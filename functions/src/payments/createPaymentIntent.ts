/**
 * Cloud Function: Create Payment Intent
 *
 * HTTPS Callable function that creates a Stripe PaymentIntent for an order.
 * Uses tenant-specific Stripe secret key from environment config.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

interface CreatePaymentIntentData {
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

/**
 * Get Stripe secret key for a tenant
 * Keys are stored in Firebase Functions config: stripe.{tenantId}_secret_key
 * Or use a default test key for development
 */
async function getStripeSecretKey(tenantId: string): Promise<string> {
  // Try to get tenant-specific key from environment config
  const config = functions.config();

  // Check for tenant-specific key (format: stripe.tenant_demo_tenant_secret_key)
  const sanitizedTenantId = tenantId.replace(/-/g, '_');
  const tenantKey = config.stripe?.[`${sanitizedTenantId}_secret_key`];

  if (tenantKey) {
    return tenantKey;
  }

  // Fall back to default/test key
  const defaultKey = config.stripe?.secret_key;

  if (defaultKey) {
    return defaultKey;
  }

  // For development/testing, use test mode key
  throw new functions.https.HttpsError(
    'failed-precondition',
    'Stripe is not configured for this tenant. Please contact administrator.'
  );
}

/**
 * Validate order exists and belongs to tenant
 */
async function validateOrder(
  tenantId: string,
  orderId: string
): Promise<{ exists: boolean; total: number; paymentStatus?: string }> {
  const db = admin.firestore();
  const orderRef = db.doc(`tenants/${tenantId}/orders/${orderId}`);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    return { exists: false, total: 0 };
  }

  const orderData = orderDoc.data();
  return {
    exists: true,
    total: orderData?.total || 0,
    paymentStatus: orderData?.paymentStatus,
  };
}

/**
 * Update order with payment intent information
 */
async function updateOrderWithPaymentIntent(
  tenantId: string,
  orderId: string,
  paymentIntentId: string
): Promise<void> {
  const db = admin.firestore();
  const orderRef = db.doc(`tenants/${tenantId}/orders/${orderId}`);

  await orderRef.update({
    paymentIntentId,
    paymentStatus: 'pending',
    paymentMethod: 'stripe',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Main callable function
 */
export const createPaymentIntent = functions.https.onCall(
  async (data: CreatePaymentIntentData, context): Promise<CreatePaymentIntentResponse> => {
    // 1. Validate caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to make a payment'
      );
    }

    const callerUid = context.auth.uid;
    const db = admin.firestore();

    try {
      // 2. Get caller's user document to determine tenant
      const callerDoc = await db.doc(`users/${callerUid}`).get();

      let currentTenantId: string | undefined;

      if (callerDoc.exists) {
        const callerData = callerDoc.data();
        currentTenantId = callerData?.currentTenantId ||
                          (callerData?.tenantMemberships ? Object.keys(callerData.tenantMemberships)[0] : undefined) ||
                          callerData?.tenantId;
      }

      if (!currentTenantId) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No active tenant found for user'
        );
      }

      // 3. Validate input
      const { amount, currency, orderId } = data;

      if (!amount || amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid payment amount'
        );
      }

      if (!currency) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Currency is required'
        );
      }

      if (!orderId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Order ID is required'
        );
      }

      // 4. Validate order exists and check its status
      const orderValidation = await validateOrder(currentTenantId, orderId);

      if (!orderValidation.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Order not found'
        );
      }

      // Prevent duplicate payment intents for already paid orders
      if (orderValidation.paymentStatus === 'paid') {
        throw new functions.https.HttpsError(
          'already-exists',
          'This order has already been paid'
        );
      }

      // 5. Get Stripe secret key for this tenant
      const stripeSecretKey = await getStripeSecretKey(currentTenantId);

      // 6. Initialize Stripe with tenant's key
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia',
      });

      // 7. Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Ensure it's an integer (cents)
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          tenantId: currentTenantId,
          userId: callerUid,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // 8. Update order with payment intent ID
      await updateOrderWithPaymentIntent(currentTenantId, orderId, paymentIntent.id);

      functions.logger.info('PaymentIntent created successfully', {
        paymentIntentId: paymentIntent.id,
        orderId,
        tenantId: currentTenantId,
        amount,
        currency,
      });

      // 9. Return client secret to frontend
      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };

    } catch (error: any) {
      // Re-throw HttpsErrors as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Handle Stripe errors
      if (error.type === 'StripeCardError') {
        throw new functions.https.HttpsError(
          'aborted',
          error.message || 'Your card was declined'
        );
      }

      if (error.type === 'StripeInvalidRequestError') {
        functions.logger.error('Stripe invalid request:', error);
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid payment request'
        );
      }

      // Log unexpected errors
      functions.logger.error('Unexpected error in createPaymentIntent:', error);

      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred while processing your payment'
      );
    }
  }
);
