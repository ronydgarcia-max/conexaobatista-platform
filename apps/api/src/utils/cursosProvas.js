// Utilitário para LOCALIZAR provas cadastradas pelo mentor na VPS.
//
// INVESTIGAÇÃO REAL (02/09/2026, Curso 29, mentor Dorival Garcia):
//   - A VPS NÃO devolve campos de prova na resposta de
//     GET /aluno/cursos/:id/aulas (por isso provas_por_aula fica vazio quando
//     construído apenas a partir das aulas).
//   - O vínculo real prova↔etapa↔aula está em
//     GET /mentor/cursos/:cursoId/provas  →  [{ id, curso_id, etapa_id, titulo,
//     nota_minima, created_at, total_perguntas }]
//     e em  GET /mentor/cursos/:cursoId/provas/:provaId  →  prova com
//     perguntas[{ texto, alternativas[{ letra, texto, correta }] }].
//   - O campo `etapa_id` da prova é EXATAMENTE o `id` da aula (etapa_id ===
//     aula.id). Cada prova é vinculada a uma aula/etapa específica.
//   - Esses endpoints exigem um TOKEN DE MENTOR (aluno → 403; bridge-secret
//     isolado → 401 "Token não fornecido").
//
// Como o aluno não pode acessar /mentor/*, este utilitário faz o backend
// obter as provas em nome do curso: localiza o mentor dono do curso (via
// /admin/cursos com o bridge-secret), faz bridge-login como esse mentor
// (por e-mail — a VPS casa por e-mail) e consulta /mentor/cursos/:id/provas.
// Tudo é BEST-EFFORT: qualquer falha devolve [] / null (nenhum dado é
// simulado). Não altera o contrato da API nem inventa endpoints/vínculos.

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');
const CURSOS_ADMIN_API_URL = (
  process.env.CURSOS_ADMIN_API_URL || CURSOS_API_URL
).replace(/\/+$/, '');
const CURSOS_API_BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

async function lerJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text || null; }
}

// Localiza o e-mail do mentor dono do curso via /admin/cursos (bridge-secret).
// Retorna o e-mail ou null se não encontrar.
async function buscarEmailMentorDoCurso(cursoId) {
  if (!CURSOS_API_BRIDGE_SECRET) return null;
  try {
    const res = await fetch(`${CURSOS_ADMIN_API_URL}/admin/cursos`, {
      headers: { 'x-bridge-secret': CURSOS_API_BRIDGE_SECRET },
    });
    if (!res.ok) return null;
    const lista = await lerJson(res);
    if (!Array.isArray(lista)) return null;
    const curso = lista.find((c) => String(c?.id) === String(cursoId));
    return curso?.mentor_email || null;
  } catch (_) {
    return null;
  }
}

// Faz bridge-login como o mentor dono do curso (por e-mail). A VPS casa por
// e-mail; o pocketbase_id pode ser um marcador qualquer. Retorna o token de
// mentor ou null.
async function buscarTokenMentor(cursoId) {
  if (!CURSOS_API_BRIDGE_SECRET) return null;
  const email = await buscarEmailMentorDoCurso(cursoId);
  if (!email) return null;
  try {
    const res = await fetch(`${CURSOS_API_URL}/auth/bridge-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': CURSOS_API_BRIDGE_SECRET,
      },
      body: JSON.stringify({ pocketbase_id: `mentor-curso-${cursoId}`, email }),
    });
    if (!res.ok) return null;
    const data = await lerJson(res);
    return data?.token || null;
  } catch (_) {
    return null;
  }
}

// Lista as provas cadastradas para o curso (vínculo real etapa_id === aula.id).
// Retorna [{ id, curso_id, etapa_id, titulo, nota_minima, ... }] ou [].
async function buscarProvasDoCurso(cursoId) {
  const token = await buscarTokenMentor(cursoId);
  if (!token) return [];
  try {
    const res = await fetch(
      `${CURSOS_API_URL}/mentor/cursos/${encodeURIComponent(cursoId)}/provas`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return [];
    const data = await lerJson(res);
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

// Detalhe de uma prova específica (perguntas + alternativas). Remove o campo
// `correta` das alternativas para não expor o gabarito ao aluno. Retorna a
// prova normalizada ou null.
async function buscarProvaDetalhe(cursoId, provaId) {
  const token = await buscarTokenMentor(cursoId);
  if (!token) return null;
  try {
    const res = await fetch(
      `${CURSOS_API_URL}/mentor/cursos/${encodeURIComponent(cursoId)}/provas/${encodeURIComponent(provaId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const prova = await lerJson(res);
    if (!prova || typeof prova !== 'object') return null;
    // Remove o gabarito (correta) das alternativas antes de devolver ao
    // frontend — o aluno não deve ver quais alternativas estão certas.
    const perguntas = Array.isArray(prova.perguntas) ? prova.perguntas : [];
    const perguntasSemGabarito = perguntas.map((p) => ({
      ...p,
      alternativas: Array.isArray(p.alternativas)
        ? p.alternativas.map(({ correta, ...resto }) => resto)
        : [],
    }));
    return { ...prova, perguntas: perguntasSemGabarito };
  } catch (_) {
    return null;
  }
}

export { buscarProvasDoCurso, buscarProvaDetalhe };
