import mongoose from 'mongoose';
import {
  ParkingVerificationModel,
  IParkingVerification,
  VerificationStatus,
  IEvidenceRef,
  IDuplicateWarning,
} from './verification.model';
import { PaginationOptions } from '../../types/common.types';

export class VerificationRepository {
  async create(data: Partial<IParkingVerification>): Promise<IParkingVerification> {
    return ParkingVerificationModel.create(data);
  }

  async findByParkingId(parkingId: string): Promise<IParkingVerification | null> {
    return ParkingVerificationModel.findOne({
      parkingId: new mongoose.Types.ObjectId(parkingId),
    })
      .populate('reviewedBy', 'name email')
      .lean();
  }

  async findByParkingIdWithEvidence(parkingId: string): Promise<IParkingVerification | null> {
    return ParkingVerificationModel.findOne({
      parkingId: new mongoose.Types.ObjectId(parkingId),
    })
      .select('+evidenceRefs +adminNotes')
      .populate('reviewedBy', 'name email')
      .populate('ownerId', 'name email phone')
      .lean();
  }

  async findById(id: string): Promise<IParkingVerification | null> {
    return ParkingVerificationModel.findById(id).lean();
  }

  async findByIdWithEvidence(id: string): Promise<IParkingVerification | null> {
    return ParkingVerificationModel.findById(id)
      .select('+evidenceRefs +adminNotes')
      .populate('reviewedBy', 'name email')
      .populate('ownerId', 'name email phone')
      .populate('parkingId', 'name address location verificationStatus verificationLevel isDuplicateFlagged status')
      .lean();
  }

  async findByOwnerId(ownerId: string): Promise<IParkingVerification[]> {
    return ParkingVerificationModel.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    })
      .populate('parkingId', 'name address status verificationStatus verificationLevel')
      .lean();
  }

  async listAll(
    options: PaginationOptions,
    filter: { status?: VerificationStatus; hasDuplicateWarning?: boolean } = {},
  ): Promise<{ data: IParkingVerification[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.hasDuplicateWarning) {
      query['duplicateWarnings.0'] = { $exists: true };
    }
    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      ParkingVerificationModel.find(query)
        .select('+adminNotes')
        .populate('ownerId', 'name email')
        .populate('parkingId', 'name address status isDuplicateFlagged verificationStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .lean(),
      ParkingVerificationModel.countDocuments(query),
    ]);
    return { data, total };
  }

  async updateStatus(
    parkingId: string,
    status: VerificationStatus,
    adminId?: string,
    opts?: { reason?: string; adminNotes?: string; verificationLevel?: string },
  ): Promise<IParkingVerification | null> {
    const setFields: Record<string, unknown> = { status };
    const incFields: Record<string, unknown> = {};

    if (status === 'SUBMITTED') {
      setFields.submittedAt = new Date();
      incFields.previousAttempts = 1;
    }
    if (['VERIFIED', 'REJECTED', 'MORE_INFO_REQUIRED', 'SUSPENDED'].includes(status) && adminId) {
      setFields.reviewedAt = new Date();
      setFields.reviewedBy = new mongoose.Types.ObjectId(adminId);
    }
    if (opts?.reason) setFields.reviewReason = opts.reason;
    if (opts?.adminNotes) setFields.adminNotes = opts.adminNotes;
    if (opts?.verificationLevel) setFields.verificationLevel = opts.verificationLevel;

    const update: Record<string, unknown> = { $set: setFields };
    if (Object.keys(incFields).length) update.$inc = incFields;

    return ParkingVerificationModel.findOneAndUpdate(
      { parkingId: new mongoose.Types.ObjectId(parkingId) },
      update,
      { new: true },
    ).lean();
  }

  async addEvidenceRef(parkingId: string, ref: IEvidenceRef): Promise<IParkingVerification | null> {
    return ParkingVerificationModel.findOneAndUpdate(
      { parkingId: new mongoose.Types.ObjectId(parkingId) },
      { $push: { evidenceRefs: ref } },
      { new: true },
    ).lean();
  }

  async addDuplicateWarnings(parkingId: string, warnings: IDuplicateWarning[]): Promise<void> {
    await ParkingVerificationModel.findOneAndUpdate(
      { parkingId: new mongoose.Types.ObjectId(parkingId) },
      { $push: { duplicateWarnings: { $each: warnings } } },
    );
  }

  async updateVerificationType(parkingId: string, verificationType: string): Promise<IParkingVerification | null> {
    return ParkingVerificationModel.findOneAndUpdate(
      { parkingId: new mongoose.Types.ObjectId(parkingId) },
      { $set: { verificationType } },
      { new: true },
    ).lean();
  }
}

export const verificationRepository = new VerificationRepository();
