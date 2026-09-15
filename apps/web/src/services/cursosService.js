// Serviço de cursos — chama a API de cursos via proxy Express (evita mixed content
// HTTPS→HTTP e mantém o segredo no backend). Todas as chamadas exigem um token
// de cursos válido (gerenciado por cursosAuthService) enviado no header
// `x-cursos-token`, além do token PocketBase no header Authorization.

import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';
import { garantirToken, limparToken } from './cursosAuthService';

// Faz uma chamada autenticada ao proxy de cursos. Em caso de 401 (token expirado),
// limpa o token, renova e tenta uma única vez.
async function authedFetch(path, options = {}) {
  const cursosToken = await garantirToken();
  const buildHeaders = (token) => ({
    ...(options.headers || {}),
    'x-cursos-token': token,
    Authorization: `Bearer ${pb.authStore.token || ''}`,
  });

  let res = await apiServerClient.fetch(path, {
    ...options,
    headers: buildHeaders(cursosToken),
  });

  if (res.status === 401) {
    // Token de cursos expirado — renova e tenta novamente uma vez.
    limparToken();
    try {
      const novoToken = await garantirToken();
      res = await apiServerClient.fetch(path, {
        ...options,
        headers: buildHeaders(novoToken),
      });
    } catch (err) {
      const message = err?.message || 'Sua sessão expirou. Faça login novamente.';
      const e = new Error(message);
      e.status = 401;
      throw e;
    }
  }

  return res;
}

// Trata a resposta: lança um Error com mensagem amigável em PT-BR se não for ok.
async function tratarResposta(res, mensagemPadrao) {
  let data = null;
  const text = await res.text().catch(() => '');
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }

  if (!res.ok) {
    let mensagem = mensagemPadrao;
    if (typeof data === 'string' && data) mensagem = data;
    else if (data?.error) mensagem = data.error;
    else if (data?.message) mensagem = data.message;

    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    } else if (res.status === 403) {
      mensagem = 'Você não tem permissão para acessar este conteúdo.';
    } else if (res.status === 404) {
      mensagem = 'Curso não encontrado.';
    } else if (res.status === 502 || res.status === 503) {
      mensagem = 'Serviço de cursos indisponível no momento. Tente novamente em instantes.';
    }

    const err = new Error(mensagem);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

