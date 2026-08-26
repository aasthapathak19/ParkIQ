import crypto from 'crypto';
import { ILockService } from '../../domain/interfaces/ILockService';
import { redisClient } from './RedisClient';

export class RedisLockService implements ILockService {
  async acquire(resource: string, ttlSeconds: number): Promise<string | null> {
    const lockId = crypto.randomUUID();
    const lockKey = `lock:${resource}`;

    // Set NX (Not eXists) and EX (expire in seconds)
    const result = await redisClient.set(lockKey, lockId, 'EX', ttlSeconds, 'NX');

    if (result === 'OK') {
      return lockId;
    }
    
    return null; // Lock already held
  }

  async release(resource: string, lockId: string): Promise<void> {
    const lockKey = `lock:${resource}`;
    
    // Lua script to safely release the lock only if the value matches our lockId
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await redisClient.eval(script, 1, lockKey, lockId);
  }
}

