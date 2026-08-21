import { bookingRepository } from './booking.repository';
import { slotRepository } from '../slots/slot.repository';
import { parkingRepository } from '../parking/parking.repository';
import { vehicleRepository } from '../vehicles/vehicle.repository';
import { IBooking } from './booking.model';
import {
  NotFoundError, SlotUnavailableError, BookingConflictError,
  ForbiddenError, ConflictError,
} from '../../domain/errors';
import { RuleBasedPricingEngine } from '../../infrastructure/pricing/RuleBasedPricingEngine';
import { MockPaymentGateway } from '../../infrastructure/payment/MockPaymentGateway';
import { BookingReference, TimeSlot } from '../../domain/value-objects';
import { generateBookingQR } from '../../utils/qrcode.utils';
import { PaginationOptions, PaginatedResult } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';

// ─── Phase 1 Implementations (swap in container.ts for Phase 2+) ──────────────
const pricingEngine = new RuleBasedPricingEngine();
const paymentGateway = new MockPaymentGateway();

export class BookingService {
  async createBooking(
    customerId: string,
    dto: {
      vehicleId: string;
      parkingLotId: string;
      slotId: string;
      startTime: Date;
      endTime: Date;
      source?: IBooking['source'];
      ip?: string;
      userAgent?: string;
    },
  ): Promise<IBooking & { clientSecret?: string }> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const timeSlot = new TimeSlot(startTime, endTime);

    // ─── Phase 2: Distributed Lock ────────────────────────────────────────
    const lockService = new (require('../../infrastructure/redis/RedisLockService')).RedisLockService();
    const lockResource = `slot:${dto.slotId}`;
    const lockId = await lockService.acquire(lockResource, 600); // 10 minutes lock
    if (!lockId) {
      throw new ConflictError('This slot is currently being booked by someone else. Please try again or select another slot.');
    }

