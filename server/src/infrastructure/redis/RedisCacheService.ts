import { ICacheService } from '../../domain/interfaces/ICacheService';
import { redisClient } from './RedisClient';

export class RedisCacheService implements ICacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.set(key, data, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, data);
    }
  }

  async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100,
    });

    return new Promise((resolve, reject) => {
      const pipeline = redisClient.pipeline();
      let hasKeys = false;

      stream.on('data', (keys: string[]) => {
        if (keys.length > 0) {
          hasKeys = true;
          keys.forEach((key) => pipeline.del(key));
        }
      });

      stream.on('end', async () => {
        if (hasKeys) {
          try {
            await pipeline.exec();
          } catch (err) {
            reject(err);
            return;
          }
        }
        resolve();
      });

      stream.on('error', (err) => reject(err));
    });
  }
}
