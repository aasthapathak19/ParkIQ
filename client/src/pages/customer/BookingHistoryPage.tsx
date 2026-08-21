import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, MapPin, QrCode, ChevronRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, Skeleton, EmptyState } from '@/components/ui/index';
import { bookingsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { IBooking } from '@/types';
import { Select } from '@/components/ui/Input';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.bookings({ status: statusFilter || undefined, page }),
    queryFn: () => bookingsApi.getMyBookings({ status: statusFilter || undefined, page, limit: 10 }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Bookings</h1>
            <p className="text-sm text-neutral-400">Track your parking history</p>
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-44"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-16 h-16" />}
            title="No bookings yet"
            description="Book your first parking spot and it will appear here."
            action={<Button onClick={() => navigate('/search')}>Find Parking</Button>}
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, i) => (
              <BookingCard key={booking._id} booking={booking} index={i} onClick={() => navigate(`/bookings/${booking._id}`)} />
            ))}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button variant="secondary" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-neutral-400">{pagination.page}/{pagination.totalPages}</span>
                <Button variant="secondary" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const BookingCard: React.FC<{ booking: IBooking; index: number; onClick: () => void }> = ({
  booking, index, onClick
}) => {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="glass rounded-xl p-5 border border-white/5 card-hover cursor-pointer group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">
              {booking.parkingLot.name}
            </p>
            <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
          </div>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" />{booking.parkingLot.address}
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {booking.vehicle.brand} {booking.vehicle.model} · {booking.vehicle.licensePlate} · Slot {booking.slot.slotNumber}
          </p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="font-bold text-emerald-400 text-sm">₹{booking.amount.total}</p>
          <p className="text-xs text-neutral-600 uppercase">{booking.bookingRef}</p>
          <ChevronRight className="w-4 h-4 text-neutral-600 mt-2 ml-auto" />
        </div>
      </div>
    </motion.div>
  );
};

export default BookingHistoryPage;
