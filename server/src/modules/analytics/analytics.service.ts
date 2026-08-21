import mongoose from 'mongoose';
import { BookingModel } from '../bookings/booking.model';
import { ParkingLotModel } from '../parking/parking.model';
import { UserModel } from '../users/user.model';

export class AnalyticsService {
  // ─── Owner Analytics ──────────────────────────────────────────────────────
  async getOwnerStats(ownerId: string) {
    const redisClient = require('../../infrastructure/redis/RedisClient').redisClient;
    const cache = await redisClient.get(`analytics:owner:${ownerId}`);
    if (cache) return JSON.parse(cache);

    const stats = await this.computeOwnerStats(ownerId);
    
    // Enqueue background job to compute stats
    const bullMQService = require('../../infrastructure/jobs/BullMQService').bullMQService;
    bullMQService.enqueue('analytics-queue', 'precompute_owner_stats', { ownerId }).catch(() => {});
    
    return stats;
  }

  async computeOwnerStats(ownerId: string) {
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Get all lot IDs for this owner
    const lots = await ParkingLotModel.find({ owner: ownerObjectId, deletedAt: null }).lean();
    const lotIds = lots.map((l) => l._id);

    // Revenue + booking counts grouped by status
    const bookingStats = await BookingModel.aggregate([
      { $match: { 'parkingLot.lotId': { $in: lotIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$amount.total' },
        },
      },
    ]);

    // Revenue over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const revenueTimeline = await BookingModel.aggregate([
      {
        $match: {
          'parkingLot.lotId': { $in: lotIds },
          status: { $in: ['completed', 'active'] },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount.total' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Slot occupancy per lot
    const slotStats = await ParkingLotModel.aggregate([
      { $match: { _id: { $in: lotIds } } },
      {
        $project: {
          name: 1,
          totalSlots: '$capacity.total',
          availableSlots: '$capacity.available',
          occupancyRate: {
            $cond: [
              { $gt: ['$capacity.total', 0] },
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$capacity.total', '$capacity.available'] }, '$capacity.total'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Summarize totals
    let totalRevenue = 0;
    let totalBookings = 0;
    const byStatus: Record<string, number> = {};
    for (const s of bookingStats) {
      byStatus[s._id] = s.count;
      totalBookings += s.count;
      if (['completed', 'active'].includes(s._id)) totalRevenue += s.revenue;
    }

    return {
      summary: {
        totalRevenue,
        totalBookings,
        totalLots: lots.length,
        byStatus,
      },
      revenueTimeline,
      slotStats,
      lots: lots.map((l) => ({ id: l._id, name: l.name, status: l.status })),
    };
  }

  // ─── Admin Analytics ──────────────────────────────────────────────────────
  async getAdminStats() {
    const redisClient = require('../../infrastructure/redis/RedisClient').redisClient;
    const cache = await redisClient.get('analytics:admin');
    if (cache) return JSON.parse(cache);

    const stats = await this.computeAdminStats();
    
    // Enqueue background job
    const bullMQService = require('../../infrastructure/jobs/BullMQService').bullMQService;
    bullMQService.enqueue('analytics-queue', 'precompute_admin_stats', {}).catch(() => {});
    
    return stats;
  }

  async computeAdminStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [userCount, lotCount, bookingStats, revenueTimeline, topLots, userGrowth] = await Promise.all([
      // Total users by role
      UserModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),

      // Parking lots by status
      ParkingLotModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Booking stats
      BookingModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$amount.total' } } },
      ]),

      // Revenue timeline
      BookingModel.aggregate([
        { $match: { status: { $in: ['completed', 'active'] }, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount.total' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 lots by revenue
      BookingModel.aggregate([
        { $match: { status: { $in: ['completed', 'active'] } } },
        {
          $group: {
            _id: '$parkingLot.lotId',
            name: { $first: '$parkingLot.name' },
            revenue: { $sum: '$amount.total' },
            bookings: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),

      // New users per day (last 30 days)
      UserModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const usersByRole: Record<string, number> = {};
    for (const u of userCount) usersByRole[u._id] = u.count;

    const lotsByStatus: Record<string, number> = {};
    for (const l of lotCount) lotsByStatus[l._id] = l.count;

    let totalRevenue = 0;
    let totalBookings = 0;
    const bookingsByStatus: Record<string, number> = {};
    for (const b of bookingStats) {
      bookingsByStatus[b._id] = b.count;
      totalBookings += b.count;
      if (['completed', 'active'].includes(b._id)) totalRevenue += b.revenue;
    }

    return {
      summary: {
        totalUsers: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        usersByRole,
        totalLots: Object.values(lotsByStatus).reduce((a, b) => a + b, 0),
        lotsByStatus,
        totalRevenue,
        totalBookings,
        bookingsByStatus,
      },
      revenueTimeline,
      topLots,
      userGrowth,
    };
  }
}

export const analyticsService = new AnalyticsService();