// Lista cursos matriculados do usuário logado, lidos diretamente do PocketBase
// (coleção `matriculas`) e REVALIDADOS pela API real (GET /cursos-publicados/:id).
//
// REVALIDAÇÃO (portal do aluno): ao abrir "Área do Aluno" ou "Meus Cursos",
// cada matrícula é conferida contra o endpoint público de detalhe do curso.
// Cursos que retornarem 404 ("Curso não encontrado ou não publicado") — ou
// seja, excluídos, inexistentes ou não publicados — são REMOVIDOS do estado
// local/cache (lista exibida + registro de matrícula local stale no
// PocketBase), para que não reapareçam nem gerem revalidações repetidas.
// Cursos válidos, matrículas e progresso são PRESERVADOS. Falhas transitórias
// (rede/5xx) NÃO removem o curso — só a confirmação explícita de 404 remove.
export async function getMeusCursos() {
  if (!pb.authStore.isValid) return [];
  const userId = pb.authStore.record?.id;
  if (!userId) return [];
  try {
    const lista = await pb.collection('matriculas').getFullList({
      filter: `usuario_id = "${userId}"`,
      sort: '-created',
    });

    // Revalidação paralela pela API real. Para cada matrícula, consulta o
    // endpoint público de detalhe do curso. 404 → curso inválido (excluído,
    // inexistente ou não publicado) → remove do cache (registro local stale)
    // e da lista. Outros erros → preserva (falha transitória).
    //
    // ORIGEM DA IMAGEM (Prompt 2): em 200, a imagem ATUAL do curso é lida do
    // corpo da resposta de GET /cursos-publicados/:id (campo curso.imagem_url)
    // e armazenada em `imagensAtuais`. O card de "Meus Cursos" passa a usar
    // essa imagem fresca da API em vez da imagem antiga congelada no registro
    // da matrícula (m.curso_imagem) no momento da inscrição. Assim, após uma
    // nova inscrição ou troca de imagem pelo mentor, o card reflete o estado
    // atual do curso. Falhas transitórias (5xx/rede) preservam o curso e
    // mantêm m.curso_imagem como fallback. Sem imagem definida → string vazia
    // → o card exibe o estado visual padrão já existente (placeholder).
    const imagensAtuais = new Map();
    const validacoes = await Promise.all(
      lista.map(async (m) => {
        const cursoId = String(m.curso_api_id ?? '');
        if (!cursoId) return m;
        try {
          const res = await apiServerClient.fetch(
            `/cursos-publicados/${encodeURIComponent(cursoId)}`,
          );
          if (res.status === 404) {
            // Curso excluído/inexistente/não publicado — remove o registro
            // local stale (cache) para que não reapareça na próxima visita.
            try {
              await pb.collection('matriculas').delete(m.id, {
                requestKey: `cleanup-mat-${m.id}`,
              });
            } catch (_) {}
            return null;
          }
          // 200 → captura a imagem ATUAL do curso retornada pela API.
          if (res.ok) {
            try {
              const data = await res.json();
              const curso = data?.curso || data;
              const img = curso?.imagem_url || curso?.img || '';
              if (img) imagensAtuais.set(cursoId, img);
            } catch (_) {}
          }
          // ok (200) ou falha transitória (5xx/rede) → preserva o curso.
          return m;
        } catch (_) {
          // Erro de rede — preserva o curso (não remove por falha transitória).
          return m;
        }
      }),
    );

    const aposExistencia = validacoes.filter(Boolean);

    // ===== REVALIDAÇÃO DE MATRÍCULA REAL NA VPS =====
    // Consulta a lista REAL de cursos matriculados na VPS
    // (GET /cursos/meus → /cursos/usuario/meus, fonte oficial da VPS) e remove
    // qualquer curso cuja matrícula foi EXCLUÍDA no painel administrativo da
    // VPS — o registro local no PocketBase permanece (stale) porque o
    // cancelamento pela VPS não propaga para o PocketBase. Cursos ausentes da
    // lista da VPS são removidos da lista exibida E do cache local
    // (registro PocketBase deletado), para que não reapareçam nem gerem
    // revalidações repetidas. Falhas transitórias (rede/5xx/VPS indisponível)
    // NÃO removem o curso — só a confirmação explícita de ausência na lista.
    let idsVps = null;
    try {
      const resVps = await authedFetch('/cursos/meus');
      const dataVps = await tratarResposta(resVps, '');
      const listaVps = Array.isArray(dataVps)
        ? dataVps
        : (dataVps?.cursos || dataVps?.data || []);
      idsVps = new Set(
        listaVps.map((c) => String(c.id ?? c.curso_id ?? c.cursoId ?? '')),
      );
    } catch (_) {
      // VPS indisponível — preserva os cursos (não remove por falha transitória).
      idsVps = null;
    }

    let validos = aposExistencia;
    if (idsVps !== null) {
      validos = aposExistencia.filter((m) =>
        idsVps.has(String(m.curso_api_id ?? '')),
      );
      // Remove os registros locais stale (cursos cuja matrícula foi excluída
      // na VPS) para que não reapareçam na próxima visita. Cada delete recebe
      // um requestKey único (evita auto-cancelamento do SDK PocketBase).
      const removidos = aposExistencia.filter(
        (m) => !idsVps.has(String(m.curso_api_id ?? '')),
      );
      if (removidos.length > 0) {
        await Promise.all(
          removidos.map((m, i) =>
            pb
              .collection('matriculas')
              .delete(m.id, { requestKey: `cleanup-vps-mat-${m.id}-${i}` })
              .catch(() => {}),
          ),
        );
      }
    }

    return validos.map((m) => {
      const cursoId = String(m.curso_api_id ?? '');
      return {
        id: m.curso_api_id,
        titulo: m.curso_titulo || 'Curso',
        instrutor: m.curso_mentor || '',
        // Imagem ATUAL do curso, obtida da resposta de
        // GET /cursos-publicados/:id (campo curso.imagem_url) durante a
        // revalidação acima. Fallback para m.curso_imagem apenas quando a
        // consulta à API falhou (falha transitória). String vazia → o card
        // exibe o placeholder padrão já existente.
        img: imagensAtuais.get(cursoId) || m.curso_imagem || '',
        duracao: '',
        progresso: 0,
        concluido: false,
        certificado: null,
        status: m.status,
      };
    });
  } catch (err) {
    const e = new Error(err?.message || 'Não foi possível carregar seus cursos.');
    e.status = err?.status || 500;
    throw e;
  }
}

