import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking {
  _id: mongoose.Types.ObjectId;
  bookingRef: string;
  customer: mongoose.Types.ObjectId;
  vehicle: {
    vehicleId: mongoose.Types.ObjectId;
    licensePlate: string;
    type: string;
    brand: string;
    model: string;
  };
  parkingLot: {
    lotId: mongoose.Types.ObjectId;
    name: string;
    address: string;
  };
  slot: {
    slotId: mongoose.Types.ObjectId;
    slotNumber: string;
    floor: number;
    type: string;
  };
  startTime: Date;
  endTime: Date;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  duration: { planned: number; actual?: number };
  amount: {
    base: number;
    peakSurcharge: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
    pricingStrategy: string;
    priceBreakdown: Record<string, number>;
  };
  payment: {
    status: 'pending' | 'paid' | 'refunded' | 'failed' | 'partial_refund';
    method?: string;
    gatewayRef?: string;
    paidAt?: Date;
    refundedAt?: Date;
    refundAmount?: number;
    refundReason?: string;
  };
  status: 'pending' | 'reserved' | 'payment_pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'expired' | 'no_show';
  cancellation?: {
    reason: string;
    cancelledBy: 'customer' | 'owner' | 'admin' | 'system';
    cancelledAt: Date;
  };
  qrCode: string;
  qrCodeExpiresAt: Date;
  lockKey?: string;
  lockExpiresAt?: Date;
  reminderJobId?: string;
  source: 'web' | 'mobile' | 'api' | 'kiosk';
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingRef: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicle: {
      vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
      licensePlate: { type: String, required: true },
      type: String,
      brand: String,
      model: String,
      _id: false,
    },
    parkingLot: {
      lotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
      name: String,
      address: String,
      _id: false,
    },
    slot: {
      slotId: { type: Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
      slotNumber: String,
      floor: Number,
      type: String,
      _id: false,
    },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    actualCheckIn: Date,
    actualCheckOut: Date,
    duration: {
      planned: { type: Number, required: true },
      actual: Number,
      _id: false,
    },
    amount: {
      base: Number,
      peakSurcharge: { type: Number, default: 0 },
      tax: Number,
      discount: { type: Number, default: 0 },
      total: Number,
      currency: { type: String, default: 'INR' },
      pricingStrategy: String,
      priceBreakdown: { type: Schema.Types.Mixed, default: {} },
      _id: false,
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed', 'partial_refund'],
        default: 'pending',
      },
      method: String,
      gatewayRef: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number,
      refundReason: String,
      _id: false,
    },
    status: {
      type: String,
      enum: ['pending', 'reserved', 'payment_pending', 'confirmed', 'active', 'completed', 'cancelled', 'expired', 'no_show'],
      default: 'pending',
    },
    cancellation: {
      reason: String,
      cancelledBy: { type: String, enum: ['customer', 'owner', 'admin', 'system'] },
      cancelledAt: Date,
      _id: false,
    },
    qrCode: { type: String, required: true },
    qrCodeExpiresAt: { type: Date, required: true },
    lockKey: String,
    lockExpiresAt: Date,
    reminderJobId: String,
    source: { type: String, enum: ['web', 'mobile', 'api', 'kiosk'], default: 'web' },
    userAgent: String,
    ip: String,
  },
  { timestamps: true },
);

// ─── Critical Indexes ────────────────────────────────────────────────────────
BookingSchema.index({ customer: 1, status: 1, createdAt: -1 });
BookingSchema.index({ 'parkingLot.lotId': 1, status: 1, startTime: 1 });
BookingSchema.index({ 'slot.slotId': 1, status: 1, startTime: 1, endTime: 1 }); // overlap detection
BookingSchema.index({ status: 1, startTime: 1 }); // reminder jobs
BookingSchema.index({ status: 1, endTime: 1 });   // auto-expire jobs
BookingSchema.index({ 'payment.gatewayRef': 1 }, { sparse: true });

export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);
