import QRCode from 'qrcode';
import { BookingReference } from '../domain/value-objects';

interface QRPayload {
  ref: string;
  bookingId: string;
  expiresAt: string;
}

export const generateBookingQR = async (
  bookingId: string,
  bookingRef: string,
  expiresAt: Date,
): Promise<string> => {
  const payload: QRPayload = {
    ref: bookingRef,
    bookingId,
    expiresAt: expiresAt.toISOString(),
  };

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return qrDataUrl;
};

export const validateBookingRef = (ref: string): boolean => {
  return BookingReference.isValid(ref);
};
