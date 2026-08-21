import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { parsePaginationParams } from '../../utils/pagination.utils';

export class NotificationController {
  getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
    const options = parsePaginationParams(req.query as Record<string, string>);
    const result = await notificationService.getMyNotifications(req.user!.id, options);
    res.status(200).json(ApiResponse.paginated(result.data, result.pagination, 'Notifications', req.requestId));
  });

  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.status(200).json(ApiResponse.success({ count }, 'Unread count', req.requestId));
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'Marked as read', req.requestId));
  });

  markAllRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'All notifications marked as read', req.requestId));
  });

  deleteNotification = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.delete(req.params.id, req.user!.id);
    res.status(200).json(ApiResponse.success(null, 'Notification deleted', req.requestId));
  });
}

export const notificationController = new NotificationController();
