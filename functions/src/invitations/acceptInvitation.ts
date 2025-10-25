/**
 * Cloud Function: Accept Invitation
 *
 * HTTPS Callable function that allows invited users to complete signup
 * Creates Firebase Auth user and adds tenant membership
 * No authentication required (user doesn't exist yet)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isInvitationExpired } from '../utils/tokens';

interface AcceptInvitationData {
  token: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
}

interface AcceptInvitationResponse {
  success: boolean;
  customToken?: string;
  userId?: string;
  tenantId?: string;
  error?: string;
}

/**
 * Find invitation by token
 */
async function findInvitationByToken(token: string): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const db = admin.firestore();

  const invitationsQuery = await db
    .collection('invitations')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (invitationsQuery.empty) {
    return null;
  }

  return invitationsQuery.docs[0];
}

/**
 * Create or update user document with tenant membership
 */
async function createOrUpdateUserDocument(
  userId: string,
  email: string,
  displayName: string,
  phoneNumber: string | undefined,
  tenantId: string,
  role: string,
  invitedBy: string
): Promise<void> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${userId}`);
  const userDoc = await userRef.get();

  const now = new Date().toISOString();

  if (userDoc.exists) {
    // User exists - add new tenant membership (multi-tenant case)
    functions.logger.info('Adding tenant membership to existing user', {
      userId,
      tenantId,
      role,
    });

    const userData = userDoc.data();
    const tenantMemberships = userData?.tenantMemberships || {};

    // Add new tenant membership
    tenantMemberships[tenantId] = {
      role,
      joinedAt: now,
      invitedBy,
      isActive: true,
    };

    await userRef.update({
      tenantMemberships,
      currentTenantId: tenantId, // Set as current tenant
      // Update phone number if provided and not already set
      ...(phoneNumber && !userData?.phoneNumber && { phoneNumber }),
    });

  } else {
    // New user - create document with initial tenant membership
    functions.logger.info('Creating new user document', {
      userId,
      tenantId,
      role,
    });

    await userRef.set({
      uid: userId,
      email,
      displayName,
      phoneNumber: phoneNumber || null,
      createdAt: now,
      tenantMemberships: {
        [tenantId]: {
          role,
          joinedAt: now,
          invitedBy,
          isActive: true,
        },
      },
      currentTenantId: tenantId,
      loyaltyPoints: 0, // Initialize for backward compatibility
    });
  }
}

/**
 * Update invitation status to accepted
 */
async function markInvitationAsAccepted(
  invitationRef: FirebaseFirestore.DocumentReference,
  userId: string
): Promise<void> {
  await invitationRef.update({
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
    acceptedByUserId: userId,
  });
}

/**
 * Increment tenant acceptance stats
 */
async function incrementAcceptanceStats(tenantId: string): Promise<void> {
  const db = admin.firestore();
  const tenantMetadataRef = db.doc(`tenantMetadata/${tenantId}`);

  await tenantMetadataRef.update({
    'stats.totalInvitationsAccepted': admin.firestore.FieldValue.increment(1),
  });
}

/**
 * Main callable function
 */
export const acceptInvitation = functions.https.onCall(
  async (data: AcceptInvitationData, context): Promise<AcceptInvitationResponse> => {
    // Note: No authentication required - user doesn't exist yet

    try {
      // 1. Validate input parameters
      const { token, password, displayName, phoneNumber } = data;

      if (!token || typeof token !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Token is required'
        );
      }

      if (!password || typeof password !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Password is required'
        );
      }

      if (password.length < 8) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Password must be at least 8 characters'
        );
      }

      if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Display name is required'
        );
      }

      // 2. Query invitation by token
      const invitationDoc = await findInvitationByToken(token);

      if (!invitationDoc) {
        throw new functions.https.HttpsError(
          'not-found',
          'Invalid or expired invitation'
        );
      }

      const invitationData = invitationDoc.data();
      if (!invitationData) {
        throw new functions.https.HttpsError(
          'not-found',
          'Invalid invitation data'
        );
      }

      // 3. Verify status is pending
      if (invitationData.status !== 'pending') {
        if (invitationData.status === 'accepted') {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'This invitation has already been accepted. Please log in instead.'
          );
        } else if (invitationData.status === 'expired') {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'This invitation has expired. Please contact the administrator for a new invitation.'
          );
        } else {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'This invitation is no longer valid.'
          );
        }
      }

      // 4. Verify not expired
      if (isInvitationExpired(invitationData.expiresAt)) {
        // Mark as expired in database
        await invitationDoc.ref.update({ status: 'expired' });

        throw new functions.https.HttpsError(
          'failed-precondition',
          'This invitation has expired. Please contact the administrator for a new invitation.'
        );
      }

      const email = invitationData.email;
      const tenantId = invitationData.tenantId;
      const role = invitationData.role;
      const invitedBy = invitationData.invitedBy;

      let userId: string;
      let isNewUser = false;

      // 5. Check if Firebase Auth user already exists
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        userId = existingUser.uid;

        functions.logger.info('User already exists in Firebase Auth, adding tenant membership', {
          userId,
          email,
          tenantId,
        });

      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found') {
          // 6. Create new Firebase Auth user
          functions.logger.info('Creating new Firebase Auth user', { email });

          const newUser = await admin.auth().createUser({
            email,
            password,
            displayName: displayName.trim(),
            emailVerified: true, // Auto-verify invited users
          });

          userId = newUser.uid;
          isNewUser = true;

          functions.logger.info('Firebase Auth user created', { userId, email });

        } else {
          // Unexpected auth error
          functions.logger.error('Unexpected Firebase Auth error', {
            error: authError.message,
            code: authError.code,
          });

          throw new functions.https.HttpsError(
            'internal',
            'Failed to create user account. Please try again.'
          );
        }
      }

      // 7. If user exists but this is a new signup attempt with password, update password
      if (!isNewUser) {
        try {
          await admin.auth().updateUser(userId, {
            password,
            displayName: displayName.trim(),
          });

          functions.logger.info('Updated existing user password and display name', { userId });
        } catch (updateError) {
          functions.logger.warn('Failed to update user password', { userId, updateError });
          // Continue anyway - user can reset password if needed
        }
      }

      // 8. Create or update user document with tenant membership
      await createOrUpdateUserDocument(
        userId,
        email,
        displayName.trim(),
        phoneNumber,
        tenantId,
        role,
        invitedBy
      );

      // 9. Update invitation status to accepted
      await markInvitationAsAccepted(invitationDoc.ref, userId);

      // 10. Increment acceptance stats
      try {
        await incrementAcceptanceStats(tenantId);
      } catch (error) {
        // Non-critical error
        functions.logger.warn('Failed to update acceptance stats:', error);
      }

      // 11. Generate custom token for auto-login
      const customToken = await admin.auth().createCustomToken(userId);

      functions.logger.info('Invitation accepted successfully', {
        invitationId: invitationDoc.id,
        userId,
        email,
        tenantId,
        role,
        isNewUser,
      });

      // 12. Return success with custom token
      return {
        success: true,
        customToken,
        userId,
        tenantId,
      };

    } catch (error: any) {
      // Re-throw HttpsErrors as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Log unexpected errors
      functions.logger.error('Unexpected error in acceptInvitation:', error);

      throw new functions.https.HttpsError(
        'internal',
        'An unexpected error occurred while accepting the invitation'
      );
    }
  }
);
