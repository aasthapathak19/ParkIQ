import { Request, Response } from 'express';
import { StripeAdapter } from '../../infrastructure/payment/StripeAdapter';
import { BookingModel } from '../bookings/booking.model';
import { logger } from '../../config/logger';

const stripeAdapter = new StripeAdapter();

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    res.status(400).send('Missing stripe-signature header');
    return;
  }

  let event;
  try {
    // Note: Stripe requires the raw body buffer to verify signatures
    // Ensure that your express app is using express.raw({ type: 'application/json' }) for this specific route
    event = stripeAdapter.verifyWebhook(req.body, signature as string);
  } catch (err: any) {
    logger.error({ err }, 'Webhook signature verification failed');
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        const bookingRef = paymentIntent.metadata?.bookingRef;

        if (bookingRef) {
          const booking = await BookingModel.findOne({ bookingRef });
          if (booking && booking.status === 'payment_pending') {
            booking.status = 'confirmed';
            booking.payment.status = 'paid';
            booking.payment.paidAt = new Date();
            booking.payment.gatewayRef = paymentIntent.id;
            booking.payment.method = paymentIntent.payment_method_types?.[0] || 'card';
            await booking.save();
            
            logger.info({ bookingRef, paymentId: paymentIntent.id }, 'Booking confirmed via webhook');
            // Future: Publish PaymentSucceededEvent here
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        const bookingRef = paymentIntent.metadata?.bookingRef;

        if (bookingRef) {
          const booking = await BookingModel.findOne({ bookingRef });
          if (booking && booking.status === 'payment_pending') {
            booking.status = 'cancelled';
            booking.payment.status = 'failed';
            booking.cancellation = {
              reason: 'Payment failed',
              cancelledBy: 'system',
              cancelledAt: new Date(),
            };
            await booking.save();
            
            logger.info({ bookingRef, paymentId: paymentIntent.id }, 'Booking cancelled due to payment failure');
          }
        }
        break;
      }
      default:
        logger.debug({ eventType: event.type }, 'Unhandled stripe webhook event');
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ error }, 'Error processing webhook event');
    res.status(500).send('Internal Server Error');
  }
};
