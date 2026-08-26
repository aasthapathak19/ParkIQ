import mongoose from 'mongoose';
import { ClaimRequestModel, IClaimRequest, ClaimStatus } from './claim.model';
import { ParkingLotModel } from '../parking/parking.model';
import { auditService } from '../audit/audit.service';
import { eventBus } from '../../domain/events/EventBus';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { NotFoundError, ForbiddenError, ConflictError } from '../../domain/errors';
import { PaginationOptions } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';

class ClaimStatusChangedEvent extends DomainEvent {
  constructor(public readonly payload: { claimId: string; claimantId: string; status: ClaimStatus; reason?: string }) {
    super('ClaimStatusChanged');
  }
}

export class ClaimService {
  async createClaim(parkingId: string, claimantId: string, claimReason: string): Promise<IClaimRequest> {
    const lot = await ParkingLotModel.findById(parkingId).lean();
    if (!lot) throw new NotFoundError('ParkingLot', parkingId);

    // Prevent owner from claiming their own lot
    if (lot.owner.toString() === claimantId) {
      throw new ConflictError('You are already the owner of this parking lot');
    }

    // Check for existing pending claim by this claimant
    const existing = await ClaimRequestModel.findOne({
      parkingId: new mongoose.Types.ObjectId(parkingId),
      claimantId: new mongoose.Types.ObjectId(claimantId),
      status: { $in: ['PENDING', 'UNDER_REVIEW'] },
    }).lean();
    if (existing) throw new ConflictError('You already have a pending claim for this parking lot');

    const claim = await ClaimRequestModel.create({
      parkingId: new mongoose.Types.ObjectId(parkingId),
      claimantId: new mongoose.Types.ObjectId(claimantId),
      claimReason,
      status: 'PENDING',
      conflictsWith: lot.owner,
    });

    await auditService.log({
      actorId: claimantId,
      action: 'CLAIM_CREATED',
      entityType: 'ClaimRequest',
      entityId: claim._id.toString(),
      metadata: { parkingId },
    });

    return claim;
  }

  async getMyClaims(claimantId: string) {
    return ClaimRequestModel.find({ claimantId: new mongoose.Types.ObjectId(claimantId) })
      .populate('parkingId', 'name address status verificationStatus')
      .lean();
  }

  async listAll(options: PaginationOptions, filter: { status?: ClaimStatus } = {}) {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      ClaimRequestModel.find(query)
        .select('+evidenceRefs')
        .populate('parkingId', 'name address status verificationStatus owner')
        .populate('claimantId', 'name email')
        .populate('conflictsWith', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .lean(),
      ClaimRequestModel.countDocuments(query),
    ]);
    return buildPaginatedResult(data, total, options);
  }

  async approve(claimId: string, adminId: string, reason: string) {
    const claim = await ClaimRequestModel.findById(claimId).lean();
    if (!claim) throw new NotFoundError('ClaimRequest', claimId);
    if (claim.status !== 'UNDER_REVIEW' && claim.status !== 'PENDING') {
      throw new ConflictError(`Cannot approve claim in status: ${claim.status}`);
    }

    // NOTE: Does NOT automatically transfer ownership — admin must do so manually via separate flow
    await ClaimRequestModel.findByIdAndUpdate(claimId, {
      $set: { status: 'APPROVED', reviewedBy: new mongoose.Types.ObjectId(adminId), reviewReason: reason },
    });

    await auditService.log({
      actorId: adminId,
      action: 'CLAIM_APPROVED',
      entityType: 'ClaimRequest',
      entityId: claimId,
      reason,
    });

    await eventBus.publish(new ClaimStatusChangedEvent({
      claimId,
      claimantId: claim.claimantId.toString(),
      status: 'APPROVED',
      reason,
    }));
  }

  async reject(claimId: string, adminId: string, reason: string) {
    const claim = await ClaimRequestModel.findById(claimId).lean();
    if (!claim) throw new NotFoundError('ClaimRequest', claimId);

    await ClaimRequestModel.findByIdAndUpdate(claimId, {
      $set: { status: 'REJECTED', reviewedBy: new mongoose.Types.ObjectId(adminId), reviewReason: reason },
    });

    await auditService.log({
      actorId: adminId,
      action: 'CLAIM_REJECTED',
      entityType: 'ClaimRequest',
      entityId: claimId,
      reason,
    });

    await eventBus.publish(new ClaimStatusChangedEvent({
      claimId,
      claimantId: claim.claimantId.toString(),
      status: 'REJECTED',
      reason,
    }));
  }
}

export const claimService = new ClaimService();