// POST /cursos/:id/matricula — matrícula na VPS + registro local.
// Requer token PocketBase (Authorization). Retorna
// { sucesso, mensagem, matricula, ja_matriculado, vps_matricula, cursos_token }.
//
// O backend cria a matrícula na VPS (efeito colateral idempotente de
// GET /cursos/:id/token) e registra uma cópia local no PocketBase. O
// frontend NÃO assume 200 = sucesso: verifica explicitamente que a
// resposta contém confirmação de persistência (sucesso/matricula/vps_matricula).
export async function matricularCurso(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  const pbToken = pb.authStore.token;
  if (!pbToken) {
    const err = new Error('Sua sessão expirou. Faça login novamente para se inscrever.');
    err.status = 401;
    throw err;
  }

  const url = `/cursos/${encodeURIComponent(cursoId)}/matricula`;
  console.log(`📚 [MATRÍCULA] Chamando: ${url}`);
  const t0 = Date.now();

  const res = await apiServerClient.fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pbToken}`,
    },
  });
  console.log(`📊 [MATRÍCULA] Status: ${res.status} (${Date.now() - t0}ms)`);

  let data = null;
  const text = await res.text().catch(() => '');
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }

  if (!res.ok) {
    let mensagem = 'Não foi possível concluir sua matrícula. Tente novamente.';
    if (typeof data === 'string' && data) mensagem = data;
    else if (data?.error) mensagem = data.error;
    else if (data?.message) mensagem = data.message;
    if (res.status === 401) mensagem = 'Sua sessão expirou. Faça login novamente para se inscrever.';
    else if (res.status === 404) mensagem = 'Curso não encontrado ou não publicado.';
    console.error('❌ [MATRÍCULA] Erro:', mensagem);
    const err = new Error(mensagem);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  // ✅ Verificação de persistência — não assume 200 = sucesso.
  // Exige confirmação explícita de que a matrícula foi registrada (VPS ou local).
  const confirmado = data?.sucesso || data?.matricula || data?.vps_matricula || data?.id;
  if (!confirmado) {
    console.error('❌ [MATRÍCULA] Resposta sem confirmação de persistência:', data);
    const err = new Error('Matrícula não foi confirmada pelo servidor.');
    err.status = res.status;
    err.details = data;
    throw err;
  }

  console.log('✅ [MATRÍCULA] Resposta confirmada:', {
    sucesso: data?.sucesso,
    ja_matriculado: data?.ja_matriculado,
    vps_matricula_id: data?.vps_matricula?.id,
    vps_curso_id: data?.vps_matricula?.curso_id,
    vps_status: data?.vps_matricula?.status,
    local_id: data?.matricula?.id,
  });

  return data;
}

// GET /cursos/:id/token — obtém token de acesso ao curso específico.
// A resposta vem enriquecida com usuario_id, email, nome e token_type
// (lidos do PocketBase no backend), além do token gerado pela VPS.
export async function acessarCurso(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(`/cursos/${encodeURIComponent(cursoId)}/token`);
  return tratarResposta(res, 'Não foi possível acessar este curso.');
}

// GET /cursos/:id/aulas — lista as aulas do curso (proxy ponta a ponta).
// O backend encadeia a obtenção do token de acesso e a chamada a
// /aluno/cursos/:id/aulas na VPS, devolvendo { curso_id, aulas, raw }.
export async function getAulas(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(`/cursos/${encodeURIComponent(cursoId)}/aulas`);
  return tratarResposta(res, 'Não foi possível carregar as aulas deste curso.');
}

// GET /cursos/:id/aulas/:aulaId/pdf — proxy autenticado do PDF de uma aula.
// O backend valida a sessão PocketBase, valida a matrícula na VPS (só
// matriculados recebem a aula com material_pdf_url) e devolve os bytes do
// PDF (application/pdf). Retorna um ArrayBuffer pronto para pdf.js
// (getDocument({ data })). Lança Error com mensagem PT-BR em caso de falha:
//   401 → "Sua sessão expirou…", 403 → "Acesso negado…",
//   404 → "Material indisponível…", 502 → "Erro ao carregar PDF…".
export async function getPdfAula(cursoId, aulaId) {
  if (!cursoId || !aulaId) {
    const err = new Error('Curso ou aula inválida.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(
    `/cursos/${encodeURIComponent(cursoId)}/aulas/${encodeURIComponent(aulaId)}/pdf`,
  );

  if (!res.ok) {
    let mensagem = 'Erro ao carregar o PDF. Tente novamente em instantes.';
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    } else if (res.status === 403) {
      mensagem = 'Acesso negado. Você não está matriculado neste curso.';
    } else if (res.status === 404) {
      mensagem = 'Material indisponível para esta aula.';
    } else if (res.status === 502 || res.status === 503) {
      mensagem = 'Erro ao carregar o PDF. Tente novamente em instantes.';
    }
    const err = new Error(mensagem);
    err.status = res.status;
    throw err;
  }

  const blob = await res.blob();
  return blob.arrayBuffer();
}

// GET /cursos/mentor-acesso — valida autenticação/aprovação e retorna a credencial
// SSO do mentor (JWT de curta duração) + URL do ambiente real, ou env=demo (fallback).
// Requer apenas o token PocketBase (não usa o token de cursos).
export async function getMentorAcesso() {
  const pbToken = pb.authStore.token;
  if (!pbToken) {
    const err = new Error('Sua sessão expirou. Faça login novamente para acessar a área do mentor.');
    err.status = 401;
    throw err;
  }

  const res = await apiServerClient.fetch('/cursos/mentor-acesso', {
    method: 'GET',
    headers: { Authorization: `Bearer ${pbToken}` },
  });

  let data = null;
  const text = await res.text().catch(() => '');
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }

  if (!res.ok) {
    let mensagem = 'Não foi possível acessar a área do mentor. Tente novamente.';
    if (typeof data === 'string' && data) mensagem = data;
    else if (data?.error) mensagem = data.error;
    else if (data?.message) mensagem = data.message;

    if (res.status === 401) {
      mensagem = 'Sua sessão expirou. Faça login novamente para acessar a área do mentor.';
    } else if (res.status === 403) {
      mensagem = data?.error || 'Sua conta ainda não foi aprovada para acessar a área do mentor.';
    }

    const err = new Error(mensagem);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

// GET /mentor-sso-token — gera a credencial SSO (JWT HS256, TTL 600s) para o
// botão "Acessar painel do mentor" e retorna { token, url, redirectUrl,
// expiresAt, ttl, algorithm, role }. Requer apenas o token PocketBase.
export async function getMentorSsoToken() {
  const pbToken = pb.authStore.token;
  if (!pbToken) {
    const err = new Error('Sua sessão expirou. Faça login novamente para acessar o painel do mentor.');
    err.status = 401;
    throw err;
  }

  const res = await apiServerClient.fetch('/mentor-sso-token', {
    method: 'GET',
    headers: { Authorization: `Bearer ${pbToken}` },
  });

  let data = null;
  const text = await res.text().catch(() => '');
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }

  if (!res.ok) {
    let mensagem = 'Não foi possível gerar a credencial do painel do mentor. Tente novamente.';
    if (typeof data === 'string' && data) mensagem = data;
    else if (data?.error) mensagem = data.error;
    else if (data?.message) mensagem = data.message;

    if (res.status === 401) {
      mensagem = 'Sua sessão expirou. Faça login novamente para acessar o painel do mentor.';
    } else if (res.status === 403) {
      mensagem = data?.error || 'Sua conta ainda não foi aprovada para acessar o painel do mentor.';
    } else if (res.status === 503) {
      mensagem = 'Painel do mentor não configurado. Contate o administrador.';
    }

    const err = new Error(mensagem);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

// GET /aluno-sso — gera a credencial SSO do aluno (JWT HS256 assinado com
// MENTOR_JWT_SECRET, destino "aluno", TTL 600s) e retorna
// { token, url, redirectUrl, expiresAt, ttl, algorithm, destino, role }.
// O frontend navega para redirectUrl (https://api.conexaobatista.com.br/sso?token=…)
// e a VPS faz o resto (cria/atualiza usuário, emite token interno e
// redireciona para /painel-aluno?token=…). Requer apenas o token PocketBase.
export async function getAlunoSso() {
  const pbToken = pb.authStore.token;
  if (!pbToken) {
    const err = new Error('Sua sessão expirou. Faça login novamente para acessar a área do aluno.');
    err.status = 401;
    throw err;
  }

  const res = await apiServerClient.fetch('/aluno-sso', {
    method: 'GET',
    headers: { Authorization: `Bearer ${pbToken}` },
  });

  let data = null;
  const text = await res.text().catch(() => '');
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }

  if (!res.ok) {
    let mensagem = 'Não foi possível gerar a credencial da área do aluno. Tente novamente.';
    if (typeof data === 'string' && data) mensagem = data;
    else if (data?.error) mensagem = data.error;
    else if (data?.message) mensagem = data.message;

    if (res.status === 401) {
      mensagem = 'Sua sessão expirou. Faça login novamente para acessar a área do aluno.';
    } else if (res.status === 403) {
      mensagem = data?.error || 'Sua conta ainda não foi aprovada para acessar a área do aluno.';
    } else if (res.status === 503) {
      mensagem = 'Área do aluno não configurada. Contate o administrador.';
    }

    const err = new Error(mensagem);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

// GET /cursos/:id/prova — proxy ponta a ponta para a prova do curso (etapa
// final). O backend consulta a VPS em /aluno/cursos/:id/prova com o token de
// sessão (bridge-login) e devolve { existe, prova, status }. Sem prova
// cadastrada → existe=false (o frontend mantém o botão "Próxima" normal e
// não exibe a prova na sidebar). Nenhum dado é simulado.
// Lança Error com mensagem PT-BR em caso de falha de sessão (401).
export async function getProva(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(`/cursos/${encodeURIComponent(cursoId)}/prova`);

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar a prova deste curso.';
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    }
    const err = new Error(mensagem);
    err.status = res.status;
    throw err;
  }

  const data = await res.json().catch(() => ({ existe: false, prova: null, status: 'sem_prova' }));
  return data;
}

// POST /cursos/:id/aulas/:aulaId/concluir — marca uma aula como concluída na
// VPS (endpoint real confirmado em 02/09/2026). O backend repassa a chamada
// ao POST /aluno/cursos/:id/aulas/:aulaId/concluir da VPS usando o token de
// sessão (bridge-login). Retorna
// { success, message, progresso: { id, aluno_id, curso_id, aula_id, concluida_em } }.
// Não altera a API VPS nem dados cadastrados do curso — apenas persiste o
// progresso real do aluno. Lança Error com mensagem PT-BR em caso de falha.
export async function concluirAula(cursoId, aulaId) {
  if (!cursoId || !aulaId) {
    const err = new Error('Curso ou aula inválida.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(
    `/cursos/${encodeURIComponent(cursoId)}/aulas/${encodeURIComponent(aulaId)}/concluir`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' } },
  );

  if (!res.ok) {
    let mensagem = 'Não foi possível concluir esta aula. Tente novamente.';
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    }
    const err = new Error(mensagem);
    err.status = res.status;
    throw err;
  }

  const data = await res.json().catch(() => ({ success: true }));
  return data;
}

// GET /cursos/:id/provas/:provaId — localiza e ABRE a prova cadastrada pelo
// mentor (vínculo real etapa_id === aula.id). O backend faz bridge-login
// como mentor dono do curso e devolve a prova real SEM o gabarito. Retorna
// { existe, prova, status, curso_id }. Sem prova → existe=false.
// Lança Error com mensagem PT-BR em caso de falha de sessão (401).
export async function getProvaDetalhe(cursoId, provaId) {
  if (!cursoId || !provaId) {
    const err = new Error('Curso ou prova inválida.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(
    `/cursos/${encodeURIComponent(cursoId)}/provas/${encodeURIComponent(provaId)}`,
  );

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar esta prova.';
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    }
    const err = new Error(mensagem);
    err.status = res.status;
    throw err;
  }

  const data = await res.json().catch(() => ({ existe: false, prova: null, status: 'sem_prova' }));
  return data;
}

// GET /cursos/:id/progresso — progresso real do aluno na VPS
// (total_aulas, aulas_concluidas, percentual). Usado para detectar a
// conclusão do curso (100%). Lança Error com mensagem PT-BR em caso de falha.
export async function getProgresso(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(`/cursos/${encodeURIComponent(cursoId)}/progresso`);

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar o progresso do curso.';
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    }
    const err = new Error(mensagem);
    err.status = res.status;
    throw err;
  }

  const data = await res.json().catch(() => ({ total_aulas: 0, aulas_concluidas: 0, percentual: 0 }));
  return data;
}

// GET /cursos/:id/provas/:provaId/resultado — proxy ponta a ponta para o
// RESULTADO da prova do aluno na VPS (GET /aluno/provas/:provaId/resultado).
// O backend autentica a sessão PocketBase e repassa a chamada com o token de
// sessão da VPS (x-cursos-token). Retorna { nota, aprovado, total_perguntas,
// total_acertos, nota_minima, respondido_em } — sem gabarito. 404 quando o
// aluno ainda não respondeu. Lança Error com mensagem PT-BR em caso de falha.
export async function getResultadoProva(cursoId, provaId) {
  if (!cursoId || !provaId) {
    const err = new Error('Curso ou prova inválida.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(
    `/cursos/${encodeURIComponent(cursoId)}/provas/${encodeURIComponent(provaId)}/resultado`,
  );

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar o resultado da prova.';
    let status = res.status;
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    } else if (status === 404) {
      // 404 = endpoint não deployado OU aluno ainda não respondeu. Mensagem
      // neutra — o frontend trata como "ainda não respondida".
      mensagem = 'Você ainda não respondeu esta prova.';
    }
    const err = new Error(mensagem);
    err.status = status;
    throw err;
  }

  const data = await res.json().catch(() => ({ nota: 0, aprovado: false, total_perguntas: 0, total_acertos: 0 }));
  return data;
}

// POST /cursos/:id/provas/:provaId/respostas — proxy ponta a ponta para o
// ENVIO das respostas da prova do aluno na VPS (POST /aluno/provas/:provaId/
// respostas). Recebe um array de respostas [{ pergunta_id, alternativa_id }],
// valida e persiste (UPSERT), calcula a nota, grava o resultado (UPSERT) e
// devolve { nota, aprovado, total_perguntas, total_acertos, nota_minima } —
// sem gabarito. 409 quando a prova já foi respondida (tentativa única).
// Lança Error com mensagem PT-BR em caso de falha.
export async function enviarRespostasProva(cursoId, provaId, respostas) {
  if (!cursoId || !provaId) {
    const err = new Error('Curso ou prova inválida.');
    err.status = 422;
    throw err;
  }
  if (!Array.isArray(respostas) || respostas.length === 0) {
    const err = new Error('Selecione uma resposta para cada questão.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(
    `/cursos/${encodeURIComponent(cursoId)}/provas/${encodeURIComponent(provaId)}/respostas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas }),
    },
  );

  if (!res.ok) {
    let mensagem = 'Não foi possível enviar suas respostas. Tente novamente.';
    let status = res.status;
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    } else if (status === 409) {
      mensagem = 'Esta prova já foi respondida.';
    } else if (status === 403) {
      mensagem = 'Você não tem permissão para responder esta prova.';
    } else if (status === 404) {
      mensagem = 'O envio de respostas ainda não está disponível para esta prova.';
    } else if (status === 400) {
      mensagem = 'Respostas inválidas. Confira suas seleções e tente novamente.';
    }
    const err = new Error(mensagem);
    err.status = status;
    throw err;
  }

  const data = await res.json().catch(() => ({ nota: 0, aprovado: false, total_perguntas: 0, total_acertos: 0 }));
  return data;
}

