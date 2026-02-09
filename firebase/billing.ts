/**
 * Client-side Billing API Functions
 *
 * Phase 1B: Billing Management
 * Provides functions to interact with billing Cloud Functions.
 * Follows the pattern from firebase/payments.ts.
 */

import { functions } from './config';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

// ============================================================================
// TYPES
// ============================================================================

interface CreateCheckoutSessionRequest {
  plan: string;
  interval: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

interface CreatePortalSessionRequest {
  returnUrl: string;
}

interface CreatePortalSessionResponse {
  url: string;
}

interface BillingResult {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

// ============================================================================
// BILLING FUNCTIONS
// ============================================================================

/**
 * Create a Stripe Checkout Session for plan upgrade.
 * Redirects the user to Stripe Checkout.
 */
export const createCheckoutSession = async (
  plan: string,
  interval: 'monthly' | 'annual'
): Promise<BillingResult> => {
  try {
    const currentUrl = window.location.origin;
    const fn = httpsCallable<
      CreateCheckoutSessionRequest,
      CreateCheckoutSessionResponse
    >(functions, 'createCheckoutSession');

    const result: HttpsCallableResult<CreateCheckoutSessionResponse> = await fn({
      plan,
      interval,
      successUrl: `${currentUrl}?billing=success`,
      cancelUrl: `${currentUrl}?billing=cancelled`,
    });

    return {
      success: true,
      url: result.data.url,
      sessionId: result.data.sessionId,
    };
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Failed to start checkout';
    return { success: false, error: message };
  }
};

/**
 * Create a Stripe Customer Portal session.
 * Redirects the user to Stripe Portal for payment/invoice management.
 */
export const createPortalSession = async (): Promise<BillingResult> => {
  try {
    const currentUrl = window.location.origin;
    const fn = httpsCallable<
      CreatePortalSessionRequest,
      CreatePortalSessionResponse
    >(functions, 'createPortalSession');

    const result: HttpsCallableResult<CreatePortalSessionResponse> = await fn({
      returnUrl: currentUrl,
    });

    return {
      success: true,
      url: result.data.url,
    };
  } catch (error: unknown) {
    console.error('Error creating portal session:', error);
    const message = error instanceof Error ? error.message : 'Failed to open billing portal';
    return { success: false, error: message };
  }
};
