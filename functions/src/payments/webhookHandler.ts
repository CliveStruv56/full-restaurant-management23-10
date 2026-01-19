/**
 * Cloud Function: Stripe Webhook Handler
 *
 * HTTP endpoint that handles Stripe webhook events.
 * Updates order payment status when payment succeeds or fails.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

/**
 * Get Stripe secret key for webhook verification
 * Uses the signing secret from Firebase Functions config
 */
function getStripeWebhookSecret(): string {
  const config = functions.config();
  const webhookSecret = config.stripe?.webhook_secret;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  return webhookSecret;
}

/**
 * Get default Stripe secret key for API operations
 */
function getStripeSecretKey(): string {
  const config = functions.config();
  const secretKey = config.stripe?.secret_key;

  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }

  return secretKey;
}

/**
 * Update order payment status in Firestore
 */
async function updateOrderPaymentStatus(
  tenantId: string,
  orderId: string,
  status: 'paid' | 'failed' | 'refunded',
  additionalData?: Record<string, any>
): Promise<void> {
  const db = admin.firestore();
  const orderRef = db.doc(`tenants/${tenantId}/orders/${orderId}`);

  const updateData: Record<string, any> = {
    paymentStatus: status,
    updatedAt: new Date().toISOString(),
    ...additionalData,
  };

  await orderRef.update(updateData);

  functions.logger.info(`Order ${orderId} payment status updated to ${status}`, {
    tenantId,
    orderId,
    status,
  });
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { orderId, tenantId } = paymentIntent.metadata;

  if (!orderId || !tenantId) {
    functions.logger.warn('PaymentIntent missing required metadata', {
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
    return;
  }

  await updateOrderPaymentStatus(tenantId, orderId, 'paid', {
    paidAt: new Date().toISOString(),
    stripeChargeId: paymentIntent.latest_charge,
  });
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  const { orderId, tenantId } = paymentIntent.metadata;

  if (!orderId || !tenantId) {
    functions.logger.warn('PaymentIntent missing required metadata', {
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    });
    return;
  }

  const lastError = paymentIntent.last_payment_error;
  await updateOrderPaymentStatus(tenantId, orderId, 'failed', {
    paymentError: lastError?.message || 'Payment failed',
    paymentErrorCode: lastError?.code,
  });
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  // Get the payment intent to access metadata
  const stripeSecretKey = getStripeSecretKey();
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
  });

  if (!charge.payment_intent) {
    functions.logger.warn('Refund charge missing payment_intent', {
      chargeId: charge.id,
    });
    return;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    charge.payment_intent as string
  );

  const { orderId, tenantId } = paymentIntent.metadata;

  if (!orderId || !tenantId) {
    functions.logger.warn('PaymentIntent missing required metadata for refund', {
      paymentIntentId: paymentIntent.id,
    });
    return;
  }

  // Check if fully or partially refunded
  const refundedAmount = charge.amount_refunded;
  const totalAmount = charge.amount;

  await updateOrderPaymentStatus(tenantId, orderId, 'refunded', {
    refundedAt: new Date().toISOString(),
    refundAmount: refundedAmount,
    isPartialRefund: refundedAmount < totalAmount,
  });
}

/**
 * Main webhook handler function
 * Note: This is an HTTP function, not a callable function
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let event: Stripe.Event;

  try {
    // Get webhook secret
    const webhookSecret = getStripeWebhookSecret();
    const stripeSecretKey = getStripeSecretKey();

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Verify webhook signature
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      functions.logger.warn('Missing stripe-signature header');
      res.status(400).send('Missing signature');
      return;
    }

    // Get raw body for signature verification
    const rawBody = req.rawBody;

    if (!rawBody) {
      functions.logger.warn('Missing raw body for webhook verification');
      res.status(400).send('Missing body');
      return;
    }

    // Construct and verify event
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

  } catch (err: any) {
    functions.logger.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    functions.logger.info('Processing webhook event', {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      // Log but don't process other events
      default:
        functions.logger.info(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt of the event
    res.status(200).json({ received: true });

  } catch (error: any) {
    functions.logger.error('Error processing webhook event:', error);
    // Still return 200 to prevent Stripe from retrying
    // Log the error for investigation
    res.status(200).json({ received: true, error: error.message });
  }
});
