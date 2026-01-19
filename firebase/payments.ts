/**
 * Client-side Payment API Functions
 *
 * Phase 4A: Stripe Payment Integration
 * Provides functions to interact with payment Cloud Functions.
 */

import { functions } from './config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// ============================================================================
// TYPES
// ============================================================================

interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency: string;
  orderId: string;
}

interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

interface PaymentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

// ============================================================================
// PAYMENT FUNCTIONS
// ============================================================================

/**
 * Create a PaymentIntent for an order
 *
 * Calls the Cloud Function to create a Stripe PaymentIntent.
 * Returns the client secret needed to confirm the payment.
 *
 * @param orderId - The order ID to create payment for
 * @param amount - Amount in cents (e.g., $10.00 = 1000)
 * @param currency - Currency code (e.g., 'USD', 'GBP', 'EUR')
 * @returns PaymentResult with clientSecret or error
 *
 * @example
 * const result = await createPaymentIntent('order-123', 1500, 'GBP');
 * if (result.success) {
 *   // Use result.clientSecret with Stripe Elements
 * }
 */
export const createPaymentIntent = async (
  orderId: string,
  amount: number,
  currency: string
): Promise<PaymentResult> => {
  try {
    const createPaymentIntentFn = httpsCallable<
      CreatePaymentIntentRequest,
      CreatePaymentIntentResponse
    >(functions, 'createPaymentIntent');

    const result: HttpsCallableResult<CreatePaymentIntentResponse> =
      await createPaymentIntentFn({
        orderId,
        amount,
        currency,
      });

    if (result.data.success) {
      return {
        success: true,
        clientSecret: result.data.clientSecret,
        paymentIntentId: result.data.paymentIntentId,
      };
    } else {
      return {
        success: false,
        error: result.data.error || 'Failed to create payment',
      };
    }
  } catch (error: any) {
    console.error('Error creating payment intent:', error);

    // Parse Firebase Functions error
    if (error.code) {
      switch (error.code) {
        case 'unauthenticated':
          return { success: false, error: 'Please log in to make a payment' };
        case 'not-found':
          return { success: false, error: 'Order not found' };
        case 'already-exists':
          return { success: false, error: 'This order has already been paid' };
        case 'failed-precondition':
          return { success: false, error: 'Payment system is not configured' };
        case 'invalid-argument':
          return { success: false, error: 'Invalid payment details' };
        default:
          return {
            success: false,
            error: error.message || 'Payment failed. Please try again.',
          };
      }
    }

    return {
      success: false,
      error: 'Unable to process payment. Please try again.',
    };
  }
};

/**
 * Convert order total to cents for Stripe
 *
 * Stripe requires amounts in the smallest currency unit (cents).
 * This function converts a decimal amount to cents.
 *
 * @param amount - Amount in dollars/pounds/euros (e.g., 15.99)
 * @returns Amount in cents (e.g., 1599)
 *
 * @example
 * const cents = amountToCents(15.99); // Returns 1599
 */
export const amountToCents = (amount: number): number => {
  // Round to avoid floating point precision issues
  return Math.round(amount * 100);
};

/**
 * Convert cents to display amount
 *
 * Converts cents back to the display format.
 *
 * @param cents - Amount in cents
 * @returns Amount in dollars/pounds/euros
 *
 * @example
 * const dollars = centsToAmount(1599); // Returns 15.99
 */
export const centsToAmount = (cents: number): number => {
  return cents / 100;
};

/**
 * Check if Stripe is configured for the tenant
 *
 * @param publishableKey - The Stripe publishable key from settings
 * @returns true if Stripe appears to be configured
 */
export const isStripeConfigured = (publishableKey: string | undefined): boolean => {
  return !!(publishableKey && publishableKey.startsWith('pk_'));
};

/**
 * Get Stripe test mode indicator
 *
 * @param publishableKey - The Stripe publishable key
 * @returns true if using test mode
 */
export const isStripeTestMode = (publishableKey: string | undefined): boolean => {
  return !!(publishableKey && publishableKey.startsWith('pk_test_'));
};
