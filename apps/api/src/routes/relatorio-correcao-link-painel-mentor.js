// Download do relatório de CORREÇÃO - LINK DO PAINEL DO MENTOR (.txt gerado
// em memória).
//
// Documenta a correção aplicada em 26/08/2026: o link "Acessar painel do
// mentor" deixou de gerar o token JWT e redirecionava para uma URL direta
// (https://cursos.conexaobatista.com.br/) sem credencial. A correção
// restaura a geração do JWT (HS256, TTL 600s) e o redirecionamento via GET
// com o token na query string, no formato esperado pelo painel do mentor:
//   https://api.conexaobatista.com.br/painel?token=<JWT>
//
// Alterações:
//   1. apps/api/.env — MENTOR_PAINEL_SSO_URL corrigida de
//      https://api.conexaobatista.com.br/sso para
//      https://api.conexaobatista.com.br/painel (path /painel, esperado
//      pelo painel-mentor.html que captura ?token=).
//   2. apps/api/src/routes/cursos-mentor.js — a rota /cursos/mentor-acesso
//      (ambiente production) passou a devolver um campo redirectUrl
//      (${MENTOR_PAINEL_SSO_URL}?token=<JWT>) em vez de apenas url+token
//      usados pelo formulário POST oculto.
//   3. apps/web/src/pages/curso/CursoMentorPage.jsx — substituiu o
//      formulário POST oculto (que navegava para MENTOR_REAL_URL sem token
//      na URL) por um redirecionamento GET (window.location.href =
//      acesso.redirectUrl), restaurando o formato com token JWT.
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-correcao-link-painel-mentor/download

import logger from "../utils/logger.js";

function montarRelatorioCorrecaoLinkPainelMentor() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO DE CORREÇÃO - Link do Painel do Mentor
================================================================================

Período: 26/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

------------------------------------------------------------------------------
ÍNDICE
------------------------------------------------------------------------------
  1. Problema
  2. Causa
  3. Solução
  4. Código ANTES e DEPOIS
  5. Teste
  6. Impacto

