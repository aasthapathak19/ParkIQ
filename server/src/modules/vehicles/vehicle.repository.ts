import mongoose from 'mongoose';
import { VehicleModel, IVehicle } from './vehicle.model';

export class VehicleRepository {
  async create(data: Partial<IVehicle>): Promise<IVehicle> {
    const vehicle = new VehicleModel(data);
    return vehicle.save() as unknown as Promise<IVehicle>;
  }

  async findById(id: string): Promise<IVehicle | null> {
    return VehicleModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isActive: true,
    }) as unknown as Promise<IVehicle | null>;
  }

  async findByIdAndOwner(id: string, ownerId: string): Promise<IVehicle | null> {
    return VehicleModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      owner: new mongoose.Types.ObjectId(ownerId),
      isActive: true,
    }) as unknown as Promise<IVehicle | null>;
  }

  async findByOwner(ownerId: string): Promise<IVehicle[]> {
    return VehicleModel.find({
      owner: new mongoose.Types.ObjectId(ownerId),
      isActive: true,
    })
      .sort({ isDefault: -1, createdAt: -1 }) as unknown as Promise<IVehicle[]>;
  }

  async updateById(id: string, ownerId: string, data: Partial<IVehicle>): Promise<IVehicle | null> {
    return VehicleModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), owner: new mongoose.Types.ObjectId(ownerId) },
      { $set: data },
      { new: true },
    ) as unknown as Promise<IVehicle | null>;
  }

  async softDelete(id: string, ownerId: string): Promise<boolean> {
    const result = await VehicleModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), owner: new mongoose.Types.ObjectId(ownerId) },
      { $set: { isActive: false } },
    );
    return !!result;
  }

  async setDefault(vehicleId: string, ownerId: string): Promise<void> {
    const ownerObjId = new mongoose.Types.ObjectId(ownerId);
    await VehicleModel.updateMany({ owner: ownerObjId }, { $set: { isDefault: false } });
    await VehicleModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(vehicleId), owner: ownerObjId },
      { $set: { isDefault: true } },
    );
  }

  async findDefaultByOwner(ownerId: string): Promise<IVehicle | null> {
    return VehicleModel.findOne({
      owner: new mongoose.Types.ObjectId(ownerId),
      isDefault: true,
      isActive: true,
    }) as unknown as Promise<IVehicle | null>;
  }

  async existsByPlate(plate: string): Promise<boolean> {
    const count = await VehicleModel.countDocuments({ licensePlate: plate.toUpperCase() });
    return count > 0;
  }
}

export const vehicleRepository = new VehicleRepository();
