// GET /cursos/:id/provas/:provaId — ABRE a prova do aluno (detalhes: perguntas
// + alternativas, SEM o gabarito).
//
// ESTRATÉGIA DE COMPATIBILIDADE (08/09/2026 — restaurar exibição da prova):
// A prova é LOCALIZADA pelo vínculo real prova.etapa_id === aula.id (via
// /mentor/cursos/:id/provas, mentor-only — o provaId que chega aqui é o
// `id` devolvido por esse endpoint). O detalhe da prova é obtido em duas
// camadas, preservando os endpoints já ajustados e sem criar dados simulados:
//
//   1. Camada ALUNO (preferencial): GET /aluno/cursos/:cursoId/provas/:provaId
//      na VPS usando o token de SESSÃO do aluno (header `x-cursos-token` →
//      Authorization). A VPS devolve a prova com perguntas + alternativas
//      SEM o campo `correta` (gabarito oculto para o aluno). Este é o
//      endpoint oficial da camada do aluno (src/routes/alunoProvas.js).
//
//   2. Camada MENTOR (fallback): se o endpoint de aluno NÃO estiver
//      deployado ainda (404/403/5xx) ou devolver corpo vazio, o backend faz
//      bridge-login como mentor dono do curso e lê
//      GET /mentor/cursos/:id/provas/:provaId (mesmo id space da lista que
//      vinculou a prova à etapa). O gabarito (`correta`) é removido
//      defensivamente das alternativas antes de devolver ao frontend.
//
// O fallback restaura a exibição que funcionava antes (perguntas +
// alternativas + envio) enquanto o endpoint de aluno não está disponível na
// VPS, sem quebrar os endpoints de lista/respostas/resultado (que continuam
// apontando para /aluno/*). Nenhum dado é simulado; o contrato da API não é
// alterado. Rotas do mentor e schema do banco permanecem intactos.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida).

import { buscarProvaDetalhe } from '../utils/cursosProvas.js';

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

async function lerJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text || null; }
}

// Remove o gabarito (campo `correta`) das alternativas de cada pergunta,
// garantindo que o aluno nunca veja quais alternativas estão certas.
function semGabarito(prova) {
  if (!prova || typeof prova !== 'object') return prova;
  const perguntas = Array.isArray(prova.perguntas) ? prova.perguntas
    : Array.isArray(prova.questoes) ? prova.questoes : [];
  const limpas = perguntas.map((p) => ({
    ...p,
    alternativas: Array.isArray(p.alternativas)
      ? p.alternativas.map(({ correta, ...resto }) => resto)
      : (Array.isArray(p.opcoes) ? p.opcoes.map(({ correta, ...resto }) => resto) : []),
  }));
  return { ...prova, perguntas: limpas };
}

// Verifica se a prova devolvida tem perguntas reais (não vazia).
function provaTemConteudo(prova) {
  if (!prova || typeof prova !== 'object') return false;
  const perguntas = Array.isArray(prova.perguntas) ? prova.perguntas
    : Array.isArray(prova.questoes) ? prova.questoes : [];
  return perguntas.length > 0;
}

export default async (req, res) => {
  const { id: cursoId, provaId } = req.params;
  if (!cursoId || !provaId) {
    return res.status(422).json({ error: 'ID do curso e da prova são obrigatórios.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login).
  const cursosToken = req.headers['x-cursos-token'];

  // ===== Camada 1: endpoint de ALUNO (/aluno/cursos/:cursoId/provas/:provaId) =====
  // Preferencial. Pode ainda não estar deployado na VPS — nesse caso cai
  // para a camada 2 (mentor). Só tenta se houver token de sessão do aluno.
  if (cursosToken) {
    let vpsRes;
    try {
      vpsRes = await fetch(
        `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/provas/${encodeURIComponent(provaId)}`,
        { headers: { Authorization: `Bearer ${cursosToken}` } },
      );
    } catch (e) {
      // Falha de rede/serviço — tenta a camada mentor antes de desistir.
      vpsRes = null;
    }

    if (vpsRes) {
      // Sessão VPS expirada — o frontend renova via bridge-login e tenta de novo.
      if (vpsRes.status === 401) {
        return res.status(401).json({
          error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
        });
      }

      if (vpsRes.ok) {
        const prova = await lerJson(vpsRes);
        if (provaTemConteudo(prova)) {
          // Remove defensivamente o gabarito (correta) antes de devolver.
          const provaLimpa = semGabarito(prova);
          return res.status(200).json({
            existe: true,
            prova: provaLimpa,
            status: 'pendente',
            curso_id: String(cursoId),
            origem: 'aluno',
          });
        }
      }
      // 403/404/5xx ou corpo sem perguntas → endpoint de aluno indisponível
      // ou incompatível. Prossegue para a camada mentor (fallback).
    }
  }

  // ===== Camada 2: endpoint de MENTOR (fallback) =====
  // Bridge-login como mentor dono do curso + leitura de
  // /mentor/cursos/:id/provas/:provaId (mesmo id space da lista que vinculou
  // a prova à etapa). O utilitário já remove o gabarito (correta).
  let provaMentor = null;
  try {
    provaMentor = await buscarProvaDetalhe(cursoId, provaId);
  } catch (_) {
    provaMentor = null;
  }

  if (provaTemConteudo(provaMentor)) {
    // Garante remoção defensiva do gabarito (o utilitário já faz, mas
    // reforçamos aqui para qualquer formato de retorno).
    const provaLimpa = semGabarito(provaMentor);
    return res.status(200).json({
      existe: true,
      prova: provaLimpa,
      status: 'pendente',
      curso_id: String(cursoId),
      origem: 'mentor',
    });
  }

  // Nenhuma das camadas devolveu uma prova real — diagnóstico correto.
  return res.status(200).json({
    existe: false,
    prova: null,
    status: 'sem_prova',
    curso_id: String(cursoId),
  });
};
