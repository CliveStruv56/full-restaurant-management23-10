import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * User Invitation System Functions
 *
 * Phase 2: Backend Implementation
 */

// Milestone 2.1: Invitation Creation Function
export { createInvitation } from './invitations/createInvitation';

// Milestone 2.2: Email Sending Functions
export { sendInvitationEmailTrigger } from './invitations/sendInvitationEmail';

// Milestone 2.3: Signup and Acceptance Function
export { validateInvitationToken } from './invitations/validateInvitationToken';
export { acceptInvitation } from './invitations/acceptInvitation';
export { cancelInvitation } from './invitations/cancelInvitation';

// Milestone 2.4: Scheduled Functions
export { sendInvitationReminderScheduled } from './invitations/sendInvitationReminder';
export { sendAcceptanceNotificationTrigger } from './invitations/sendAcceptanceNotification';
export { cleanupExpiredInvitationsScheduled } from './invitations/cleanupExpiredInvitations';

/**
 * Reservation System Functions
 *
 * Phase 3: Customer Flow Redesign - Milestone 4
 */

// Auto-cancellation scheduled function for no-show reservations
export { autoCancelNoShows } from './scheduledJobs';

/**
 * Payment Integration Functions
 *
 * Phase 4A: Stripe Payment Integration
 */

// Payment intent creation and webhook handling
export { createPaymentIntent, stripeWebhook } from './payments';

/**
 * Tenant Provisioning Functions
 *
 * Phase 0: Infrastructure - Tenant creation from VBP website signup
 */

// Tenant provisioning and subdomain availability check
export { provisionTenantFromWebsite, checkSubdomain } from './tenants';

/**
 * Billing Functions
 *
 * Phase 1B: Platform billing (Stripe subscriptions for tenant plans)
 */

// Checkout, portal, webhook, and trial expiry
export {
  createCheckoutSession,
  createPortalSession,
  billingWebhook,
  expireTrials,
} from './billing';
