import { Worker, Job } from 'bullmq';
import { redisClient } from '../../redis/RedisClient';
import { BookingModel } from '../../../modules/bookings/booking.model';
import { slotRepository } from '../../../modules/slots/slot.repository';
import { parkingRepository } from '../../../modules/parking/parking.repository';
import { logger } from '../../../config/logger';

export const bookingQueueName = 'booking-queue';

export const bookingWorker = new Worker(
  bookingQueueName,
  async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing job');

    if (job.name === 'release_unpaid_slot') {
      const { bookingId } = job.data;
      
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return;

      if (booking.status === 'payment_pending') {
        logger.info({ bookingId }, 'Booking payment timeout reached. Releasing slot.');
        
        booking.status = 'cancelled';
        booking.cancellation = {
          reason: 'Payment timeout',
          cancelledBy: 'system',
          cancelledAt: new Date()
        };
        await booking.save();

        // Release the slot lock and increment parking lot availability
        await slotRepository.updateStatus(booking.slot.slotId.toString(), 'available', 'booking_engine');
        await parkingRepository.incrementAvailable(booking.parkingLot.lotId.toString());

        // Future: Publish Event (e.g. BookingCancelledEvent)
      } else {
        logger.debug({ bookingId, status: booking.status }, 'Booking payment already processed or cancelled.');
      }
    }
  },
  { connection: { host: process.env.REDIS_URI ? new URL(process.env.REDIS_URI).hostname : '127.0.0.1', port: process.env.REDIS_URI ? parseInt(new URL(process.env.REDIS_URI).port) : 6379 } }
);

bookingWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, 'Job completed');
});

bookingWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Job failed');
});

