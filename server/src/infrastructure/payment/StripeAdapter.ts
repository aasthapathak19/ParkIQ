import Stripe from 'stripe';
import { IPaymentProvider, PaymentIntentResult } from '../../domain/interfaces/IPaymentProvider';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class StripeAdapter implements IPaymentProvider {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2026-07-29.dahlia' as Stripe.LatestApiVersion,
    });
  }

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentIntentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('No client secret returned from Stripe');
      }

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id,
        provider: 'stripe',
      };
    } catch (error) {
      logger.error({ error, amount, currency }, 'Failed to create Stripe PaymentIntent');
      throw error;
    }
  }

  verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      logger.error({ error }, 'Failed to verify Stripe webhook signature');
      throw error;
    }
  }

  async refund(paymentId: string, amount?: number): Promise<void> {
    try {
      await this.stripe.refunds.create({
        payment_intent: paymentId,
        amount, // if undefined, refunds the full amount
      });
    } catch (error) {
      logger.error({ error, paymentId, amount }, 'Failed to process Stripe refund');
      throw error;
    }
  }
}

