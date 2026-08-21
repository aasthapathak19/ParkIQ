import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';

import { env } from './config/env';
import { logger } from './config/logger';
import { requestId } from './middlewares/requestId.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';
import apiRoutes from './routes/index';
import healthRoutes from './routes/health.routes';

const app: Application = express();

// ─── Security Middlewares ─────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production',
  }),
);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  }),
);

import { RedisStore } from 'rate-limit-redis';
import { redisClient } from './infrastructure/redis/RedisClient';

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
    message: { success: false, message: 'Too many requests, please try again later.' },
  }),
);

import webhookRoutes from './modules/webhooks/webhook.routes';

// ─── Webhooks (Must be before body parsers) ──────────────────────────────────
app.use('/api/v1/webhooks', webhookRoutes);

// ─── Request Parsing & Sanitization ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Prevents NoSQL injection
app.set('trust proxy', 1); // Required for accurate req.ip behind reverse proxy

// ─── Request Tracing ─────────────────────────────────────────────────────────
app.use(requestId);

import pinoHttp from 'pino-http';

// ─── HTTP Logging ─────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );
}

// ─── Health Probes (before rate limiting in production) ───────────────────────
app.use('/', healthRoutes);

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// ─── API Documentation ────────────────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/', apiRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorMiddleware);

export default app;
