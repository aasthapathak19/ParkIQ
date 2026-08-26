import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParkingLot {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode?: string;
    formattedAddress?: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  images: Array<{ url: string; isPrimary: boolean; order: number }>;
  amenities: {
    isEVCharging: boolean;
    isCovered: boolean;
    is24x7: boolean;
    hasSecurity: boolean;
    hasCCTV: boolean;
    hasWifi: boolean;
    hasDisabledAccess: boolean;
    hasCarWash: boolean;
    hasValet: boolean;
  };
  capacity: {
    total: number;
    available: number;
    byType: { standard: number; ev: number; disabled: number };
  };
  pricing: {
    baseRate: number;
    currency: string;
    minimumDuration: number;
    maximumDuration: number;
    peakHourRate: number;
    peakHours: Array<{ dayOfWeek: number; startHour: number; endHour: number }>;
    weekendMultiplier: number;
    pricingStrategy: 'fixed' | 'time_based' | 'dynamic' | 'ml_driven';
  };
  operatingHours: Array<{
    dayOfWeek: number;
    open: string;
    close: string;
    isClosed: boolean;
  }>;
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected';
  rejectionReason?: string;
  /** Phase 3 — Verification lifecycle status (separate from operational status) */
  verificationStatus: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'MORE_INFO_REQUIRED' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  /** Phase 3 — The badge/level earned from verification */
  verificationLevel?: 'PARKIQ_VERIFIED' | 'VERIFIED_OWNER' | 'VERIFIED_OPERATOR' | 'LOCATION_VERIFIED' | 'BASIC_VERIFIED';
  /** Phase 3 — Flagged when nearby duplicate listing detected */
  isDuplicateFlagged: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rating: { average: number; count: number };
  stats: { totalBookings: number; totalRevenue: number; averageOccupancyRate: number; lastCalculatedAt?: Date };
  externalIds?: { smartCityId?: string; municipalId?: string };
  totalFloors: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingLotSchema = new Schema<IParkingLot>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 2000 },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
      zipCode: String,
      formattedAddress: String,
      _id: false,
    },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    images: [{ url: String, isPrimary: Boolean, order: Number, _id: false }],
    amenities: {
      isEVCharging: { type: Boolean, default: false },
      isCovered: { type: Boolean, default: false },
      is24x7: { type: Boolean, default: false },
      hasSecurity: { type: Boolean, default: false },
      hasCCTV: { type: Boolean, default: false },
      hasWifi: { type: Boolean, default: false },
      hasDisabledAccess: { type: Boolean, default: false },
      hasCarWash: { type: Boolean, default: false },
      hasValet: { type: Boolean, default: false },
      _id: false,
    },
    capacity: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      byType: {
        standard: { type: Number, default: 0 },
        ev: { type: Number, default: 0 },
        disabled: { type: Number, default: 0 },
        _id: false,
      },
      _id: false,
    },
    pricing: {
      baseRate: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      minimumDuration: { type: Number, default: 60 },
      maximumDuration: { type: Number, default: 1440 },
      peakHourRate: { type: Number, default: 0 },
      peakHours: [{ dayOfWeek: Number, startHour: Number, endHour: Number, _id: false }],
      weekendMultiplier: { type: Number, default: 1.0 },
      pricingStrategy: { type: String, enum: ['fixed', 'time_based', 'dynamic', 'ml_driven'], default: 'time_based' },
      _id: false,
    },
    operatingHours: [{
      dayOfWeek: { type: Number, min: 0, max: 6 },
      open: { type: String, default: '00:00' },
      close: { type: String, default: '23:59' },
      isClosed: { type: Boolean, default: false },
      _id: false,
    }],
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'inactive', 'suspended', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    // Phase 3 — Verification Fields
    verificationStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFO_REQUIRED', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'DRAFT',
      index: true,
    },
    verificationLevel: {
      type: String,
      enum: ['PARKIQ_VERIFIED', 'VERIFIED_OWNER', 'VERIFIED_OPERATOR', 'LOCATION_VERIFIED', 'BASIC_VERIFIED'],
    },
    isDuplicateFlagged: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      _id: false,
    },
    stats: {
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageOccupancyRate: { type: Number, default: 0 },
      lastCalculatedAt: Date,
      _id: false,
    },
    externalIds: { smartCityId: String, municipalId: String, _id: false },
    totalFloors: { type: Number, default: 1 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// â”€â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ParkingLotSchema.index({ location: '2dsphere' });
ParkingLotSchema.index({ status: 1, 'address.city': 1 });
ParkingLotSchema.index({ status: 1, 'amenities.isEVCharging': 1 });
ParkingLotSchema.index({ status: 1, 'pricing.baseRate': 1 });
ParkingLotSchema.index({ status: 1, 'capacity.available': 1 });
ParkingLotSchema.index({ 'rating.average': -1, status: 1 });
ParkingLotSchema.index({ deletedAt: 1 }, { sparse: true });

export const ParkingLotModel = mongoose.model<IParkingLot>('ParkingLot', ParkingLotSchema);


