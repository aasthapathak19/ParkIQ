import mongoose, { Schema } from 'mongoose';

export type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'MORE_INFO_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type VerificationType =
  | 'PROPERTY_OWNER'
  | 'LEASE_HOLDER'
  | 'AUTHORIZED_OPERATOR'
  | 'BUSINESS_OPERATOR'
  | 'PROPERTY_MANAGER'
  | 'OTHER';

export type VerificationLevel =
  | 'PARKIQ_VERIFIED'
  | 'VERIFIED_OWNER'
  | 'VERIFIED_OPERATOR'
  | 'LOCATION_VERIFIED'
  | 'BASIC_VERIFIED';

/** A single piece of submitted evidence. File key is internal — never public. */
export interface IEvidenceRef {
  evidenceType: string;
  description: string;
  /** Storage key — MUST NOT appear in public/owner API responses */
  fileKey: string;
  mimeType: string;
  uploadedAt: Date;
}

export interface IDuplicateWarning {
  lotId: mongoose.Types.ObjectId;
  distanceMeters: number;
  flaggedAt: Date;
}

export interface IParkingVerification {
  _id: mongoose.Types.ObjectId;
  parkingId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  verificationType: VerificationType;
  status: VerificationStatus;
  verificationLevel?: VerificationLevel;
  /** Private evidence files — MUST be stripped from public/owner responses */
  evidenceRefs: IEvidenceRef[];
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewReason?: string;
  /** Admin-only internal notes — NEVER exposed to owner or customer */
  adminNotes?: string;
  duplicateWarnings: IDuplicateWarning[];
  previousAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceRefSchema = new Schema<IEvidenceRef>(
  {
    evidenceType: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    fileKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const DuplicateWarningSchema = new Schema<IDuplicateWarning>(
  {
    lotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
    distanceMeters: { type: Number },
    flaggedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const ParkingVerificationSchema = new Schema<IParkingVerification>(
  {
    parkingId: {
      type: Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
      unique: true,
      index: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    verificationType: {
      type: String,
      enum: ['PROPERTY_OWNER', 'LEASE_HOLDER', 'AUTHORIZED_OPERATOR', 'BUSINESS_OPERATOR', 'PROPERTY_MANAGER', 'OTHER'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFO_REQUIRED', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'DRAFT',
      index: true,
    },
    verificationLevel: {
      type: String,
      enum: ['PARKIQ_VERIFIED', 'VERIFIED_OWNER', 'VERIFIED_OPERATOR', 'LOCATION_VERIFIED', 'BASIC_VERIFIED'],
    },
    evidenceRefs: {
      type: [EvidenceRefSchema],
      default: [],
      select: false, // Always hidden by default — must be explicitly selected
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewReason: { type: String, maxlength: 2000 },
    adminNotes: { type: String, maxlength: 5000, select: false }, // Never auto-selected
    duplicateWarnings: { type: [DuplicateWarningSchema], default: [] },
    previousAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

ParkingVerificationSchema.index({ status: 1, createdAt: -1 });
ParkingVerificationSchema.index({ ownerId: 1, status: 1 });

export const ParkingVerificationModel = mongoose.model<IParkingVerification>(
  'ParkingVerification',
  ParkingVerificationSchema,
);
