import Redis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

class RedisClientSingleton {
  private static instance: Redis;

  public static getInstance(): Redis {
    if (!RedisClientSingleton.instance) {
      RedisClientSingleton.instance = new Redis(env.REDIS_URI, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });

      RedisClientSingleton.instance.on('connect', () => {
        logger.info('Connected to Redis');
      });

      RedisClientSingleton.instance.on('error', (err) => {
        logger.error({ err }, 'Redis connection error');
      });
    }

    return RedisClientSingleton.instance;
  }
}

export const redisClient = RedisClientSingleton.getInstance();
