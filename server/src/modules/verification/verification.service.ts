import mongoose from 'mongoose';
import { verificationRepository } from './verification.repository';
import { parkingRepository } from '../parking/parking.repository';
import { ParkingLotModel } from '../parking/parking.model';
import { ParkingVerificationModel, VerificationStatus, VerificationType, VerificationLevel, IDuplicateWarning } from './verification.model';
import { auditService } from '../audit/audit.service';
import { eventBus } from '../../domain/events/EventBus';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { NotFoundError, ForbiddenError, ConflictError } from '../../domain/errors';
import { PaginationOptions } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';
import { localStorageAdapter } from '../../infrastructure/storage/LocalStorageAdapter';
import { logger } from '../../config/logger';

// ─── Domain Events ────────────────────────────────────────────────────────────

class VerificationStatusChangedEvent extends DomainEvent {
  constructor(public readonly payload: {
    parkingId: string;
    ownerId: string;
    status: VerificationStatus;
    verificationLevel?: VerificationLevel;
    reason?: string;
  }) {
    super('VerificationStatusChanged');
  }
}

/** Duplicate detection radius in meters */
const DUPLICATE_RADIUS_METERS = 200;

/** Map verification type → truthful badge level */
function deriveBadge(type: VerificationType): VerificationLevel {
  switch (type) {
    case 'PROPERTY_OWNER': return 'VERIFIED_OWNER';
    case 'LEASE_HOLDER':
    case 'AUTHORIZED_OPERATOR':
    case 'PROPERTY_MANAGER': return 'VERIFIED_OPERATOR';
    case 'BUSINESS_OPERATOR': return 'PARKIQ_VERIFIED';
    case 'OTHER': return 'BASIC_VERIFIED';
    default: return 'BASIC_VERIFIED';
  }
}

