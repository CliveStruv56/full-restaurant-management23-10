/**
 * Cloud Function: Provision Tenant from Website
 *
 * HTTPS Callable function that provisions a new tenant in Firestore
 * and creates (or reuses) a Firebase Auth user. Called by the VBP website
 * signup API or by the SaaS platform's own signup flow.
 *
 * Mirrors the logic in the VBP website's /api/signup route but runs
 * server-side in Firebase, providing a secure alternative to the client-side
 * Firestore writes in the SaaS platform's SignupFlow.tsx.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface ProvisionTenantData {
  name: string;
  email: string;
  password: string;
  businessName: string;
  subdomain: string;
  verticalType: string; // 'restaurant' | 'salon' | 'auto-shop' | etc.
}

interface ProvisionTenantResponse {
  success: boolean;
  tenantId?: string;
  userId?: string;
  customToken?: string;
  appUrl?: string;
  error?: string;
}

const SUBDOMAIN_REGEX = /^[a-z][a-z0-9-]{2,29}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_DOMAIN = 'app.vbp.solutions';

const VALID_VERTICALS = [
  'restaurant',
  'salon',
  'auto-shop',
  'hotel',
  'retail',
];

function validateInput(data: ProvisionTenantData): string[] {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name is required (minimum 2 characters)');
  }

  if (!data.email || typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!data.businessName || typeof data.businessName !== 'string' || data.businessName.trim().length < 2) {
    errors.push('Business name is required (minimum 2 characters)');
  }

  if (!data.subdomain || typeof data.subdomain !== 'string' || !SUBDOMAIN_REGEX.test(data.subdomain)) {
    errors.push('Subdomain must be 3-30 characters, start with a letter, and contain only lowercase letters, numbers, and hyphens');
  }

  if (!data.verticalType || !VALID_VERTICALS.includes(data.verticalType)) {
    errors.push(`Invalid vertical type. Must be one of: ${VALID_VERTICALS.join(', ')}`);
  }

  return errors;
}

export const provisionTenantFromWebsite = functions.https.onCall(
  async (data: ProvisionTenantData): Promise<ProvisionTenantResponse> => {
    // Validate input
    const errors = validateInput(data);
    if (errors.length > 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        errors.join('; ')
      );
    }

    const { name, email, password, businessName, subdomain, verticalType } = data;
    const db = admin.firestore();
    const auth = admin.auth();

    try {
      // 1. Check subdomain availability
      const tenantDoc = await db.doc(`tenantMetadata/${subdomain}`).get();
      if (tenantDoc.exists) {
        throw new functions.https.HttpsError(
          'already-exists',
          'This subdomain is already taken'
        );
      }

      // 2. Create or reuse Firebase Auth user
      let userId: string;
      let isNewUser = false;

      try {
        const existingUser = await auth.getUserByEmail(email.trim().toLowerCase());
        userId = existingUser.uid;
      } catch (authError: unknown) {
        const errorCode =
          authError && typeof authError === 'object' && 'code' in authError
            ? (authError as { code: string }).code
            : '';

        if (errorCode === 'auth/user-not-found') {
          const newUser = await auth.createUser({
            email: email.trim().toLowerCase(),
            password,
            displayName: name.trim(),
            emailVerified: false,
          });
          userId = newUser.uid;
          isNewUser = true;
        } else {
          throw authError;
        }
      }

      // Update password for existing users
      if (!isNewUser) {
        await auth.updateUser(userId, {
          password,
          displayName: name.trim(),
        });
      }

      const now = new Date().toISOString();

      // 3. Create tenantMetadata document
      await db.doc(`tenantMetadata/${subdomain}`).set({
        id: subdomain,
        businessName: businessName.trim(),
        verticalType,
        subdomain,
        enabledModules: {
          base: true,
          tableManagement: false,
          management: false,
          delivery: false,
        },
        subscription: {
          plan: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          modules: ['base'],
        },
        paymentGateway: {
          provider: 'none',
        },
        tenantStatus: {
          status: 'trial',
          statusChangedAt: now,
          statusChangedBy: 'website-signup',
        },
        usageMetrics: {
          totalOrders: 0,
          totalUsers: 1,
          totalStaff: 0,
          lastActivityAt: now,
        },
        stats: {
          totalInvitationsSent: 0,
          totalInvitationsAccepted: 0,
        },
        createdAt: now,
        createdBy: 'vbp-website',
      });

      // 4. Create or update user document with tenant membership
      const userDocRef = db.doc(`users/${userId}`);
      const userDoc = await userDocRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const tenantMemberships = userData?.tenantMemberships || {};
        tenantMemberships[subdomain] = {
          role: 'admin',
          joinedAt: now,
          isActive: true,
        };
        await userDocRef.update({
          tenantMemberships,
          currentTenantId: subdomain,
        });
      } else {
        await userDocRef.set({
          uid: userId,
          email: email.trim().toLowerCase(),
          displayName: name.trim(),
          phoneNumber: null,
          createdAt: now,
          tenantMemberships: {
            [subdomain]: {
              role: 'admin',
              joinedAt: now,
              isActive: true,
            },
          },
          currentTenantId: subdomain,
          loyaltyPoints: 0,
        });
      }

      // 5. Generate custom token for auto-login
      const customToken = await auth.createCustomToken(userId);

      const appUrl = `https://${subdomain}.${APP_DOMAIN}`;

      functions.logger.info('Tenant provisioned successfully', {
        tenantId: subdomain,
        userId,
        verticalType,
        isNewUser,
      });

      return {
        success: true,
        tenantId: subdomain,
        userId,
        customToken,
        appUrl,
      };
    } catch (error) {
      // Re-throw HttpsErrors as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      functions.logger.error('Error provisioning tenant:', error);
      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred during signup. Please try again.'
      );
    }
  }
);
