/**
 * Cloud Function: Create Stripe Customer Portal Session
 *
 * Phase 1B: Billing Management
 * Callable function that creates a Stripe Customer Portal session
 * for payment method, invoice, and subscription management.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getPlatformStripe } from './stripeClient';

interface PortalInput {
  returnUrl: string;
}

interface PortalResponse {
  url: string;
}

export const createPortalSession = functions.https.onCall(
  async (data: PortalInput, context): Promise<PortalResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be logged in to manage billing'
      );
    }

    const { returnUrl } = data;
    if (!returnUrl) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required field: returnUrl'
      );
    }

    const db = admin.firestore();
    const uid = context.auth.uid;

    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data();
    const tenantId = userData?.currentTenantId;

    if (!tenantId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No tenant associated with this user'
      );
    }

    const membership = userData?.tenantMemberships?.[tenantId];
    if (!membership || membership.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only tenant admins can manage billing'
      );
    }

    const tenantDoc = await db.doc(`tenantMetadata/${tenantId}`).get();
    const tenantData = tenantDoc.data();
    const stripeCustomerId = tenantData?.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Billing is not initialised for this tenant. Please contact support.'
      );
    }

    const stripe = getPlatformStripe();

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    functions.logger.info('Portal session created', {
      tenantId,
      stripeCustomerId,
    });

    return { url: session.url };
  }
);
