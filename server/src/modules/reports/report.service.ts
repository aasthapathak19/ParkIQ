import mongoose from 'mongoose';
import { ParkingReportModel, IParkingReport, ReportReason, ReportStatus } from './report.model';
import { ParkingLotModel } from '../parking/parking.model';
import { auditService } from '../audit/audit.service';
import { eventBus } from '../../domain/events/EventBus';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { NotFoundError, ConflictError } from '../../domain/errors';
import { PaginationOptions } from '../../types/common.types';
import { buildPaginatedResult } from '../../utils/pagination.utils';

class ReportResolvedEvent extends DomainEvent {
  constructor(public readonly payload: { reportId: string; reportedBy: string; resolution: string }) {
    super('ReportResolved');
  }
}

const REPORTS_BEFORE_AUTO_REVIEW = 5; // Flag for review after this many reports

export class ReportService {
  async createReport(
    parkingId: string,
    reportedBy: string,
    reason: ReportReason,
    description?: string,
  ): Promise<IParkingReport> {
    const lot = await ParkingLotModel.findById(parkingId).lean();
    if (!lot) throw new NotFoundError('ParkingLot', parkingId);

    // Prevent spam: one active report per user per parking
    const existing = await ParkingReportModel.findOne({
      parkingId: new mongoose.Types.ObjectId(parkingId),
      reportedBy: new mongoose.Types.ObjectId(reportedBy),
      status: { $in: ['OPEN', 'UNDER_REVIEW'] },
    }).lean();
    if (existing) throw new ConflictError('You already have an active report for this parking');

    const report = await ParkingReportModel.create({
      parkingId: new mongoose.Types.ObjectId(parkingId),
      reportedBy: new mongoose.Types.ObjectId(reportedBy),
      reason,
      description,
    });

    await auditService.log({
      actorId: reportedBy,
      action: 'REPORT_CREATED',
      entityType: 'ParkingReport',
      entityId: report._id.toString(),
      metadata: { reason, parkingId },
    });

    // Auto-escalate if high report count (deterministic, not AI)
    const openReportCount = await ParkingReportModel.countDocuments({
      parkingId: new mongoose.Types.ObjectId(parkingId),
      status: { $in: ['OPEN', 'UNDER_REVIEW'] },
    });
    if (openReportCount >= REPORTS_BEFORE_AUTO_REVIEW) {
      // Update status to UNDER_REVIEW — do NOT auto-suspend
      await ParkingReportModel.updateMany(
        { parkingId: new mongoose.Types.ObjectId(parkingId), status: 'OPEN' },
        { $set: { status: 'UNDER_REVIEW' } },
      );
    }

    return report;
  }

  async listAll(options: PaginationOptions, filter: { status?: ReportStatus; parkingId?: string } = {}) {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.parkingId) query.parkingId = new mongoose.Types.ObjectId(filter.parkingId);

    const skip = (options.page - 1) * options.limit;
    const [data, total] = await Promise.all([
      ParkingReportModel.find(query)
        .populate('parkingId', 'name address status verificationStatus')
        .populate('reportedBy', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .lean(),
      ParkingReportModel.countDocuments(query),
    ]);
    return buildPaginatedResult(data, total, options);
  }

  async resolve(reportId: string, adminId: string, resolution: string) {
    const report = await ParkingReportModel.findById(reportId).lean();
    if (!report) throw new NotFoundError('ParkingReport', reportId);
    if (!resolution?.trim()) throw new ConflictError('A resolution reason is required');

    await ParkingReportModel.findByIdAndUpdate(reportId, {
      $set: {
        status: 'RESOLVED',
        resolution,
        resolvedBy: new mongoose.Types.ObjectId(adminId),
      },
    });

    await auditService.log({
      actorId: adminId,
      action: 'REPORT_RESOLVED',
      entityType: 'ParkingReport',
      entityId: reportId,
      reason: resolution,
    });

    await eventBus.publish(new ReportResolvedEvent({
      reportId,
      reportedBy: report.reportedBy.toString(),
      resolution,
    }));
  }

  async dismiss(reportId: string, adminId: string, resolution: string) {
    const report = await ParkingReportModel.findById(reportId).lean();
    if (!report) throw new NotFoundError('ParkingReport', reportId);

    await ParkingReportModel.findByIdAndUpdate(reportId, {
      $set: {
        status: 'DISMISSED',
        resolution,
        resolvedBy: new mongoose.Types.ObjectId(adminId),
      },
    });

    await auditService.log({
      actorId: adminId,
      action: 'REPORT_DISMISSED',
      entityType: 'ParkingReport',
      entityId: reportId,
      reason: resolution,
    });
  }
}

export const reportService = new ReportService();
