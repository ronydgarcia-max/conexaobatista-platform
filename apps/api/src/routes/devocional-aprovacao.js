import crypto from 'node:crypto';
import express from 'express';

import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { normalizeApprovalState, requestIdFrom, responseFor, validateBody } from './devocional-aprovacao-contract.js';

const router = express.Router();

function unauthorized(message = 'Credencial de integração inválida') {
  const error = new Error(message);
  error.status = 401;
  error.code = 'INTEGRATION_UNAUTHORIZED';
  return error;
}

function configured() {
  return Boolean(String(process.env.DEVOCIONAL_INTEGRATION_TOKEN_SHA256 || '').trim());
}

function validBearer(req) {
  const header = req.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !configured()) return false;

  const providedHash = crypto.createHash('sha256').update(match[1], 'utf8').digest('hex');
  const expectedHash = String(process.env.DEVOCIONAL_INTEGRATION_TOKEN_SHA256).trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(expectedHash)) return false;

  return crypto.timingSafeEqual(
    Buffer.from(providedHash, 'utf8'),
    Buffer.from(expectedHash, 'utf8'),
  );
}

router.post('/approval/check', async (req, res, next) => {
  const requestId = requestIdFrom(req);

  try {
    if (!configured()) {
      return res.status(503).json({
        error: {
          code: 'INTEGRATION_NOT_CONFIGURED',
          message: 'A credencial server-to-server do Devocional não está configurada.',
          requestId,
        },
      });
    }

    if (!validBearer(req)) {
      throw unauthorized();
    }

    const { memberId, churchId } = validateBody(req.body);
    const users = pocketbaseClient.collection('users');
    const user = await users.getOne(memberId, {
      fields: 'id,status_aprovacao,igreja_id',
    }).catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });

    if (!user) {
      return res.json(responseFor({
        decision: 'desconhecido',
        memberId,
        churchId,
        requestId,
      }));
    }

    const userState = normalizeApprovalState(user.status_aprovacao);
    if (userState !== 'aprovado') {
      return res.json(responseFor({
        decision: userState,
        memberId,
        churchId,
        requestId,
      }));
    }

    if (user.igreja_id && user.igreja_id !== churchId) {
      return res.json(responseFor({
        decision: 'desconhecido',
        memberId,
        churchId,
        requestId,
      }));
    }

    const relation = await pocketbaseClient
      .collection('vinculos_usuario_igreja')
      .getFirstListItem(`usuario_id = "${memberId}" && igreja_id = "${churchId}"`, {
        fields: 'id,status',
      })
      .catch((error) => {
        if (error?.status === 404) return null;
        throw error;
      });

    if (!relation || (relation.status && relation.status !== 'ativo')) {
      return res.json(responseFor({
        decision: relation?.status === 'pendente' ? 'pendente' : 'desconhecido',
        memberId,
        churchId,
        requestId,
      }));
    }

    return res.json(responseFor({
      decision: 'aprovado',
      memberId,
      churchId,
      requestId,
    }));
  } catch (error) {
    if (error?.code === 'INTEGRATION_UNAUTHORIZED' || error?.code === 'INVALID_APPROVAL_REQUEST') {
      return next(error);
    }

    logger.error('[devocional-approval] consulta indisponível', {
      requestId,
      status: error?.status,
      code: error?.code,
    });

    return res.status(503).json({
      error: {
        code: 'APPROVAL_UNAVAILABLE',
        message: 'Não foi possível validar a aprovação na plataforma.',
        requestId,
      },
    });
  }
});

export default router;
