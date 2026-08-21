import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, ParkingSquare, CalendarCheck, IndianRupee, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/index';
import { analyticsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminAnalytics,
    queryFn: () => analyticsApi.getAdminStats().then((r) => r.data.data as {
      summary: {
        totalUsers: number; usersByRole: Record<string, number>;
        totalLots: number; lotsByStatus: Record<string, number>;
        totalRevenue: number; totalBookings: number;
      };
      revenueTimeline: Array<{ _id: string; revenue: number; bookings: number }>;
      topLots: Array<{ _id: string; name: string; revenue: number; bookings: number }>;
      userGrowth: Array<{ _id: string; count: number }>;
    }),
  });

  const s = data?.summary;
  const topLots = data?.topLots ?? [];
  const timeline = data?.revenueTimeline ?? [];
  const maxRevenue = Math.max(...timeline.map((t) => t.revenue), 1);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-neutral-400">Platform-wide analytics and overview</p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={(s?.totalUsers ?? 0).toLocaleString()} icon={<Users className="w-5 h-5" />} color="blue" change={`${s?.usersByRole?.customer ?? 0} customers`} changeType="neutral" />
            <StatCard title="Parking Lots" value={(s?.totalLots ?? 0).toLocaleString()} icon={<ParkingSquare className="w-5 h-5" />} color="purple" change={`${s?.lotsByStatus?.active ?? 0} active`} changeType="up" />
            <StatCard title="Total Revenue" value={`₹${(s?.totalRevenue ?? 0).toLocaleString()}`} icon={<IndianRupee className="w-5 h-5" />} color="green" />
            <StatCard title="Total Bookings" value={(s?.totalBookings ?? 0).toLocaleString()} icon={<CalendarCheck className="w-5 h-5" />} color="yellow" />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Timeline */}
          <div className="glass rounded-xl p-6 border border-white/5">
            <h3 className="font-semibold text-white mb-4">Platform Revenue (30 days)</h3>
            {isLoading ? <Skeleton className="h-48" /> : timeline.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No data yet</p>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                      dataKey="_id" 
                      stroke="#a3a3a3" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#a3a3a3" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `₹${value > 1000 ? (value/1000).toFixed(1) + 'k' : value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#262626', borderColor: '#404040', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6' }}
                      labelFormatter={(l) => new Date(l).toLocaleDateString()}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdminRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top Lots */}
          <div className="glass rounded-xl p-6 border border-white/5">
            <h3 className="font-semibold text-white mb-4">Top 5 Lots by Revenue</h3>
            {isLoading ? <Skeleton className="h-48" /> : topLots.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topLots.map((lot, i) => (
                  <div key={lot._id} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', color: i === 0 ? '#fbbf24' : '#9ca3af' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 truncate">{lot.name}</p>
                      <p className="text-xs text-neutral-500">{lot.bookings} bookings</p>
                    </div>
                    <span className="font-semibold text-emerald-400 text-sm shrink-0">₹{lot.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Breakdown */}
        {s?.usersByRole && (
          <div className="glass rounded-xl p-6 border border-white/5">
            <h3 className="font-semibold text-white mb-4">Users by Role</h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(s.usersByRole).map(([role, count]) => (
                <div key={role} className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-3xl font-bold gradient-text">{count}</p>
                  <p className="text-xs text-neutral-400 capitalize mt-1">{role}s</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
