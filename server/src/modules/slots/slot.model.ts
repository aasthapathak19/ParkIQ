import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISlot {
  _id: mongoose.Types.ObjectId;
  parkingLot: mongoose.Types.ObjectId;
  floor: number;
  slotNumber: string;
  displayLabel: string;
  type: 'standard' | 'ev' | 'disabled' | 'compact' | 'large' | 'valet' | 'motorcycle';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked';
  currentBooking?: mongoose.Types.ObjectId;
  reservedUntil?: Date;
  evCharger: {
    isPresent: boolean;
    connectorType?: 'Type2' | 'CCS' | 'CHAdeMO' | 'Tesla';
    powerKW?: number;
    isOperational: boolean;
  };
  lastStatusChange: {
    from?: string;
    to?: string;
    changedAt: Date;
    changedBy?: mongoose.Types.ObjectId;
    source: 'manual' | 'booking_engine' | 'owner' | 'system';
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>(
  {
    parkingLot: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true, index: true },
    floor: { type: Number, required: true, min: 0 },
    slotNumber: { type: String, required: true, trim: true },
    displayLabel: { type: String, trim: true },
    type: {
      type: String,
      enum: ['standard', 'ev', 'disabled', 'compact', 'large', 'valet', 'motorcycle'],
      default: 'standard',
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance', 'blocked'],
      default: 'available',
    },
    currentBooking: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    reservedUntil: { type: Date, default: null },
    evCharger: {
      isPresent: { type: Boolean, default: false },
      connectorType: { type: String, enum: ['Type2', 'CCS', 'CHAdeMO', 'Tesla'] },
      powerKW: Number,
      isOperational: { type: Boolean, default: true },
      _id: false,
    },
    lastStatusChange: {
      from: String,
      to: String,
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      source: {
        type: String,
        enum: ['manual', 'booking_engine', 'owner', 'system'],
        default: 'system',
      },
      _id: false,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

SlotSchema.index({ parkingLot: 1, status: 1 });
SlotSchema.index({ parkingLot: 1, floor: 1, status: 1 });
SlotSchema.index({ parkingLot: 1, type: 1, status: 1 });
SlotSchema.index({ 'evCharger.isPresent': 1, status: 1 });
SlotSchema.index({ currentBooking: 1 }, { sparse: true });

export const SlotModel = mongoose.model<ISlot>('ParkingSlot', SlotSchema);
