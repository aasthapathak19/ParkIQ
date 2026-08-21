import { eventBus } from '../../domain/events/EventBus';
import { socketManager } from './SocketServer';
import { logger } from '../../config/logger';

export const registerSocketEventHandlers = () => {
  const io = socketManager.getIO();

  // ─── Listen to Booking Events ──────────────────────────────────────────
  eventBus.subscribe('BookingCreated', async (event: any) => {
    const { booking } = event.payload;
    
    // Notify the user who made the booking
    io.to(`user:${booking.customer}`).emit('booking:created', { bookingId: booking._id, status: booking.status });
    
    // Notify the lot owner dashboard
    io.to(`lot:${booking.parkingLot.lotId}`).emit('lot:booking_new', { bookingId: booking._id });
    
    logger.debug({ bookingId: booking._id }, 'Pushed BookingCreated via socket');
  });

  eventBus.subscribe('PaymentSucceededEvent', async (event: any) => {
    const { booking } = event.payload;
    
    io.to(`user:${booking.customer}`).emit('booking:confirmed', { bookingId: booking._id });
    io.to(`lot:${booking.parkingLot.lotId}`).emit('lot:booking_confirmed', { bookingId: booking._id });
  });

  // Example for slot updates
  eventBus.subscribe('SlotStatusChanged', async (event: any) => {
    const { slotId, lotId, status } = event.payload;
    
    io.to(`lot:${lotId}`).emit('slot:updated', { slotId, status });
  });

  logger.info('Socket event handlers registered with EventBus');
};
