export interface PaymentIntentResult {
  clientSecret: string;
  paymentId: string;
  provider: string;
}

export interface IPaymentProvider {
  /**
   * Create a payment intent (e.g., Stripe PaymentIntent, Razorpay Order)
   * @param amount The total amount in the smallest currency unit (e.g., paise for INR)
   * @param currency The 3-letter currency code (e.g., 'INR')
   * @param metadata Additional metadata to attach to the payment (e.g., bookingRef)
   */
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentIntentResult>;

  /**
   * Verify the webhook signature received from the provider
   * @param payload The raw webhook body
   * @param signature The signature header from the provider
   */
  verifyWebhook(payload: string | Buffer, signature: string): any;

  /**
   * Process a refund for a previously successful payment
   * @param paymentId The provider's payment ID
   * @param amount Optional partial refund amount
   */
  refund(paymentId: string, amount?: number): Promise<void>;
}
