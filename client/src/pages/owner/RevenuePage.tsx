import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, CalendarCheck, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/index';
import { analyticsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

const RevenuePage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ownerAnalytics,
    queryFn: () => analyticsApi.getOwnerStats().then((r) => r.data.data as {
      summary: { totalRevenue: number; totalBookings: number; byStatus: Record<string, number> };
      revenueTimeline: Array<{ _id: string; revenue: number; bookings: number }>;
    }),
  });

  const summary = data?.summary;
  const timeline = data?.revenueTimeline ?? [];
  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 1);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-sm text-neutral-400">Your earnings over the last 30 days</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard title="Total Revenue" value={`₹${(summary?.totalRevenue ?? 0).toLocaleString()}`} icon={<IndianRupee className="w-5 h-5" />} color="green" />
            <StatCard title="Total Bookings" value={summary?.totalBookings ?? 0} icon={<CalendarCheck className="w-5 h-5" />} color="blue" />
            <StatCard title="Avg per Booking" value={`₹${summary?.totalBookings ? Math.round((summary.totalRevenue ?? 0) / summary.totalBookings) : 0}`} icon={<TrendingUp className="w-5 h-5" />} color="purple" />
          </div>
        )}

        {/* Revenue Chart */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Revenue Timeline (30 days)</h3>
            <BarChart2 className="w-5 h-5 text-neutral-500" />
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : timeline.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-neutral-500 text-sm">No revenue data yet</div>
          ) : (
            <div className="space-y-2">
              {timeline.map((day, i) => (
                <div key={day._id} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">{new Date(day._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 h-7 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                      transition={{ delay: i * 0.03, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 flex items-center justify-end pr-2"
                    >
                      {day.revenue > 0 && <span className="text-[10px] font-bold text-white">₹{day.revenue}</span>}
                    </motion.div>
                  </div>
                  <span className="text-xs text-neutral-500 w-10 text-right">{day.bookings}b</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking by status */}
        {summary?.byStatus && (
          <div className="glass rounded-xl p-6 border border-white/5">
            <h3 className="font-semibold text-white mb-4">Bookings by Status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(summary.byStatus).map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-neutral-500 capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RevenuePage;
