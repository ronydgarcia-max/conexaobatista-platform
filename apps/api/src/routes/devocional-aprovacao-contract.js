import crypto from 'node:crypto';

const APPROVAL_STATES = new Set([
  'aprovado',
  'pendente',
  'recusado',
  'suspenso',
  'cancelado',
  'desconhecido',
]);

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function requestIdFrom(req) {
  const value = req.get('X-Request-Id');
  return value && value.length <= 128 ? value : crypto.randomUUID();
}

export function normalizeApprovalState(value) {
  const state = String(value || '').trim().toLowerCase();
  return APPROVAL_STATES.has(state) ? state : 'desconhecido';
}

export function responseFor({ decision, memberId, churchId, requestId, checkedAt = new Date().toISOString() }) {
  return {
    contractVersion: '1.0',
    decision,
    member: { id: memberId },
    church: { id: churchId },
    permissions: { devocional: decision === 'aprovado' },
    checkedAt,
    requestId,
  };
}

export function validateBody(body) {
  const memberId = String(body?.memberId || '').trim();
  const churchId = String(body?.churchId || '').trim();

  if (!SAFE_ID.test(memberId) || !SAFE_ID.test(churchId)) {
    const error = new Error('memberId e churchId são obrigatórios e devem ser identificadores válidos');
    error.status = 422;
    error.code = 'INVALID_APPROVAL_REQUEST';
    throw error;
  }

  return { memberId, churchId };
}
