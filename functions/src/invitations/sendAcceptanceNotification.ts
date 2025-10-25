/**
 * Cloud Function: Send Acceptance Notification
 *
 * Background function triggered when an invitation status changes to 'accepted'
 * Sends notification email to the inviter (admin)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendAcceptanceNotificationEmail } from '../email/mailgun';
import { renderAcceptanceNotificationEmail } from '../email/templates';

/**
 * Get tenant metadata for business name
 */
async function getTenantMetadata(tenantId: string): Promise<{ businessName: string }> {
  const db = admin.firestore();
  const tenantDoc = await db.doc(`tenantMetadata/${tenantId}`).get();

  if (!tenantDoc.exists) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const tenantData = tenantDoc.data();
  return {
    businessName: tenantData?.businessName || 'OrderFlow',
  };
}

/**
 * Get user data for accepted user
 */
async function getUserData(userId: string): Promise<{ displayName: string; email: string }> {
  const db = admin.firestore();
  const userDoc = await db.doc(`users/${userId}`).get();

  if (!userDoc.exists) {
    throw new Error(`User not found: ${userId}`);
  }

  const userData = userDoc.data();
  return {
    displayName: userData?.displayName || 'User',
    email: userData?.email || '',
  };
}

/**
 * Main background function triggered on invitation update
 */
export const sendAcceptanceNotificationTrigger = functions
  .runWith({ secrets: ["SENDGRID_API_KEY"] })
  .firestore
  .document('invitations/{invitationId}')
  .onUpdate(async (change, context) => {
    const invitationId = context.params.invitationId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only proceed if status changed to 'accepted'
    if (beforeData.status === afterData.status || afterData.status !== 'accepted') {
      return; // Not a status change to 'accepted', exit
    }

    functions.logger.info('Sending acceptance notification', {
      invitationId,
      acceptedByUserId: afterData.acceptedByUserId,
      inviterEmail: afterData.invitedByEmail,
    });

    try {
      // 1. Get tenant metadata
      const { businessName } = await getTenantMetadata(afterData.tenantId);

      // 2. Get accepted user data
      const acceptedUser = await getUserData(afterData.acceptedByUserId);

      // 3. Render email template
      const emailContent = renderAcceptanceNotificationEmail({
        recipientEmail: afterData.invitedByEmail,
        inviterName: afterData.invitedByName,
        userName: acceptedUser.displayName,
        userEmail: acceptedUser.email,
        businessName,
        role: afterData.role,
      });

      // 4. Send email via Mailgun
      const messageId = await sendAcceptanceNotificationEmail(
        afterData.invitedByEmail,
        emailContent.subject,
        emailContent.text,
        afterData.tenantId
      );

      functions.logger.info('Acceptance notification sent successfully', {
        invitationId,
        messageId,
        inviterEmail: afterData.invitedByEmail,
      });

    } catch (error: any) {
      // Log error but don't fail the function
      functions.logger.error('Failed to send acceptance notification', {
        invitationId,
        inviterEmail: afterData.invitedByEmail,
        error: error.message,
        stack: error.stack,
      });

      // Don't throw - background functions should not fail
      // Acceptance has already happened, notification is a courtesy
    }
  });
