// GET /cursos/:id/provas — LISTA as provas do curso (camada do aluno).
//
// AJUSTE (08/09/2026 — endpoints de prova do aluno na VPS):
// Repassa a chamada ao endpoint oficial de aluno
//   GET /aluno/cursos/:cursoId/provas
// usando o token de SESSÃO do aluno (header `x-cursos-token` →
// Authorization: Bearer). A VPS devolve a lista de provas do curso (sem o
// gabarito — apenas metadados: id, titulo, etapa_id, nota_minima, status).
//
// Nenhum dado é simulado; o contrato da API não é alterado. Rotas do mentor
// e schema do banco permanecem intactos.
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
  const { id: cursoId } = req.params;
  if (!cursoId) {
    return res.status(422).json({ error: 'ID do curso é obrigatório.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login).
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res.status(401).json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  let vpsRes;
  try {
    vpsRes = await fetch(
      `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/provas`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
  } catch (e) {
    // Falha de rede/serviço — devolve lista vazia sem simular dados.
    return res.status(200).json({ provas: [], curso_id: String(cursoId) });
  }

  // Sessão VPS expirada — o frontend renova via bridge-login e tenta de novo.
  if (vpsRes.status === 401) {
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }

  // 403/404 — sem provas cadastradas / não matriculado → lista vazia.
  if (vpsRes.status === 403 || vpsRes.status === 404) {
    return res.status(200).json({ provas: [], curso_id: String(cursoId) });
  }

  if (!vpsRes.ok) {
    return res.status(200).json({ provas: [], curso_id: String(cursoId) });
  }

  const data = await lerJson(vpsRes);
  // Normaliza: a VPS pode devolver { provas: [...] } ou [...] direto.
  const provas = Array.isArray(data) ? data : (Array.isArray(data?.provas) ? data.provas : []);

  return res.status(200).json({ provas, curso_id: String(cursoId) });
};
