// =============================================================================
// Registro de endpoints — integração Frontend (Horizons) ↔ Backend VPS
// =============================================================================
//
// API da VPS: https://api.conexaobatista.com.br
//
// PRINCÍPIO ARQUITETURAL (importante):
//   O frontend NÃO chama a VPS diretamente do navegador. Todas as chamadas
//   passam por proxies Express (mesma origem, prefixo /hcgi/api) que:
//     - evitam mixed content (o site é HTTPS; a VPS histórica era HTTP);
//     - mantêm segredos no backend (x-bridge-secret, MENTOR_JWT_SECRET);
//     - NÃO expõem tokens da VPS no navegador (os tokens de cursos ficam
//       no backend ou são emitidos sob demanda via SSO de curta duração);
//     - preservam a ÚNICA fonte de autenticação (PocketBase — rede de
//       membros com fluxo de aprovação da igreja, CPF, dataNascimento,
//       estadoCivil, igreja_id). A VPS não possui seu próprio login de
//       membros; o acesso do aluno/mentor é feito por SSO (JWT assinado
//       com MENTOR_JWT_SECRET, TTL 600s).
//
//   Por isso NÃO existe um `vpsService` que faz fetch direto ao navegador
//   com tokens em localStorage — isso criaria uma SEGUNDA fonte de dados,
//   exporia tokens no frontend e quebraria nos endpoints que a VPS não
//   oferece (GET /auth/me → 404; POST /cursos/:id/matricula → 404).
//
// Auditoria de endpoints da VPS (validada em 31/08/2026):
//   GET  /cursos              → 200 (público, lista cursos publicados)
//   GET  /cursos/:id          → 200 (público, detalhe do curso)
//   POST /auth/login          → 400 em credenciais inválidas (existe)
//   GET  /auth/me             → 404 (NÃO existe — não usar)
//   GET  /aluno/cursos        → 401 sem token (existe, exige auth)
//   GET  /cursos/:id/token    → 401 sem token (existe; cria matrícula
//                                como efeito colateral idempotente)
//   POST /cursos/:id/matricula→ 404 (NÃO existe — matrícula = side
//                                effect de GET /cursos/:id/token)
//   GET  /sso                 → 400 sem token (existe; valida JWT SSO
//                                e redireciona para /painel-aluno)
//   GET  /painel-aluno        → 200 (página estática do painel do aluno)
//   POST /usuarios/ensure     → sincroniza usuário PocketBase → VPS
//   POST /auth/bridge-login   → emite token de cursos (header x-bridge-secret)
//   GET  /admin/cursos        → lista administrativa (header x-bridge-secret)
// =============================================================================

// URL base da API externa de cursos (VPS). Usada apenas como referência
// documental no frontend — as chamadas reais passam pelos proxies abaixo.
const VPS_BASE_URL = 'https://api.conexaobatista.com.br';

// Endpoints da VPS (referência — NÃO chamados diretamente do navegador).
export const vpsEndpoints = {
  baseURL: VPS_BASE_URL,

  // Autenticação da VPS (a autenticação do SITE é PocketBase; a VPS é
  // acessada via SSO/bridge-login, não via login direto do navegador).
  auth: {
    login: `${VPS_BASE_URL}/auth/login`,        // existe (não usado pelo site)
    bridgeLogin: `${VPS_BASE_URL}/auth/bridge-login`, // backend only
    me: null,                                     // /auth/me NÃO existe (404)
  },

  // Cursos públicos.
  cursos: {
    lista: `${VPS_BASE_URL}/cursos`,             // público (200)
    detalhes: (id) => `${VPS_BASE_URL}/cursos/${id}`, // público (200)
  },

  // Área do aluno (exige token de cursos — obtido via proxy server-side).
  aluno: {
    cursos: `${VPS_BASE_URL}/aluno/cursos`,      // 401 sem token
    aulas: (id) => `${VPS_BASE_URL}/aluno/cursos/${id}/aulas`,
    token: (id) => `${VPS_BASE_URL}/cursos/${id}/token`, // cria matrícula
    matricula: null,                              // /cursos/:id/matricula NÃO existe (404)
  },

  // SSO (JWT assinado com MENTOR_JWT_SECRET, destino "aluno" ou "mentor").
  sso: {
    entrada: `${VPS_BASE_URL}/sso`,              // valida JWT e redireciona
    painelAluno: `${VPS_BASE_URL}/painel-aluno`, // página estática
    painelMentor: `${VPS_BASE_URL}/painel`,      // captura ?token=
  },

  // Backend only (segredo no servidor — nunca no navegador).
  admin: {
    cursos: `${VPS_BASE_URL}/admin/cursos`,      // x-bridge-secret
    ensure: `${VPS_BASE_URL}/usuarios/ensure`,   // x-bridge-secret
  },
};

// Proxies Express (mesma origem, /hcgi/api) — ESTES são os caminhos que o
// frontend realmente usa via `apiServerClient.fetch(...)`. Cada proxy
// encapsula a chamada à VPS, mantendo segredos no backend.
export const proxyEndpoints = {
  // Públicos (sem autenticação).
  publicos: {
    categorias: '/categorias',
    cursosPublicados: '/cursos-publicados',           // → VPS /cursos
    cursoDetalhe: (id) => `/cursos-publicados/${id}`, // → VPS /admin/cursos + suplemento local
  },

  // Autenticados (exige sessão PocketBase — authMiddleware).
  autenticados: {
    meusCursos: '/cursos/meus',                       // → PocketBase matriculas
    matricula: (id) => `/cursos/${id}/matricula`,     // → VPS /cursos/:id/token + PB local
    tokenAcesso: (id) => `/cursos/${id}/token`,       // → VPS /cursos/:id/token
    aulas: (id) => `/cursos/${id}/aulas`,             // → VPS /aluno/cursos/:id/aulas
    alunoSso: '/aluno-sso',                           // → VPS /sso?token=JWT (aluno)
    mentorSso: '/mentor-sso-token',                   // → VPS /painel?token=JWT (mentor)
    mentorAcesso: '/cursos/mentor-acesso',
  },
};

// Configuração consolidada exportada como default.
const apiConfig = {
  vps: vpsEndpoints,
  proxy: proxyEndpoints,
  // Prefixo do cliente da API (apiServerClient) — mesma origem.
  proxyPrefix: '/hcgi/api',
};

export default apiConfig;
