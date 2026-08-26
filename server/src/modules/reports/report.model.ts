import mongoose, { Schema } from 'mongoose';

export type ReportReason =
  | 'DOESNT_EXIST'
  | 'WRONG_LOCATION'
  | 'FAKE_LISTING'
  | 'UNAUTHORIZED'
  | 'WRONG_AVAILABILITY'
  | 'FRAUD_PAYMENT'
  | 'SAFETY_CONCERN'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface IParkingReport {
  _id: mongoose.Types.ObjectId;
  parkingId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingReportSchema = new Schema<IParkingReport>(
  {
    parkingId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true, index: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: {
      type: String,
      enum: ['DOESNT_EXIST','WRONG_LOCATION','FAKE_LISTING','UNAUTHORIZED','WRONG_AVAILABILITY','FRAUD_PAYMENT','SAFETY_CONCERN','OTHER'],
      required: true,
    },
    description: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
      index: true,
    },
    resolution: { type: String, maxlength: 2000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

ParkingReportSchema.index({ parkingId: 1, status: 1 });
ParkingReportSchema.index({ reportedBy: 1, createdAt: -1 });

export const ParkingReportModel = mongoose.model<IParkingReport>('ParkingReport', ParkingReportSchema);
