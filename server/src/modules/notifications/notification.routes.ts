import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
