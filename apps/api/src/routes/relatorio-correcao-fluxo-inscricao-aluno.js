// Download do relatório de CORREÇÃO - FLUXO DE INSCRIÇÃO DO ALUNO (.txt gerado
// em memória).
//
// Documenta a correção aplicada em 30/08/2026: o curso matriculado não
// aparecia em "Meus Cursos" do painel-aluno da VPS. Investigação com probes
// diretos à VPS localizou a causa raiz e a correção definitiva.
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-correcao-fluxo-inscricao-aluno/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO DE CORREÇÃO - Fluxo de Inscrição do Aluno
================================================================================

Período: 30/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

------------------------------------------------------------------------------
ÍNDICE
------------------------------------------------------------------------------
  1. Problema
  2. Investigação (probes diretos à VPS)
  3. Causa raiz
  4. Solução
  5. Fluxo corrigido ponta a ponta
  6. Teste passo a passo

================================================================================
1. Problema
================================================================================

  Aluno autenticado clica "Inscrever-se" em /curso/:id → é redirecionado para
  o painel-aluno da VPS (https://api.conexaobatista.com.br/sso?token=… →
  /painel-aluno?token=…), MAS o curso NÃO aparece em "Meus Cursos".

  Suspeita inicial (incorreta): a página CursoDetalhePage.jsx teria passado a
  fazer fetch direto a /cursos/:id/matricula, deixando de usar
  cursosService.matricularCurso().

  Verificação: CursoDetalhePage.jsx JÁ usa cursosService.matricularCurso() e
  cursosService.getAlunoSso() (correto). A regressão estava no BACKEND.

================================================================================
2. Investigação (probes diretos à VPS)
================================================================================

  Probes executados contra https://api.conexaobatista.com.br (30/08/2026):

  (a) GET /cursos/29 (público)
      → 200, curso "Curso Livre Secretariado", status="publicado", preco="0.00"

  (b) POST /cursos/29/matricula (sem auth)
      → 404 "Cannot POST /cursos/29/matricula"  (endpoint NÃO existe na VPS)

  (c) POST /usuarios/128/cursos/29 (com x-bridge-secret)
      → 404 "Cannot POST /usuarios/128/cursos/29"  (endpoint NÃO existe)

  (d) POST /usuarios/ensure (com x-bridge-secret)
      → 201, { id:128, nome, email, role:"aluno", pocketbase_id, criado_em }
      (a VPS mantém seu próprio cadastro com id numérico distinto do PocketBase)

  (e) POST /auth/bridge-login (com x-bridge-secret)
      → 200, { token, expiresAt, usuario:{ id:128, ... } }

  (f) GET /aluno/cursos (Bearer token) — ANTES de /cursos/:id/token
      → 200, []  (lista VAZIA)

  (g) GET /cursos/29/token (Bearer token)
      → 200, { token, matricula:{ id:123, usuario_id:128, curso_id:29,
              progresso:0, status:"ativo", matriculado_em, concluido_em:null } }
      ★ A VPS CRIA A MATRÍCULA COMO EFEITO COLATERAL deste endpoint ★

  (h) GET /aluno/cursos (Bearer token) — DEPOIS de /cursos/:id/token
      → 200, [ { id:29, titulo:"Curso Livre Secretariado", progresso:0,
              matriculado_em, ... } ]  (curso APARECE ✅)

  (i) GET /cursos/29/token novamente (idempotência)
      → 200, matricula.id=123 (mesmo id — idempotente)

================================================================================
3. Causa raiz
================================================================================

  A VPS NÃO possui endpoint de matrícula (POST /cursos/:id/matricula e
  POST /usuarios/:id/cursos/:cursoId ambos retornam 404). A matrícula na VPS
  é criada COMO EFEITO COLATERAL do endpoint GET /cursos/:id/token (token de
  acesso ao curso), de forma idempotente.

  A versão anterior de cursos-matricula.js registrava a matrícula APENAS no
  PocketBase local e NUNCA chamava GET /cursos/:id/token na VPS. Resultado:
  a tabela de matriculas da VPS ficava vazia e GET /aluno/cursos (usado pelo
  painel-aluno) retornava [] — o curso nunca aparecia em "Meus Cursos".

  O painel-aluno da VPS lista cursos lendo a tabela de matriculas da VPS via
  GET /aluno/cursos; a página local /curso/meus-cursos lê o PocketBase local.
  Sem a matrícula na VPS, só a lista local funcionava.

