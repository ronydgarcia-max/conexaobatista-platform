// GET /cursos/:id/progresso — proxy ponta a ponta para o progresso real do
// aluno na VPS (GET /aluno/cursos/:id/progresso). Devolve
// { total_aulas, aulas_concluidas, percentual }. Usado pelo frontend para
// detectar a conclusão do curso (100%). Proxy apenas repassa a chamada real
// usando o token de sessão do aluno (header x-cursos-token). Não altera a
// API VPS nem simula dados. Protegido por authMiddleware.

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

async function lerJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text || null; }
}

export default async (req, res) => {
  const { id: cursoId } = req.params;
  if (!cursoId) {
    return res.status(422).json({ error: 'ID do curso é obrigatório.' });
  }

  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res
      .status(401)
      .json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  let upstream;
  try {
    upstream = await fetch(
      `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/progresso`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
  } catch (e) {
    return res.status(502).json({
      error:
        'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }

  const data = await lerJson(upstream);

  if (!upstream.ok) {
    let msg = 'Não foi possível carregar o progresso do curso.';
    if (typeof data === 'string' && data) msg = data;
    else if (data?.error) msg = data.error;
    else if (data?.message) msg = data.message;
    return res.status(upstream.status === 404 ? 404 : 502).json({ error: msg });
  }

  return res.status(200).json(data || { total_aulas: 0, aulas_concluidas: 0, percentual: 0 });
};
