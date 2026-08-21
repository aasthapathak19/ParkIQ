import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRefreshToken {
  tokenHash: string;
  deviceId: string;
  userAgent: string;
  ip: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IOwnerProfile {
  businessName?: string;
  businessRegistration?: string;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: 'customer' | 'owner' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  refreshTokens: IRefreshToken[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  favouriteParkings: mongoose.Types.ObjectId[];
  ownerProfile?: IOwnerProfile;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginCount: number;
  tokenVersion: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true },
    deviceId: { type: String, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
);

const OwnerProfileSchema = new Schema<IOwnerProfile>(
  {
    businessName: { type: String, trim: true },
    businessRegistration: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    avatar: { type: String },
    role: {
      type: String,
      enum: ['customer', 'owner', 'admin'],
      default: 'customer',
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
    refreshTokens: { type: [RefreshTokenSchema], default: [], select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    favouriteParkings: [{ type: Schema.Types.ObjectId, ref: 'ParkingLot' }],
    ownerProfile: { type: OwnerProfileSchema },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    loginCount: { type: Number, default: 0 },
    tokenVersion: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Indexes ────────────────────────────────────────────────────────────────
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ 'refreshTokens.tokenHash': 1 });
UserSchema.index({ deletedAt: 1 }, { sparse: true });
UserSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
