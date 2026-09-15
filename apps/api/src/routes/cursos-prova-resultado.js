// GET /cursos/:id/provas/:provaId/resultado — proxy ponta a ponta para o
// RESULTADO da prova do aluno na VPS
// (GET /aluno/provas/:provaId/resultado — endpoint real da camada do aluno).
//
// O backend valida a sessão PocketBase (authMiddleware) e repassa a chamada à
// VPS usando o token de SESSÃO do aluno (header `x-cursos-token` →
// Authorization: Bearer). A VPS devolve { nota, aprovado, total_perguntas,
// total_acertos, nota_minima, respondido_em } a partir de provas_resultados
// — SEM expor o gabarito.
//
// 404 quando o aluno ainda não respondeu a prova (resultado não disponível).
// Nenhum dado é simulado; o contrato da API não é alterado.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida).

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

async function lerJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text || null; }
}

export default async (req, res) => {
  const { id: cursoId, provaId } = req.params;
  if (!cursoId || !provaId) {
    return res.status(422).json({ error: 'ID do curso e da prova são obrigatórios.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login).
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res.status(401).json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  let vpsRes;
  try {
    vpsRes = await fetch(
      `${CURSOS_API_URL}/aluno/provas/${encodeURIComponent(provaId)}/resultado`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
  } catch (e) {
    return res.status(502).json({
      error: 'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }

  if (vpsRes.status === 401) {
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }

  // 404 — endpoint não deployado na VPS OU aluno ainda não respondeu.
  if (vpsRes.status === 404) {
    const data = await lerJson(vpsRes);
    return res.status(404).json({
      error: (data && data.error) || 'Resultado não disponível. Você ainda não respondeu esta prova.',
    });
  }

  if (vpsRes.status === 403) {
    const data = await lerJson(vpsRes);
    return res.status(403).json({
      error: (data && data.error) || 'Você não tem permissão para ver este resultado.',
    });
  }

  if (!vpsRes.ok) {
    const data = await lerJson(vpsRes);
    return res.status(vpsRes.status).json({
      error: (data && data.error) || 'Não foi possível carregar o resultado.',
    });
  }

  const data = await lerJson(vpsRes);
  return res.status(200).json(data);
};
