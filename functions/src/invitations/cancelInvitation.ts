/**
 * Cancel Invitation Cloud Function
 *
 * Allows admins to cancel/delete pending invitations
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cancel an invitation
 * Only admins can cancel invitations for their tenant
 */
export const cancelInvitation = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to cancel invitations'
    );
  }

  const { invitationId } = data;

  if (!invitationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'invitationId is required'
    );
  }

  const db = admin.firestore();
  const invitationRef = db.collection('invitations').doc(invitationId);
  const invitationDoc = await invitationRef.get();

  if (!invitationDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Invitation not found'
    );
  }

  const invitationData = invitationDoc.data();

  if (!invitationData) {
    throw new functions.https.HttpsError(
      'not-found',
      'Invitation data not found'
    );
  }

  // Get caller's user data
  const userRef = db.collection('users').doc(context.auth.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (!userData) {
    throw new functions.https.HttpsError(
      'not-found',
      'User not found'
    );
  }

  const tenantId = invitationData.tenantId;

  // Check if user is admin for this tenant
  // Support both legacy (tenantId + role) and new (tenantMemberships) structures
  let isAdmin = false;

  if (userData.tenantMemberships && userData.tenantMemberships[tenantId]) {
    isAdmin = userData.tenantMemberships[tenantId].role === 'admin';
  } else if (userData.tenantId === tenantId) {
    isAdmin = userData.role === 'admin';
  }

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can cancel invitations'
    );
  }

  // Delete the invitation
  await invitationRef.delete();

  functions.logger.info('Invitation cancelled', {
    invitationId,
    tenantId,
    cancelledBy: context.auth.uid,
  });

  return {
    success: true,
    message: 'Invitation cancelled successfully',
  };
});