================================================================================
4. Solução
================================================================================

  apps/api/src/routes/cursos-matricula.js reescrito para criar a matrícula na
  VPS antes de registrar a cópia local:

    Passo 4 (NOVO, OBRIGATÓRIO): GET /cursos/:id/token na VPS com o
    cursosToken (do bridge-login). A VPS cria a matrícula idempotentemente e
    devolve { token, matricula }. Sem este passo o curso não aparece em
    "Meus Cursos" do painel-aluno.

  O bridge-login tornou-se OBRIGATÓRIO (antes era best-effort), pois o
  cursosToken é necessário para chamar GET /cursos/:id/token.

  A resposta agora inclui vps_matricula (o objeto retornado pela VPS) além
  da matricula local, para o frontend confirmar a persistência.

  apps/web/src/services/cursosService.js — matricularCurso() passou a:
    - registrar logs detalhados (URL, status, tempo, confirmação);
    - NÃO assumir 200 = sucesso: exige data.sucesso || data.matricula ||
      data.vps_matricula || data.id, senão lança erro de persistência.

  apps/web/src/pages/curso/CursoDetalhePage.jsx — handleInscrever já usava
    matricularCurso() + getAlunoSso(); logs ampliados para confirmar a
    matrícula na VPS (vps_matricula_id/curso_id/status) antes do SSO.

================================================================================
5. Fluxo corrigido ponta a ponta
================================================================================

  Aluno autenticado → clica "Inscrever-se"
    → cursosService.matricularCurso(cursoId)
    → POST /hcgi/api/cursos/:id/matricula (Authorization: PocketBase)
       backend:
         1. valida curso publicado (GET /admin/cursos)
         2. sincroniza usuário (POST /usuarios/ensure)
         3. bridge-login (POST /auth/bridge-login) → cursosToken [OBRIGATÓRIO]
         4. GET /cursos/:id/token (Bearer cursosToken) → VPS cria matrícula ✅
         5. verifica GET /aluno/cursos (best-effort, log)
         6. registra matrícula local no PocketBase (idempotente)
         → 200 { sucesso, mensagem, matricula, ja_matriculado, vps_matricula }
    → frontend verifica confirmação de persistência
    → cursosService.getAlunoSso()
    → GET /hcgi/api/aluno-sso (Authorization: PocketBase)
       → 200 { redirectUrl: https://api.conexaobatista.com.br/sso?token=JWT }
    → window.location.href = redirectUrl
    → VPS /sso valida JWT → cria/atualiza usuário (mesmo pocketbase_id/email)
      → emite token interno → redireciona /painel-aluno?token=…
    → painel-aluno chama GET /aluno/cursos → curso aparece ✅

  Identificador: o SSO e a matrícula usam o mesmo usuário VPS (mesmo
  pocketbase_id → mesmo id numérico VPS), então a matrícula criada no passo 4
  é visível ao usuário autenticado pelo SSO.

================================================================================
6. Teste passo a passo
================================================================================

  1. Acessar /curso/29 como aluno logado e aprovado.
  2. Clicar "Inscrever-se" (curso gratuito).
  3. DevTools → Console, verificar logs:
     - "📚 [INSCRIÇÃO] Iniciando matrícula do curso: 29"
     - "📚 [MATRÍCULA] Chamando: /cursos/29/matricula"
     - "📊 [MATRÍCULA] Status: 200"
     - "✅ [MATRÍCULA] Resposta confirmada: { vps_matricula_id, vps_curso_id, vps_status:'ativo' }"
     - "✅ [INSCRIÇÃO] Matrícula confirmada: { vps_matricula_id:123, ... }"
     - "🎓 [INSCRIÇÃO] Matrícula persistida na VPS. Iniciando SSO do aluno..."
     - "🔑 [INSCRIÇÃO] SSO obtido com sucesso"
     - "📍 [INSCRIÇÃO] Redirecionando para: https://api.conexaobatista.com.br/sso?token=..."
  4. URL muda para /sso?token=… e depois /painel-aluno?token=…
  5. painel-aluno carrega → curso 29 aparece em "Meus Cursos" ✅
  6. Persistência: F5 → curso continua; sair/entrar → curso continua.
  7. Idempotência: clicar "Inscrever-se" novamente → não duplica (mesmo id).

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-fluxo-inscricao-aluno] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-fluxo-inscricao-aluno-30-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