// GET /cursos/:id/provas — lista as provas do curso (camada do aluno).
// O backend repassa GET /aluno/cursos/:cursoId/provas na VPS usando o token
// de sessão (x-cursos-token). Devolve { provas, curso_id } (sem gabarito —
// apenas metadados: id, titulo, etapa_id, nota_minima, status). Lança Error
// com mensagem PT-BR em caso de falha de sessão (401).
export async function getProvasCurso(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  const res = await authedFetch(`/cursos/${encodeURIComponent(cursoId)}/provas`);

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar as provas deste curso.';
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (typeof data === 'string' && data) mensagem = data;
      else if (data?.error) mensagem = data.error;
      else if (data?.message) mensagem = data.message;
    } catch (_) {}
    if (res.status === 401) {
      mensagem = 'Sua sessão na plataforma de cursos expirou. Tente novamente para renovar o acesso.';
    }
    const err = new Error(mensagem);
    err.status = res.status;
    throw err;
  }

  const data = await res.json().catch(() => ({ provas: [] }));
  return data;
}

// Verifica o estado REAL de matrícula do usuário logado para um curso,
// consultando diretamente o PocketBase (coleção `matriculas`). NÃO usa cache
// de componente nem estado local — cada chamada refaz a consulta ao banco,
// garantindo que o estado exibido reflita a realidade atual (matrícula ativa
// vs. cancelada/excluída). Retorna { matriculado: boolean, matricula: record|null }.
// Considera apenas matrículas com status 'ativa' ou 'concluida' como válidas.
export async function verificarMatricula(cursoId) {
  if (!cursoId) return { matriculado: false, matricula: null };
  if (!pb.authStore.isValid) return { matriculado: false, matricula: null };
  const userId = pb.authStore.record?.id;
  if (!userId) return { matriculado: false, matricula: null };
  try {
    const lista = await pb.collection('matriculas').getFullList({
      filter: `usuario_id = "${userId}" && curso_api_id = "${String(cursoId)}"`,
    });
    const valida = lista.find(
      (m) => m.status === 'ativa' || m.status === 'concluida',
    );
    return { matriculado: Boolean(valida), matricula: valida || null };
  } catch (_) {
    return { matriculado: false, matricula: null };
  }
}

