import mongoose from 'mongoose';
import { ParkingLotModel, IParkingLot } from './parking.model';
import { PaginationOptions } from '../../types/common.types';

export interface ParkingSearchFilter {
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  maxPrice?: number;
  minPrice?: number;
  isEV?: boolean;
  isCovered?: boolean;
  is24x7?: boolean;
}

export class ParkingRepository {
  async create(data: Partial<IParkingLot>): Promise<IParkingLot> {
    const lot = new ParkingLotModel(data);
    return lot.save();
  }

  async findById(id: string): Promise<IParkingLot | null> {
    return ParkingLotModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    })
      .populate('owner', 'name email')
      .lean();
  }

  async findBySlug(slug: string): Promise<IParkingLot | null> {
    return ParkingLotModel.findOne({ slug, deletedAt: null }).populate('owner', 'name email').lean();
  }

  async search(
    filter: ParkingSearchFilter,
    options: PaginationOptions,
  ): Promise<{ data: IParkingLot[]; total: number }> {
    const query: Record<string, unknown> = { status: 'active', deletedAt: null };

    if (filter.lat !== undefined && filter.lng !== undefined) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [filter.lng, filter.lat] },
          $maxDistance: (filter.radiusKm ?? 10) * 1000,
        },
      };
    }

    if (filter.city) query['address.city'] = { $regex: filter.city, $options: 'i' };
    if (filter.isEV) query['amenities.isEVCharging'] = true;
    if (filter.isCovered) query['amenities.isCovered'] = true;
    if (filter.is24x7) query['amenities.is24x7'] = true;
    if (filter.maxPrice) query['pricing.baseRate'] = { $lte: filter.maxPrice };
    if (filter.minPrice) {
      query['pricing.baseRate'] = { ...(query['pricing.baseRate'] as object ?? {}), $gte: filter.minPrice };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price: { 'pricing.baseRate': 1 },
      rating: { 'rating.average': -1 },
      createdAt: { createdAt: -1 },
    };

    const sort = sortMap[options.sortBy ?? 'createdAt'] ?? { createdAt: -1 };
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      ParkingLotModel.find(query).sort(sort).skip(skip).limit(options.limit).lean(),
      ParkingLotModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async findByOwner(
    ownerId: string,
    options: PaginationOptions,
  ): Promise<{ data: IParkingLot[]; total: number }> {
    const query = { owner: new mongoose.Types.ObjectId(ownerId), deletedAt: null };
    const skip = (options.page - 1) * options.limit;

    const [data, total] = await Promise.all([
      ParkingLotModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(options.limit).lean(),
      ParkingLotModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async updateById(id: string, data: Partial<IParkingLot>): Promise<IParkingLot | null> {
    return ParkingLotModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), deletedAt: null },
      { $set: data },
      { new: true, runValidators: true },
    ).lean();
  }

  async updateStatus(
    id: string,
    status: string,
    adminId?: string,
    rejectionReason?: string,
  ): Promise<IParkingLot | null> {
    const update: Record<string, unknown> = { status };
    if (status === 'active' && adminId) {
      update.approvedBy = new mongoose.Types.ObjectId(adminId);
      update.approvedAt = new Date();
    }
    if (status === 'rejected' && rejectionReason) {
      update.rejectionReason = rejectionReason;
    }
    return ParkingLotModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  }

  async softDelete(id: string, ownerId: string): Promise<boolean> {
    const result = await ParkingLotModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), owner: new mongoose.Types.ObjectId(ownerId) },
      { $set: { deletedAt: new Date(), status: 'inactive' } },
    );
    return !!result;
  }

  async decrementAvailable(lotId: string): Promise<void> {
    await ParkingLotModel.findByIdAndUpdate(lotId, {
      $inc: { 'capacity.available': -1, 'stats.totalBookings': 1 },
    });
  }

  async incrementAvailable(lotId: string): Promise<void> {
    await ParkingLotModel.findByIdAndUpdate(lotId, {
      $inc: { 'capacity.available': 1 },
    });
  }

  async findPending(options: PaginationOptions): Promise<{ data: IParkingLot[]; total: number }> {
    const query = { status: 'pending', deletedAt: null };
    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      ParkingLotModel.find(query).populate('owner', 'name email').sort({ createdAt: 1 }).skip(skip).limit(options.limit).lean(),
      ParkingLotModel.countDocuments(query),
    ]);
    return { data, total };
  }

  // Phase 3 — Geospatial duplicate detection
  async findNearby(
    lng: number,
    lat: number,
    radiusMeters: number,
    excludeId?: string,
  ): Promise<IParkingLot[]> {
    const query: Record<string, unknown> = {
      deletedAt: null,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    };
    if (excludeId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }
    return ParkingLotModel.find(query)
      .select('_id name address location status verificationStatus')
      .limit(10)
      .lean();
  }
}

export const parkingRepository = new ParkingRepository();
