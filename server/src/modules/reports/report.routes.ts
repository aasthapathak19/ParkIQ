import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Customer: report a parking
router.post('/parking/:parkingId', authenticate, authorize('customer', 'owner'), reportController.create);

// Admin
router.get('/admin', authenticate, authorize('admin'), reportController.adminListAll);
router.post('/admin/:id/resolve', authenticate, authorize('admin'), reportController.adminResolve);
router.post('/admin/:id/dismiss', authenticate, authorize('admin'), reportController.adminDismiss);

export default router;
