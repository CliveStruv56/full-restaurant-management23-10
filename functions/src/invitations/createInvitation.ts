/**
 * Cloud Function: Create Invitation
 *
 * HTTPS Callable function that allows tenant admins to invite users
 * Includes authentication, authorization, rate limiting, and duplicate detection
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateInvitationToken, calculateExpirationTime } from '../utils/tokens';

interface CreateInvitationData {
  email: string;
  role: 'admin' | 'staff' | 'customer';
}

interface CreateInvitationResponse {
  success: boolean;
  invitationId?: string;
  error?: string;
}

/**
 * Validate email format (RFC 5322 simplified)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check and update rate limit for a tenant
 * Uses Firestore transaction to prevent race conditions
 *
 * @returns true if invitation can be sent, false if rate limit exceeded
 */
async function checkAndUpdateRateLimit(tenantId: string): Promise<{ allowed: boolean; resetsAt?: Date }> {
  const db = admin.firestore();
  const tenantMetadataRef = db.doc(`tenantMetadata/${tenantId}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const tenantDoc = await transaction.get(tenantMetadataRef);

      if (!tenantDoc.exists) {
        throw new Error('Tenant not found');
      }

      const tenantData = tenantDoc.data();
      const now = new Date();

      // Initialize rate limit if not exists
      let rateLimit = tenantData?.invitationRateLimit || {
        lastResetAt: now.toISOString(),
        invitationsSentThisHour: 0,
      };

      const lastResetAt = new Date(rateLimit.lastResetAt);
      const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60);

      // Reset counter if an hour has passed
      if (hoursSinceReset >= 1) {
        rateLimit = {
          lastResetAt: now.toISOString(),
          invitationsSentThisHour: 0,
        };
      }

      // Check if limit exceeded
      if (rateLimit.invitationsSentThisHour >= 10) {
        const resetsAt = new Date(lastResetAt.getTime() + 60 * 60 * 1000); // 1 hour from last reset
        return { allowed: false, resetsAt };
      }

      // Increment counter
      rateLimit.invitationsSentThisHour += 1;

      // Update tenant metadata
      transaction.update(tenantMetadataRef, {
        invitationRateLimit: rateLimit,
      });

      return { allowed: true };
    });

    return result;
  } catch (error) {
    functions.logger.error('Error checking rate limit:', error);
    throw error;
  }
}

/**
 * Check for duplicate active invitation
 */
async function checkDuplicateInvitation(email: string, tenantId: string): Promise<boolean> {
  const db = admin.firestore();

  const existingInvitations = await db
    .collection('invitations')
    .where('email', '==', email)
    .where('tenantId', '==', tenantId)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  return !existingInvitations.empty;
}

/**
 * Increment tenant invitation stats
 */
async function incrementInvitationStats(tenantId: string): Promise<void> {
  const db = admin.firestore();
  const tenantMetadataRef = db.doc(`tenantMetadata/${tenantId}`);

  await tenantMetadataRef.update({
    'stats.totalInvitationsSent': admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Main callable function
 */
export const createInvitation = functions.https.onCall(
  async (data: CreateInvitationData, context): Promise<CreateInvitationResponse> => {
    // 1. Validate caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to send invitations'
      );
    }

    const callerUid = context.auth.uid;
    const db = admin.firestore();

    try {
      // 2. Get caller's user document
      const callerDoc = await db.doc(`users/${callerUid}`).get();

      if (!callerDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User profile not found'
        );
      }

      const callerData = callerDoc.data();
      if (!callerData) {
        throw new functions.https.HttpsError(
          'not-found',
          'User profile not found'
        );
      }

      // 3. Determine caller's tenant (support both legacy and new structure)
      let currentTenantId: string | undefined;

      if (callerData.currentTenantId) {
        currentTenantId = callerData.currentTenantId;
      } else if (callerData.tenantMemberships) {
        // Get first active tenant membership
        const activeTenantIds = Object.keys(callerData.tenantMemberships).filter(
          tenantId => callerData.tenantMemberships[tenantId].isActive
        );
        currentTenantId = activeTenantIds[0];
      } else if (callerData.tenantId) {
        // Legacy support
        currentTenantId = callerData.tenantId;
      }

      if (!currentTenantId) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No active tenant found for user'
        );
      }

      // 4. Verify caller has admin role for this tenant
      let isAdmin = false;

      if (callerData.tenantMemberships && callerData.tenantMemberships[currentTenantId]) {
        isAdmin = callerData.tenantMemberships[currentTenantId].role === 'admin';
      } else if (callerData.role === 'admin' && callerData.tenantId === currentTenantId) {
        // Legacy support
        isAdmin = true;
      }

      if (!isAdmin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can send invitations'
        );
      }

      // 5. Validate email format
      const { email, role } = data;

      if (!email || typeof email !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Email is required'
        );
      }

      if (!isValidEmail(email)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid email format'
        );
      }

      // 6. Lowercase email for consistency
      const normalizedEmail = email.toLowerCase().trim();

      // 7. Validate role
      const validRoles = ['admin', 'staff', 'customer'];
      if (!role || !validRoles.includes(role)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Role must be one of: ${validRoles.join(', ')}`
        );
      }

      // 8. Check for duplicate active invitation
      const isDuplicate = await checkDuplicateInvitation(normalizedEmail, currentTenantId);

      if (isDuplicate) {
        throw new functions.https.HttpsError(
          'already-exists',
          `An active invitation already exists for ${normalizedEmail}`
        );
      }

      // 9. Check rate limit
      const rateLimitResult = await checkAndUpdateRateLimit(currentTenantId);

      if (!rateLimitResult.allowed) {
        const resetsAt = rateLimitResult.resetsAt!;
        const resetTime = resetsAt.toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        throw new functions.https.HttpsError(
          'resource-exhausted',
          `Rate limit exceeded. You can send 10 invitations per hour. Please try again at ${resetTime}.`
        );
      }

      // 10. Generate secure token
      const token = generateInvitationToken();

      // 11. Calculate expiration (72 hours)
      const expiresAt = calculateExpirationTime(72);
      const createdAt = new Date().toISOString();

      // 12. Create invitation document
      const invitationRef = db.collection('invitations').doc();

      const invitationData = {
        id: invitationRef.id,
        tenantId: currentTenantId,
        email: normalizedEmail,
        role,
        token,
        status: 'pending',
        invitedBy: callerUid,
        invitedByName: callerData.displayName || 'Admin',
        invitedByEmail: callerData.email || '',
        createdAt,
        expiresAt,
      };

      await invitationRef.set(invitationData);

      // 13. Increment invitation stats
      try {
        await incrementInvitationStats(currentTenantId);
      } catch (error) {
        // Non-critical error, just log it
        functions.logger.warn('Failed to update invitation stats:', error);
      }

      functions.logger.info('Invitation created successfully', {
        invitationId: invitationRef.id,
        email: normalizedEmail,
        role,
        tenantId: currentTenantId,
        invitedBy: callerUid,
      });

      // 14. Return success (email will be sent via onCreate trigger)
      return {
        success: true,
        invitationId: invitationRef.id,
      };

    } catch (error: any) {
      // Re-throw HttpsErrors as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Log unexpected errors
      functions.logger.error('Unexpected error in createInvitation:', error);

      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred while creating the invitation'
      );
    }
  }
);
