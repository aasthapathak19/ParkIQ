import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin, Star, Car, Clock, IndianRupee, Heart, HeartOff,
  Shield, Zap, Accessibility, ChevronRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  cctv: 'ðŸ“·', covered: 'ðŸ ', ev_charging: 'âš¡', handicapped: 'â™¿',
  '24x7': 'ðŸ•', valet: 'ðŸ‘¨â€âœˆï¸', washroom: 'ðŸš»', security: 'ðŸ‘®',
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
  const [step, setStep] = useState(1);
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
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details & Slots */}
          <div className="lg:col-span-2 space-y-6">
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
            </div>
          </div>
        </motion.div>
            <div className="glass rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-white text-lg">Select a Spot</h3>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" /> Available</span>
                  <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" /> Occupied</span>
                </div>
              </div>
              
              {slots.length === 0 ? (
                <p className="text-sm text-neutral-500">No slots configured for this lot.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {slots.map((slot) => {
                    const colors = {
                      available: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
                      occupied: 'bg-red-500/10 border-red-500/30 text-red-400 opacity-50',
                      reserved: 'bg-amber-500/10 border-amber-500/30 text-amber-400 opacity-50',
                      maintenance: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-400 opacity-50',
                      inactive: 'bg-neutral-800 border-neutral-700 text-neutral-600',
                    };
                    return (
                      <button
                        key={slot._id}
                        title={`${slot.slotNumber} - ${slot.status}`}
                        onClick={() => slot.status === 'available' && setSelectedSlot(slot)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                          ${colors[slot.status] ?? colors.inactive} 
                          ${slot.status === 'available' ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-not-allowed'} 
                          ${selectedSlot?._id === slot._id ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0a0f1e] bg-emerald-500/30' : ''}`}
                      >
                        <Car className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-bold">{slot.slotNumber}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
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
            
            {/* Booking Summary Widget */}
            <div className="glass rounded-xl p-6 border border-white/5 sticky top-20">
              <h3 className="text-lg font-bold text-white mb-4">Book Parking</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-neutral-400 text-sm">Selected Spot</span>
                  <span className="font-semibold text-white">{selectedSlot ? selectedSlot.slotNumber : 'None'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-neutral-400 text-sm">Base Rate</span>
                  <span className="font-semibold text-white">₹{lot.pricing.baseRate}/{lot.pricing.billingUnit}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-400 text-sm">Availability</span>
                  <span className="font-semibold text-emerald-400">{lot.capacity.available} left</span>
                </div>
              </div>

              {isAuthenticated && lot.status === 'active' ? (
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={() => {
                    if(!selectedSlot) {
                      toast.error('Please select a spot from the map first');
                      return;
                    }
                    setShowBookModal(true);
                    setStep(1);
                  }}
                >
                  Proceed to Book
                </Button>
              ) : !isAuthenticated ? (
                <Button className="w-full" size="lg" onClick={() => navigate('/login')}>Sign in to Book</Button>
              ) : (
                <Button className="w-full" size="lg" disabled>Currently Unavailable</Button>
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal (Wizard) */}
        <Modal open={showBookModal} onClose={() => setShowBookModal(false)} title="Complete Booking" size="lg">
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-4 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 -z-10 rounded-full" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-300 rounded-full -z-10" style={{ width: step === 1 ? '50%' : '100%' }} />
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>1</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>2</div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h4 className="text-white font-medium">Vehicle Details</h4>
                  <Select
                    label="Select your vehicle"
                    options={[
                      { value: '', label: 'Choose a saved vehicle' },
                      ...vehicles.map((v) => ({ value: v._id, label: `${v.brand} ${v.model} (${v.licensePlate})` })),
                    ]}
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                  />
                  <Button className="w-full mt-4" onClick={() => setStep(2)} disabled={!selectedVehicle}>Next Step</Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <h4 className="text-white font-medium">Time & Duration</h4>
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
                    <div className="rounded-xl p-4 flex items-center justify-between mt-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <div>
                        <p className="text-sm text-neutral-400">Estimated Total</p>
                        <p className="text-xs text-neutral-500">Includes all applicable taxes</p>
                      </div>
                      <span className="font-bold text-emerald-400 text-2xl">₹{priceEstimate.total}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button
                      className="flex-1"
                      loading={isBooking}
                      disabled={!startTime || !endTime}
                      onClick={() => book()}
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default ParkingDetailPage;

