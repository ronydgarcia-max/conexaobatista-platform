// Geração de credencial SSO (JWT) para o aplicativo "Corações Conectados"
// (app de relacionamento). Retorna apenas o token assinado; o frontend
// redireciona o navegador para:
//   https://coracoes.conexaobatista.com.br?token=JWT
//
// Variável de ambiente (apps/api/.env):
//   MENTOR_JWT_SECRET → segredo HS256 compartilhado com o app Corações.
//
// Payload do JWT (claims):
//   sub            → id do usuário (PocketBase)
//   email          → e-mail do usuário
//   nome           → nome completo do usuário
//   genero         → valor exato do banco (campo `sexo`)
//   estadoCivil    → valor exato do banco (campo `estadoCivil`)
//   dataNascimento → "AAAA-MM-DD" (ISO)
//   iss            → "conexao-batista"
//   aud            → "coracoes"
//   iat, exp       → timestamps (exp = iat + 600)
//
// TTL: 600 segundos (10 minutos). Algoritmo: HS256.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida na
// coleção `users`):
//   POST /coracoes-sso-token

import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const CORACOES_JWT_SECRET = process.env.MENTOR_JWT_SECRET;
const CORACOES_TOKEN_TTL_SECONDS = 10 * 60; // 600 segundos (10 minutos)

// Formata uma data (Date do PocketBase / string ISO) como "AAAA-MM-DD".
function formatarDataISO(valor) {
  if (!valor) return '';
  try {
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime())) return '';
    const ano = d.getUTCFullYear();
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(d.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  } catch (_) {
    return '';
  }
}

export default async (req, res) => {
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  logger.info(
    `[coracoes-sso-token] Solicitação por usuário ${user.id} (${user.email || 'sem email'}) — MENTOR_JWT_SECRET=${CORACOES_JWT_SECRET ? 'configurado' : 'ausente'}`,
  );

  // Segredo JWT obrigatório (fail-closed).
  if (!CORACOES_JWT_SECRET) {
    logger.error(
      '[coracoes-sso-token] MENTOR_JWT_SECRET ausente — não é possível assinar a credencial',
    );
    return res.status(500).json({
      error: 'Integração de segurança não configurada. Contate o administrador.',
      codigo: 'CORACOES_SEGREDO_AUSENTE',
    });
  }

  // Gera credencial SSO assinada (HS256, TTL 600s) com o payload exato
  // esperado pelo app Corações Conectados.
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email || '',
      nome: user.name || '',
      genero: user.sexo || '',
      estadoCivil: user.estadoCivil || '',
      dataNascimento: formatarDataISO(user.dataNascimento),
      iss: 'conexao-batista',
      aud: 'coracoes',
    },
    CORACOES_JWT_SECRET,
    {
      expiresIn: CORACOES_TOKEN_TTL_SECONDS,
      algorithm: 'HS256',
      notBefore: 0,
    },
  );

  logger.info(
    `[coracoes-sso-token] Credencial gerada para usuário ${user.id} (${user.email || 'sem email'}) ttl=${CORACOES_TOKEN_TTL_SECONDS}s`,
  );

  return res.json({ token });
};
