import { Router } from 'express';
import { claimController } from './claim.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Owner/Customer — submit a claim
router.post('/parking/:parkingId', authenticate, authorize('owner', 'customer'), claimController.create);
router.get('/my', authenticate, claimController.getMyClaims);

// Admin
router.get('/admin', authenticate, authorize('admin'), claimController.adminListAll);
router.post('/admin/:id/approve', authenticate, authorize('admin'), claimController.adminApprove);
router.post('/admin/:id/reject', authenticate, authorize('admin'), claimController.adminReject);

export default router;
