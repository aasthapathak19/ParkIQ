import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, ParkingSquare, CalendarCheck,
  TrendingUp, IndianRupee, Car, Plus, ArrowRight, Camera, Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge, statusVariant, Skeleton } from '@/components/ui/index';
import { analyticsApi, parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OwnerDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.ownerAnalytics,
    queryFn: () => analyticsApi.getOwnerStats().then((r) => r.data.data as {
      summary: { totalRevenue: number; totalBookings: number; totalLots: number; byStatus: Record<string, number> };
      slotStats: Array<{ name: string; totalSlots: number; occupancyRate: number }>;
      revenueTimeline: Array<{ _id: string; revenue: number; bookings: number }>;
    }),
  });

  const { data: lotsData, isLoading: lotsLoading } = useQuery({
    queryKey: queryKeys.myLots,
    queryFn: () => parkingApi.getMyLots().then((r) => r.data.data),
  });

  const summary = analyticsData?.summary;
  const lots = lotsData ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
            <p className="text-sm text-neutral-400">Monitor your parking business</p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate('/owner/lots/create')}>Add Lot</Button>
        </div>

        {/* Stats */}
        {analyticsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={`₹${(summary?.totalRevenue ?? 0).toLocaleString()}`} icon={<IndianRupee className="w-5 h-5" />} color="green" change="This month" />
            <StatCard title="Total Bookings" value={summary?.totalBookings ?? 0} icon={<CalendarCheck className="w-5 h-5" />} color="blue" />
            <StatCard title="My Lots" value={summary?.totalLots ?? 0} icon={<ParkingSquare className="w-5 h-5" />} color="purple" />
            <StatCard title="Confirmed" value={summary?.byStatus?.confirmed ?? 0} icon={<Car className="w-5 h-5" />} color="yellow" />
          </div>
        )}



        {/* Lot Occupancy */}
        {analyticsData?.slotStats && analyticsData.slotStats.length > 0 && (
          <Card className="!bg-dark-800">
            <h3 className="font-semibold text-white mb-4">Lot Occupancy</h3>
            <div className="space-y-4">
              {analyticsData.slotStats.map((lot) => (
                <div key={lot.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-neutral-300">{lot.name}</span>
                    <span className="text-xs text-neutral-500">{lot.occupancyRate.toFixed(0)}% · {lot.totalSlots} slots</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${lot.occupancyRate}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Revenue Timeline */}
        {analyticsData?.revenueTimeline && analyticsData.revenueTimeline.length > 0 && (
          <Card className="!bg-dark-800">
            <h3 className="font-semibold text-white mb-4">Revenue Trends (Last 30 Days)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.revenueTimeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="_id" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#262626', borderColor: '#404040', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Recent Lots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">My Parking Lots</h3>
            <button onClick={() => navigate('/owner/lots')} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {lotsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-2">
              {lots.slice(0, 5).map((lot) => (
                <div key={lot._id} className="glass rounded-xl px-5 py-3 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{lot.name}</p>
                    <p className="text-xs text-neutral-500">{lot.address.city} · {lot.capacity.available}/{lot.capacity.total} available</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
                    <button onClick={() => navigate(`/owner/lots/${lot._id}`)} className="text-xs text-neutral-400 hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboardPage;
