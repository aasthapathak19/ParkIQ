export interface ILockService {
  /**
   * Acquire a distributed lock.
   * @param resource The resource string identifier to lock (e.g., 'slot:123')
   * @param ttlSeconds How long the lock should be held in seconds
   * @returns A unique lock identifier if acquired, or null if the resource is already locked
   */
  acquire(resource: string, ttlSeconds: number): Promise<string | null>;

  /**
   * Release a previously acquired lock.
   * @param resource The resource string identifier
   * @param lockId The unique lock identifier returned by acquire()
   */
  release(resource: string, lockId: string): Promise<void>;
}
