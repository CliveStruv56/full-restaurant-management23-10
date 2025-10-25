/**
 * SendGrid Email Sender
 *
 * Handles sending emails via SendGrid API
 */

import * as functions from 'firebase-functions';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  tags?: string[];
}

/**
 * Send email via SendGrid
 *
 * NOTE: This implementation uses the SendGrid API directly via fetch
 * The actual SendGrid credentials should be stored in Firebase Secret Manager
 *
 * @param options Email configuration
 * @returns Promise with message ID on success
 */
export async function sendEmail(options: EmailOptions): Promise<string> {
  // Get SendGrid configuration from environment variables
  const sendgridApiKey = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.api_key;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || functions.config().sendgrid?.from_email || 'clive@platform91.com';
  const fromName = process.env.SENDGRID_FROM_NAME || functions.config().sendgrid?.from_name || 'OrderFlow';

  if (!sendgridApiKey) {
    throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
  }

  // SendGrid API endpoint
  const sendgridUrl = 'https://api.sendgrid.com/v3/mail/send';

  // Prepare request body
  const body = {
    personalizations: [
      {
        to: [{ email: options.to }],
        subject: options.subject,
      },
    ],
    from: {
      email: fromEmail,
      name: fromName,
    },
    content: [
      {
        type: 'text/plain',
        value: options.text,
      },
    ],
    // Add custom args for tagging (visible in SendGrid analytics)
    custom_args: options.tags ? options.tags.reduce((acc, tag) => {
      const [key, value] = tag.includes(':') ? tag.split(':') : [tag, 'true'];
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) : {},
    // Enable click tracking
    tracking_settings: {
      click_tracking: {
        enable: false,
      },
      open_tracking: {
        enable: true,
      },
    },
  };

  // Send request to SendGrid
  const response = await fetch(sendgridUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error (${response.status}): ${errorText}`);
  }

  // SendGrid returns 202 with X-Message-Id header
  const messageId = response.headers.get('X-Message-Id') || 'unknown';

  functions.logger.info('Email sent successfully via SendGrid', {
    to: options.to,
    messageId: messageId,
  });

  return messageId;
}

/**
 * Send invitation email
 *
 * @param to Recipient email
 * @param subject Email subject
 * @param text Email body
 * @param tenantId Tenant ID for tagging
 */
export async function sendInvitationEmail(
  to: string,
  subject: string,
  text: string,
  tenantId: string
): Promise<string> {
  return sendEmail({
    to,
    subject,
    text,
    tags: ['invitation', `tenant:${tenantId}`],
  });
}

/**
 * Send reminder email
 *
 * @param to Recipient email
 * @param subject Email subject
 * @param text Email body
 * @param tenantId Tenant ID for tagging
 */
export async function sendReminderEmail(
  to: string,
  subject: string,
  text: string,
  tenantId: string
): Promise<string> {
  return sendEmail({
    to,
    subject,
    text,
    tags: ['reminder', `tenant:${tenantId}`],
  });
}

/**
 * Send acceptance notification email
 *
 * @param to Recipient email (inviter)
 * @param subject Email subject
 * @param text Email body
 * @param tenantId Tenant ID for tagging
 */
export async function sendAcceptanceNotificationEmail(
  to: string,
  subject: string,
  text: string,
  tenantId: string
): Promise<string> {
  return sendEmail({
    to,
    subject,
    text,
    tags: ['acceptance-notification', `tenant:${tenantId}`],
  });
}
