import { Request, Response } from 'express';
import { userRepository } from './user.repository';
import { authService } from '../auth/auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { parsePaginationParams } from '../../utils/pagination.utils';
import { buildPaginatedResult } from '../../utils/pagination.utils';

export class UserController {
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.id);
    res.status(200).json(ApiResponse.success(
      user ? authService.toResponseDto(user) : null,
      'Profile fetched',
      req.requestId,
    ));
  });

  updateMe = asyncHandler(async (req: Request, res: Response) => {
    const updated = await userRepository.updateById(req.user!.id, req.body);
    res.status(200).json(ApiResponse.success(
      updated ? authService.toResponseDto(updated) : null,
      'Profile updated',
      req.requestId,
    ));
  });

  deleteMe = asyncHandler(async (req: Request, res: Response) => {
    await userRepository.softDelete(req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'Account deleted', req.requestId));
  });

  // Admin endpoints
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const options = parsePaginationParams(req.query as Record<string, string>);
    const { role, isActive } = req.query as { role?: string; isActive?: string };

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const { data, total } = await userRepository.findAll(filter, options);
    const result = buildPaginatedResult(data, total, options);
    res.status(200).json(
      ApiResponse.paginated(result.data.map((u) => authService.toResponseDto(u)), result.pagination, 'Users', req.requestId),
    );
  });

  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, isSuspended, suspensionReason } = req.body;
    const updated = await userRepository.updateById(req.params.id, {
      isActive,
      isSuspended,
      suspensionReason,
    });
    res.status(200).json(ApiResponse.success(
      updated ? authService.toResponseDto(updated) : null,
      'User status updated',
      req.requestId,
    ));
  });
}

export const userController = new UserController();
