import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();
router.use(authenticate);

router.get('/owner', authorize('owner'), analyticsController.getOwnerStats);
router.get('/admin', authorize('admin'), analyticsController.getAdminStats);

export default router;
