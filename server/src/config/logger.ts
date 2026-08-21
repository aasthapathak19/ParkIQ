import pino from 'pino';
import { env } from './env';

const isDev = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev && env.LOG_FORMAT === 'pretty'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  base: {
    service: 'parkiq-api',
    version: '1.0.0',
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

export type Logger = typeof logger;
