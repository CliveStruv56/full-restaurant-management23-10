/**
 * Platform Stripe Client for Cloud Functions
 *
 * Phase 1B: Billing Management
 * Uses stripe.platform_secret_key from Functions config.
 * SEPARATE from tenant payment keys in functions/src/payments/.
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getPlatformStripe(): Stripe {
  if (!stripeInstance) {
    const config = functions.config();
    const secretKey = config.stripe?.platform_secret_key;

    if (!secretKey) {
      throw new Error(
        'Platform Stripe key not configured. Run: firebase functions:config:set stripe.platform_secret_key="sk_..."'
      );
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  return stripeInstance;
}

export function getPlatformWebhookSecret(): string {
  const config = functions.config();
  const webhookSecret = config.stripe?.platform_webhook_secret;

  if (!webhookSecret) {
    throw new Error(
      'Platform webhook secret not configured. Run: firebase functions:config:set stripe.platform_webhook_secret="whsec_..."'
    );
  }

  return webhookSecret;
}
