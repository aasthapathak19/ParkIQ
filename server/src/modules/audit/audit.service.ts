import { AuditLogModel, AuditAction, AuditEntityType } from './audit.model';
import { PaginationOptions } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';
import { logger } from '../../config/logger';
import mongoose from 'mongoose';

interface CreateAuditParams {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Fire-and-forget audit log creation.
   * Failures are logged but never thrown — audit must not break business flows.
   */
  async log(params: CreateAuditParams): Promise<void> {
    try {
      await AuditLogModel.create({
        actorId: new mongoose.Types.ObjectId(params.actorId),
        action: params.action,
        entityType: params.entityType,
        entityId: new mongoose.Types.ObjectId(params.entityId),
        reason: params.reason,
        metadata: params.metadata,
      });
    } catch (err) {
      logger.error({ err, params }, 'AuditService.log failed — non-fatal');
    }
  }

  async listForEntity(
    entityId: string,
    entityType: AuditEntityType,
    options: PaginationOptions,
  ) {
    const query = {
      entityId: new mongoose.Types.ObjectId(entityId),
      entityType,
    };
    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .populate('actorId', 'name email role')
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);
    return buildPaginatedResult(data, total, options);
  }

  async listAll(options: PaginationOptions, filter?: { action?: string; entityType?: string }) {
    const query: Record<string, unknown> = {};
    if (filter?.action) query.action = filter.action;
    if (filter?.entityType) query.entityType = filter.entityType;

    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .populate('actorId', 'name email role')
        .lean(),
      AuditLogModel.countDocuments(query),
    ]);
    return buildPaginatedResult(data, total, options);
  }
}

export const auditService = new AuditService();
