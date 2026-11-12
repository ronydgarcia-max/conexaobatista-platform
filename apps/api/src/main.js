import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import PocketBase from 'pocketbase';
import jwt from 'jsonwebtoken';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';
import devocionalApprovalRouter from './routes/devocional-aprovacao.js';

const app = express();

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
  logger.info('Interrupted');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received');
  await new Promise((resolve) => setTimeout(resolve, 3000));
  logger.info('Exiting');
  process.exit(0);
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'QUERY'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({ limit: BodyLimit }));
app.use(express.urlencoded({ extended: true, limit: BodyLimit }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/api/v1/auth/session', async (req, res, next) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({
      error: 'INVALID_SESSION_REQUEST',
      message: 'email and password are required',
    });
  }

  if (!process.env.POCKETBASE_HOST || !process.env.JWT_SECRET) {
    return res.status(503).json({
      error: 'SESSION_NOT_CONFIGURED',
      message: 'Session authentication is not configured',
    });
  }

  try {
    const authClient = new PocketBase(process.env.POCKETBASE_HOST);
    const authData = await authClient
      .collection('_pb_users_auth_')
      .authWithPassword(email.trim(), password);

    const sessionToken = jwt.sign(
      {
        sub: authData.record.id,
        email: authData.record.email,
        collection: authData.record.collectionName,
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' },
    );

    return res.status(200).json({
      session: {
        token: sessionToken,
        expiresIn: '12h',
      },
      user: {
        id: authData.record.id,
        email: authData.record.email,
        username: authData.record.username || null,
        verified: Boolean(authData.record.verified),
      },
    });
  } catch (error) {
    if (error?.status === 400 || error?.status === 401) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    return next(error);
  }
});

app.use('/api/v1/internal/devocional', devocionalApprovalRouter);
app.use('/', routes);

app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

http
  .createServer({ maxHeaderSize: 1024 * 128 }, app)
  .listen(port, () => {
    logger.info(`🚀 API Server running on http://localhost:${port}`);
  });

export default app;
