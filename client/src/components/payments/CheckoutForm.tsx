import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Spinner, Button } from '@/components/ui';
import toast from 'react-hot-toast';

interface CheckoutFormProps {
  clientSecret: string;
  onSuccess: () => void;
  amount: number;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ clientSecret, onSuccess, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast.success('Payment successful!');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md p-6 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">Secure Checkout</h3>
      <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex justify-center py-3"
      >
        {isProcessing ? <Spinner size="sm" className="text-white" /> : `Pay $${amount.toFixed(2)}`}
      </Button>
      <p className="text-xs text-neutral-500 mt-4 text-center">
        Payments are securely processed by Stripe.
      </p>
    </form>
  );
};
