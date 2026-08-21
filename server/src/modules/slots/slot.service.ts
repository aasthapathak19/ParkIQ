import { slotRepository } from './slot.repository';
import { parkingRepository } from '../parking/parking.repository';
import { ISlot } from './slot.model';
import { NotFoundError, ForbiddenError } from '../../domain/errors';

export class SlotService {
  async createSlots(lotId: string, ownerId: string, slots: Partial<ISlot>[]): Promise<ISlot[]> {
    const lot = await parkingRepository.findById(lotId);
    if (!lot) throw new NotFoundError('ParkingLot', lotId);
    if (lot.owner.toString() !== ownerId) throw new ForbiddenError();

    const slotsWithLot = slots.map((s, i) => ({
      ...s,
      parkingLot: lotId as unknown as import('mongoose').Types.ObjectId,
      displayLabel: `Floor ${s.floor ?? 1}, Slot ${s.slotNumber ?? i + 1}`,
    }));

    const created = await slotRepository.createMany(slotsWithLot);

    // Update lot capacity atomically
    await parkingRepository.updateById(lotId, {
      'capacity.total': (lot.capacity.total ?? 0) + created.length,
      'capacity.available': (lot.capacity.available ?? 0) + created.length,
    } as Partial<typeof lot>);

    return created;
  }

  async getSlotsByLot(
    lotId: string,
    filter: { status?: string; type?: string; floor?: number },
  ): Promise<ISlot[]> {
    return slotRepository.findByLot(lotId, filter);
  }

  async updateSlot(id: string, ownerId: string, lotId: string, data: Partial<ISlot>): Promise<ISlot> {
    const lot = await parkingRepository.findById(lotId);
    if (!lot) throw new NotFoundError('ParkingLot', lotId);
    if (lot.owner.toString() !== ownerId) throw new ForbiddenError();

    const updated = await slotRepository.updateById(id, data);
    if (!updated) throw new NotFoundError('Slot', id);
    return updated;
  }

  async updateSlotStatus(
    slotId: string,
    status: ISlot['status'],
    ownerId: string,
    lotId: string,
  ): Promise<ISlot> {
    const lot = await parkingRepository.findById(lotId);
    if (!lot) throw new NotFoundError('ParkingLot', lotId);
    if (lot.owner.toString() !== ownerId) throw new ForbiddenError();

    const updated = await slotRepository.updateStatus(slotId, status, 'owner', undefined, ownerId);
    if (!updated) throw new NotFoundError('Slot', slotId);
    return updated;
  }

  async deleteSlot(id: string, ownerId: string, lotId: string): Promise<void> {
    const lot = await parkingRepository.findById(lotId);
    if (!lot) throw new NotFoundError('ParkingLot', lotId);
    if (lot.owner.toString() !== ownerId) throw new ForbiddenError();
    await slotRepository.softDelete(id);
  }

}

export const slotService = new SlotService();
