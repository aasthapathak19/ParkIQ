import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { claimService } from './claim.service';

class ClaimController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const { parkingId } = req.params;
    const { claimReason } = req.body;
    const data = await claimService.createClaim(parkingId, req.user!.id, claimReason);
    res.status(201).json(ApiResponse.success(data, 'Claim submitted for admin review', req.requestId));
  });

  getMyClaims = asyncHandler(async (req: Request, res: Response) => {
    const data = await claimService.getMyClaims(req.user!.id);
    res.json(ApiResponse.success(data, 'Your claims retrieved', req.requestId));
  });

  adminListAll = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const options = { page: Number(page), limit: Number(limit), sortBy: 'createdAt', sortOrder: 'desc' as const };
    const data = await claimService.listAll(options, { status: status as any });
    res.json(ApiResponse.paginated(data.data, data.pagination, 'Claims retrieved', req.requestId));
  });

  adminApprove = asyncHandler(async (req: Request, res: Response) => {
    await claimService.approve(req.params.id, req.user!.id, req.body.reason ?? '');
    res.json(ApiResponse.success(null, 'Claim approved', req.requestId));
  });

  adminReject = asyncHandler(async (req: Request, res: Response) => {
    await claimService.reject(req.params.id, req.user!.id, req.body.reason ?? '');
    res.json(ApiResponse.success(null, 'Claim rejected', req.requestId));
  });
}

export const claimController = new ClaimController();
