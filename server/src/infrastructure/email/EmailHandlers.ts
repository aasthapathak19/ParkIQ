import { eventBus } from '../../domain/events/EventBus';
import { emailService } from './SmtpEmailService';
import { UserModel } from '../../modules/users/user.model';
import { logger } from '../../config/logger';

export const registerEmailEventHandlers = () => {
  eventBus.subscribe('PaymentSucceededEvent', async (event: any) => {
    try {
      const { booking } = event.payload;
      const user = await UserModel.findById(booking.customer);
      
      if (user && user.email) {
        await emailService.sendEmail(user.email, 'booking_confirmation', {
          bookingRef: booking.bookingRef,
          parkingLotName: booking.parkingLot.name,
          startTime: booking.startTime,
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process email for PaymentSucceededEvent');
    }
  });

  logger.info('Email event handlers registered with EventBus');
};
