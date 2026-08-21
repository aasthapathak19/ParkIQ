import mongoose from 'mongoose';
import { BookingModel, IBooking } from './booking.model';
import { PaginationOptions } from '../../types/common.types';

export class BookingRepository {
  async create(data: Partial<IBooking>): Promise<IBooking> {
    return new BookingModel(data).save();
  }

  async findById(id: string): Promise<IBooking | null> {
    return BookingModel.findById(id).lean();
  }

  async findByRef(bookingRef: string): Promise<IBooking | null> {
    return BookingModel.findOne({ bookingRef }).lean();
  }

  async findByCustomer(
    customerId: string,
    filter: { status?: string },
    options: PaginationOptions,
  ): Promise<{ data: IBooking[]; total: number }> {
    const query: Record<string, unknown> = { customer: new mongoose.Types.ObjectId(customerId) };
    if (filter.status) query.status = filter.status;

    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      BookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(options.limit).lean(),
      BookingModel.countDocuments(query),
    ]);
    return { data, total };
  }

  async findByLot(
    lotId: string,
    filter: { status?: string },
    options: PaginationOptions,
  ): Promise<{ data: IBooking[]; total: number }> {
    const query: Record<string, unknown> = { 'parkingLot.lotId': new mongoose.Types.ObjectId(lotId) };
    if (filter.status) query.status = filter.status;

    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      BookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(options.limit).lean(),
      BookingModel.countDocuments(query),
    ]);
    return { data, total };
  }

  /**
   * CRITICAL: Check for conflicting bookings on a slot.
   * Uses the compound index: { slot.slotId, status, startTime, endTime }
   */
  async hasConflict(slotId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const count = await BookingModel.countDocuments({
      'slot.slotId': new mongoose.Types.ObjectId(slotId),
      status: { $in: ['pending', 'confirmed', 'active'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    return count > 0;
  }

  async updateStatus(
    id: string,
    status: IBooking['status'],
    extra?: Partial<IBooking>,
  ): Promise<IBooking | null> {
    return BookingModel.findByIdAndUpdate(
      id,
      { $set: { status, ...extra } },
      { new: true },
    ).lean();
  }

  async cancel(
    id: string,
    reason: string,
    cancelledBy: 'customer' | 'owner' | 'admin' | 'system',
  ): Promise<IBooking | null> {
    return BookingModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'cancelled',
          cancellation: { reason, cancelledBy, cancelledAt: new Date() },
          'payment.status': 'refunded',
          'payment.refundedAt': new Date(),
        },
      },
      { new: true },
    ).lean();
  }

  async checkIn(id: string): Promise<IBooking | null> {
    return BookingModel.findByIdAndUpdate(
      id,
      { $set: { actualCheckIn: new Date(), status: 'active' } },
      { new: true },
    ).lean();
  }

  async checkOut(id: string, actualAmount?: number): Promise<IBooking | null> {
    const booking = await BookingModel.findById(id).lean();
    const actual = booking
      ? Math.round((new Date().getTime() - booking.actualCheckIn!.getTime()) / 60000)
      : undefined;

    return BookingModel.findByIdAndUpdate(
      id,
      {
        $set: {
          actualCheckOut: new Date(),
          status: 'completed',
          'duration.actual': actual,
          'payment.status': 'paid',
          'payment.paidAt': new Date(),
        },
      },
      { new: true },
    ).lean();
  }

  async updateQrCode(id: string, qrCode: string, expiresAt: Date): Promise<void> {
    await BookingModel.findByIdAndUpdate(id, { $set: { qrCode, qrCodeExpiresAt: expiresAt } });
  }

  async getAdminStats(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
  }> {
    const result = await BookingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$amount.total' },
        },
      },
    ]);

    const byStatus: Record<string, number> = {};
    let totalBookings = 0;
    let totalRevenue = 0;

    for (const r of result) {
      byStatus[r._id] = r.count;
      totalBookings += r.count;
      if (['completed', 'active'].includes(r._id)) totalRevenue += r.revenue;
    }

    return { totalBookings, totalRevenue, byStatus };
  }
}

export const bookingRepository = new BookingRepository();
