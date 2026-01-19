/**
 * Payment Form Component
 *
 * Phase 4A: Stripe Elements card input form for processing payments.
 * Handles payment confirmation and error states.
 */

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { styles } from '../../styles';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

/**
 * Format amount for display
 */
const formatAmount = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  // Amount is in cents, convert to dollars
  return formatter.format(amount / 100);
};

/**
 * PaymentForm Component
 *
 * Renders Stripe Payment Element and handles payment confirmation.
 */
export const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Reset error when client secret changes
  useEffect(() => {
    setPaymentError(null);
  }, [clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Return URL is required but we'll handle success in-app
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setPaymentError(error.message || 'An unexpected error occurred.');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent) {
        // Payment succeeded!
        if (paymentIntent.status === 'succeeded') {
          onSuccess();
        } else if (paymentIntent.status === 'processing') {
          // Payment is processing - show confirmation
          onSuccess();
        } else if (paymentIntent.status === 'requires_action') {
          // Additional action needed - Stripe handles this automatically
          // but we shouldn't get here with redirect: 'if_required'
          setPaymentError('Additional authentication required.');
        } else {
          setPaymentError('Payment could not be completed.');
          onError('Payment could not be completed');
        }
      }
    } catch (err: any) {
      setPaymentError(err.message || 'An unexpected error occurred.');
      onError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '1.2em',
        color: '#22223b',
        fontWeight: 600,
      }}>
        Payment Details
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Payment Element */}
        <div style={{ marginBottom: '20px' }}>
          <PaymentElement
            onReady={() => setIsReady(true)}
            options={{
              layout: 'tabs',
            }}
          />
        </div>

        {/* Error Message */}
        {paymentError && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            {paymentError}
          </div>
        )}

        {/* Payment Summary */}
        <div style={{
          padding: '15px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Total Amount
            </span>
            <span style={{
              color: '#22223b',
              fontSize: '1.3em',
              fontWeight: 700,
            }}>
              {formatAmount(amount, currency)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              ...styles.adminButtonSecondary as React.CSSProperties,
              flex: 1,
              padding: '14px',
              opacity: isProcessing ? 0.5 : 1,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing || !isReady}
            style={{
              ...styles.optionsModalButton as React.CSSProperties,
              flex: 2,
              padding: '14px',
              backgroundColor: isProcessing ? '#9ca3af' : '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: (!stripe || !elements || isProcessing || !isReady) ? 'not-allowed' : 'pointer',
              opacity: (!stripe || !elements || isProcessing || !isReady) ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isProcessing ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Processing...
              </>
            ) : (
              `Pay ${formatAmount(amount, currency)}`
            )}
          </button>
        </div>

        {/* Security Note */}
        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
        }}>
          Payments are securely processed by Stripe. Your card details never touch our servers.
        </p>
      </form>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentForm;
