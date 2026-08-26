import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { verificationService } from './verification.service';
import { VerificationStatus, VerificationType, VerificationLevel } from './verification.model';
import { auditService } from '../audit/audit.service';

class VerificationController {
  // ─── Owner: Get own verification status ─────────────────────────────────────
  getMyVerification = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const { parkingId } = req.params;
    const data = await verificationService.getForOwner(parkingId, ownerId);
    res.json(ApiResponse.success(data, 'Verification status retrieved', req.requestId));
  });

  // ─── Owner: Update verification type (before submit) ────────────────────────
  updateType = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const { parkingId } = req.params;
    const { verificationType } = req.body as { verificationType: VerificationType };
    const data = await verificationService.updateVerificationType(parkingId, ownerId, verificationType);
    res.json(ApiResponse.success(data, 'Verification type updated', req.requestId));
  });

  // ─── Owner: Submit for review ────────────────────────────────────────────────
  submit = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const { parkingId } = req.params;
    const data = await verificationService.submit(parkingId, ownerId);
    res.json(ApiResponse.success(data, 'Verification submitted for review', req.requestId));
  });

  // ─── Owner: Add evidence reference ──────────────────────────────────────────
  addEvidence = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.id;
    const { parkingId } = req.params;
    const { evidenceType, description, fileKey, mimeType } = req.body;
    const data = await verificationService.addEvidenceRef(parkingId, ownerId, {
      evidenceType, description: description ?? '', fileKey, mimeType,
    });
    res.json(ApiResponse.success(data, 'Evidence added', req.requestId));
  });

  // ─── Owner: List all own verifications ──────────────────────────────────────
  listMyVerifications = asyncHandler(async (req: Request, res: Response) => {
    const data = await verificationService.listForOwner(req.user!.id);
    res.json(ApiResponse.success(data, 'Verifications retrieved', req.requestId));
  });

  // ─── Admin: List all verifications ──────────────────────────────────────────
  adminListAll = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', status, hasDuplicateWarning } = req.query as Record<string, string>;
    const options = { page: Number(page), limit: Number(limit), sortBy: 'createdAt', sortOrder: 'desc' as const };
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status as VerificationStatus;
    if (hasDuplicateWarning === 'true') filter.hasDuplicateWarning = true;
    const data = await verificationService.listAll(options, filter as any);
    res.json(ApiResponse.paginated(data.data, data.pagination, 'Verifications retrieved', req.requestId));
  });

  // ─── Admin: Get single verification detail ───────────────────────────────────
  adminGetDetail = asyncHandler(async (req: Request, res: Response) => {
    const data = await verificationService.getDetailAdmin(req.params.id);
    res.json(ApiResponse.success(data, 'Verification detail retrieved', req.requestId));
  });

  // ─── Admin: Approve ──────────────────────────────────────────────────────────
  adminApprove = asyncHandler(async (req: Request, res: Response) => {
    const { verificationLevel, reason, adminNotes } = req.body;
    const data = await verificationService.approve(req.params.id, req.user!.id, {
      verificationLevel: verificationLevel as VerificationLevel,
      reason,
      adminNotes,
    });
    res.json(ApiResponse.success(data, 'Verification approved', req.requestId));
  });

  // ─── Admin: Reject ───────────────────────────────────────────────────────────
  adminReject = asyncHandler(async (req: Request, res: Response) => {
    const { reason, adminNotes } = req.body;
    const data = await verificationService.reject(req.params.id, req.user!.id, reason, adminNotes);
    res.json(ApiResponse.success(data, 'Verification rejected', req.requestId));
  });

  // ─── Admin: Request More Info ─────────────────────────────────────────────────
  adminRequestInfo = asyncHandler(async (req: Request, res: Response) => {
    const { reason, adminNotes } = req.body;
    const data = await verificationService.requestMoreInfo(req.params.id, req.user!.id, reason, adminNotes);
    res.json(ApiResponse.success(data, 'More information requested', req.requestId));
  });

  // ─── Admin: Suspend parking ──────────────────────────────────────────────────
  adminSuspend = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    await verificationService.suspend(req.params.parkingId, req.user!.id, reason);
    res.json(ApiResponse.success(null, 'Parking suspended', req.requestId));
  });

  // ─── Admin: Reinstate parking ─────────────────────────────────────────────────
  adminReinstate = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    await verificationService.reinstate(req.params.parkingId, req.user!.id, reason);
    res.json(ApiResponse.success(null, 'Parking reinstated', req.requestId));
  });

  // ─── Admin: Get signed evidence URL ─────────────────────────────────────────
  adminGetEvidence = asyncHandler(async (req: Request, res: Response) => {
    const url = await verificationService.getEvidenceUrl(req.params.fileKey);
    res.json(ApiResponse.success({ url }, 'Evidence URL generated', req.requestId));
  });

  // ─── Admin: Audit log for entity ─────────────────────────────────────────────
  adminGetAudit = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', action, entityType } = req.query as Record<string, string>;
    const options = { page: Number(page), limit: Number(limit), sortBy: 'createdAt', sortOrder: 'desc' as const };
    const data = await auditService.listAll(options, { action, entityType });
    res.json(ApiResponse.paginated(data.data, data.pagination, 'Audit logs retrieved', req.requestId));
  });
}

export const verificationController = new VerificationController();
