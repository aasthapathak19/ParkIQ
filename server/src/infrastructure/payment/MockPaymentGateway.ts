import { IPaymentGateway, PaymentIntent, PaymentMetadata, PaymentResult, RefundResult } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * Phase 1 mock payment gateway — auto-confirms all payments.
 * Phase 2: swap with StripeGateway in container.ts.
 */
export class MockPaymentGateway implements IPaymentGateway {
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: PaymentMetadata,
  ): Promise<PaymentIntent> {
    return {
      id: `mock_pi_${uuidv4()}`,
      status: 'requires_confirmation',
      clientSecret: `mock_secret_${uuidv4()}`,
    };
  }

  async confirmPayment(intentId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: intentId,
      paidAt: new Date(),
    };
  }

  async refund(intentId: string, amount?: number): Promise<RefundResult> {
    return {
      success: true,
      refundId: `mock_refund_${uuidv4()}`,
      refundedAt: new Date(),
      amount: amount ?? 0,
    };
  }
}