// Verifica o estado REAL de matrícula do usuário logado para um curso,
// consultando a API da VPS (GET /cursos/meus → /cursos/usuario/meus), que é
// a fonte oficial de matrículas. Diferente de `verificarMatricula` (que lê o
// PocketBase, onde registros stale permanecem após exclusão na VPS), esta
// função reflete a realidade da VPS — inclusive exclusões feitas no painel
// administrativo da VPS, que não propagam para o PocketBase.
//
// Retorna { matriculado: boolean, disponivel: boolean }:
//   - disponivel=true  → a consulta à VPS foi bem-sucedida; `matriculado`
//                        indica se o curso está na lista real da VPS.
//   - disponivel=false → a consulta não pôde ser concluída (VPS indisponível,
//                        rede, sessão PocketBase inválida); `matriculado`
//                        é false mas NÃO deve ser interpretado como "não
//                        matriculado" — o chamador deve preservar o curso
//                        (falha transitória) e seguir o fluxo normal.
//
// Usa authedFetch (renova o bridge-login uma única vez se o token expirou),
// mas NÃO entra no loop "renovar e tentar de novo → falhar → sessão expirada":
// erros são capturados e devolvidos como disponivel=false.
export async function verificarMatriculaApi(cursoId) {
  if (!cursoId) return { matriculado: false, disponivel: false };
  if (!pb.authStore.isValid) return { matriculado: false, disponivel: false };
  const userId = pb.authStore.record?.id;
  if (!userId) return { matriculado: false, disponivel: false };
  try {
    const res = await authedFetch('/cursos/meus');
    const data = await tratarResposta(res, 'Não foi possível verificar sua matrícula.');
    const lista = Array.isArray(data)
      ? data
      : (data?.cursos || data?.data || []);
    const matriculado = lista.some(
      (c) => String(c.id ?? c.curso_id ?? c.cursoId ?? '') === String(cursoId),
    );
    return { matriculado, disponivel: true };
  } catch (_) {
    return { matriculado: false, disponivel: false };
  }
}

