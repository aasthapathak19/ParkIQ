import { Worker, Job } from 'bullmq';
import { redisClient } from '../../redis/RedisClient';
import { analyticsService } from '../../../modules/analytics/analytics.service';
import { logger } from '../../../config/logger';

export const analyticsQueueName = 'analytics-queue';

export const analyticsWorker = new Worker(
  analyticsQueueName,
  async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing analytics job');

    if (job.name === 'precompute_admin_stats') {
      const stats = await analyticsService.computeAdminStats();
      await redisClient.set('analytics:admin', JSON.stringify(stats), 'EX', 60 * 60); // Cache for 1 hour
    }

    if (job.name === 'precompute_owner_stats') {
      const { ownerId } = job.data;
      const stats = await analyticsService.computeOwnerStats(ownerId);
      await redisClient.set(`analytics:owner:${ownerId}`, JSON.stringify(stats), 'EX', 60 * 60);
    }
  },
  { connection: redisClient as any }
);

analyticsWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, 'Analytics job completed');
});

analyticsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Analytics job failed');
});
