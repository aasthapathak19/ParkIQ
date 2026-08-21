import mongoose from 'mongoose';
import { SlotModel, ISlot } from './slot.model';

export class SlotRepository {
  async createMany(slots: Partial<ISlot>[]): Promise<ISlot[]> {
    return SlotModel.insertMany(slots) as unknown as ISlot[];
  }

  async create(data: Partial<ISlot>): Promise<ISlot> {
    return new SlotModel(data).save();
  }

  async findById(id: string): Promise<ISlot | null> {
    return SlotModel.findOne({ _id: new mongoose.Types.ObjectId(id), isActive: true }).lean();
  }

  async findByLot(
    lotId: string,
    filter: { status?: string; type?: string; floor?: number } = {},
  ): Promise<ISlot[]> {
    const query: Record<string, unknown> = {
      parkingLot: new mongoose.Types.ObjectId(lotId),
      isActive: true,
    };
    if (filter.status) query.status = filter.status;
    if (filter.type) query.type = filter.type;
    if (filter.floor !== undefined) query.floor = filter.floor;

    return SlotModel.find(query).sort({ floor: 1, slotNumber: 1 }).lean();
  }

  async findAvailable(lotId: string, type?: string): Promise<ISlot | null> {
    const query: Record<string, unknown> = {
      parkingLot: new mongoose.Types.ObjectId(lotId),
      status: 'available',
      isActive: true,
    };
    if (type) query.type = type;
    return SlotModel.findOne(query).lean();
  }

  async updateStatus(
    slotId: string,
    status: ISlot['status'],
    source: ISlot['lastStatusChange']['source'],
    bookingId?: string,
    changedBy?: string,
  ): Promise<ISlot | null> {
    const slot = await SlotModel.findById(slotId).lean();
    return SlotModel.findByIdAndUpdate(
      slotId,
      {
        $set: {
          status,
          currentBooking: bookingId ? new mongoose.Types.ObjectId(bookingId) : null,
          lastStatusChange: {
            from: slot?.status,
            to: status,
            changedAt: new Date(),
            changedBy: changedBy ? new mongoose.Types.ObjectId(changedBy) : undefined,
            source,
          },
        },
      },
      { new: true },
    ).lean();
  }

  async updateById(id: string, data: Partial<ISlot>): Promise<ISlot | null> {
    return SlotModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  }

  async softDelete(id: string): Promise<void> {
    await SlotModel.findByIdAndUpdate(id, { $set: { isActive: false } });
  }

  async countAvailableByLot(lotId: string): Promise<number> {
    return SlotModel.countDocuments({
      parkingLot: new mongoose.Types.ObjectId(lotId),
      status: 'available',
      isActive: true,
    });
  }


}

export const slotRepository = new SlotRepository();