// Exclui a matrícula local do usuário para um curso (PocketBase). Retorna
// { sucesso: boolean, removidos: number }. Não altera a VPS (backend
// preservado). Usado para sincronizar o estado do frontend quando uma
// matrícula é cancelada/excluída — o registro local é removido para que as
// telas (Meus Cursos, Detalhe, Aula) parem de tratá-lo como matriculado.
// Cada delete recebe um requestKey único (evita auto-cancelamento do SDK
// PocketBase ao excluir múltiplos registros em paralelo).
export async function cancelarMatricula(cursoId) {
  if (!cursoId) {
    const err = new Error('Curso inválido.');
    err.status = 422;
    throw err;
  }
  if (!pb.authStore.isValid) {
    const err = new Error('Sua sessão expirou. Faça login novamente.');
    err.status = 401;
    throw err;
  }
  const userId = pb.authStore.record?.id;
  if (!userId) {
    const err = new Error('Sua sessão expirou. Faça login novamente.');
    err.status = 401;
    throw err;
  }
  try {
    const lista = await pb.collection('matriculas').getFullList({
      filter: `usuario_id = "${userId}" && curso_api_id = "${String(cursoId)}"`,
    });
    if (lista.length === 0) return { sucesso: true, removidos: 0 };
    await Promise.all(
      lista.map((m, i) =>
        pb.collection('matriculas').delete(m.id, {
          requestKey: `del-mat-${m.id}-${i}`,
        }),
      ),
    );
    return { sucesso: true, removidos: lista.length };
  } catch (err) {
    const e = new Error(err?.message || 'Não foi possível cancelar sua matrícula.');
    e.status = err?.status || 500;
    throw e;
  }
}

export default { getMeusCursos, matricularCurso, acessarCurso, getAulas, getPdfAula, getProva, getProvasCurso, getProvaDetalhe, getProgresso, concluirAula, getMentorAcesso, getMentorSsoToken, getAlunoSso, getResultadoProva, enviarRespostasProva, verificarMatricula, verificarMatriculaApi, cancelarMatricula };
