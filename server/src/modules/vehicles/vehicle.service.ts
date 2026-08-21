import { vehicleRepository } from './vehicle.repository';
import { IVehicle } from './vehicle.model';
import { ConflictError, NotFoundError } from '../../domain/errors';

export class VehicleService {
  async addVehicle(ownerId: string, dto: Partial<IVehicle>): Promise<IVehicle> {
    const exists = await vehicleRepository.existsByPlate(dto.licensePlate!);
    if (exists) throw new ConflictError('A vehicle with this license plate already exists');

    const userVehicles = await vehicleRepository.findByOwner(ownerId);
    const isFirst = userVehicles.length === 0;

    return vehicleRepository.create({
      ...dto,
      owner: ownerId as unknown as import('mongoose').Types.ObjectId,
      isDefault: isFirst || dto.isDefault,
    });
  }

  async getMyVehicles(ownerId: string): Promise<IVehicle[]> {
    return vehicleRepository.findByOwner(ownerId);
  }

  async updateVehicle(id: string, ownerId: string, dto: Partial<IVehicle>): Promise<IVehicle> {
    const vehicle = await vehicleRepository.updateById(id, ownerId, dto);
    if (!vehicle) throw new NotFoundError('Vehicle', id);
    return vehicle;
  }

  async deleteVehicle(id: string, ownerId: string): Promise<void> {
    const deleted = await vehicleRepository.softDelete(id, ownerId);
    if (!deleted) throw new NotFoundError('Vehicle', id);
  }

  async setDefault(vehicleId: string, ownerId: string): Promise<void> {
    const vehicle = await vehicleRepository.findByIdAndOwner(vehicleId, ownerId);
    if (!vehicle) throw new NotFoundError('Vehicle', vehicleId);
    await vehicleRepository.setDefault(vehicleId, ownerId);
  }
}

export const vehicleService = new VehicleService();
