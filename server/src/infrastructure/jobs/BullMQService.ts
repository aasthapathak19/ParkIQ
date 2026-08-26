import { Queue } from 'bullmq';
import { IJobQueueService, JobOpts } from '../../domain/interfaces/IJobQueueService';
import { redisClient } from '../redis/RedisClient';
import { logger } from '../../config/logger';

export class BullMQService implements IJobQueueService {
  private queues: Map<string, Queue> = new Map();

  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const q = new Queue(queueName, { connection: { host: process.env.REDIS_URI ? new URL(process.env.REDIS_URI).hostname : '127.0.0.1', port: process.env.REDIS_URI ? parseInt(new URL(process.env.REDIS_URI).port) : 6379 } });
      this.queues.set(queueName, q);
    }
    return this.queues.get(queueName)!;
  }

  async enqueue<T>(queueName: string, jobName: string, data: T, opts?: JobOpts): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.add(jobName, data, opts);
      logger.debug({ queueName, jobName }, 'Job enqueued successfully');
    } catch (error) {
      logger.error({ error, queueName, jobName }, 'Failed to enqueue job');
      throw error;
    }
  }
}

export const bullMQService = new BullMQService();

