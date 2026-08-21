import { Router, Request, Response } from 'express';
import { getDBStatus } from '../config/db';
import { redisClient } from '../infrastructure/redis/RedisClient';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'parkiq-api',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get('/live', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

router.get('/ready', async (_req: Request, res: Response) => {
  const db = getDBStatus();
  let redisStatus = 'down';
  try {
    const ping = await redisClient.ping();
    if (ping === 'PONG') redisStatus = 'up';
  } catch {
    redisStatus = 'down';
  }

  const isReady = db.status === 'connected' && redisStatus === 'up';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    checks: {
      database: db,
      cache: { status: redisStatus },
      queue: { status: redisStatus }, // BullMQ uses the same Redis instance
    },
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
  });
});

export default router;
