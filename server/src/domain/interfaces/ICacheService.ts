export interface ICacheService {
  /**
   * Get a value from the cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in the cache with an optional TTL in seconds
   */
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;

  /**
   * Delete a specific key from the cache
   */
  del(key: string): Promise<void>;

  /**
   * Delete all keys matching a specific pattern
   */
  invalidatePattern(pattern: string): Promise<void>;
}
