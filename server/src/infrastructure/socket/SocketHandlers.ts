import { eventBus } from '../../domain/events/EventBus';
import { socketManager } from './SocketServer';
import { logger } from '../../config/logger';

export const registerSocketEventHandlers = () => {
  const io = socketManager.getIO();

  // ─── Booking Events (Phase 1/2) ───────────────────────────────────────────────
  eventBus.subscribe('BookingCreated', async (event: any) => {
    const { booking } = event.payload;
    io.to(`user:${booking.customer}`).emit('booking:created', { bookingId: booking._id, status: booking.status });
    io.to(`lot:${booking.parkingLot.lotId}`).emit('lot:booking_new', { bookingId: booking._id });
    logger.debug({ bookingId: booking._id }, 'Pushed BookingCreated via socket');
  });

  eventBus.subscribe('PaymentSucceededEvent', async (event: any) => {
    const { booking } = event.payload;
    io.to(`user:${booking.customer}`).emit('booking:confirmed', { bookingId: booking._id });
    io.to(`lot:${booking.parkingLot.lotId}`).emit('lot:booking_confirmed', { bookingId: booking._id });
  });

  eventBus.subscribe('SlotStatusChanged', async (event: any) => {
    const { slotId, lotId, status } = event.payload;
    io.to(`lot:${lotId}`).emit('slot:updated', { slotId, status });
  });

  // ─── Phase 3 Verification Events ─────────────────────────────────────────────
  eventBus.subscribe('VerificationStatusChanged', async (event: any) => {
    const { parkingId, ownerId, status, verificationLevel, reason } = event.payload;
    // Emit ONLY to the owner — never broadcast to customers
    io.to(`user:${ownerId}`).emit('verification:updated', {
      parkingId,
      status,
      verificationLevel,
      reason,
    });
    logger.debug({ parkingId, ownerId, status }, 'Pushed VerificationStatusChanged to owner via socket');
  });

  // ─── Phase 3 Claim Events ─────────────────────────────────────────────────────
  eventBus.subscribe('ClaimStatusChanged', async (event: any) => {
    const { claimId, claimantId, status, reason } = event.payload;
    io.to(`user:${claimantId}`).emit('claim:updated', { claimId, status, reason });
    logger.debug({ claimId, claimantId, status }, 'Pushed ClaimStatusChanged via socket');
  });

  // ─── Phase 3 Report Events ────────────────────────────────────────────────────
  eventBus.subscribe('ReportResolved', async (event: any) => {
    const { reportId, reportedBy, resolution } = event.payload;
    io.to(`user:${reportedBy}`).emit('report:updated', { reportId, status: 'RESOLVED', resolution });
    logger.debug({ reportId, reportedBy }, 'Pushed ReportResolved via socket');
  });

  logger.info('Socket event handlers registered with EventBus (Phase 1/2/3)');
};
