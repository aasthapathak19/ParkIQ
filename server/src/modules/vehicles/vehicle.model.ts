import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVehicle {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  licensePlate: string;
  type: 'car' | 'motorcycle' | 'ev' | 'truck' | 'van';
  brand: string;
  model: string;
  year?: number;
  color?: string;
  evDetails?: {
    batteryCapacity?: number;
    range?: number;
    connectorType?: 'Type2' | 'CCS' | 'CHAdeMO' | 'Tesla';
  };
  aiMetadata?: {
    plateConfidence?: number;
    detectedColor?: string;
    lastDetectedAt?: Date;
    detectedBy?: 'manual' | 'ocr' | 'vision';
  };
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    licensePlate: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['car', 'motorcycle', 'ev', 'truck', 'van'], required: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, min: 1900, max: new Date().getFullYear() + 1 },
    color: { type: String, trim: true },
    evDetails: {
      batteryCapacity: Number,
      range: Number,
      connectorType: { type: String, enum: ['Type2', 'CCS', 'CHAdeMO', 'Tesla'] },
      _id: false,
    },
    aiMetadata: {
      plateConfidence: Number,
      detectedColor: String,
      lastDetectedAt: Date,
      detectedBy: { type: String, enum: ['manual', 'ocr', 'vision'] },
      _id: false,
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

VehicleSchema.index({ owner: 1, isActive: 1 });
VehicleSchema.index({ owner: 1, isDefault: 1 });

export const VehicleModel = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