================================================================================
1. Problema
================================================================================

  O link "Acessar painel do mentor" (página /curso/mentor — Área do mentor)
  deixou de gerar o token JWT e passou a direcionar o navegador para uma
  URL direta, sem credencial:

    ANTES (correto):  https://api.conexaobatista.com.br/painel?token=eyJhbGci...
    AGORA (errado):   https://cursos.conexaobatista.com.br/

  Sem o token na query string, o painel do mentor (painel-mentor.html) não
  conseguia autenticar as chamadas /mentor/* (HTTP 401) e caía no fallback
  de dados MOCK.

================================================================================
2. Causa
================================================================================

  A página CursoMentorPage.jsx (área do mentor) implementava o acesso ao
  painel via um formulário POST oculto cujo action era acesso.url
  (= MENTOR_REAL_URL = https://cursos.conexaobatista.com.br). O token JWT
  era enviado no CORPO do POST (campo hidden "token"), e não na URL.

  Como o painel do mentor (painel-mentor.html na VPS) espera receber o
  token via GET na query string (?token=) — capturado por
  capturarTokenDaUrl() — o POST não funcionava: o navegador navegava para
  https://cursos.conexaobatista.com.br/ sem o token na URL.

  Adicionalmente, a variável MENTOR_PAINEL_SSO_URL (usada pelo endpoint
  /mentor-sso-token na página de boas-vindas) apontava para
  https://api.conexaobatista.com.br/sso em vez de
  https://api.conexaobatista.com.br/painel (path correto onde o
  painel-mentor.html é servido e captura o token).

================================================================================
3. Solução
================================================================================

  Restaurada a geração do token JWT (HS256, TTL 600s) e o redirecionamento
  via GET com o token na query string, no formato esperado pelo painel:

    https://api.conexaobatista.com.br/painel?token=<JWT>

  Três alterações:

  (a) apps/api/.env
      MENTOR_PAINEL_SSO_URL: https://api.conexaobatista.com.br/sso
                         →  https://api.conexaobatista.com.br/painel

  (b) apps/api/src/routes/cursos-mentor.js (rota GET /cursos/mentor-acesso)
      Passou a ler MENTOR_PAINEL_SSO_URL e a devolver o campo redirectUrl
      (\${MENTOR_PAINEL_SSO_URL}?token=\${encodeURIComponent(token)}) na
      resposta do ambiente production, mantendo url/token por compatibilidade.

  (c) apps/web/src/pages/curso/CursoMentorPage.jsx
      Substituiu o formulário POST oculto por
      window.location.href = acesso.redirectUrl (redirecionamento GET com
      o token na URL). O botão "Abrir painel do mentor" e o auto-redirecionamento
      passam a usar o mesmo redirectUrl.

================================================================================
4. Código ANTES e DEPOIS
================================================================================

------ apps/api/.env ------
ANTES:
  MENTOR_PAINEL_SSO_URL=https://api.conexaobatista.com.br/sso

DEPOIS:
  MENTOR_PAINEL_SSO_URL=https://api.conexaobatista.com.br/painel

------ apps/api/src/routes/cursos-mentor.js ------
ANTES (resposta production — sem redirectUrl):
  return res.json({
    env: 'production',
    configured: true,
    url: MENTOR_REAL_URL,
    token,
    expiresAt,
    role,
    ttl: MENTOR_TOKEN_TTL_SECONDS,
  });

DEPOIS (com redirectUrl no formato /painel?token=):
  const redirectUrl = MENTOR_PAINEL_SSO_URL
    ? \`\${MENTOR_PAINEL_SSO_URL}?token=\${encodeURIComponent(token)}\`
    : \`\${MENTOR_REAL_URL}?token=\${encodeURIComponent(token)}\`;

  return res.json({
    env: 'production',
    configured: true,
    url: MENTOR_REAL_URL,
    redirectUrl,
    token,
    expiresAt,
    role,
    ttl: MENTOR_TOKEN_TTL_SECONDS,
  });

------ apps/web/src/pages/curso/CursoMentorPage.jsx ------
ANTES (formulário POST oculto — navegava sem token na URL):
  <form ref={formRef} method="POST" action={acesso.url} target="_blank" className="hidden">
    <input type="hidden" name="token" value={acesso.token} />
    ...
  </form>
  // auto-submit:
  formRef.current.submit();

DEPOIS (redirecionamento GET com token na query string):
  // auto-redirecionamento:
  useEffect(() => {
    if (acesso?.env === 'production' && acesso?.redirectUrl) {
      const t = setTimeout(() => {
        window.location.href = acesso.redirectUrl;
      }, 400);
      return () => clearTimeout(t);
    }
  }, [acesso]);
  // botão:
  onClick={() => { if (acesso?.redirectUrl) window.location.href = acesso.redirectUrl; }}

================================================================================
5. Teste
================================================================================

  1. Fazer login como mentor aprovado (status_aprovacao='aprovado' e
     mentor_status='aprovado').
  2. Acessar /curso/mentor (Área do mentor).
  3. A credencial é gerada (JWT HS256, válido por 10 minutos) e o
     navegador é redirecionado automaticamente via GET.
  4. Verificar a URL na barra do navegador:
       Esperado: https://api.conexaobatista.com.br/painel?token=eyJhbGci...
       (NÃO deve ser https://cursos.conexaobatista.com.br/)
  5. O painel do mentor (painel-mentor.html) captura o token via
     capturarTokenDaUrl() e autentica as chamadas /mentor/* (HTTP 200).

  ✅ Link com token JWT restaurado (formato /painel?token=).
  ✅ Geração de credencial JWT (HS256, TTL 600s) mantida no backend.
  ✅ Redirecionamento via GET (token na query string), não mais POST.

================================================================================
6. Impacto
================================================================================

  - O mentor volta a acessar o painel real autenticado (dados reais em vez
    de MOCK), com a credencial JWT válida por 10 minutos.
  - O segredo MENTOR_JWT_SECRET permanece no backend (nunca exposto ao
    navegador); apenas o token assinado transita na URL (HTTPS).
  - A página de boas-vindas (/curso/boas-vindas), que já usava o endpoint
    /mentor-sso-token com redirectUrl, também passa a apontar para
    /painel?token= (correção do path da variável MENTOR_PAINEL_SSO_URL).
  - O fluxo demo (MENTOR_ENV=demo) permanece inalterado (painel
    demonstrativo de fallback).

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-link-painel-mentor] Solicitação de relatório de correção do link do painel do mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoLinkPainelMentor();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-link-painel-mentor-26-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
