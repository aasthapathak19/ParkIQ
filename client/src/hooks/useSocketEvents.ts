import { useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import toast from 'react-hot-toast';

export const useSocketEvents = () => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listeners for Customer Events
    const handleBookingCreated = (data: any) => {
      toast.success(`Booking ${data.bookingId} created!`);
    };

    const handleBookingConfirmed = (data: any) => {
      toast.success('Payment successful! Your slot is reserved.');
    };

    // Listeners for Owner Events
    const handleLotBookingNew = (data: any) => {
      toast('New booking received!', { icon: '🚘' });
    };

    // Listeners for Global Events
    const handleSlotUpdated = (data: any) => {
      // Typically we'll rely on React Query invalidation in specific components
      // rather than global toasts for slot updates to prevent spam.
      console.log('Slot updated:', data);
    };

    socket.on('booking:created', handleBookingCreated);
    socket.on('booking:confirmed', handleBookingConfirmed);
    socket.on('lot:booking_new', handleLotBookingNew);
    socket.on('slot:updated', handleSlotUpdated);

    return () => {
      socket.off('booking:created', handleBookingCreated);
      socket.off('booking:confirmed', handleBookingConfirmed);
      socket.off('lot:booking_new', handleLotBookingNew);
      socket.off('slot:updated', handleSlotUpdated);
    };
  }, [socket, isConnected]);
};
