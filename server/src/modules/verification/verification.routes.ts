import { Router } from 'express';
import { verificationController } from './verification.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  SubmitVerificationSchema,
  AddEvidenceSchema,
  AdminApproveSchema,
  AdminRejectSchema,
  AdminRequestInfoSchema,
  AdminSuspendSchema,
  AdminReinstateSchema,
} from './verification.schema';

const router = Router();

// ─── Owner Routes ─────────────────────────────────────────────────────────────
router.get('/my', authenticate, authorize('owner'), verificationController.listMyVerifications);
router.get('/parking/:parkingId', authenticate, authorize('owner'), verificationController.getMyVerification);
router.put('/parking/:parkingId/type', authenticate, authorize('owner'), validate(SubmitVerificationSchema), verificationController.updateType);
router.post('/parking/:parkingId/submit', authenticate, authorize('owner'), verificationController.submit);
router.post('/parking/:parkingId/evidence', authenticate, authorize('owner'), validate(AddEvidenceSchema), verificationController.addEvidence);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
router.get('/admin', authenticate, authorize('admin'), verificationController.adminListAll);
router.get('/admin/audit', authenticate, authorize('admin'), verificationController.adminGetAudit);
router.get('/admin/evidence/:fileKey', authenticate, authorize('admin'), verificationController.adminGetEvidence);
router.get('/admin/:id', authenticate, authorize('admin'), verificationController.adminGetDetail);
router.post('/admin/:id/approve', authenticate, authorize('admin'), validate(AdminApproveSchema), verificationController.adminApprove);
router.post('/admin/:id/reject', authenticate, authorize('admin'), validate(AdminRejectSchema), verificationController.adminReject);
router.post('/admin/:id/request-info', authenticate, authorize('admin'), validate(AdminRequestInfoSchema), verificationController.adminRequestInfo);
router.post('/admin/parking/:parkingId/suspend', authenticate, authorize('admin'), validate(AdminSuspendSchema), verificationController.adminSuspend);
router.post('/admin/parking/:parkingId/reinstate', authenticate, authorize('admin'), validate(AdminReinstateSchema), verificationController.adminReinstate);

export default router;
