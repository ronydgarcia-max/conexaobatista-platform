// POST /cursos/:id/aulas/:aulaId/concluir — proxy ponta a ponta para marcar
// uma aula como concluída na VPS.
//
// INVESTIGAÇÃO REAL (02/09/2026, Curso 29, usuário Rony Garcia, token bridge):
// A VPS passou a possuir um sistema de conclusão/progresso que NÃO existia nas
// investigações anteriores (01/09 retornavam 404). Endpoints reais confirmados:
//   - POST /aluno/cursos/:id/aulas/:aulaId/concluir → 200
//       { success: true, message: "Aula concluída com sucesso",
//         progresso: { id, aluno_id, curso_id, aula_id, concluida_em } }
//   - GET  /aluno/cursos/:id/progresso → 200
//       { total_aulas, aulas_concluidas, percentual }
//   - Cada aula agora traz `concluida` (bool) e `concluida_em` (timestamp).
//
// PROVAS: todos os endpoints de prova retornam 404 mesmo com token válido
// (/aluno/cursos/:id/prova, /provas, /etapas, /aulas/:aulaId/prova, etc.) e
// as aulas NÃO possuem campos de prova/etapa. A VPS NÃO possui sistema de
// provas — nenhum dado é simulado; o fluxo de prova entre etapas não pode ser
// implementado e permanece como impedimento documentado.
//
// Este endpoint é um PROXY (não altera a API VPS nem dados cadastrados do
// curso): apenas repassa a chamada ao endpoint real da VPS usando o token de
// sessão do aluno (header `x-cursos-token` → Authorization: Bearer).
// Protegido por authMiddleware (exige sessão PocketBase válida).

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

async function lerJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text || null; }
}

export default async (req, res) => {
  const { id: cursoId, aulaId } = req.params;
  if (!cursoId || !aulaId) {
    return res.status(422).json({ error: 'ID do curso e da aula são obrigatórios.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login).
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res
      .status(401)
      .json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  let upstream;
  try {
    upstream = await fetch(
      `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/aulas/${encodeURIComponent(aulaId)}/concluir`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cursosToken}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    );
  } catch (e) {
    return res.status(502).json({
      error:
        'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }

  // Sessão VPS expirada — o frontend renova via bridge-login e tenta de novo.
  if (upstream.status === 401 || upstream.status === 403) {
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }

  const data = await lerJson(upstream);

  if (!upstream.ok) {
    let msg = 'Não foi possível concluir esta aula. Tente novamente.';
    if (typeof data === 'string' && data) msg = data;
    else if (data?.error) msg = data.error;
    else if (data?.message) msg = data.message;
    return res.status(upstream.status === 404 ? 404 : 502).json({ error: msg });
  }

  return res.status(200).json(data);
};
