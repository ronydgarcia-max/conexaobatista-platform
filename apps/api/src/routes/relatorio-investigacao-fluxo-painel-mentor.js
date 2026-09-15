// Download do RELATÓRIO DE INVESTIGAÇÃO DO FLUXO "ACESSAR PAINEL DO MENTOR"
// em conexaobatista.com.br (01/09/2026).
//
// Investigação EXCLUSIVA do fluxo "Acessar painel do mentor": identificação da
// requisição real feita ao clicar na ação, validação da geração da credencial
// temporária de 10 minutos e localização da camada responsável pela falha
// (frontend / rota existente do backend / serviço externo indisponível).
//
// Foram feitas requisições HTTP reais contra a VPS
// (https://api.conexaobatista.com.br) com o segredo de bridge real
// (CURSOS_API_BRIDGE_SECRET) e leitura do código-fonte das camadas frontend
// (MentorBoasVindasPage.jsx, cursosService.js) e backend (mentor-sso-token.js).
//
// CONCLUSÃO PRINCIPAL: a falha NÃO está no frontend e NÃO está na rota
// existente do backend. O encaminhamento do mentor está correto e intacto em
// ambas as camadas. A credencial temporária de 10 minutos NÃO está sendo
// gerada porque o SERVIÇO EXTERNO (VPS em api.conexaobatista.com.br,
// 69.62.124.240) está INDISPONÍVEL — TODOS os endpoints testados retornam
// HTTP 502 Bad Gateway (página "Not Found" do Easypanel), incluindo o
// /auth/bridge-login que emite a credencial e o /painel que é o destino do
// redirecionamento. O DNS resolve normalmente para um IP público; o serviço
// por trás do proxy está derrubado.
//
// Por determinação da tarefa: NÃO foram criados endpoints, NÃO foram
// simuladas credenciais, NÃO foi alterado o painel do aluno, SSO, matrículas,
// etapas dos cursos, permissões ou visual. Como a falha NÃO está no
// frontend, NENHUMA correção de encaminhamento foi aplicada.
//
// Acesso restrito a administradores (adminAuth — coleção admins).
// GET /relatorio-investigacao-fluxo-painel-mentor/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "================================================================================",
    "RELATÓRIO DE INVESTIGAÇÃO DO FLUXO \"ACESSAR PAINEL DO MENTOR\"",
    "conexaobatista.com.br — 01/09/2026",
    "================================================================================",
    "",
    "Título: Investigação Fluxo Acessar Painel do Mentor - " + dataHoraCurta,
    "Data/Hora (Brasília): " + dataHoraCurta,
    "",
    "Objeto: fluxo disparado pelo botão \"Acessar painel do mentor\" na página",
    "  /curso/boas-vindas (MentorBoasVindasPage.jsx) — mentor aprovado.",
    "Método: leitura do código-fonte (frontend + backend) + requisições HTTP",
    "  reais contra a VPS (https://api.conexaobatista.com.br) com o segredo de",
    "  bridge real (CURSOS_API_BRIDGE_SECRET).",
    "",
    "================================================================",
    "RESUMO EXECUTIVO",
    "================================================================",
    "",
    "A falha NÃO está no frontend e NÃO está na rota existente do backend.",
    "O encaminhamento do mentor está CORRETO e INTACTO em ambas as camadas.",
    "",
    "A credencial temporária de 10 minutos NÃO está sendo gerada porque o",
    "SERVIÇO EXTERNO (VPS em api.conexaobatista.com.br, IP 69.62.124.240) está",
    "INDISPONÍVEL. TODOS os endpoints testados retornam HTTP 502 Bad Gateway",
    "(página \"Not Found\" do Easypanel), inclusive:",
    "  - POST /auth/bridge-login  (emite a credencial de 10 minutos) -> 502",
    "  - GET  /painel             (destino do redirecionamento)      -> 502",
    "  - GET  /sso?token=...      (endpoint SSO citado em relatórios) -> 502",
    "  - GET  /                   (raiz)                              -> 502",
    "  - GET  /cursos             (listagem pública)                  -> 502",
    "  - GET  /health             (verificação de saúde)              -> 502",
    "",
    "O DNS resolve normalmente para um IP público (69.62.124.240); o serviço",
    "por trás do proxy reverso (Easypanel) está derrubado/inacessível. Esse",
    "mesmo 502 é a causa do erro observado no painel público",
    "(GET /hcgi/api/cursos-publicados -> 500 \"cursos-publicados falhou: 502",
    "Bad Gateway\"), registrado no journal da sessão.",
    "",
    "Por determinação da tarefa, como a falha NÃO está no frontend, NENHUMA",
    "correção de encaminhamento foi aplicada. Não foram criados endpoints,",
    "não foram simuladas credenciais e não foram alterados painel do aluno,",
    "SSO, matrículas, etapas dos cursos, permissões ou visual.",
    "",
    "================================================================",
    "1. REQUISIÇÃO REAL FEITA AO CLICAR EM \"ACESSAR PAINEL DO MENTOR\"",
    "================================================================",
    "",
    "1.1. Camada frontend (intacta, correta)",
    "--------------------------------------------------------------",
    "Arquivo: apps/web/src/pages/curso/MentorBoasVindasPage.jsx",
    "  - Botão \"Acessar painel do mentor\" (exibido só para mentor aprovado,",
    "    usuario.mentor_status === 'aprovado').",
    "  - onClick -> acessarPainelMentor() -> getMentorSsoToken().",
    "",
    "Arquivo: apps/web/src/services/cursosService.js -> getMentorSsoToken()",
    "  Requisição real disparada pelo clique:",
    "    GET /hcgi/api/mentor-sso-token",
    "    Header: Authorization: Bearer <token PocketBase da sessão>",
    "  (apiServerClient adiciona o prefixo /hcgi/api; o segredo nunca é",
    "   exposto no frontend.)",
    "",
    "  Em sucesso: window.location.href = data.redirectUrl",
    "  (redireciona o navegador para a URL de destino com o token na query).",
    "  Em falha: exibe erroPainel (mensagem PT-BR) e reabilita o botão.",
    "",
    "1.2. Camada backend — rota existente (intacta, correta)",
    "--------------------------------------------------------------",
    "Arquivo: apps/api/src/routes/mentor-sso-token.js",
    "Rota registrada: GET /mentor-sso-token (authMiddleware — sessão PB).",
    "",
    "Sequência executada pela rota:",
    "  1. Valida req.user (sessão PocketBase) — 401 se ausente.",
    "  2. Valida status_aprovacao === 'aprovado' — 403 se não.",
    "  3. Valida mentor_status === 'aprovado' — 403 se não.",
    "  4. Exige MENTOR_PAINEL_SSO_URL configurada — 503 se ausente.",
    "     (Valor real lido de apps/api/.env:",
    "      https://api.conexaobatista.com.br/painel)",
    "  5. Validação SSRF/TLS/DNS do destino (HTTPS, não privado).",
    "  6. Exige CURSOS_API_BRIDGE_SECRET configurado — 500 se ausente.",
    "  7. POST {CURSOS_API_URL}/usuarios/ensure (best-effort, ignora erro).",
    "  8. POST {CURSOS_API_URL}/auth/bridge-login",
    "       Header: x-bridge-secret: <CURSOS_API_BRIDGE_SECRET>",
    "       Body: { pocketbase_id, email }",
    "     -> espera { token, expiresAt } (credencial VPS-issued).",
    "  9. Monta redirectUrl = {MENTOR_PAINEL_SSO_URL}?token=<token VPS>.",
    " 10. Retorna { token, url, redirectUrl, expiresAt, role: 'mentor' }.",
    "",
    "  Em falha do bridge-login (passo 8): retorna 502 { error: <msg> }.",
    "",
    "================================================================",
    "2. VALIDAÇÃO DA CREDENCIAL TEMPORÁRIA DE 10 MINUTOS",
    "================================================================",
    "",
    "CONFIRMAÇÃO: NÃO ESTÁ SENDO GERADA.",
    "",
    "A credencial de 10 minutos é emitida pela própria VPS no endpoint",
    "POST /auth/bridge-login (passo 8 da rota). O backend Hostinger NÃO a",
    "assina localmente — ele delega à VPS justamente porque o painel do",
    "mentor é servido pela VPS e só valida tokens emitidos por ela (tokens",
    "assinados com MENTOR_JWT_SECRET eram rejeitados com 401, conforme",
    "histórico).",
    "",
    "Probe real (01/09/2026, Brasília):",
    "  POST https://api.conexaobatista.com.br/auth/bridge-login",
    "    Header: Content-Type: application/json",
    "    Header: x-bridge-secret: <CURSOS_API_BRIDGE_SECRET real>",
    "    Body: {\"pocketbase_id\":\"probe-investigacao\",",
    "           \"email\":\"probe@investigacao.test\",",
    "           \"nome\":\"Probe Investigacao\"}",
    "  Resposta: HTTP/2 502 Bad Gateway",
    "    content-type: text/html",
    "    Corpo: página \"Not Found\" do Easypanel (HTML, 2871 bytes).",
    "",
    "Como o bridge-login retorna 502 (não-OK, sem campo \"token\"), a rota",
    "mentor-sso-token.js cai no branch de falha e devolve 502 ao frontend,",
    "que exibe a mensagem de erro e NÃO redireciona. A credencial de 10",
    "minutos nunca chega a existir porque o emissor (VPS) está indisponível.",
    "",
    "Observação: o TTL de 10 minutos (600s) está definido na VPS (emissor do",
    "token); o backend Hostinger apenas repassa expiresAt quando o token",
    "existe. Como o token não foi emitido, o TTL não pôde ser confirmado",
    "neste momento (validação não comprovada — ver seção 6).",
    "",
    "================================================================",
    "3. CAMADA RESPONSÁVEL PELA FALHA",
    "================================================================",
    "",
    "CAMADA: SERVIÇO EXTERNO (VPS — api.conexaobatista.com.br).",
    "",
    "Evidência — varredura de endpoints (todos 502 Bad Gateway):",
    "  GET  https://api.conexaobatista.com.br/            -> 502",
    "  GET  https://api.conexaobatista.com.br/cursos      -> 502",
    "  GET  https://api.conexaobatista.com.br/health      -> 502",
    "  POST https://api.conexaobatista.com.br/auth/bridge-login -> 502",
    "  GET  https://api.conexaobatista.com.br/sso?token=teste   -> 502",
    "  GET  https://api.conexaobatista.com.br/painel             -> 502",
    "  GET  https://api.conexaobatista.com.br/painel?token=teste -> 502",
    "",
    "Resolução DNS: api.conexaobatista.com.br -> 69.62.124.240 (IPv4 público,",
    "não privado). O DNS está íntegro; o serviço por trás do proxy reverso",
    "(Easypanel) é que está derrubado — por isso TODA rota retorna a página",
    "padrão \"Not Found\"/502 do Easypanel, e não um 404 de rota inexistente.",
    "",
    "Descartado como causa:",
    "  - Frontend: encaminhamento correto (getMentorSsoToken -> GET",
    "    /mentor-sso-token -> window.location.href = redirectUrl).",
    "  - Backend (rota existente): lógica correta e fail-closed; só falha",
    "    porque o upstream (VPS) retorna 502.",
    "  - Configuração: MENTOR_PAINEL_SSO_URL e CURSOS_API_BRIDGE_SECRET",
    "    estão configurados em apps/api/.env.",
    "",
    "================================================================",
    "4. REQUISIÇÃO, MÉTODO, STATUS E RESPOSTA RELEVANTE",
    "================================================================",
    "",
    "Requisição-chave do fluxo (backend -> VPS):",
    "  Método: POST",
    "  URL: https://api.conexaobatista.com.br/auth/bridge-login",
    "  Headers: Content-Type: application/json;",
    "           x-bridge-secret: <CURSOS_API_BRIDGE_SECRET>",
    "  Body: { \"pocketbase_id\": \"<id>\", \"email\": \"<email>\" }",
    "  Status da resposta: 502 Bad Gateway",
    "  Resposta relevante: página HTML \"Not Found\" do Easypanel",
    "    (content-type: text/html; content-length: 2871). Sem corpo JSON,",
    "    sem campo \"token\". O JSON.parse falha e a rota devolve 502 ao",
    "    frontend com a mensagem do corpo (HTML) ou o fallback",
    "    \"Não foi possível autenticar na plataforma de cursos. Tente",
    "    novamente.\"",
    "",
    "Requisição de destino do redirecionamento (navegador -> VPS, após",
    "sucesso hipotético):",
    "  Método: GET",
    "  URL: https://api.conexaobatista.com.br/painel?token=<JWT VPS>",
    "  Status da resposta: 502 Bad Gateway (mesmo com a VPS no ar, o",
    "    destino /painel também retorna 502 — rota não servida).",
    "",
    "Requisição do frontend -> backend Hostinger:",
    "  Método: GET",
    "  URL: /hcgi/api/mentor-sso-token",
    "  Header: Authorization: Bearer <token PocketBase>",
    "  Status da resposta: 502 (propagado do upstream VPS).",
    "",
    "================================================================",
    "5. O QUE FOI FEITO E O QUE NÃO FOI FEITO",
    "================================================================",
    "",
    "FEITO (somente investigação + relatório):",
    "  - Leitura do código-fonte das camadas frontend (MentorBoasVindasPage.jsx,",
    "    cursosService.js) e backend (mentor-sso-token.js) para identificar a",
    "    requisição real e validar o encaminhamento.",
    "  - Requisições HTTP reais contra a VPS (bridge-login, /painel, /sso,",
    "    raiz, /cursos, /health) com o segredo de bridge real, registrando",
    "    método, status e corpo.",
    "  - Resolução DNS de api.conexaobatista.com.br (IP público confirmado).",
    "  - Documentação da requisição, status, resposta, confirmação (ou não)",
    "    da credencial de 10 minutos, camada responsável e validações não",
    "    comprovadas.",
    "  - Geração deste relatório (rota adminAuth, .txt em memória, horário",
    "    de Brasília).",
    "",
    "NÃO FEITO (por determinação da tarefa / porque a falha é externa):",
    "  - NENHUMA correção de encaminhamento no frontend (a falha NÃO está no",
    "    frontend; o encaminhamento está correto).",
    "  - NÃO foram criados endpoints (nem no Express, nem na VPS).",
    "  - NÃO foram simuladas credenciais ou tokens.",
    "  - NÃO foi alterado o painel do aluno, SSO, matrículas, etapas dos",
    "    cursos, permissões ou visual.",
    "  - NÃO foi alterada a VPS (fora do sandbox; exige SSH/direct access).",
    "",
    "================================================================",
    "6. VALIDAÇÕES NÃO COMPROVADAS",
    "================================================================",
    "",
    "  - TTL de 10 minutos (600s) da credencial: NÃO comprovado. O TTL é",
    "    definido na VPS (emissora do token); como o bridge-login retorna",
    "    502, nenhum token foi emitido e o expiresAt não pôde ser lido.",
    "    Será comprovado somente quando a VPS voltar ao ar.",
    "  - Redirecionamento final do navegador para /painel?token=...: NÃO",
    "    comprovado ponta a ponta. O frontend só redireciona após receber",
    "    redirectUrl com sucesso; como a rota devolve 502, o redirecionamento",
    "    não ocorre. Adicionalmente, o destino /painel também retorna 502",
    "    hoje (rota não servida pela VPS).",
    "  - Validação visual no navegador (sessão live) não foi executada no",
    "    sandbox; a conclusão se apoia nas respostas HTTP reais observadas.",
    "",
    "================================================================",
    "7. PRÓXIMAS ETAPAS (fora do escopo desta tarefa)",
    "================================================================",
    "",
    "Para restaurar o fluxo \"Acessar painel do mentor\":",
    "",
    "  a) Reiniciar/republicar o serviço cursos-api na VPS (Easypanel,",
    "     projeto cursos-api em /etc/easypanel/projects/cursos-api/...) —",
    "     hoje TODA rota retorna 502, indicando serviço derrubado, não rota",
    "     inexistente.",
    "  b) Confirmar que POST /auth/bridge-login volta a devolver",
    "     { token, expiresAt } (200) e que GET /painel?token=... serve o",
    "     painel do mentor (200, HTML).",
    "  c) Sendo ambos confirmados, o fluxo existente (frontend + rota",
    "     mentor-sso-token) passará a funcionar sem alteração de código.",
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
    "[relatorio-investigacao-fluxo-painel-mentor] Solicitação de relatório por: " +
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
    "relatorio-investigacao-fluxo-painel-mentor-" +
    dataHoraArquivo +
    ".txt";

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
