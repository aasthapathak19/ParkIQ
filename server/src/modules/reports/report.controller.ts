import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { reportService } from './report.service';

class ReportController {
  // Customer: Create report
  create = asyncHandler(async (req: Request, res: Response) => {
    const { reason, description } = req.body;
    const data = await reportService.createReport(req.params.parkingId, req.user!.id, reason, description);
    res.status(201).json(ApiResponse.success(data, 'Report submitted', req.requestId));
  });

  // Admin: List all reports
  adminListAll = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', status, parkingId } = req.query as Record<string, string>;
    const options = { page: Number(page), limit: Number(limit), sortBy: 'createdAt', sortOrder: 'desc' as const };
    const data = await reportService.listAll(options, { status: status as any, parkingId });
    res.json(ApiResponse.paginated(data.data, data.pagination, 'Reports retrieved', req.requestId));
  });

  // Admin: Resolve report
  adminResolve = asyncHandler(async (req: Request, res: Response) => {
    await reportService.resolve(req.params.id, req.user!.id, req.body.resolution ?? '');
    res.json(ApiResponse.success(null, 'Report resolved', req.requestId));
  });

  // Admin: Dismiss report
  adminDismiss = asyncHandler(async (req: Request, res: Response) => {
    await reportService.dismiss(req.params.id, req.user!.id, req.body.resolution ?? '');
    res.json(ApiResponse.success(null, 'Report dismissed', req.requestId));
  });
}

export const reportController = new ReportController();
