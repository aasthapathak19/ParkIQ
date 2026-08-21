import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class AnalyticsController {
  getOwnerStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await analyticsService.getOwnerStats(req.user!.id);
    res.status(200).json(ApiResponse.success(stats, 'Owner analytics', req.requestId));
  });

  getAdminStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await analyticsService.getAdminStats();
    res.status(200).json(ApiResponse.success(stats, 'Admin analytics', req.requestId));
  });
}

export const analyticsController = new AnalyticsController();
