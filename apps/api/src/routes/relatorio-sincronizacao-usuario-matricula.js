// Download do relatório de SINCRONIZAÇÃO DE USUÁRIO NA MATRÍCULA (.txt gerado
// em memória).
//
// Documenta a sincronização do usuário PocketBase com a VPS antes de criar a
// matrícula, garantindo que o usuário exista na VPS com o identificador
// correto (pocketbase_id → id numérico VPS) — o mesmo usuário usado no SSO.
//
// Rota protegida por adminAuth (coleção admins).
// GET /relatorio-sincronizacao-usuario-matricula/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO - Sincronização de Usuário na Matrícula
================================================================================

Período: 30/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

================================================================================
1. Contexto
================================================================================

  A VPS (cursos-api) mantém seu próprio cadastro de usuários, distinto do
  PocketBase. Antes de criar a matrícula (e antes do SSO), é necessário
  sincronizar o usuário PocketBase com a VPS para que ele exista no banco da
  VPS com o identificador correto.

  Sem sincronização, o bridge-login retorna "Usuário não encontrado. Chame
  /usuarios/ensure primeiro." e a matrícula não pode ser criada.

================================================================================
2. Identificadores
================================================================================

  - PocketBase: user.id (string, ex. "z5frz1bg23zq4j6") — coleção users.
  - VPS: id numérico (ex. 128) + pocketbase_id (string, = user.id) + email.

  Probe confirmado (30/08/2026):
    POST /usuarios/ensure { pocketbase_id, email, nome }
      → 201 { id:128, nome, email, role:"aluno", pocketbase_id, criado_em }

  O ensure é idempotente: cria se faltar, atualiza se existir. O campo
  pocketbase_id vincula o usuário VPS ao usuário PocketBase.

================================================================================
3. Fluxo de sincronização na matrícula
================================================================================

  apps/api/src/routes/cursos-matricula.js — ordem garantida:

    Passo 2: POST /usuarios/ensure (best-effort)
      Envia { pocketbase_id: user.id, email: user.email, nome: user.name }.
      Garante que o usuário exista na VPS.

    Passo 3: POST /auth/bridge-login (OBRIGATÓRIO)
      Envia { pocketbase_id: user.id, email: user.email } com x-bridge-secret.
      A VPS localiza o usuário por pocketbase_id/email e devolve { token,
      expiresAt, usuario:{ id, ... } }. O cursosToken é persistido no
      PocketBase (users.cursos_api_token) para acesso futuro.

    Passo 4: GET /cursos/:id/token (Bearer cursosToken) — cria a matrícula
      A VPS associa a matrícula ao usuario_id numérico (128) obtido no
      bridge-login. A matrícula fica vinculada ao usuário VPS correto.

  O bridge-login também executa /usuarios/ensure internamente (defesa em
  profundidade), então mesmo se o passo 2 falhar, o passo 3 re-sincroniza.

================================================================================
4. Consistência com o SSO
================================================================================

  O SSO do aluno (GET /aluno-sso) gera um JWT com payload
  { pocketbase_id: user.id, email, nome, destino:"aluno" }, assinado com
  MENTOR_JWT_SECRET. A VPS /sso valida o JWT e localiza/cria o usuário pelo
  pocketbase_id (ou email) — o MESMO usuário criado no ensure/bridge-login.

  Resultado: a matrícula criada no passo 4 (vinculada ao usuario_id 128) é
  visível ao usuário autenticado pelo SSO (mesmo pocketbase_id → mesmo id 128).
  Não há divergência entre id, usuario_id e pocketbase_id.

================================================================================
5. Segredo
================================================================================

  O CURSOS_API_BRIDGE_SECRET permanece no backend (apps/api/.env), enviado
  apenas no header x-bridge-secret das chamadas server-side à VPS. Nunca é
  exposto ao navegador. O MENTOR_JWT_SECRET (SSO) também permanece no backend.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-sincronizacao-usuario-matricula] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-sincronizacao-usuario-matricula-30-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