export class VerificationService {
  // ─── Create Draft Verification (called on lot creation) ──────────────────────
  async createDraft(parkingId: string, ownerId: string, verificationType: VerificationType) {
    const existing = await verificationRepository.findByParkingId(parkingId);
    if (existing) return existing; // Idempotent

    const rec = await verificationRepository.create({
      parkingId: new mongoose.Types.ObjectId(parkingId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      verificationType,
      status: 'DRAFT',
    });

    // Run duplicate detection
    await this.checkDuplicates(parkingId, ownerId);

    return rec;
  }

  // ─── Owner: Get Verification Status ──────────────────────────────────────────
  async getForOwner(parkingId: string, ownerId: string) {
    const ver = await verificationRepository.findByParkingId(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');
    if (ver.ownerId.toString() !== ownerId) throw new ForbiddenError();
    // Strip evidence and adminNotes — owner never sees these
    const { adminNotes: _an, ...safe } = ver as any;
    return safe;
  }

  // ─── Owner: Update Verification Type ─────────────────────────────────────────
  async updateVerificationType(parkingId: string, ownerId: string, verificationType: VerificationType) {
    const ver = await verificationRepository.findByParkingId(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');
    if (ver.ownerId.toString() !== ownerId) throw new ForbiddenError();
    if (!['DRAFT', 'MORE_INFO_REQUIRED'].includes(ver.status)) {
      throw new ConflictError('Cannot change verification type once submitted for review');
    }
    return verificationRepository.updateVerificationType(parkingId, verificationType);
  }

  // ─── Owner: Submit for Review ─────────────────────────────────────────────────
  async submit(parkingId: string, ownerId: string) {
    const ver = await verificationRepository.findByParkingId(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');
    if (ver.ownerId.toString() !== ownerId) throw new ForbiddenError();
    if (!['DRAFT', 'MORE_INFO_REQUIRED'].includes(ver.status)) {
      throw new ConflictError(`Cannot submit from status: ${ver.status}`);
    }

    const updated = await verificationRepository.updateStatus(parkingId, 'SUBMITTED');

    // Update parking verificationStatus
    await ParkingLotModel.findByIdAndUpdate(parkingId, { $set: { verificationStatus: 'SUBMITTED' } });

    await auditService.log({
      actorId: ownerId,
      action: 'VERIFICATION_SUBMITTED',
      entityType: 'ParkingVerification',
      entityId: ver._id.toString(),
    });

    // Move to UNDER_REVIEW automatically
    const reviewed = await verificationRepository.updateStatus(parkingId, 'UNDER_REVIEW');
    await ParkingLotModel.findByIdAndUpdate(parkingId, { $set: { verificationStatus: 'UNDER_REVIEW' } });

    return reviewed;
  }

  // ─── Owner: Add Evidence Reference ────────────────────────────────────────────
  async addEvidenceRef(
    parkingId: string,
    ownerId: string,
    ref: { evidenceType: string; description: string; fileKey: string; mimeType: string },
  ) {
    const ver = await verificationRepository.findByParkingId(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');
    if (ver.ownerId.toString() !== ownerId) throw new ForbiddenError();

    const evidenceRef = { ...ref, uploadedAt: new Date() };
    const updated = await verificationRepository.addEvidenceRef(parkingId, evidenceRef);

    await auditService.log({
      actorId: ownerId,
      action: 'EVIDENCE_UPLOADED',
      entityType: 'ParkingVerification',
      entityId: ver._id.toString(),
      metadata: { evidenceType: ref.evidenceType },
    });

    return updated;
  }

  // ─── Admin: List All Verifications ───────────────────────────────────────────
  async listAll(options: PaginationOptions, filter: { status?: VerificationStatus; hasDuplicateWarning?: boolean } = {}) {
    const { data, total } = await verificationRepository.listAll(options, filter);
    return buildPaginatedResult(data, total, options);
  }

  // ─── Admin: Get Detail with Evidence ─────────────────────────────────────────
  async getDetailAdmin(verificationId: string) {
    const ver = await verificationRepository.findByIdWithEvidence(verificationId);
    if (!ver) throw new NotFoundError('ParkingVerification', verificationId);
    return ver;
  }

  async getDetailAdminByParkingId(parkingId: string) {
    const ver = await verificationRepository.findByParkingIdWithEvidence(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');
    return ver;
  }

  // ─── Admin: Approve ───────────────────────────────────────────────────────────
  async approve(
    verificationId: string,
    adminId: string,
    opts: { verificationLevel?: VerificationLevel; adminNotes?: string; reason?: string },
  ) {
    const ver = await verificationRepository.findById(verificationId);
    if (!ver) throw new NotFoundError('ParkingVerification', verificationId);
    if (ver.status !== 'UNDER_REVIEW') {
      throw new ConflictError(`Verification is not under review (current: ${ver.status})`);
    }

    const level = opts.verificationLevel ?? deriveBadge(ver.verificationType);

    const updated = await verificationRepository.updateStatus(
      ver.parkingId.toString(),
      'VERIFIED',
      adminId,
      { reason: opts.reason, adminNotes: opts.adminNotes, verificationLevel: level },
    );

    // Update the parking lot
    await ParkingLotModel.findByIdAndUpdate(ver.parkingId, {
      $set: {
        status: 'active',
        verificationStatus: 'VERIFIED',
        verificationLevel: level,
        approvedBy: new mongoose.Types.ObjectId(adminId),
        approvedAt: new Date(),
      },
    });

    await auditService.log({
      actorId: adminId,
      action: 'VERIFICATION_APPROVED',
      entityType: 'ParkingVerification',
      entityId: verificationId,
      reason: opts.reason,
      metadata: { verificationLevel: level },
    });

    // Real-time notify owner
    await eventBus.publish(new VerificationStatusChangedEvent({
      parkingId: ver.parkingId.toString(),
      ownerId: ver.ownerId.toString(),
      status: 'VERIFIED',
      verificationLevel: level,
    }));

    return updated;
  }

  // ─── Admin: Reject ────────────────────────────────────────────────────────────
  async reject(verificationId: string, adminId: string, reason: string, adminNotes?: string) {
    const ver = await verificationRepository.findById(verificationId);
    if (!ver) throw new NotFoundError('ParkingVerification', verificationId);
    if (!reason?.trim()) throw new ConflictError('A reason is required when rejecting');

    const updated = await verificationRepository.updateStatus(
      ver.parkingId.toString(),
      'REJECTED',
      adminId,
      { reason, adminNotes },
    );

    await ParkingLotModel.findByIdAndUpdate(ver.parkingId, {
      $set: { verificationStatus: 'REJECTED', status: 'rejected', rejectionReason: reason },
    });

    await auditService.log({
      actorId: adminId,
      action: 'VERIFICATION_REJECTED',
      entityType: 'ParkingVerification',
      entityId: verificationId,
      reason,
    });

    await eventBus.publish(new VerificationStatusChangedEvent({
      parkingId: ver.parkingId.toString(),
      ownerId: ver.ownerId.toString(),
      status: 'REJECTED',
      reason,
    }));

    return updated;
  }

  // ─── Admin: Request More Info ─────────────────────────────────────────────────
  async requestMoreInfo(verificationId: string, adminId: string, reason: string, adminNotes?: string) {
    const ver = await verificationRepository.findById(verificationId);
    if (!ver) throw new NotFoundError('ParkingVerification', verificationId);
    if (!reason?.trim()) throw new ConflictError('A reason is required');

    const updated = await verificationRepository.updateStatus(
      ver.parkingId.toString(),
      'MORE_INFO_REQUIRED',
      adminId,
      { reason, adminNotes },
    );

    await ParkingLotModel.findByIdAndUpdate(ver.parkingId, {
      $set: { verificationStatus: 'MORE_INFO_REQUIRED' },
    });

    await auditService.log({
      actorId: adminId,
      action: 'VERIFICATION_MORE_INFO_REQUESTED',
      entityType: 'ParkingVerification',
      entityId: verificationId,
      reason,
    });

    await eventBus.publish(new VerificationStatusChangedEvent({
      parkingId: ver.parkingId.toString(),
      ownerId: ver.ownerId.toString(),
      status: 'MORE_INFO_REQUIRED',
      reason,
    }));

    return updated;
  }

  // ─── Admin: Suspend ───────────────────────────────────────────────────────────
  async suspend(parkingId: string, adminId: string, reason: string) {
    if (!reason?.trim()) throw new ConflictError('A reason is required for suspension');

    const ver = await verificationRepository.findByParkingId(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');

    await verificationRepository.updateStatus(parkingId, 'SUSPENDED', adminId, { reason });

    await ParkingLotModel.findByIdAndUpdate(parkingId, {
      $set: { status: 'suspended', verificationStatus: 'SUSPENDED' },
    });

    await auditService.log({
      actorId: adminId,
      action: 'VERIFICATION_SUSPENDED',
      entityType: 'ParkingLot',
      entityId: parkingId,
      reason,
    });

    await eventBus.publish(new VerificationStatusChangedEvent({
      parkingId,
      ownerId: ver.ownerId.toString(),
      status: 'SUSPENDED',
      reason,
    }));
  }

  // ─── Admin: Reinstate ─────────────────────────────────────────────────────────
  async reinstate(parkingId: string, adminId: string, reason: string) {
    const ver = await verificationRepository.findByParkingId(parkingId);
    if (!ver) throw new NotFoundError('ParkingVerification');

    await verificationRepository.updateStatus(parkingId, 'VERIFIED', adminId, { reason });
    await ParkingLotModel.findByIdAndUpdate(parkingId, {
      $set: { status: 'active', verificationStatus: 'VERIFIED' },
    });

    await auditService.log({
      actorId: adminId,
      action: 'VERIFICATION_REINSTATED',
      entityType: 'ParkingLot',
      entityId: parkingId,
      reason,
    });

    await eventBus.publish(new VerificationStatusChangedEvent({
      parkingId,
      ownerId: ver.ownerId.toString(),
      status: 'VERIFIED',
    }));
  }

  // ─── Admin: Get Signed Evidence URL ──────────────────────────────────────────
  async getEvidenceUrl(fileKey: string): Promise<string> {
    return localStorageAdapter.getSignedUrl(fileKey);
  }

  // ─── Private: Geospatial Duplicate Detection ──────────────────────────────────
  private async checkDuplicates(parkingId: string, ownerId: string): Promise<void> {
    try {
      const lot = await ParkingLotModel.findById(parkingId).lean();
      if (!lot?.location?.coordinates) return;

      const [lng, lat] = lot.location.coordinates;

      const nearbyLots = await ParkingLotModel.find({
        _id: { $ne: new mongoose.Types.ObjectId(parkingId) },
        deletedAt: null,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: DUPLICATE_RADIUS_METERS,
          },
        },
      })
        .select('_id name location')
        .limit(5)
        .lean();

      if (nearbyLots.length === 0) return;

      const warnings: IDuplicateWarning[] = nearbyLots.map((n) => ({
        lotId: n._id,
        distanceMeters: DUPLICATE_RADIUS_METERS,
        flaggedAt: new Date(),
      }));

      await verificationRepository.addDuplicateWarnings(parkingId, warnings);
      await ParkingLotModel.findByIdAndUpdate(parkingId, { $set: { isDuplicateFlagged: true } });

      logger.warn({ parkingId, nearbyCount: nearbyLots.length }, 'Duplicate parking detected — flagged for review');
    } catch (err) {
      logger.error({ err, parkingId }, 'Duplicate detection failed — non-fatal');
    }
  }

  // ─── Owner: List Own Verifications ───────────────────────────────────────────
  async listForOwner(ownerId: string) {
    return verificationRepository.findByOwnerId(ownerId);
  }
}

export const verificationService = new VerificationService();
