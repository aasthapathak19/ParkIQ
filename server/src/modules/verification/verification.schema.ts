import { z } from 'zod';

export const SubmitVerificationSchema = z.object({
  verificationType: z.enum([
    'PROPERTY_OWNER', 'LEASE_HOLDER', 'AUTHORIZED_OPERATOR',
    'BUSINESS_OPERATOR', 'PROPERTY_MANAGER', 'OTHER',
  ]),
});

export const AddEvidenceSchema = z.object({
  evidenceType: z.string().min(2).max(100),
  description: z.string().max(500).optional().default(''),
  fileKey: z.string().min(1, 'fileKey is required'),
  mimeType: z.string().min(1, 'mimeType is required'),
});

export const AdminApproveSchema = z.object({
  verificationLevel: z.enum([
    'PARKIQ_VERIFIED', 'VERIFIED_OWNER', 'VERIFIED_OPERATOR',
    'LOCATION_VERIFIED', 'BASIC_VERIFIED',
  ]).optional(),
  reason: z.string().max(2000).optional(),
  adminNotes: z.string().max(5000).optional(),
});

export const AdminRejectSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(2000),
  adminNotes: z.string().max(5000).optional(),
});

export const AdminRequestInfoSchema = z.object({
  reason: z.string().min(10).max(2000),
  adminNotes: z.string().max(5000).optional(),
});

export const AdminSuspendSchema = z.object({
  reason: z.string().min(5).max(2000),
});

export const AdminReinstateSchema = z.object({
  reason: z.string().min(5).max(2000),
});

export const ListVerificationsQuerySchema = z.object({
  status: z.enum(['DRAFT','SUBMITTED','UNDER_REVIEW','MORE_INFO_REQUIRED','VERIFIED','REJECTED','SUSPENDED']).optional(),
  hasDuplicateWarning: z.string().transform(v => v === 'true').optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});
