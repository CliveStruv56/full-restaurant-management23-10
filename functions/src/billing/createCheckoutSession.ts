/**
 * Cloud Function: Create Stripe Checkout Session
 *
 * Phase 1B: Billing Management
 * Callable function that creates a Stripe Checkout Session for plan upgrades.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getPlatformStripe } from './stripeClient';

interface CheckoutInput {
  plan: string;
  interval: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export const createCheckoutSession = functions.https.onCall(
  async (data: CheckoutInput, context): Promise<CheckoutResponse> => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to upgrade'
      );
    }

    const { plan, interval, successUrl, cancelUrl } = data;

    if (!plan || !interval || !successUrl || !cancelUrl) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: plan, interval, successUrl, cancelUrl'
      );
    }

    if (!['growth', 'professional'].includes(plan)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid plan. Must be growth or professional.'
      );
    }

    if (!['monthly', 'annual'].includes(interval)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid interval. Must be monthly or annual.'
      );
    }

    const db = admin.firestore();
    const uid = context.auth.uid;

    // Look up the user's current tenant
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data();
    const tenantId = userData?.currentTenantId;

    if (!tenantId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No tenant associated with this user'
      );
    }

    // Verify user is admin of the tenant
    const membership = userData?.tenantMemberships?.[tenantId];
    if (!membership || membership.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only tenant admins can manage billing'
      );
    }

    // Get tenant metadata to find Stripe Customer ID
    const tenantDoc = await db.doc(`tenantMetadata/${tenantId}`).get();
    const tenantData = tenantDoc.data();
    const stripeCustomerId = tenantData?.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Billing is not initialised for this tenant. Please contact support.'
      );
    }

    // Look up the Stripe Price ID from tenant metadata or plan config
    // Price IDs are stored in the client-side billing config and passed via the plan name
    // We retrieve them from the Stripe customer's metadata or use the plan + interval lookup
    const stripe = getPlatformStripe();

    // Search for matching prices by product metadata
    const prices = await stripe.prices.search({
      query: `active:"true" AND metadata["plan"]:"${plan}" AND metadata["interval"]:"${interval}"`,
      limit: 1,
    });

    let priceId: string;
    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
    } else {
      throw new functions.https.HttpsError(
        'not-found',
        `No Stripe price found for plan "${plan}" (${interval}). Ensure prices have metadata plan="${plan}" and interval="${interval}".`
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      subscription_data: {
        metadata: { tenantId, plan, interval },
      },
      metadata: { tenantId, plan, interval },
    });

    functions.logger.info('Checkout session created', {
      tenantId,
      plan,
      interval,
      sessionId: session.id,
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }
);
