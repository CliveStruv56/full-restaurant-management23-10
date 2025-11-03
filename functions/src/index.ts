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
 * Legacy Functions (to be refactored)
 *
 * Note: These are the old invitation functions that can be removed
 * once the new system is fully deployed and tested
 */

// Keeping exports organized for easy reference
// New functions follow the spec exactly as documented
