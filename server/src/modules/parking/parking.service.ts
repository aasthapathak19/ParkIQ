import { parkingRepository, ParkingSearchFilter } from './parking.repository';
import { IParkingLot } from './parking.model';
import { userRepository } from '../users/user.repository';
import { NotFoundError, ForbiddenError, ConflictError } from '../../domain/errors';
import { PaginationOptions, PaginatedResult } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';
import { verificationService } from '../verification/verification.service';
import { VerificationType } from '../verification/verification.model';
import { logger } from '../../config/logger';

const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export class ParkingService {
  async createLot(ownerId: string, dto: Partial<IParkingLot> & { verificationType?: VerificationType }): Promise<IParkingLot> {
    const baseSlug = slugify(dto.name!);
    const slug = `${baseSlug}-${Date.now()}`;
    const verificationType: VerificationType = dto.verificationType ?? 'PROPERTY_OWNER';

    const lot = await parkingRepository.create({
      ...dto,
      owner: ownerId as unknown as import('mongoose').Types.ObjectId,
      slug,
      status: 'pending',     // Operational: pending admin review
      verificationStatus: 'DRAFT', // Verification: starts as DRAFT
      location: { type: 'Point', coordinates: dto.location!.coordinates },
    });

    // Phase 3: Create DRAFT verification record (includes duplicate detection)
    try {
      await verificationService.createDraft(lot._id.toString(), ownerId, verificationType);
    } catch (err) {
      logger.error({ err, lotId: lot._id }, 'Failed to create verification draft — non-fatal');
    }

    return lot;
  }

  async getLotById(id: string): Promise<IParkingLot> {
    const lot = await parkingRepository.findById(id);
    if (!lot) throw new NotFoundError('ParkingLot', id);
    return lot;
  }

  async getLotBySlug(slug: string): Promise<IParkingLot> {
    const lot = await parkingRepository.findBySlug(slug);
    if (!lot) throw new NotFoundError('ParkingLot');
    return lot;
  }

  async search(
    filter: ParkingSearchFilter,
    options: PaginationOptions,
  ): Promise<PaginatedResult<IParkingLot>> {
    const cacheService = new (require('../../infrastructure/redis/RedisCacheService')).RedisCacheService();
    const cacheKey = `search:${JSON.stringify(filter)}:${JSON.stringify(options)}`;

    const cached = await cacheService.get(cacheKey) as PaginatedResult<IParkingLot>;
    if (cached) return cached;

    const { data, total } = await parkingRepository.search(filter, options);
    const result = buildPaginatedResult(data, total, options);

    await cacheService.set(cacheKey, result, 300);
    return result;
  }

  async getMyLots(ownerId: string, options: PaginationOptions): Promise<PaginatedResult<IParkingLot>> {
    const { data, total } = await parkingRepository.findByOwner(ownerId, options);
    return buildPaginatedResult(data, total, options);
  }

  async updateLot(id: string, ownerId: string, dto: Partial<IParkingLot>): Promise<IParkingLot> {
    const lot = await parkingRepository.findById(id);
    if (!lot) throw new NotFoundError('ParkingLot', id);
    if (lot.owner.toString() !== ownerId) throw new ForbiddenError();

    const updated = await parkingRepository.updateById(id, dto);
    return updated!;
  }

  async deleteLot(id: string, ownerId: string): Promise<void> {
    const deleted = await parkingRepository.softDelete(id, ownerId);
    if (!deleted) throw new NotFoundError('ParkingLot', id);
  }

  /**
   * Phase 3 guard: Only allow setting status to 'active' if verificationStatus === VERIFIED.
   * Admin must use the verification approval workflow to activate a lot.
   */
  async updateStatus(
    id: string,
    status: 'active' | 'rejected' | 'suspended' | 'inactive',
    adminId: string,
    rejectionReason?: string,
  ): Promise<IParkingLot> {
    const lot = await parkingRepository.findById(id);
    if (!lot) throw new NotFoundError('ParkingLot', id);

    if (status === 'active' && lot.verificationStatus !== 'VERIFIED') {
      throw new ConflictError(
        `Cannot activate a parking lot that is not verified (current verificationStatus: ${lot.verificationStatus}). Use the verification approval workflow.`,
      );
    }

    const updated = await parkingRepository.updateStatus(id, status, adminId, rejectionReason);
    if (!updated) throw new NotFoundError('ParkingLot', id);
    return updated;
  }

  async getPendingApprovals(options: PaginationOptions): Promise<PaginatedResult<IParkingLot>> {
    const { data, total } = await parkingRepository.findPending(options);
    return buildPaginatedResult(data, total, options);
  }

  async toggleFavourite(userId: string, lotId: string): Promise<{ added: boolean }> {
    await this.getLotById(lotId);
    return userRepository.toggleFavourite(userId, lotId);
  }
}

export const parkingService = new ParkingService();

