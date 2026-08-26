import mongoose, { Schema } from 'mongoose';

export type AuditAction =
  | 'VERIFICATION_SUBMITTED'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'VERIFICATION_MORE_INFO_REQUESTED'
  | 'VERIFICATION_SUSPENDED'
  | 'VERIFICATION_REINSTATED'
  | 'CLAIM_CREATED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'PARKING_SUSPENDED'
  | 'PARKING_REINSTATED'
  | 'REPORT_CREATED'
  | 'REPORT_RESOLVED'
  | 'REPORT_DISMISSED'
  | 'EVIDENCE_UPLOADED';

export type AuditEntityType =
  | 'ParkingVerification'
  | 'ClaimRequest'
  | 'ParkingReport'
  | 'ParkingLot';

export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: mongoose.Types.ObjectId;
  reason?: string;
  /** Metadata stored here must NEVER contain document contents or PII */
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, maxlength: 1000 },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ entityId: 1, entityType: 1 });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
