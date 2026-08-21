import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import app from './app';
import './infrastructure/jobs/Workers/BookingTimeoutWorker';
import './infrastructure/jobs/Workers/AnalyticsWorker';

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV, url: `${env.APP_URL}/api/${env.API_VERSION}` },
      '🚀 ParkIQ API Server started',
    );
  });

  const { socketManager } = await import('./infrastructure/socket/SocketServer');
  socketManager.init(server);

  const { registerSocketEventHandlers } = await import('./infrastructure/socket/SocketHandlers');
  registerSocketEventHandlers();

  const { registerEmailEventHandlers } = await import('./infrastructure/email/EmailHandlers');
  registerEmailEventHandlers();



  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const gracefulShutdown = (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    server.close(async () => {
      logger.info('HTTP server closed');
      const { disconnectDB } = await import('./config/db');
      await disconnectDB();
      logger.info('All connections closed. Exiting process.');
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 30s timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error({ error }, 'Uncaught exception');
    process.exit(1);
  });
};

startServer();
