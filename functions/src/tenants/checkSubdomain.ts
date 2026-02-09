/**
 * Cloud Function: Check Subdomain Availability
 *
 * HTTPS Callable function that checks whether a subdomain is available
 * for tenant registration. Validates format, checks reserved list,
 * and queries Firestore for existing tenants.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface CheckSubdomainData {
  subdomain: string;
}

interface CheckSubdomainResponse {
  available: boolean;
  error?: string;
}

const SUBDOMAIN_REGEX = /^[a-z][a-z0-9-]{2,29}$/;

const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'app',
  'www',
  'mail',
  'ftp',
  'demo',
  'test',
  'staging',
  'superadmin',
  'support',
  'help',
  'docs',
  'blog',
  'status',
];

export const checkSubdomain = functions.https.onCall(
  async (data: CheckSubdomainData): Promise<CheckSubdomainResponse> => {
    const { subdomain } = data;

    if (!subdomain || typeof subdomain !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Subdomain is required'
      );
    }

    if (!SUBDOMAIN_REGEX.test(subdomain)) {
      return {
        available: false,
        error:
          'Subdomain must be 3-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens',
      };
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return {
        available: false,
        error: 'This subdomain is reserved',
      };
    }

    try {
      const db = admin.firestore();
      const tenantDoc = await db.doc(`tenantMetadata/${subdomain}`).get();

      return { available: !tenantDoc.exists };
    } catch (error) {
      functions.logger.error('Error checking subdomain:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to check subdomain availability'
      );
    }
  }
);
