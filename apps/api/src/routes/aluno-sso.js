// SSO da Área do Aluno — espelha o SSO do mentor, mudando apenas o destino.
//
// Gera um JWT assinado com MENTOR_JWT_SECRET (mesmo segredo do mentor) com
// payload { pocketbase_id, email, nome, destino: "aluno" } e TTL de 10 min,
// e devolve a URL de redirecionamento para o endpoint /sso da VPS:
//   https://api.conexaobatista.com.br/sso?token=<JWT>
//
// A VPS valida o JWT, cria/atualiza o usuário, emite um token interno (7 dias)
// e redireciona para /painel-aluno?token=<token_interno>.
//
// Fluxo idêntico ao do mentor (mentor-sso-token.js), exceto:
//   - destino: "aluno" (não "mentor")
//   - URL base: CURSOS_API_URL + "/sso" (o /sso da VPS decide o painel pelo destino)
//
// Variáveis de ambiente (apps/api/.env):
//   MENTOR_JWT_SECRET  → segredo DEDICADO (HS256) para assinar o JWT.
//   CURSOS_API_URL     → URL base da VPS (https://api.conexaobatista.com.br).
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida na
// coleção `users`):
//   GET /aluno-sso

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const MENTOR_JWT_SECRET = process.env.MENTOR_JWT_SECRET;
const CURSOS_API_URL = (process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br')
  .trim()
  .replace(/\/+$/, '');
const JWT_TTL = 600; // 10 minutos (mesmo TTL do mentor)

export default async (req, res) => {
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  logger.info(
    `[aluno-sso] Solicitação por usuário ${user.id} (${user.email || 'sem email'}) — destino=aluno`,
  );

  // 1. Verifica aprovação da conta (mesmo guarda do mentor).
  const statusAprovacao = user.status_aprovacao || '';
  if (statusAprovacao !== 'aprovado') {
    return res.status(403).json({
      error:
        'Sua conta ainda não foi aprovada. Aguarde a aprovação da sua igreja para acessar a área do aluno.',
      status_aprovacao: statusAprovacao,
    });
  }

  // 2. Segredo de assinatura obrigatório (fail-closed).
  if (!MENTOR_JWT_SECRET) {
    logger.error(
      `[aluno-sso] FAIL-CLOSED: MENTOR_JWT_SECRET ausente — usuário ${user.id} bloqueado`,
    );
    return res.status(503).json({
      error: 'Área do aluno não configurada. Contate o administrador.',
      codigo: 'ALUNO_SSO_NAO_CONFIGURADO',
    });
  }

  // 3. Gera o JWT assinado com MENTOR_JWT_SECRET (HS256, 10 min).
  //    Payload idêntico ao do mentor, mudando apenas destino → "aluno".
  let token;
  try {
    token = jwt.sign(
      {
        pocketbase_id: user.id,
        email: user.email || '',
        nome: user.name || user.email || '',
        destino: 'aluno',
      },
      MENTOR_JWT_SECRET,
      { algorithm: 'HS256', expiresIn: JWT_TTL },
    );
  } catch (err) {
    logger.error(
      `[aluno-sso] Falha ao assinar JWT para usuário ${user.id} — ${err?.message || err}`,
    );
    throw new Error(`aluno-sso: falha ao gerar credencial — ${err?.message || err}`);
  }

  // 4. URL de redirecionamento para o /sso da VPS (GET com token na query).
  const redirectUrl = `${CURSOS_API_URL}/sso?token=${encodeURIComponent(token)}`;

  // 5. Expiração (ISO) derivada do payload do token.
  let expiresAt = '';
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf8'),
      );
      if (payload?.exp) {
        expiresAt = new Date(payload.exp * 1000).toISOString();
      }
    }
  } catch (_) {}

  logger.info(
    `[aluno-sso] Credencial JWT gerada para usuário ${user.id} (${user.email || 'sem email'}) destino=aluno → ${CURSOS_API_URL}/sso`,
  );

  return res.json({
    token,
    url: `${CURSOS_API_URL}/sso`,
    redirectUrl,
    expiresAt,
    ttl: JWT_TTL,
    algorithm: 'HS256',
    destino: 'aluno',
    role: 'aluno',
  });
};
