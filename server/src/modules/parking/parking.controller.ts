import { Request, Response } from 'express';
import { parkingService } from './parking.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { parsePaginationParams } from '../../utils/pagination.utils';

export class ParkingController {
  createLot = asyncHandler(async (req: Request, res: Response) => {
    const lot = await parkingService.createLot(req.user!.id, req.body);
    res.status(201).json(ApiResponse.success(lot, 'Parking lot created and pending approval', req.requestId));
  });

  getLotById = asyncHandler(async (req: Request, res: Response) => {
    const lot = await parkingService.getLotById(req.params.id);
    res.status(200).json(ApiResponse.success(lot, 'Parking lot fetched', req.requestId));
  });

  getLotBySlug = asyncHandler(async (req: Request, res: Response) => {
    const lot = await parkingService.getLotBySlug(req.params.slug);
    res.status(200).json(ApiResponse.success(lot, 'Parking lot fetched', req.requestId));
  });

  search = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const options = parsePaginationParams(query);

    const filter = {
      city: query.city,
      lat: query.lat ? Number(query.lat) : undefined,
      lng: query.lng ? Number(query.lng) : undefined,
      radiusKm: query.radius ? Number(query.radius) : 10,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      isEV: query.ev === 'true',
      isCovered: query.covered === 'true',
      is24x7: query.open24x7 === 'true',
    };

    const result = await parkingService.search(filter, options);
    res.status(200).json(
      ApiResponse.paginated(result.data, result.pagination, 'Search results', req.requestId),
    );
  });

  getMyLots = asyncHandler(async (req: Request, res: Response) => {
    const options = parsePaginationParams(req.query as Record<string, string>);
    const result = await parkingService.getMyLots(req.user!.id, options);
    res.status(200).json(ApiResponse.paginated(result.data, result.pagination, 'My parking lots', req.requestId));
  });

  updateLot = asyncHandler(async (req: Request, res: Response) => {
    const lot = await parkingService.updateLot(req.params.id, req.user!.id, req.body);
    res.status(200).json(ApiResponse.success(lot, 'Parking lot updated', req.requestId));
  });

  deleteLot = asyncHandler(async (req: Request, res: Response) => {
    await parkingService.deleteLot(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'Parking lot deleted', req.requestId));
  });

  updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, rejectionReason } = req.body;
    const lot = await parkingService.updateStatus(req.params.id, status, req.user!.id, rejectionReason);
    res.status(200).json(ApiResponse.success(lot, `Parking lot ${status}`, req.requestId));
  });

  getPendingApprovals = asyncHandler(async (req: Request, res: Response) => {
    const options = parsePaginationParams(req.query as Record<string, string>);
    const result = await parkingService.getPendingApprovals(options);
    res.status(200).json(ApiResponse.paginated(result.data, result.pagination, 'Pending approvals', req.requestId));
  });

  toggleFavourite = asyncHandler(async (req: Request, res: Response) => {
    const result = await parkingService.toggleFavourite(req.user!.id, req.params.id);
    const message = result.added ? 'Added to favourites' : 'Removed from favourites';
    res.status(200).json(ApiResponse.success(result, message, req.requestId));
  });
}

export const parkingController = new ParkingController();
