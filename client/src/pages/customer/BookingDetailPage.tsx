import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, Car, QrCode, X, ArrowLeft, IndianRupee, Hash, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant, Skeleton } from '@/components/ui/index';
import { Modal } from '@/components/ui/Modal';
import { bookingsApi } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/stores/uiStore';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { CheckoutForm } from '@/components/payments/CheckoutForm';

const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [showQR, setShowQR] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.booking(id!),
    queryFn: () => bookingsApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { mutate: cancel, isPending: isCancelling } = useMutation({
    mutationFn: () => bookingsApi.cancel(id!, cancelReason),
    onSuccess: () => {
      toast.success('Booking cancelled.');
      qc.invalidateQueries({ queryKey: queryKeys.booking(id!) });
      setShowCancel(false);
    },
    onError: () => toast.error('Could not cancel booking.'),
  });

  const booking = data;

  if (isLoading) return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </DashboardLayout>
  );

  if (!booking) return <DashboardLayout><div className="text-center py-20 text-neutral-400">Booking not found.</div></DashboardLayout>;

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Animation Overlay (shows briefly on mount if confirmed) */}
        <AnimatePresence>
          {booking.status === 'confirmed' && (
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 0.9, transitionEnd: { display: 'none' } }}
              transition={{ duration: 1, delay: 1.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1e] pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="flex flex-col items-center"
              >
                <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-4" />
                <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back */}
        <button onClick={() => navigate('/bookings')} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to bookings
        </button>

        {/* Header */}
        <div className="glass rounded-xl p-6 border border-white/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">{booking.parkingLot.name}</h1>
              <p className="text-sm text-neutral-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />{booking.parkingLot.address}
              </p>
            </div>
            <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Detail icon={<Hash />} label="Ref" value={booking.bookingRef} />
            <Detail icon={<Clock />} label="Check-in" value={`${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
            <Detail icon={<Clock />} label="Check-out" value={`${end.toLocaleDateString()} ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`} />
            <Detail icon={<Car />} label="Vehicle" value={`${booking.vehicle.brand} ${booking.vehicle.model}`} />
            <Detail icon={<MapPin />} label="Slot" value={`${booking.slot.slotNumber} (Floor ${booking.slot.floor})`} />
            <Detail icon={<IndianRupee />} label="Amount" value={`₹${booking.amount.total}`} />
          </div>
        </div>

        {/* Payment */}
        <div className="glass rounded-xl p-5 border border-white/5">
          <h3 className="font-semibold text-white mb-3">Payment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-neutral-400"><span>Base amount</span><span>₹{booking.amount.base}</span></div>
            {booking.amount.peakSurcharge > 0 && <div className="flex justify-between text-neutral-400"><span>Peak surcharge</span><span>₹{booking.amount.peakSurcharge}</span></div>}
            {booking.amount.tax > 0 && <div className="flex justify-between text-neutral-400"><span>Tax</span><span>₹{booking.amount.tax}</span></div>}
            {booking.amount.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-₹{booking.amount.discount}</span></div>}
            <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2"><span>Total</span><span>₹{booking.amount.total}</span></div>
          </div>
        </div>

        {/* Stripe Checkout (Phase 2) */}
        {booking.status === 'payment_pending' && booking.clientSecret && (
          <div className="glass rounded-xl p-6 border border-amber-500/30 bg-amber-500/5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white">Complete Your Payment</h3>
              <p className="text-sm text-neutral-300">Your slot is reserved for 10 minutes. Please complete payment to confirm.</p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret: booking.clientSecret, appearance: { theme: 'night' } }}>
              <CheckoutForm 
                clientSecret={booking.clientSecret} 
                amount={booking.amount.total} 
                onSuccess={() => qc.invalidateQueries({ queryKey: queryKeys.booking(id!) })}
              />
            </Elements>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {booking.qrCode && (
            <Button variant="secondary" leftIcon={<QrCode className="w-4 h-4" />} onClick={() => setShowQR(true)} className="flex-1">
              Show QR Code
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" leftIcon={<X className="w-4 h-4" />} onClick={() => setShowCancel(true)} className="flex-1">
              Cancel Booking
            </Button>
          )}
        </div>

        {/* QR Modal - Digital Ticket */}
        <Modal open={showQR} onClose={() => setShowQR(false)} title="Your Entry Ticket" size="sm">
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl w-full max-w-[280px] shadow-2xl relative overflow-hidden flex flex-col items-center">
              {/* Ticket cutouts */}
              <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0a0f1e] rounded-full -translate-y-1/2" />
              <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0a0f1e] rounded-full -translate-y-1/2" />
              <div className="absolute top-1/2 left-4 right-4 h-px border-t-2 border-dashed border-gray-300 -translate-y-1/2" />
              
              <div className="pb-6 w-full text-center">
                <h3 className="text-gray-900 font-bold text-xl mb-1">{booking.parkingLot.name}</h3>
                <p className="text-gray-500 text-xs">Slot {booking.slot.slotNumber}</p>
              </div>
              
              <div className="pt-6 w-full flex flex-col items-center">
                <div className="bg-white p-2 rounded-xl mb-3 border border-gray-200">
                  <img src={booking.qrCode} alt="Booking QR" className="w-40 h-40 object-contain mix-blend-multiply" />
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-semibold">Ref: {booking.bookingRef}</p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-400 mt-6 text-center max-w-[250px]">
              Scan this code at the boom barrier to enter the parking lot.
            </p>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel Booking">
          <div className="space-y-4">
            <p className="text-sm text-neutral-300">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div>
              <label className="form-label">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling?"
                rows={3}
                className="input-field w-full resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCancel(false)}>Keep Booking</Button>
              <Button variant="danger" className="flex-1" loading={isCancelling} onClick={() => cancel()}>Yes, Cancel</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

const Detail: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-neutral-500 mt-0.5 shrink-0 w-4 h-4">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-200 font-medium">{value}</p>
    </div>
  </div>
);

export default BookingDetailPage;
