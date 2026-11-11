import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeApprovalState,
  responseFor,
  validateBody,
} from '../src/routes/devocional-aprovacao-contract.js';

test('normaliza os estados oficiais e desconhecidos', () => {
  const cases = [
    ['aprovado', 'aprovado'],
    ['pendente', 'pendente'],
    ['recusado', 'recusado'],
    ['suspenso', 'suspenso'],
    ['cancelado', 'cancelado'],
    ['valor-inexistente', 'desconhecido'],
    ['', 'desconhecido'],
  ];

  for (const [input, expected] of cases) {
    assert.equal(normalizeApprovalState(input), expected);
  }
});

test('valida os identificadores do contrato', () => {
  assert.deepEqual(validateBody({ memberId: 'membro_1', churchId: 'igreja-1' }), {
    memberId: 'membro_1',
    churchId: 'igreja-1',
  });

  assert.throws(() => validateBody({ memberId: '', churchId: 'igreja-1' }));
  assert.throws(() => validateBody({ memberId: 'membro-1', churchId: 'igreja/1' }));
});

test('somente aprovado recebe permissão do Devocional', () => {
  assert.equal(responseFor({
    decision: 'aprovado',
    memberId: 'membro-1',
    churchId: 'igreja-1',
    requestId: 'req-1',
    checkedAt: '2026-11-11T00:00:00.000Z',
  }).permissions.devocional, true);

  assert.equal(responseFor({
    decision: 'desconhecido',
    memberId: 'membro-1',
    churchId: 'igreja-1',
    requestId: 'req-2',
    checkedAt: '2026-11-11T00:00:00.000Z',
  }).permissions.devocional, false);
});
