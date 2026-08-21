import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, MapPin, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, Skeleton, EmptyState } from '@/components/ui/index';
import { Select } from '@/components/ui/Input';
import { bookingsApi, parkingApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { IBooking } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/stores/uiStore';

const OwnerBookingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const lotId = searchParams.get('lotId') ?? '';
  const [selectedLot, setSelectedLot] = useState(lotId);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const toast = useToast();
  const qc = useQueryClient();

  const { data: lotsData } = useQuery({
    queryKey: queryKeys.myLots,
    queryFn: () => parkingApi.getMyLots().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ownerBookings(selectedLot, { status: statusFilter || undefined, page }),
    queryFn: () => bookingsApi.getOwnerBookings(selectedLot, { status: statusFilter || undefined, page }).then((r) => r.data.data),
    enabled: !!selectedLot,
    placeholderData: (prev) => prev,
  });

  const { mutate: checkIn } = useMutation({
    mutationFn: (id: string) => bookingsApi.checkIn(id),
    onSuccess: () => { toast.success('Check-in done!'); qc.invalidateQueries({ queryKey: queryKeys.ownerBookings(selectedLot, {}) }); },
  });

  const { mutate: checkOut } = useMutation({
    mutationFn: (id: string) => bookingsApi.checkOut(id),
    onSuccess: () => { toast.success('Check-out done!'); qc.invalidateQueries({ queryKey: queryKeys.ownerBookings(selectedLot, {}) }); },
  });

  const lots = lotsData ?? [];
  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Owner Bookings</h1>
          <p className="text-sm text-neutral-400">Manage check-ins and check-outs</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select
            options={[
              { value: '', label: 'Select a lot' },
              ...lots.map((l) => ({ value: l._id, label: l.name })),
            ]}
            value={selectedLot}
            onChange={(e) => { setSelectedLot(e.target.value); setPage(1); }}
            className="flex-1 min-w-40"
          />
          <Select
            options={[
              { value: '', label: 'All statuses' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-44"
          />
        </div>

        {!selectedLot ? (
          <EmptyState icon={<CalendarCheck className="w-16 h-16" />} title="Select a lot" description="Choose a parking lot to see its bookings." />
        ) : isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={<CalendarCheck className="w-16 h-16" />} title="No bookings" description="No bookings match your filter." />
        ) : (
          <div className="space-y-2">
            {bookings.map((booking, i) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl p-4 border border-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-white">{booking.vehicle.brand} {booking.vehicle.model}</p>
                      <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono mb-1">{booking.vehicle.licensePlate} · Slot {booking.slot.slotNumber}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →
                        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>₹{booking.amount.total}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {booking.status === 'confirmed' && (
                      <Button size="sm" leftIcon={<Check className="w-3.5 h-3.5" />} onClick={() => checkIn(booking._id)}>Check In</Button>
                    )}
                    {booking.status === 'active' && (
                      <Button size="sm" variant="secondary" leftIcon={<X className="w-3.5 h-3.5" />} onClick={() => checkOut(booking._id)}>Check Out</Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="secondary" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="text-sm text-neutral-400 self-center">{pagination.page}/{pagination.totalPages}</span>
                <Button variant="secondary" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OwnerBookingsPage;