    try {
      // ─── 1. Validate vehicle belongs to customer ──────────────────────────
      const vehicle = await vehicleRepository.findByIdAndOwner(dto.vehicleId, customerId);
      if (!vehicle) throw new NotFoundError('Vehicle', dto.vehicleId);

      // ─── 2. Validate parking lot is active ───────────────────────────────
      const lot = await parkingRepository.findById(dto.parkingLotId);
      if (!lot) throw new NotFoundError('ParkingLot', dto.parkingLotId);
      if (lot.status !== 'active') throw new SlotUnavailableError(dto.slotId);

      // ─── 3. Validate slot is available ───────────────────────────────────
      const slot = await slotRepository.findById(dto.slotId);
      if (!slot) throw new NotFoundError('Slot', dto.slotId);
      if (slot.status !== 'available') throw new SlotUnavailableError(dto.slotId);

      // ─── 4. Check for booking overlap (uses compound index) ───────────────
      const hasConflict = await bookingRepository.hasConflict(dto.slotId, startTime, endTime);
      if (hasConflict) throw new BookingConflictError();

      // ─── 5. Calculate pricing ─────────────────────────────────────────────
      const priceBreakdown = await pricingEngine.calculatePrice({
        baseRate: lot.pricing.baseRate,
        currency: lot.pricing.currency,
        durationMinutes: timeSlot.durationMinutes,
        startTime,
        peakHours: lot.pricing.peakHours,
        peakHourRate: lot.pricing.peakHourRate,
        weekendMultiplier: lot.pricing.weekendMultiplier,
      });

      // ─── 6. Generate booking reference ─────────────────────────────────────
      const bookingRef = BookingReference.generate();

      // ─── 7. Create Stripe PaymentIntent ────────────────────────────────────
      const stripeAdapter = new (require('../../infrastructure/payment/StripeAdapter')).StripeAdapter();
      // Stripe amount is in smallest currency unit (e.g. paise for INR). priceBreakdown.total * 100
      const paymentIntent = await stripeAdapter.createPaymentIntent(
        Math.round(priceBreakdown.total * 100),
        priceBreakdown.currency,
        { bookingRef, customerId }
      );

      // ─── 8. Generate preliminary QR code ───────────────────────────────────
      const qrExpiresAt = new Date(endTime.getTime() + 30 * 60 * 1000); // QR valid 30min after end
      const qrCode = await generateBookingQR('temp', bookingRef, qrExpiresAt);

      // ─── 9. Create booking record in `payment_pending` status ─────────────
      const booking = await bookingRepository.create({
        bookingRef,
        customer: customerId as unknown as import('mongoose').Types.ObjectId,
        vehicle: {
          vehicleId: vehicle._id,
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          brand: vehicle.brand,
          model: vehicle.model,
        },
        parkingLot: {
          lotId: lot._id,
          name: lot.name,
          address: lot.address.formattedAddress ?? `${lot.address.street}, ${lot.address.city}`,
        },
        slot: {
          slotId: slot._id,
          slotNumber: slot.slotNumber,
          floor: slot.floor,
          type: slot.type,
        },
        startTime,
        endTime,
        duration: { planned: timeSlot.durationMinutes },
        amount: {
          base: priceBreakdown.base,
          peakSurcharge: priceBreakdown.peakSurcharge,
          tax: priceBreakdown.tax,
          discount: priceBreakdown.discount,
          total: priceBreakdown.total,
          currency: priceBreakdown.currency,
          pricingStrategy: priceBreakdown.strategy,
          priceBreakdown: priceBreakdown.rawBreakdown,
        },
        payment: {
          status: 'pending',
          method: 'card', // updated by webhook later
          gatewayRef: paymentIntent.paymentId,
        },
        status: 'payment_pending',
        qrCode,
        qrCodeExpiresAt: qrExpiresAt,
        lockKey: lockId,
        lockExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min window to pay
        source: dto.source ?? 'web',
        ip: dto.ip,
        userAgent: dto.userAgent,
      });

      const finalQR = await generateBookingQR(booking._id.toString(), bookingRef, qrExpiresAt);
      await bookingRepository.updateQrCode(booking._id.toString(), finalQR, qrExpiresAt);

      // ─── 10. Reserve the slot in DB ────────────────────────────────────────
      await slotRepository.updateStatus(dto.slotId, 'reserved', 'booking_engine', booking._id.toString());
      
      // ─── 11. Enqueue job for background timeout (Phase 2) ────────────────
      const bullMQService = require('../../infrastructure/jobs/BullMQService').bullMQService;
      await bullMQService.enqueue('booking-queue', 'release_unpaid_slot', { bookingId: booking._id.toString() }, { delay: 10 * 60 * 1000 });

      return { ...booking, qrCode: finalQR, clientSecret: paymentIntent.clientSecret } as any;

    } catch (error) {
      // Release lock on error
      await lockService.release(lockResource, lockId);
      throw error;
    }
  }


  async getMyBookings(
    customerId: string,
    filter: { status?: string },
    options: PaginationOptions,
  ): Promise<PaginatedResult<IBooking>> {
    const { data, total } = await bookingRepository.findByCustomer(customerId, filter, options);
    return buildPaginatedResult(data, total, options);
  }

  async getBookingById(id: string, customerId: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking', id);
    if (booking.customer.toString() !== customerId) throw new ForbiddenError();
    return booking;
  }

  async cancelBooking(id: string, customerId: string, reason: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new NotFoundError('Booking', id);
    if (booking.customer.toString() !== customerId) throw new ForbiddenError();
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new ConflictError(`Cannot cancel a booking with status '${booking.status}'`);
    }

    const cancelled = await bookingRepository.cancel(id, reason, 'customer');

    // Free the slot and increment availability
    await slotRepository.updateStatus(booking.slot.slotId.toString(), 'available', 'booking_engine');
    await parkingRepository.incrementAvailable(booking.parkingLot.lotId.toString());

    return cancelled!;
  }

  async getOwnerBookings(
    ownerId: string,
    lotId: string,
    filter: { status?: string },
    options: PaginationOptions,
  ): Promise<PaginatedResult<IBooking>> {
    const lot = await parkingRepository.findById(lotId);
    if (!lot) throw new NotFoundError('ParkingLot', lotId);
    if (lot.owner.toString() !== ownerId) throw new ForbiddenError();

    const { data, total } = await bookingRepository.findByLot(lotId, filter, options);
    return buildPaginatedResult(data, total, options);
  }

  async checkIn(bookingId: string, ownerId: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking', bookingId);
    if (booking.status !== 'confirmed') throw new ConflictError('Booking is not in confirmed state');

    const updated = await bookingRepository.checkIn(bookingId);
    await slotRepository.updateStatus(booking.slot.slotId.toString(), 'occupied', 'booking_engine');
    return updated!;
  }

  async checkOut(bookingId: string, ownerId: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('Booking', bookingId);
    if (booking.status !== 'active') throw new ConflictError('Booking is not in active state');

    const updated = await bookingRepository.checkOut(bookingId);
    await slotRepository.updateStatus(booking.slot.slotId.toString(), 'available', 'booking_engine');
    await parkingRepository.incrementAvailable(booking.parkingLot.lotId.toString());
    return updated!;
  }

  async getPriceEstimate(
    lotId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Record<string, unknown>> {
    const lot = await parkingRepository.findById(lotId);
    if (!lot) throw new NotFoundError('ParkingLot', lotId);

    const timeSlot = new TimeSlot(new Date(startTime), new Date(endTime));
    const breakdown = await pricingEngine.estimatePrice({
      baseRate: lot.pricing.baseRate,
      currency: lot.pricing.currency,
      durationMinutes: timeSlot.durationMinutes,
      startTime: new Date(startTime),
      peakHours: lot.pricing.peakHours,
      peakHourRate: lot.pricing.peakHourRate,
      weekendMultiplier: lot.pricing.weekendMultiplier,
    });

    return { ...breakdown, durationHours: timeSlot.durationMinutes / 60 };
  }
}

export const bookingService = new BookingService();
