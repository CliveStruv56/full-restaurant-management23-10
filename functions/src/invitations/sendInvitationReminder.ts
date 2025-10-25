/**
 * Cloud Function: Send Invitation Reminder
 *
 * Scheduled function that runs hourly to send reminder emails
 * for invitations expiring within the next 24 hours
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendReminderEmail } from '../email/mailgun';
import { renderReminderEmail } from '../email/templates';

/**
 * Get tenant metadata for business name
 */
async function getTenantMetadata(tenantId: string): Promise<{ businessName: string; subdomain: string }> {
  const db = admin.firestore();
  const tenantDoc = await db.doc(`tenantMetadata/${tenantId}`).get();

  if (!tenantDoc.exists) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  const tenantData = tenantDoc.data();
  return {
    businessName: tenantData?.businessName || 'OrderFlow',
    subdomain: tenantData?.subdomain || 'app',
  };
}

/**
 * Construct signup URL
 */
function constructSignupUrl(subdomain: string, token: string): string {
  const baseUrl = process.env.APP_BASE_URL || 'https://orderflow.app';

  if (subdomain === 'app' || subdomain === 'localhost') {
    return `${baseUrl}/signup/${token}`;
  }

  return `https://${subdomain}.orderflow.app/signup/${token}`;
}

/**
 * Send reminder for a single invitation
 */
async function sendReminder(invitationDoc: FirebaseFirestore.QueryDocumentSnapshot): Promise<boolean> {
  const invitationData = invitationDoc.data();
  const invitationId = invitationDoc.id;

  try {
    // Get tenant metadata
    const { businessName, subdomain } = await getTenantMetadata(invitationData.tenantId);

    // Construct signup URL
    const signupUrl = constructSignupUrl(subdomain, invitationData.token);

    // Render reminder email
    const emailContent = renderReminderEmail({
      recipientEmail: invitationData.email,
      inviterName: invitationData.invitedByName,
      inviterEmail: invitationData.invitedByEmail,
      businessName,
      signupUrl,
      expirationDateTime: invitationData.expiresAt,
    });

    // Send email via Mailgun
    const messageId = await sendReminderEmail(
      invitationData.email,
      emailContent.subject,
      emailContent.text,
      invitationData.tenantId
    );

    // Update invitation with reminderSentAt timestamp
    await invitationDoc.ref.update({
      reminderSentAt: new Date().toISOString(),
    });

    functions.logger.info('Reminder email sent successfully', {
      invitationId,
      messageId,
      email: invitationData.email,
    });

    return true;

  } catch (error: any) {
    functions.logger.error('Failed to send reminder email', {
      invitationId,
      email: invitationData.email,
      error: error.message,
    });

    return false;
  }
}

/**
 * Main scheduled function (runs every hour)
 */
export const sendInvitationReminderScheduled = functions
  .runWith({ secrets: ["SENDGRID_API_KEY"] })
  .pubsub
  .schedule('0 * * * *') // Every hour at minute 0
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('Starting invitation reminder job');

    const db = admin.firestore();
    const now = new Date();

    // Calculate time window: 24-25 hours from now (1-hour buffer for missed runs)
    const reminderStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    try {
      // Query invitations needing reminders
      const invitationsQuery = await db
        .collection('invitations')
        .where('status', '==', 'pending')
        .where('expiresAt', '>', reminderStart.toISOString())
        .where('expiresAt', '<=', reminderEnd.toISOString())
        .get();

      functions.logger.info(`Found ${invitationsQuery.size} invitations in reminder window`);

      if (invitationsQuery.empty) {
        functions.logger.info('No invitations need reminders at this time');
        return;
      }

      // Filter out invitations that already have reminders sent
      const invitationsNeedingReminders = invitationsQuery.docs.filter(
        doc => !doc.data().reminderSentAt
      );

      functions.logger.info(`Sending reminders for ${invitationsNeedingReminders.length} invitations`);

      // Send reminders (process sequentially to avoid rate limiting)
      let successCount = 0;
      let failureCount = 0;

      for (const invitationDoc of invitationsNeedingReminders) {
        const success = await sendReminder(invitationDoc);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }

        // Add small delay to avoid overwhelming Mailgun
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      functions.logger.info('Invitation reminder job complete', {
        total: invitationsNeedingReminders.length,
        success: successCount,
        failures: failureCount,
      });

    } catch (error: any) {
      functions.logger.error('Error in invitation reminder job', {
        error: error.message,
        stack: error.stack,
      });

      // Don't throw - we want the job to complete even if there are errors
    }
  });
