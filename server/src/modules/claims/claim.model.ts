import mongoose, { Schema } from 'mongoose';

export type ClaimStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface IClaimRequest {
  _id: mongoose.Types.ObjectId;
  parkingId: mongoose.Types.ObjectId;
  claimantId: mongoose.Types.ObjectId;
  status: ClaimStatus;
  /** Claimant's reason for the claim */
  claimReason: string;
  /** Evidence refs — private, never in public responses */
  evidenceRefs: Array<{
    evidenceType: string;
    description: string;
    fileKey: string;
    mimeType: string;
    uploadedAt: Date;
  }>;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewReason?: string;
  /** ID of the current owner the claim conflicts with */
  conflictsWith?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceRefSchema = new Schema(
  {
    evidenceType: { type: String, required: true },
    description: { type: String, maxlength: 500 },
    fileKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const ClaimRequestSchema = new Schema<IClaimRequest>(
  {
    parkingId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true, index: true },
    claimantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    claimReason: { type: String, required: true, maxlength: 2000 },
    evidenceRefs: { type: [EvidenceRefSchema], default: [], select: false },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewReason: { type: String, maxlength: 2000 },
    conflictsWith: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

ClaimRequestSchema.index({ parkingId: 1, claimantId: 1 });
ClaimRequestSchema.index({ status: 1, createdAt: -1 });

export const ClaimRequestModel = mongoose.model<IClaimRequest>('ClaimRequest', ClaimRequestSchema);
