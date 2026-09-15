// Download do RELATÓRIO DE REVERSÃO DO FLUXO DE LOGIN (BRIDGE-LOGIN)
// (03/09/2026) — o frontend voltou a chamar o PROXY EXPRESS
// /cursos/bridge-login (via apiServerClient.fetch), enviando SOMENTE o token
// PocketBase no header Authorization (Bearer). O segredo (x-bridge-secret /
// CURSOS_API_BRIDGE_SECRET) permanece no backend (cursos-sso.js), que valida
// o usuário (authMiddleware) e adiciona o segredo internamente ao chamar a
// API externa de cursos. Nenhum segredo trafega pelo navegador.
//
// ESCOPO: somente o fluxo de login (bridge-login) no frontend. Backend, SSO
// de aluno, login de mentor e demais endpoints NÃO foram alterados.
//
// Acesso restrito a administradores (adminAuth).
// GET /relatorio-reversao-fluxo-login-bridge/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "================================================================================",
    "RELATÓRIO DE REVERSÃO DO FLUXO DE LOGIN (BRIDGE-LOGIN)",
    "BRIDGE-LOGIN VIA PROXY EXPRESS (RESTAURADO) — 03/09/2026",
    "================================================================================",
    "",
    "Título: Reversão Fluxo de Login - Bridge-Login via Proxy Express - " + dataHoraCurta,
    "Data/Hora (Brasília): " + dataHoraCurta,
    "",
    "--------------------------------------------------------------------------------",
    "1. OBJETIVO",
    "--------------------------------------------------------------------------------",
    "Reverter a alteração anterior (03/09/2026) que fazia o frontend chamar",
    "DIRETAMENTE o endpoint público https://api.conexaobatista.com.br/api/",
    "bridge-login. Restaurar renovarToken() para chamar o backend via",
    "apiServerClient.fetch('/cursos/bridge-login', ...) enviando o token do",
    "PocketBase no header Authorization (Bearer), como estava antes. A rota",
    "proxy /cursos/bridge-login do backend (cursos-sso.js) permanece",
    "responsável por validar o usuário (authMiddleware) e adicionar o segredo",
    "(x-bridge-secret) internamente. Nenhum segredo é enviado pelo navegador.",
    "",
    "--------------------------------------------------------------------------------",
    "2. ARQUIVO ALTERADO",
    "--------------------------------------------------------------------------------",
    "Frontend (único arquivo funcional alterado):",
    "  - apps/web/src/services/cursosAuthService.js",
    "      * Restaurado o import de apiServerClient.",
    "      * Atualizados os comentários do cabeçalho e de renovarToken() para",
    "        descrever a chamada via proxy Express (mesma origem /hcgi/api).",
    "      * renovarToken() reescrita para chamar",
    "        apiServerClient.fetch('/cursos/bridge-login', { method:'POST',",
    "        headers:{ 'Content-Type':'application/json',",
    "        Authorization:`Bearer ${pbToken}` } }).",
    "      * Removida a chamada direta fetch('https://api.conexaobatista.",
    "        com.br/api/bridge-login', ...) e o body { pocketbase_id, email,",
    "        nome, mentor_status } (esses dados agora são lidos no backend a",
    "        partir de req.user, definido por authMiddleware).",
    "",
    "Relatório (adicionais, sem alterar endpoints existentes):",
    "  - apps/api/src/routes/relatorio-reversao-fluxo-login-bridge.js (NOVO).",
    "  - apps/api/src/routes/index.js (apenas registro da nova rota de relatório).",
    "  - apps/web/src/pages/adm/RelatorioAlteracoesPage.jsx (entrada do relatório).",
    "",
    "--------------------------------------------------------------------------------",
    "3. ENDPOINT UTILIZADO",
    "--------------------------------------------------------------------------------",
    "A chamada passa novamente por apiServerClient, que adiciona o prefixo",
    "/hcgi/api. Portanto a URL final efetiva (mesma origem) é:",
    "  /hcgi/api/cursos/bridge-login",
    "  → rota backend registrada: POST /cursos/bridge-login (authMiddleware)",
    "  → handler: bridgeLogin em apps/api/src/routes/cursos-sso.js",
    "",
    "Method: POST",
    "",
    "--------------------------------------------------------------------------------",
    "4. HEADER AUTHORIZATION (BEARER)",
    "--------------------------------------------------------------------------------",
    "Headers enviados pelo frontend:",
    "  - Content-Type: application/json",
    "  - Authorization: Bearer <token_pocketbase>",
    "      onde <token_pocketbase> = pb.authStore.token (sessão PocketBase do",
    "      usuário autenticado na coleção users).",
    "",
    "O token PocketBase é validado no backend por authMiddleware (middleware/",
    "auth.js), que decodifica o JWT, lê o registro do usuário via GET (sem",
    "auth-refresh, para não rotacionar o tokenKey) e popula req.user com o",
    "registro completo (id, email, name, mentor_status, ...). O handler",
    "bridgeLogin usa req.user para chamar a VPS.",
    "",
    "--------------------------------------------------------------------------------",
    "5. SEGREDOS PERMANECEM NO BACKEND",
    "--------------------------------------------------------------------------------",
    "A requisição do frontend NÃO envia:",
    "  - header x-bridge-secret (adicionado apenas no backend, em cursos-sso.js);",
    "  - variável CURSOS_API_BRIDGE_SECRET (lida no backend via process.env);",
    "  - nenhum segredo da VPS.",
    "O backend (cursos-sso.js) lê CURSOS_API_BRIDGE_SECRET de process.env e",
    "adiciona o header x-bridge-secret ao chamar a API externa de cursos",
    "(POST /usuarios/ensure e POST /auth/bridge-login na VPS). O segredo",
    "nunca trafega pelo navegador.",
    "",
    "--------------------------------------------------------------------------------",
    "6. TRATAMENTO PRESERVADO",
    "--------------------------------------------------------------------------------",
    "O tratamento da resposta, erros, redirecionamentos e sessão do usuário",
    "foi PRESERVADO intacto:",
    "  - 401 → limparToken() + throw 'Sua sessão expirou. Faça login novamente",
    "    para acessar seus cursos.';",
    "  - não-OK (outros status) → throw data?.error || 'Não foi possível",
    "    autenticar na plataforma de cursos. Tente novamente.';",
    "  - sem data.token → throw 'Não foi possível obter o token de acesso aos",
    "    cursos. Tente novamente.';",
    "  - sucesso → armazenarToken(data.token, data.expiresAt || data.expires_at);",
    "  - refreshPromise (dedup de renovações concorrentes) e listener de logout",
    "    (limparToken quando a sessão PocketBase encerra) mantidos.",
    "  - capturarTokenDaUrl, isTokenValido, garantirToken, obter/limparToken,",
    "    armazenarToken: inalterados.",
    "",
    "--------------------------------------------------------------------------------",
    "7. O QUE NÃO FOI ALTERADO",
    "--------------------------------------------------------------------------------",
    "  - Backend (apps/api): a rota proxy POST /cursos/bridge-login",
    "    (cursos-sso.js) permanece INTACTA e responsável por validar o usuário",
    "    e adicionar o segredo internamente. Nenhuma rota existente alterada;",
    "    apenas uma NOVA rota de relatório foi adicionada (aditiva).",
    "  - SSO de aluno (aluno-sso.js / getAlunoSso): inalterado.",
    "  - Login de mentor (mentor-sso-token.js / getMentorSsoToken): inalterado.",
    "  - Demais endpoints (cursos, aulas, PDF, provas, progresso, matrícula,",
    "    moderação, categorias, etc.): inalterados.",
    "  - Visual, rotas, matrículas, permissões e dados reais: inalterados.",
    "  - Armazenamento do token em sessionStorage (sessão atual, não",
    "    localStorage): inalterado.",
    "",
    "--------------------------------------------------------------------------------",
    "8. VALIDAÇÕES",
    "--------------------------------------------------------------------------------",
    "  - Busca frontend por x-bridge-secret: 0 ocorrências (não é adicionado",
    "    pelo frontend; apenas pelo backend).",
    "  - Busca frontend por CURSOS_API_BRIDGE_SECRET: 0 ocorrências.",
    "  - Endpoint final: /hcgi/api/cursos/bridge-login (via apiServerClient).",
    "  - Header Authorization: Bearer <token_pocketbase> presente.",
    "  - ESLint/build: validado via reload_app.",
    "",
    "--------------------------------------------------------------------------------",
    "9. CONFIRMAÇÃO NO NAVEGADOR",
    "--------------------------------------------------------------------------------",
    "Confirmação de que a requisição no navegador chama o proxy",
    "/hcgi/api/cursos/bridge-login com o header Authorization (Bearer) e SEM",
    "x-bridge-secret: NÃO COMPROVADA. A execução da requisição no navegador",
    "(DevTools/Network) não pode ser realizada dentro do sandbox. A restauração",
    "do fluxo foi verificada por auditoria do código fonte (apiServerClient.fetch",
    "com path /cursos/bridge-login, headers Content-Type + Authorization Bearer,",
    "sem body nem segredos no frontend).",
    "",
    "================================================================================",
    "FIM DO RELATÓRIO",
    "================================================================================",
  ].join("\n");
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    "[relatorio-reversao-fluxo-login-bridge] Solicitação de relatório por: " +
      solicitante,
  );

  const conteudo = montarRelatorio();

  const dataHoraArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/[/: ]/g, "-");
  const nomeArquivo =
    "relatorio-reversao-fluxo-login-bridge-" + dataHoraArquivo + ".txt";

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + nomeArquivo + '"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
