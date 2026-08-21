import { Request, Response } from 'express';
import { vehicleService } from './vehicle.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class VehicleController {
  addVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.addVehicle(req.user!.id, req.body);
    res.status(201).json(ApiResponse.success(vehicle, 'Vehicle added', req.requestId));
  });

  getMyVehicles = asyncHandler(async (req: Request, res: Response) => {
    const vehicles = await vehicleService.getMyVehicles(req.user!.id);
    res.status(200).json(ApiResponse.success(vehicles, 'Vehicles fetched', req.requestId));
  });

  updateVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.success(vehicle, 'Vehicle updated', req.requestId));
  });

  deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
    await vehicleService.deleteVehicle(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'Vehicle removed', req.requestId));
  });

  setDefault = asyncHandler(async (req: Request, res: Response) => {
    await vehicleService.setDefault(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'Default vehicle updated', req.requestId));
  });
}

export const vehicleController = new VehicleController();
