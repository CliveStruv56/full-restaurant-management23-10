/**
 * Cloud Function: Billing Webhook Handler
 *
 * Phase 1B: Billing Management
 * HTTP function for platform billing events (SEPARATE from order payment webhook).
 * Uses stripe.platform_secret_key and stripe.platform_webhook_secret.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { getPlatformStripe, getPlatformWebhookSecret } from './stripeClient';
import { BillingPlan, getEnabledModulesForPlan } from './billingConfig';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract current_period_end from a subscription.
 * In Stripe API clover, this moved from Subscription to SubscriptionItem.
 */
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const firstItem = subscription.items?.data?.[0];
  if (firstItem?.current_period_end) {
    return new Date(firstItem.current_period_end * 1000).toISOString();
  }
  return null;
}

/**
 * Extract subscription ID from an invoice.
 * In Stripe API clover, invoice.subscription moved to invoice.parent.subscription_details.
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subDetails = invoice.parent?.subscription_details;
  if (subDetails?.subscription) {
    return typeof subDetails.subscription === 'string'
      ? subDetails.subscription
      : subDetails.subscription.id;
  }
  return null;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * checkout.session.completed — user finished Stripe Checkout
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const tenantId = session.metadata?.tenantId;
  const plan = session.metadata?.plan as BillingPlan | undefined;
  const interval = session.metadata?.interval as 'monthly' | 'annual' | undefined;

  if (!tenantId || !plan) {
    functions.logger.warn('Checkout session missing tenantId or plan metadata', {
      sessionId: session.id,
      metadata: session.metadata,
    });
    return;
  }

  const db = admin.firestore();
  const stripe = getPlatformStripe();

  // Retrieve the subscription to get period details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const now = new Date().toISOString();
  const enabledModules = getEnabledModulesForPlan(plan);

  await db.doc(`tenantMetadata/${tenantId}`).update({
    'subscription.plan': plan,
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.stripePriceId': subscription.items.data[0]?.price.id || '',
    'subscription.billingInterval': interval || 'monthly',
    'subscription.currentPeriodEnd': getSubscriptionPeriodEnd(subscription) || now,
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    enabledModules,
    'tenantStatus.status': 'active',
    'tenantStatus.statusChangedAt': now,
    'tenantStatus.statusChangedBy': 'stripe-checkout',
  });

  functions.logger.info('Tenant upgraded via checkout', {
    tenantId,
    plan,
    interval,
    subscriptionId,
  });
}

/**
 * customer.subscription.updated — plan change, renewal, or payment status change
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    functions.logger.warn('Subscription missing tenantId metadata', {
      subscriptionId: subscription.id,
    });
    return;
  }

  const db = admin.firestore();
  const plan = subscription.metadata?.plan as BillingPlan | undefined;
  const interval = subscription.metadata?.interval as 'monthly' | 'annual' | undefined;

  const updateData: Record<string, unknown> = {
    'subscription.stripeSubscriptionId': subscription.id,
    'subscription.stripePriceId': subscription.items.data[0]?.price.id || '',
    'subscription.currentPeriodEnd': getSubscriptionPeriodEnd(subscription) || new Date().toISOString(),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
  };

  if (plan) {
    updateData['subscription.plan'] = plan;
    updateData['subscription.billingInterval'] = interval || 'monthly';
    updateData.enabledModules = getEnabledModulesForPlan(plan);
  }

  // Handle past_due status
  if (subscription.status === 'past_due') {
    updateData['tenantStatus.status'] = 'past_due';
    updateData['tenantStatus.statusChangedAt'] = new Date().toISOString();
    updateData['tenantStatus.statusChangedBy'] = 'stripe-webhook';
    updateData['tenantStatus.statusReason'] = 'Payment past due';
  } else if (subscription.status === 'active') {
    updateData['tenantStatus.status'] = 'active';
    updateData['tenantStatus.statusChangedAt'] = new Date().toISOString();
    updateData['tenantStatus.statusChangedBy'] = 'stripe-webhook';
  }

  await db.doc(`tenantMetadata/${tenantId}`).update(updateData);

  functions.logger.info('Subscription updated', {
    tenantId,
    subscriptionId: subscription.id,
    status: subscription.status,
    plan,
  });
}

/**
 * customer.subscription.deleted — subscription cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    functions.logger.warn('Deleted subscription missing tenantId metadata', {
      subscriptionId: subscription.id,
    });
    return;
  }

  const db = admin.firestore();
  const now = new Date().toISOString();
  const enabledModules = getEnabledModulesForPlan('starter');

  await db.doc(`tenantMetadata/${tenantId}`).update({
    'subscription.plan': 'starter',
    'subscription.stripeSubscriptionId': admin.firestore.FieldValue.delete(),
    'subscription.stripePriceId': admin.firestore.FieldValue.delete(),
    'subscription.billingInterval': admin.firestore.FieldValue.delete(),
    'subscription.currentPeriodEnd': admin.firestore.FieldValue.delete(),
    'subscription.cancelAtPeriodEnd': admin.firestore.FieldValue.delete(),
    enabledModules,
    'tenantStatus.status': 'active',
    'tenantStatus.statusChangedAt': now,
    'tenantStatus.statusChangedBy': 'stripe-webhook',
    'tenantStatus.statusReason': 'Subscription cancelled — downgraded to Starter',
  });

  functions.logger.info('Subscription deleted, downgraded to Starter', {
    tenantId,
    subscriptionId: subscription.id,
  });
}

/**
 * invoice.payment_failed — payment failed
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);
  if (!subscriptionId) return;

  const stripe = getPlatformStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = subscription.metadata?.tenantId;

  if (!tenantId) {
    functions.logger.warn('Failed invoice subscription missing tenantId', {
      invoiceId: invoice.id,
      subscriptionId,
    });
    return;
  }

  const db = admin.firestore();
  await db.doc(`tenantMetadata/${tenantId}`).update({
    'tenantStatus.statusReason': `Payment failed: ${invoice.last_finalization_error?.message || 'Unknown error'}`,
  });

  functions.logger.warn('Invoice payment failed', {
    tenantId,
    invoiceId: invoice.id,
    subscriptionId,
  });
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export const billingWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = getPlatformWebhookSecret();
    const stripe = getPlatformStripe();
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      res.status(400).send('Missing body');
      return;
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    functions.logger.error('Billing webhook signature verification failed:', message);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  try {
    functions.logger.info('Processing billing webhook event', {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        functions.logger.info(`Unhandled billing event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    functions.logger.error('Error processing billing webhook:', message);
    res.status(200).json({ received: true, error: message });
  }
});
