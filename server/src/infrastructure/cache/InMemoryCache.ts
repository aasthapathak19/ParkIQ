import { ICacheService } from '../interfaces';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

/**
 * Phase 1 in-memory cache implementation.
 * Phase 2: swap with RedisCache in container.ts — same interface.
 */
export class InMemoryCache implements ICacheService {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
}
