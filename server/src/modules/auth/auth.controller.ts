import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(ApiResponse.success(result, 'Account created successfully', req.requestId));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? '';
    const result = await authService.login(req.body, ip, userAgent);
    res.status(200).json(ApiResponse.success(result, 'Login successful', req.requestId));
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1];
    
    await authService.logout(req.user!.id, refreshToken, accessToken);
    res.status(200).json(ApiResponse.success(null, 'Logged out successfully', req.requestId));
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'All sessions terminated', req.requestId));
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip ?? 'unknown';
    const tokens = await authService.refreshTokens(req.body.refreshToken, ip);
    res.status(200).json(ApiResponse.success(tokens, 'Token refreshed', req.requestId));
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.status(200).json(
      ApiResponse.success(null, 'If this email exists, a reset link has been sent', req.requestId),
    );
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json(ApiResponse.success(null, 'Password reset successfully', req.requestId));
  });
}

export const authController = new AuthController();
