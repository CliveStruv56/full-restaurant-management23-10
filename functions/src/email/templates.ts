/**
 * Email Templates for User Invitation System
 *
 * All templates are plain text (no HTML) for maximum deliverability
 */

import { formatDateForEmail } from '../utils/tokens';

export interface InvitationEmailData {
  recipientEmail: string;
  inviterName: string;
  inviterEmail: string;
  businessName: string;
  role: string;
  signupUrl: string;
  expirationDateTime: string; // ISO 8601
}

export interface ReminderEmailData {
  recipientEmail: string;
  inviterName: string;
  inviterEmail: string;
  businessName: string;
  signupUrl: string;
  expirationDateTime: string; // ISO 8601
}

export interface AcceptanceNotificationData {
  recipientEmail: string; // inviter's email
  inviterName: string;
  userName: string;
  userEmail: string;
  businessName: string;
  role: string;
}

/**
 * Render invitation email
 */
export function renderInvitationEmail(data: InvitationEmailData): { subject: string; text: string } {
  const roleCapitalized = data.role.charAt(0).toUpperCase() + data.role.slice(1);
  const formattedExpiration = formatDateForEmail(data.expirationDateTime);

  const subject = `You've been invited to join ${data.businessName} on OrderFlow`;

  const text = `Hello,

${data.inviterName} has invited you to join ${data.businessName} as a ${roleCapitalized} on OrderFlow.

Click the link below to set up your account:
${data.signupUrl}

This invitation will expire in 72 hours (on ${formattedExpiration}).

If you have any questions, please contact ${data.inviterName} at ${data.inviterEmail}.

---
OrderFlow Restaurant Management System`;

  return { subject, text };
}

/**
 * Render reminder email
 */
export function renderReminderEmail(data: ReminderEmailData): { subject: string; text: string } {
  const formattedExpiration = formatDateForEmail(data.expirationDateTime);

  const subject = `Reminder: Your invitation to ${data.businessName} expires soon`;

  const text = `Hello,

This is a reminder that your invitation to join ${data.businessName} on OrderFlow will expire in approximately 24 hours.

Click the link below to set up your account:
${data.signupUrl}

This invitation will expire on ${formattedExpiration}.

If you have any questions, please contact ${data.inviterName} at ${data.inviterEmail}.

---
OrderFlow Restaurant Management System`;

  return { subject, text };
}

/**
 * Render acceptance notification email (sent to inviter)
 */
export function renderAcceptanceNotificationEmail(data: AcceptanceNotificationData): { subject: string; text: string } {
  const roleCapitalized = data.role.charAt(0).toUpperCase() + data.role.slice(1);

  const subject = `${data.userName} accepted your invitation to ${data.businessName}`;

  const text = `Hello ${data.inviterName},

${data.userName} (${data.userEmail}) has accepted your invitation and joined ${data.businessName} as a ${roleCapitalized}.

---
OrderFlow Restaurant Management System`;

  return { subject, text };
}
