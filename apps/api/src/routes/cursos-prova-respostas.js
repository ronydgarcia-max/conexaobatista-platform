// POST /cursos/:id/provas/:provaId/respostas — proxy ponta a ponta para o
// ENVIO das respostas da prova do aluno na VPS
// (POST /aluno/provas/:provaId/respostas — endpoint real da camada do aluno,// definido em src/routes/alunoProvas.js na VPS).
//
// O backend valida a sessão PocketBase (authMiddleware) e repassa a chamada à
// VPS usando o token de SESSÃO do aluno (header `x-cursos-token` →
// Authorization: Bearer). A VPS valida a matrícula, persiste as respostas
// (UPSERT em provas_respostas), calcula a nota, grava o resultado
// (UPSERT em provas_resultados) e devolve { nota, aprovado, total_perguntas,
// total_acertos, nota_minima } — SEM expor o gabarito.
//
// Respeita a regra de tentativa única da VPS: 409 quando a prova já foi
// respondida. Nenhum dado é simulado; o contrato da API não é alterado.
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

  const { respostas } = req.body || {};
  if (!Array.isArray(respostas) || respostas.length === 0) {
    return res.status(422).json({ error: 'Respostas inválidas. Envie uma lista de respostas.' });
  }

  let vpsRes;
  try {
    vpsRes = await fetch(
      `${CURSOS_API_URL}/aluno/provas/${encodeURIComponent(provaId)}/respostas`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cursosToken}`,
        },
        body: JSON.stringify({ respostas }),
      },
    );
  } catch (e) {
    // Falha de rede/serviço — sinaliza indisponibilidade sem simular dados.
    return res.status(502).json({
      error: 'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }

  // Sessão VPS expirada — o frontend renova via bridge-login e tenta de novo.
  if (vpsRes.status === 401) {
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }

  // 404 — prova não encontrada ou endpoint indisponível na VPS.
  if (vpsRes.status === 404) {
    const data = await lerJson(vpsRes);
    return res.status(404).json({
      error: (data && data.error) || 'Prova não encontrada para envio de respostas.',
    });
  }

  // 409 — tentativa única: a prova já foi respondida.
  if (vpsRes.status === 409) {
    const data = await lerJson(vpsRes);
    return res.status(409).json({
      error: (data && data.error) || 'Esta prova já foi respondida.',
    });
  }

  // 403 — não matriculado / prova não pertence ao curso.
  if (vpsRes.status === 403) {
    const data = await lerJson(vpsRes);
    return res.status(403).json({
      error: (data && data.error) || 'Você não tem permissão para responder esta prova.',
    });
  }

  // 400 — respostas inválidas (pergunta/alternativa não pertencem à prova).
  if (vpsRes.status === 400) {
    const data = await lerJson(vpsRes);
    return res.status(400).json({
      error: (data && data.error) || 'Respostas inválidas para esta prova.',
    });
  }

  if (!vpsRes.ok) {
    const data = await lerJson(vpsRes);
    return res.status(vpsRes.status).json({
      error: (data && data.error) || 'Não foi possível enviar suas respostas.',
    });
  }

  const data = await lerJson(vpsRes);
  return res.status(201).json(data);
};
