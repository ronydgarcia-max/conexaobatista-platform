// GET /cursos/:id/aulas — proxy ponta a ponta para o conteúdo do curso.
//
// CORREÇÃO (31/08/2026 — "Sua sessão expirou" ao abrir uma aula):
// A versão anterior encadeava dois passos:
//   1. GET /cursos/:id/token (com o token de sessão/bridge) → obtinha um
//      "token de acesso ao curso";
//   2. GET /aluno/cursos/:id/aulas (com o token do passo 1).
// O passo 2 falhava com 401/403 ("Seu acesso a este curso expirou" /
// "Você não está matriculado neste curso") porque o endpoint
// /aluno/cursos/:id/aulas da VPS espera o TOKEN DE SESSÃO (bridge-login) do
// aluno — NÃO o token específico de curso devolvido por /cursos/:id/token.
//
// Probe confirmado (31/08/2026, usuário real Rony Garcia, curso 29):
//   - /aluno/cursos/29/aulas com token de CURSO  → 403 "Você não está matriculado"
//   - /aluno/cursos/29/aulas com token de BRIDGE → 200 + lista de aulas ✅
//
// Fluxo corrigido (um único passo):
//   - O frontend envia o token de sessão (bridge-login) no header
//     `x-cursos-token` (mesmo padrão das demais rotas proxy).
//   - Este backend chama diretamente /aluno/cursos/:id/aulas com esse token.
//   - O token de acesso ao curso NÃO é mais necessário aqui — a matrícula
//     já foi criada (efeito colateral idempotente de /cursos/:id/token no
//     momento da matrícula) e a VPS autoriza a leitura das aulas pelo token
//     de sessão do aluno.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida).
// Tokens permanecem no backend (nunca expostos ao navegador).

import { buscarProvasDoCurso } from '../utils/cursosProvas.js';

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

export default async (req, res) => {
  const { id: cursoId } = req.params;
  if (!cursoId) {
    return res.status(422).json({ error: 'ID do curso é obrigatório.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login). É este token — e não o
  // token específico de curso — que autoriza /aluno/cursos/:id/aulas.
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res
      .status(401)
      .json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  // Chamada única à VPS com o token de sessão do aluno.
  let aulasRes;
  try {
    aulasRes = await fetch(
      `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/aulas`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
  } catch (e) {
    return res.status(502).json({
      error:
        'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }

  if (aulasRes.status === 401 || aulasRes.status === 403) {
    // Sessão do aluno na VPS expirada/inválida — o frontend renova via
    // bridge-login e tenta novamente (authedFetch já faz isso).
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }
  if (!aulasRes.ok) {
    let msg = 'Não foi possível carregar as aulas deste curso.';
    try {
      const t = await aulasRes.text();
      const d = t ? JSON.parse(t) : null;
      if (typeof d === 'string' && d) msg = d;
      else if (d?.error) msg = d.error;
      else if (d?.message) msg = d.message;
    } catch (_) {}
    return res.status(aulasRes.status === 404 ? 404 : 502).json({ error: msg });
  }

  let aulasData = null;
  try {
    const txt = await aulasRes.text();
    aulasData = txt ? JSON.parse(txt) : null;
  } catch (_) {
    aulasData = null;
  }

  // Normaliza a resposta: a VPS pode devolver { aulas: [...] }, [...] ou
  // { modulos: [...] }. Devolvemos um formato estável para o frontend.
  let aulas = [];
  if (Array.isArray(aulasData)) {
    aulas = aulasData;
  } else if (Array.isArray(aulasData?.aulas)) {
    aulas = aulasData.aulas;
  } else if (Array.isArray(aulasData?.modulos)) {
    aulas = aulasData.modulos;
  } else if (Array.isArray(aulasData?.data)) {
    aulas = aulasData.data;
  }

  // ===== ASSOCIAÇÃO REAL PROVA ↔ AULA (etapa) =====
  // Investigação real (02/09/2026, Curso 29, mentor Dorival Garcia):
  //   - A resposta de /aluno/cursos/:id/aulas NÃO contém campos de prova
  //     em nenhuma aula (por isso o provas_por_aula ficava vazio quando
  //     construído apenas a partir das aulas).
  //   - O vínculo real prova↔etapa↔aula está em
  //     GET /mentor/cursos/:id/provas  →  [{ id, curso_id, etapa_id, ... }]
  //     onde `etapa_id` é EXATAMENTE o `id` da aula (etapa_id === aula.id).
  //   - Esse endpoint exige token de mentor (aluno → 403). O backend obtém
  //     as provas em nome do curso via bridge-login como mentor dono do
  //     curso (ver utils/cursosProvas.js). Tudo best-effort: falha → [].
  //
  // Monta `provas_por_aula` mapeando `String(etapa_id) → prova` SOMENTE com
  // as provas reais devolvidas pela VPS, usando o mesmo identificador (id
  // da aula) que o frontend já usa. Nenhum dado é simulado.
  const provasPorAula = {};
  let provasReais = [];
  try {
    provasReais = await buscarProvasDoCurso(cursoId);
  } catch (_) {
    provasReais = [];
  }
  for (const p of provasReais) {
    if (!p || typeof p !== 'object') continue;
    const etapaId = String(p.etapa_id ?? '');
    if (!etapaId) continue;
    const provaId = p.id ?? p.prova_id ?? null;
    provasPorAula[etapaId] = {
      aula_id: etapaId,
      prova_id: provaId,
      titulo: p.titulo ?? p.titulo_prova ?? null,
      nota_minima: p.nota_minima ?? null,
      total_perguntas: p.total_perguntas ?? null,
      status: 'pendente',
      prova: p,
    };
  }

  // Log claro da associação encontrada (ou da ausência) — auditoria.
  const totalProvas = Object.keys(provasPorAula).length;
  if (totalProvas > 0) {
    console.log(`[cursos-aulas] Curso ${cursoId}: ${totalProvas} prova(s) localizada(s) via /mentor/cursos/:id/provas (vínculo etapa_id===aula.id).`);
  } else {
    console.log(`[cursos-aulas] Curso ${cursoId}: nenhuma prova localizada para o curso. provas_por_aula vazio.`);
  }

  return res.status(200).json({
    curso_id: String(cursoId),
    aulas,
    provas_por_aula: provasPorAula,
    provas_por_aula_total: totalProvas,
    raw: aulasData || null,
  });
};
