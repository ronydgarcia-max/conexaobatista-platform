// Download do RELATÓRIO DE ALTERAÇÃO DO FLUXO DE LOGIN (BRIDGE-LOGIN)
// (03/09/2026) — o frontend passou a chamar DIRETAMENTE o endpoint público
// https://api.conexaobatista.com.br/api/bridge-login, sem o header
// x-bridge-secret, sem CURSOS_API_BRIDGE_SECRET e sem o token PocketBase,
// com body exatamente { pocketbase_id, email, nome, mentor_status }.
//
// ESCOPO: somente o fluxo de login (bridge-login) no frontend. Backend, SSO
// de aluno, login de mentor e demais endpoints NÃO foram alterados.
//
// Acesso restrito a administradores (adminAuth).
// GET /relatorio-alteracao-fluxo-login-bridge/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "================================================================================",
    "RELATÓRIO DE ALTERAÇÃO DO FLUXO DE LOGIN (BRIDGE-LOGIN)",
    "BRIDGE-LOGIN DIRETO DO FRONTEND — 03/09/2026",
    "================================================================================",
    "",
    "Título: Alteração Fluxo de Login - Bridge-Login Direto do Frontend - " + dataHoraCurta,
    "Data/Hora (Brasília): " + dataHoraCurta,
    "",
    "--------------------------------------------------------------------------------",
    "1. OBJETIVO",
    "--------------------------------------------------------------------------------",
    "Alterar SOMENTE o fluxo de login (bridge-login) no frontend do projeto,",
    "substituindo a chamada ao proxy backend (/cursos/bridge-login, que repassava",
    "para a VPS com o header x-bridge-secret) por uma chamada DIRETA ao endpoint",
    "público https://api.conexaobatista.com.br/api/bridge-login, sem enviar",
    "nenhum segredo, header x-bridge-secret, variável CURSOS_API_BRIDGE_SECRET",
    "ou token PocketBase pelo navegador. Body exatamente",
    "{ pocketbase_id, email, nome, mentor_status }.",
    "",
    "--------------------------------------------------------------------------------",
    "2. BUSCA REALIZADA NO CÓDIGO FRONTEND (apps/web/src)",
    "--------------------------------------------------------------------------------",
    "Padrões pesquisados em TODO o apps/web/src:",
    "  - x-bridge-secret",
    "  - CURSOS_API_BRIDGE_SECRET",
    "  - /auth/bridge-login",
    "  - api.conexaobatista.com.br",
    "  - bridge-login (termo adicional)",
    "",
    "Resultado da busca:",
    "  - apps/web/src/services/cursosAuthService.js era o ÚNICO arquivo do",
    "    frontend relacionado a esse fluxo. Continha:",
    "      * comentários mencionando CURSOS_API_BRIDGE_SECRET (linhas 14-15);",
    "      * import de apiServerClient (usado apenas em renovarToken);",
    "      * renovarToken() chamava apiServerClient.fetch('/cursos/bridge-login',",
    "        { method:'POST', headers:{ 'Content-Type':'application/json',",
    "        Authorization:`Bearer ${pbToken}` } }) — ou seja, chamava o PROXY",
    "        backend, que por sua vez chamava a VPS com x-bridge-secret.",
    "  - Nenhuma ocorrência literal de 'x-bridge-secret' no código frontend",
    "    (o header era adicionado apenas no backend, em cursos-sso.js).",
    "  - Nenhuma ocorrência literal de '/auth/bridge-login' no frontend.",
    "  - Nenhuma outra página/serviço do frontend referenciava",
    "    api.conexaobatista.com.br nem bridge-login.",
    "",
    "--------------------------------------------------------------------------------",
    "3. ARQUIVO(S) ALTERADO(S)",
    "--------------------------------------------------------------------------------",
    "Frontend (único arquivo funcional alterado):",
    "  - apps/web/src/services/cursosAuthService.js",
    "      * Removido o import de apiServerClient (não mais usado neste fluxo).",
    "      * Atualizados os comentários do cabeçalho: não mencionam mais",
    "        CURSOS_API_BRIDGE_SECRET nem 'backend (Express)'; descrevem a",
    "        chamada direta ao endpoint público.",
    "      * renovarToken() reescrita para chamar DIRETAMENTE",
    "        fetch('https://api.conexaobatista.com.br/api/bridge-login', ...).",
    "",
    "Relatório (adicionais, sem alterar endpoints existentes):",
    "  - apps/api/src/routes/relatorio-alteracao-fluxo-login-bridge.js (NOVO).",
    "  - apps/api/src/routes/index.js (apenas registro da nova rota de relatório).",
    "  - apps/web/src/pages/adm/RelatorioAlteracoesPage.jsx (entrada do relatório).",
    "",
    "--------------------------------------------------------------------------------",
    "4. URL FINAL EFETIVA",
    "--------------------------------------------------------------------------------",
    "A chamada usa fetch() com URL ABSOLUTA e completa:",
    "  https://api.conexaobatista.com.br/api/bridge-login",
    "  → path: /api/bridge-login",
    "",
    "NÃO passa por apiServerClient (que adicionaria o prefixo /hcgi/api).",
    "Portanto NÃO há risco de duplicação /api/api/bridge-login. Confirmado:",
    "a URL final é exatamente /api/bridge-login (sem prefixo extra).",
    "",
    "--------------------------------------------------------------------------------",
    "5. BODY DA REQUISIÇÃO",
    "--------------------------------------------------------------------------------",
    "Method: POST",
    "Headers: { 'Content-Type': 'application/json' }",
    "Body (exatamente estes 4 campos, lidos do registro PocketBase):",
    "  {",
    "    pocketbase_id: usuario.id,",
    "    email: usuario.email,",
    "    nome: usuario.name || usuario.username,",
    "    mentor_status: usuario.mentor_status",
    "  }",
    "",
    "--------------------------------------------------------------------------------",
    "6. AUSÊNCIA DO HEADER x-bridge-secret (E DE SEGREDOS)",
    "--------------------------------------------------------------------------------",
    "A requisição NÃO envia:",
    "  - header x-bridge-secret (removido completamente do fluxo frontend);",
    "  - header Authorization (o token PocketBase NÃO é enviado — a sessão",
    "    PocketBase é usada apenas para ler pocketbase_id/email/nome/",
    "    mentor_status localmente, nunca transmitida);",
    "  - CURSOS_API_BRIDGE_SECRET (variável de backend, nunca referenciada",
    "    no frontend após a alteração).",
    "Único header enviado: Content-Type: application/json.",
    "",
    "--------------------------------------------------------------------------------",
    "7. TRATAMENTO PRESERVADO",
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
    "  - capturarTokenDaUrl, isTokenValido, garantirToken, obter/limparToken:",
    "    inalterados.",
    "",
    "--------------------------------------------------------------------------------",
    "8. O QUE NÃO FOI ALTERADO",
    "--------------------------------------------------------------------------------",
    "  - Backend (apps/api): nenhuma rota existente alterada. A rota proxy",
    "    POST /cursos/bridge-login (cursos-sso.js) permanece no código, mas não",
    "    é mais chamada pelo frontend neste fluxo. Apenas uma NOVA rota de",
    "    relatório foi adicionada (aditiva, sem impactar endpoints existentes).",
    "  - SSO de aluno (aluno-sso.js / getAlunoSso): inalterado.",
    "  - Login de mentor (mentor-sso-token.js / getMentorSsoToken): inalterado.",
    "  - Demais endpoints (cursos, aulas, PDF, provas, progresso, matrícula,",
    "    moderação, categorias, etc.): inalterados.",
    "  - Visual, rotas, matrículas, permissões e dados reais: inalterados.",
    "",
    "--------------------------------------------------------------------------------",
    "9. VALIDAÇÕES",
    "--------------------------------------------------------------------------------",
    "  - Busca frontend por x-bridge-secret: 0 ocorrências (após alteração).",
    "  - Busca frontend por CURSOS_API_BRIDGE_SECRET: 0 ocorrências funcionais",
    "    (apenas removidas dos comentários do cursosAuthService.js).",
    "  - Busca frontend por /auth/bridge-login: 0 ocorrências.",
    "  - URL final: https://api.conexaobatista.com.br/api/bridge-login (path",
    "    /api/bridge-login, sem duplicação /api/api/).",
    "  - Body: exatamente { pocketbase_id, email, nome, mentor_status }.",
    "  - Header x-bridge-secret: ausente (código não o adiciona).",
    "  - ESLint/build: validado via reload_app.",
    "",
    "--------------------------------------------------------------------------------",
    "10. CONFIRMAÇÃO NO NAVEGADOR",
    "--------------------------------------------------------------------------------",
    "Confirmação de que a requisição no navegador não contém mais o header",
    "x-bridge-secret e de que o endpoint chamado é exatamente /api/bridge-login:",
    "NÃO COMPROVADA. A execução da requisição no navegador (DevTools/Network)",
    "não pode ser realizada dentro do sandbox. A ausência do header e a URL",
    "exata foram verificadas por auditoria do código fonte (fetch direto com",
    "URL absoluta, headers somente Content-Type).",
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
    "[relatorio-alteracao-fluxo-login-bridge] Solicitação de relatório por: " +
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
    "relatorio-alteracao-fluxo-login-bridge-" + dataHoraArquivo + ".txt";

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
