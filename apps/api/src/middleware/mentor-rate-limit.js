import rateLimit from 'express-rate-limit';

// Rate limiting dedicado para geração de credencial SSO do Mentor.
// Limite: 10 requisições por minuto por usuário autenticado (key = req.user.id).
// Deve ser aplicado DEPOIS de authMiddleware (que popula req.user).
//
// P2.2 — Escolha: OPÇÃO A (single-instância).
// A API Express deste projeto roda em instância única (o sandbox hiberna
// quando ocioso e não escala horizontalmente), portanto um store em memória
// (new Map()) é suficiente e correto para o limite de 10 req/min por usuário.
//
// NOTA DE MIGRAÇÃO: se o projeto passar a executar múltiplas instâncias da
// API (escala horizontal atrás de um balanceador), este store em memória
// deixa de ser eficaz — cada instância contaria apenas as suas próprias
// requisições. Nesse cenário, migrar para um store compartilhado (ex.:
// `rate-limit-redis` + `ioredis` com REDIS_URL em apps/api/.env) mantendo o
// mesmo limite de 10 req/min por usuário (key = req.user.id).
export const mentorRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip || 'anon',
  message: {
    error:
      'Muitas solicitações de acesso à área do mentor. Aguarde um minuto e tente novamente.',
  },
  // A chave primária é req.user.id (usuário autenticado); o fallback de IP é
  // apenas para o caso raro de ausência de req.user. Desativa a validação
  // estrita de IPv6 no fallback, que não é o caminho principal.
  validate: { trustProxy: false, keyGeneratorIpFallback: false },
});
