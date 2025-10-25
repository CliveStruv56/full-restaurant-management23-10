/**
 * Cloud Function: Send Invitation Email
 *
 * Background function triggered when an invitation document is created
 * Sends invitation email via Mailgun and updates invitation status
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendInvitationEmail as sendViaMailgun } from '../email/mailgun';
import { renderInvitationEmail } from '../email/templates';

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
  // Use environment variable for base URL from Firebase config
  const baseUrl = functions.config().app?.base_url || 'https://coffee-shop-mvp-4ff60.web.app';

  // For now, use simple URL structure (not subdomain-based)
  // Future: When custom domains are set up, switch to subdomain logic
  return `${baseUrl}/signup/${token}`;
}

/**
 * Main background function triggered on invitation creation
 */
export const sendInvitationEmailTrigger = functions
  .runWith({ secrets: ["SENDGRID_API_KEY"] })
  .firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snapshot, context) => {
    const invitationId = context.params.invitationId;
    const invitationData = snapshot.data();

    functions.logger.info('Sending invitation email', {
      invitationId,
      email: invitationData.email,
      tenantId: invitationData.tenantId,
    });

    const db = admin.firestore();
    const invitationRef = db.doc(`invitations/${invitationId}`);

    try {
      // 1. Get tenant metadata
      const { businessName, subdomain } = await getTenantMetadata(invitationData.tenantId);

      // 2. Construct signup URL
      const signupUrl = constructSignupUrl(subdomain, invitationData.token);

      // 3. Render email template
      const emailContent = renderInvitationEmail({
        recipientEmail: invitationData.email,
        inviterName: invitationData.invitedByName,
        inviterEmail: invitationData.invitedByEmail,
        businessName,
        role: invitationData.role,
        signupUrl,
        expirationDateTime: invitationData.expiresAt,
      });

      // 4. Send email via Mailgun
      const messageId = await sendViaMailgun(
        invitationData.email,
        emailContent.subject,
        emailContent.text,
        invitationData.tenantId
      );

      // 5. Update invitation with success
      await invitationRef.update({
        emailSentAt: new Date().toISOString(),
      });

      functions.logger.info('Invitation email sent successfully', {
        invitationId,
        messageId,
        email: invitationData.email,
      });

    } catch (error: any) {
      // 6. Handle errors - update invitation status
      functions.logger.error('Failed to send invitation email', {
        invitationId,
        email: invitationData.email,
        error: error.message,
        stack: error.stack,
      });

      // Update invitation with error status
      try {
        await invitationRef.update({
          status: 'error',
          error: `Failed to send email: ${error.message}`,
        });
      } catch (updateError) {
        functions.logger.error('Failed to update invitation with error status', {
          invitationId,
          updateError,
        });
      }

      // Don't throw - background functions should not fail
      // The error is logged and stored in the invitation document
    }
  });
