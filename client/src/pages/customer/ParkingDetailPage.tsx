import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Star, Car, Clock, IndianRupee, Heart, HeartOff,
  Shield, Zap, Accessibility, ChevronRight, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, Skeleton } from '@/components/ui/index';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { parkingApi, slotsApi, vehiclesApi, bookingsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/uiStore';
import { ISlot } from '@/types';
import { useSocket } from '@/contexts/SocketContext';
import { useEffect } from 'react';

const amenityIcon: Record<string, string> = {
  cctv: '📷', covered: '🏠', ev_charging: '⚡', handicapped: '♿',
  '24x7': '🕐', valet: '👨‍✈️', washroom: '🚻', security: '👮',
};

const ParkingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();
  const qc = useQueryClient();

  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ISlot | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priceEstimate, setPriceEstimate] = useState<{ total?: number; currency?: string } | null>(null);

  const { data: lotData, isLoading } = useQuery({
    queryKey: queryKeys.parkingLot(id!),
    queryFn: () => parkingApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: slotsData } = useQuery({
    queryKey: queryKeys.slots(id!),
    queryFn: () => slotsApi.getByLot(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: () => vehiclesApi.getAll().then((r) => r.data.data),
    enabled: isAuthenticated,
  });

  const { mutate: addFav } = useMutation({
    mutationFn: () => parkingApi.addFavourite(id!),
    onSuccess: () => { toast.success('Added to favourites'); qc.invalidateQueries({ queryKey: queryKeys.favourites }); },
  });

  const { mutate: book, isPending: isBooking } = useMutation({
    mutationFn: () => bookingsApi.create({
      vehicleId: selectedVehicle,
      parkingLotId: id!,
      slotId: selectedSlot!._id,
      startTime,
      endTime,
    }).then((r) => r.data.data),
    onSuccess: (booking) => {
      toast.success('Booking confirmed!');
      navigate(`/bookings/${booking._id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Booking failed';
      toast.error(msg);
    },
  });

  const getEstimate = async () => {
    if (!startTime || !endTime) return;
    try {
      const r = await bookingsApi.getPriceEstimate({ lotId: id!, startTime, endTime });
      setPriceEstimate(r.data.data as { total?: number; currency?: string });
    } catch { /* ignore */ }
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !id) return;

    const handleSlotUpdate = (data: { lotId: string; slotId: string; status: string }) => {
      if (data.lotId === id) {
        // Invalidate slots query so it refetches the latest slots
        qc.invalidateQueries({ queryKey: queryKeys.slots(id) });
      }
    };

    socket.on('slot:updated', handleSlotUpdate);
    return () => {
      socket.off('slot:updated', handleSlotUpdate);
    };
  }, [socket, id, qc]);

  const lot = lotData;
  const slots = slotsData ?? [];
  const vehicles = vehiclesData ?? [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lot) return <DashboardLayout><div className="text-center py-20 text-neutral-400">Parking lot not found.</div></DashboardLayout>;

  const availableSlots = slots.filter((s) => s.status === 'available');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{lot.name}</h1>
                <Badge variant={statusVariant(lot.status)}>{lot.status}</Badge>
              </div>
              <p className="text-sm text-neutral-400 flex items-center gap-1 mb-3">
                <MapPin className="w-4 h-4 text-emerald-400" />
                {lot.address.formattedAddress ?? `${lot.address.street}, ${lot.address.city}`}
              </p>
              {lot.rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(lot.rating!.average) ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'}`} />
                  ))}
                  <span className="text-sm text-amber-400 ml-1">{lot.rating.average.toFixed(1)}</span>
                  <span className="text-xs text-neutral-500">({lot.rating.count} reviews)</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => addFav()} className="p-2 rounded-lg btn-secondary">
                <Heart className="w-5 h-5 text-neutral-400" />
              </button>
              {isAuthenticated && lot.status === 'active' && availableSlots.length > 0 && (
                <Button leftIcon={<Calendar className="w-4 h-4" />} onClick={() => setShowBookModal(true)}>
                  Book Now
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <Car className="w-5 h-5 text-emerald-400" />, label: 'Available', value: `${lot.capacity.available}/${lot.capacity.total}` },
            { icon: <IndianRupee className="w-5 h-5 text-indigo-400" />, label: 'Base Rate', value: `₹${lot.pricing.baseRate}/${lot.pricing.billingUnit}` },
            { icon: <Clock className="w-5 h-5 text-amber-400" />, label: 'Open', value: '24 × 7' },
            { icon: <Shield className="w-5 h-5 text-purple-400" />, label: 'Security', value: 'CCTV' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 border border-white/5 text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-xs text-neutral-500 mb-0.5">{stat.label}</p>
              <p className="text-sm font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Amenities */}
        {lot.amenities.length > 0 && (
          <div className="glass rounded-xl p-5 border border-white/5">
            <h3 className="font-semibold text-white mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {lot.amenities.map((a) => (
                <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#e5e7eb' }}>
                  {amenityIcon[a] ?? '✓'} {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Slots */}
        <div className="glass rounded-xl p-5 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Slot Overview</h3>
          {slots.length === 0 ? (
            <p className="text-sm text-neutral-500">No slots configured for this lot.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const colors = {
                  available: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
                  occupied: 'bg-red-500/20 border-red-500/30 text-red-400',
                  reserved: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
                  maintenance: 'bg-neutral-500/20 border-neutral-500/30 text-neutral-400',
                  inactive: 'bg-neutral-800 border-neutral-700 text-neutral-600',
                };
                return (
                  <button
                    key={slot._id}
                    title={`${slot.slotNumber} - ${slot.status}`}
                    onClick={() => slot.status === 'available' && setSelectedSlot(slot)}
                    className={`w-10 h-10 rounded-lg border text-xs font-semibold transition-all ${colors[slot.status] ?? colors.inactive} ${slot.status === 'available' ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'} ${selectedSlot?._id === slot._id ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-dark-900' : ''}`}
                  >
                    {slot.slotNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking Modal */}
        <Modal open={showBookModal} onClose={() => setShowBookModal(false)} title="Book a Slot" size="lg">
          <div className="space-y-4">
            {!selectedSlot ? (
              <p className="text-sm text-amber-400">⚠️ Please select an available slot from the slot map above first, then click Book Now.</p>
            ) : (
              <p className="text-sm text-emerald-400">✅ Selected: Slot {selectedSlot.slotNumber} (Floor {selectedSlot.floor})</p>
            )}

            <Select
              label="Vehicle"
              options={[
                { value: '', label: 'Select your vehicle' },
                ...vehicles.map((v) => ({ value: v._id, label: `${v.brand} ${v.model} · ${v.licensePlate}` })),
              ]}
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <Input
                label="End time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); getEstimate(); }}
                min={startTime || new Date().toISOString().slice(0, 16)}
              />
            </div>

            {priceEstimate?.total && (
              <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-sm text-neutral-300">Estimated Total</span>
                <span className="font-bold text-emerald-400 text-lg">₹{priceEstimate.total}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBookModal(false)}>Cancel</Button>
              <Button
                className="flex-1"
                loading={isBooking}
                disabled={!selectedSlot || !selectedVehicle || !startTime || !endTime}
                onClick={() => book()}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ParkingDetailPage;
