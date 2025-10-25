# Specification: User Invitation System

## Executive Summary

The User Invitation System enables tenant administrators to invite staff, admins, and customers to join their restaurant/cafe via email-based invitations. The system supports multi-tenant users (one person can work for multiple restaurants), uses Cloud Functions for email delivery via Mailgun, and includes token-based secure signup flows with automatic role assignment.

This feature is critical for Phase 2 of the product roadmap, enabling proper user management and team collaboration within the multi-tenant SaaS platform.

## Goals and Success Criteria

### Primary Goals

1. Enable tenant admins to invite users with role-based access (admin, staff, customer)
2. Provide secure, token-based invitation flow with email verification
3. Support multi-tenant users (one email can belong to multiple tenants with different roles)
4. Implement rate limiting to prevent abuse
5. Create admin UI for tracking invitation status

### Success Criteria

- Admin can send invitation and user receives email within 60 seconds
- User can complete signup flow in under 2 minutes with valid token
- Multi-tenant users can switch between tenants seamlessly
- 95%+ email delivery rate via Mailgun
- Rate limiting prevents abuse (max 10 invitations/hour/tenant)
- Invitation list updates in real-time in admin panel
- Zero security vulnerabilities in token generation/validation
- Self-registered customers cannot access admin or staff features

## User Stories

### Admin User Stories

- As a restaurant admin, I want to invite staff members via email so they can access the admin panel and manage operations
- As a cafe admin, I want to see a list of pending invitations so I can track who has accepted
- As an admin, I want to receive notifications when someone accepts my invitation so I know when team members are onboarded
- As an admin, I want to assign roles during invitation so users have appropriate permissions from the start

### Invited User Stories

- As an invited user, I want to receive a clear email with signup instructions so I know what to do next
- As an invited user, I want to set my password and profile information so I can personalize my account
- As an invited user, I want to be automatically logged in after signup so I can start working immediately
- As an invited user working for multiple restaurants, I want to select which restaurant to access when I log in

### End Customer Stories

- As a restaurant patron, I want to self-register without an invitation so I can place orders online
- As a self-registered customer, I should only see customer features and not admin/staff tools

## Core Requirements

### Functional Requirements

**Invitation Creation**
- Admin provides email address and selects role (admin, staff, customer)
- System generates cryptographically secure token (32-byte random)
- System creates invitation record in Firestore with pending status
- System sends invitation email via Mailgun within 60 seconds
- Rate limiting enforced: maximum 10 invitations per hour per tenant
- Clear error messages shown if rate limit exceeded

**Invitation Email**
- Text-only email (no branding/logos)
- Contains inviter name, tenant name, role being assigned
- Includes secure signup link with token parameter
- States expiration time (72 hours from creation)
- Provides inviter contact information

**Reminder System**
- Scheduled function runs hourly to check for expiring invitations
- Reminder email sent 24 hours before expiration
- Reminder only sent once per invitation

**Signup Flow**
- User clicks link in email, redirected to `/signup/:token`
- System validates token (exists, not expired, status is pending)
- Form displays pre-filled email (read-only)
- User enters: display name (required), password (required, 8 char min), phone number (optional)
- On submit, system creates Firebase Auth user with email/password
- System creates or updates user document in Firestore with tenant membership
- User auto-logged in using custom token
- Admin receives acceptance notification email

**Multi-Tenant User Support**
- User identified by email address (Firebase Auth email)
- User document contains `tenantMemberships` object mapping tenantId to role/metadata
- User can be invited to multiple tenants with different roles
- Login flow checks if user belongs to multiple tenants
- If multiple tenants, show tenant selector screen
- Last selected tenant stored in localStorage for convenience

**Self-Registration Flow**
- Public signup page at `/register` for end customers
- Form fields: email, display name, password, phone number (optional)
- Automatically assigns "customer" role
- Associates user with tenant based on subdomain detection
- Auto-login after successful registration
- No invitation required

**Invitation Tracking**
- Admin panel shows table of all invitations for current tenant
- Columns: Email, Role, Status, Invited By, Date, Accepted Date
- Real-time updates via Firestore listener
- Status badges: pending (yellow), accepted (green), expired (gray), error (red)
- Shows who sent invitation and when

**Rate Limiting**
- Maximum 10 invitations per hour per tenant
- Counter stored in `/tenantMetadata/{tenantId}/invitationRateLimit`
- Counter resets hourly based on timestamp
- Clear error message: "Rate limit exceeded. You can send 10 invitations per hour. Please try again at [time]."

### Non-Functional Requirements

**Security**
- Tokens generated using `crypto.randomBytes(32)` and stored as hex strings
- HTTPS-only signup links
- Email validation on server side
- Tokens cannot be reused (status checked before acceptance)
- Role verification in security rules
- Audit log of all invitation creations and acceptances

**Performance**
- Email delivery within 60 seconds of invitation creation
- Signup page loads in under 2 seconds
- Token validation response under 500ms
- Real-time invitation list updates within 200ms

**Reliability**
- Email sending failures logged to Firestore
- Failed invitations marked with error status and message
- Retry logic for transient Mailgun API failures
- Graceful degradation if email service unavailable

## Visual Design

No visual mockups provided. Implementation will follow existing admin panel patterns.

### UI Components Required

**InvitationManager Component (Admin Panel)**
- Card-style layout matching existing admin components
- "Invite User" button in top-right (primary color: #2a9d8f)
- Modal overlay for invitation form
- Form fields: email (text input with validation), role (dropdown)
- Submit button disabled if form invalid
- Invitations table with sortable columns
- Status badges using color-coding
- Empty state when no invitations exist
- Loading state during API calls

**InvitationSignup Page**
- Clean, centered layout similar to authentication pages
- Page title: "Complete Your Account Setup"
- Welcoming message with tenant name
- Form card with shadow/border radius matching app theme
- Email field (pre-filled, disabled/gray)
- Display name field with placeholder "Enter your full name"
- Password field with strength indicator
- Phone number field with placeholder "(Optional) +44 7xxx xxx xxx"
- Submit button: "Create Account & Sign In"
- Error states for invalid/expired tokens

**TenantSelector Component**
- Modal overlay preventing background interaction
- Title: "Select Your Workspace"
- Card for each tenant showing: business name, role badge, "Select" button
- Cards highlight on hover
- Last selected tenant indicated with checkmark

**Self-Registration Page**
- Similar layout to InvitationSignup
- Page title: "Create Your Account"
- All fields editable (email, display name, password, phone)
- Submit button: "Sign Up"
- Link to login page: "Already have an account? Sign in"

### Responsive Design

- All forms mobile-optimized (single column on small screens)
- Touch-friendly button sizes (minimum 44x44px)
- Modal dialogs adapt to screen width
- Table scrolls horizontally on mobile

## Database Schema

### Collection: `/invitations/{invitationId}`

```typescript
{
  id: string;                    // Auto-generated Firestore document ID
  tenantId: string;              // Tenant this invitation is for
  email: string;                 // Invitee email address (lowercase)
  role: 'admin' | 'staff' | 'customer'; // Role to assign
  token: string;                 // Unique 64-character hex token
  status: 'pending' | 'accepted' | 'expired' | 'error';
  invitedBy: string;             // User ID of admin who sent invitation
  invitedByName: string;         // Display name of inviting admin
  invitedByEmail: string;        // Email of inviting admin (for contact)
  createdAt: Timestamp;          // When invitation was created
  expiresAt: Timestamp;          // 72 hours after createdAt
  acceptedAt?: Timestamp;        // When user completed signup
  acceptedByUserId?: string;     // Firebase Auth UID of accepted user
  reminderSentAt?: Timestamp;    // When reminder email was sent
  error?: string;                // Error message if email failed
}
```

**Indexes Required:**
- `tenantId` (for admin queries)
- `token` (for signup validation)
- `status` + `expiresAt` (for reminder queries)
- `email` + `tenantId` (for duplicate detection)

### Collection: `/users/{userId}` (Extended)

```typescript
{
  id: string;                    // Firebase Auth UID
  email: string;                 // User's email (lowercase)
  displayName: string;           // User's display name
  phoneNumber?: string;          // Optional phone number
  createdAt: Timestamp;          // Account creation time
  tenantMemberships: {           // NEW: Multi-tenant support
    [tenantId: string]: {
      role: 'admin' | 'staff' | 'customer';
      joinedAt: Timestamp;
      invitedBy?: string;        // User ID of inviting admin (if invited)
      isActive: boolean;         // Can be deactivated without deletion
    }
  };
  currentTenantId?: string;      // Last selected tenant (for UX)
  loyaltyPoints: number;         // Legacy field (per-tenant in future)
}
```

**Migration Required:** Existing users need `tenantMemberships` structure added.

### Collection: `/tenantMetadata/{tenantId}` (Extended)

```typescript
{
  // ... existing fields ...
  invitationRateLimit: {
    lastResetAt: Timestamp;      // When counter was last reset
    invitationsSentThisHour: number; // Current count
  };
  stats: {                       // NEW: Invitation statistics
    totalInvitationsSent: number;
    totalInvitationsAccepted: number;
  };
}
```

## Cloud Functions Specifications

### Function: `createInvitation` (Callable)

**Trigger:** HTTPS Callable Function

**Input:**
```typescript
{
  email: string;      // Invitee email (will be lowercased)
  role: 'admin' | 'staff' | 'customer';
}
```

**Authentication:** Requires authenticated user

**Authorization:** User must be admin of current tenant

**Logic:**
1. Validate caller is authenticated
2. Get caller's tenant from `/users/{uid}` document
3. Verify caller has admin role for tenant
4. Validate email format (RFC 5322)
5. Lowercase email for consistency
6. Check for duplicate active invitation (same email + tenantId)
7. Check rate limit from `/tenantMetadata/{tenantId}/invitationRateLimit`
8. If limit reached, return error with reset time
9. Generate secure token: `crypto.randomBytes(32).toString('hex')`
10. Calculate expiration: `now + 72 hours`
11. Create invitation document in `/invitations/{randomId}`
12. Increment rate limit counter
13. Trigger `sendInvitationEmail` via Firestore create event
14. Return `{ success: true, invitationId: string }`

**Error Handling:**
- `unauthenticated`: Not logged in
- `permission-denied`: Not an admin of tenant
- `invalid-argument`: Invalid email or role
- `already-exists`: Active invitation already exists for this email+tenant
- `resource-exhausted`: Rate limit exceeded

### Function: `sendInvitationEmail` (Background)

**Trigger:** Firestore document created at `/invitations/{invitationId}`

**Logic:**
1. Read invitation document
2. Read tenant metadata to get business name
3. Read inviter user document to get display name and email
4. Construct signup URL: `https://{subdomain}.orderflow.app/signup/{token}`
5. Render email template with variables
6. Send email via Mailgun API
7. If success: update invitation with `emailSentAt` timestamp
8. If failure: update invitation status to 'error' and log error message

**Email Template:**
```
Subject: You've been invited to join {businessName} on OrderFlow

Hello,

{inviterName} has invited you to join {businessName} as a {role} on OrderFlow.

Click the link below to set up your account:
{signupUrl}

This invitation will expire in 72 hours (on {expirationDateTime}).

If you have any questions, please contact {inviterName} at {inviterEmail}.

---
OrderFlow Restaurant Management System
```

**Error Handling:**
- Log all errors to Cloud Functions logs
- Update invitation document with error details
- Do not throw exceptions (background function)

### Function: `sendInvitationReminder` (Scheduled)

**Trigger:** Cloud Scheduler (runs every hour: `0 * * * *`)

**Logic:**
1. Query `/invitations` where:
   - `status == 'pending'`
   - `expiresAt > now`
   - `expiresAt < now + 25 hours` (1-hour buffer for missed runs)
   - `reminderSentAt` does not exist
2. For each invitation:
   - Read tenant metadata for business name
   - Render reminder email template
   - Send via Mailgun
   - Update `reminderSentAt` timestamp
3. Log count of reminders sent

**Email Template:**
```
Subject: Reminder: Your invitation to {businessName} expires soon

Hello,

This is a reminder that your invitation to join {businessName} on OrderFlow will expire in approximately 24 hours.

Click the link below to set up your account:
{signupUrl}

If you have any questions, please contact {inviterName} at {inviterEmail}.

---
OrderFlow Restaurant Management System
```

### Function: `acceptInvitation` (Callable)

**Trigger:** HTTPS Callable Function

**Input:**
```typescript
{
  token: string;
  password: string;      // Minimum 8 characters (Firebase Auth default)
  displayName: string;
  phoneNumber?: string;
}
```

**Authentication:** Not required (user doesn't exist yet)

**Logic:**
1. Validate input parameters
2. Query `/invitations` where `token == token`
3. If not found, return `{ success: false, error: 'Invalid or expired invitation' }`
4. Verify `status == 'pending'`
5. Verify `expiresAt > now`
6. Create Firebase Auth user with `createUserWithEmailAndPassword()`
7. Update Firebase Auth profile with display name
8. Check if user document exists (multi-tenant case)
9. If exists: add tenant membership to existing document
10. If new: create user document with tenant membership
11. Update invitation status to 'accepted', set `acceptedAt` and `acceptedByUserId`
12. Generate custom token for auto-login
13. Trigger acceptance notification email
14. Return `{ success: true, customToken: string, userId: string }`

**Error Handling:**
- `invalid-argument`: Missing or invalid parameters
- `not-found`: Token doesn't exist
- `failed-precondition`: Invitation expired or already used
- `already-exists`: Email already registered in Firebase Auth (use error message to guide to login)

### Function: `sendAcceptanceNotification` (Background)

**Trigger:** Firestore document updated at `/invitations/{invitationId}` where `status` changes to 'accepted'

**Logic:**
1. Read invitation document
2. Read tenant metadata for business name
3. Read accepted user document for display name
4. Read inviter user document for email
5. Send notification email to inviter

**Email Template:**
```
Subject: {userName} accepted your invitation to {businessName}

Hello {inviterName},

{userName} ({userEmail}) has accepted your invitation and joined {businessName} as a {role}.

---
OrderFlow Restaurant Management System
```

### Function: `cleanupExpiredInvitations` (Scheduled)

**Trigger:** Cloud Scheduler (runs daily at 2 AM UTC: `0 2 * * *`)

**Logic:**
1. Query `/invitations` where:
   - `status == 'pending'`
   - `expiresAt < now`
2. Batch update all to `status = 'expired'`
3. Log count of expired invitations

## Security and Permissions Model

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function hasRole(tenantId, allowedRoles) {
      let userData = getUserData();
      return tenantId in userData.tenantMemberships
        && userData.tenantMemberships[tenantId].role in allowedRoles
        && userData.tenantMemberships[tenantId].isActive == true;
    }

    // Invitations collection
    match /invitations/{invitationId} {
      // Admins can read their tenant's invitations
      allow read: if isAuthenticated()
        && hasRole(resource.data.tenantId, ['admin']);

      // Only Cloud Functions can create/update invitations
      // (Cloud Functions use Admin SDK which bypasses rules)
      allow create, update: if false;

      // No one can delete invitations (audit trail)
      allow delete: if false;
    }

    // Users collection
    match /users/{userId} {
      // Users can read their own document
      allow read: if isAuthenticated() && request.auth.uid == userId;

      // Users can update their own profile fields (except tenantMemberships)
      allow update: if isAuthenticated()
        && request.auth.uid == userId
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['tenantMemberships', 'createdAt']);

      // Only Cloud Functions can create users or modify tenant memberships
      allow create: if false;
    }

    // Tenant metadata - admin read only
    match /tenantMetadata/{tenantId} {
      allow read: if isAuthenticated() && hasRole(tenantId, ['admin']);
      allow write: if false; // Only Cloud Functions can update
    }
  }
}
```

### Firebase Storage Rules

No changes required for this feature.

### Environment Variables (Cloud Functions)

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.orderflow.app
MAILGUN_FROM_EMAIL=noreply@orderflow.app
MAILGUN_FROM_NAME=OrderFlow

# Application URLs
APP_BASE_URL=https://orderflow.app
```

Store sensitive values in Firebase Secret Manager:
```bash
firebase functions:secrets:set MAILGUN_API_KEY
```

## Integration Points with Existing System

### AuthContext Updates

**Current State:** Basic email/password authentication with single tenant assignment.

**Required Changes:**
1. Extend `signup()` to support multi-tenant memberships structure
2. Add `switchTenant(tenantId: string)` method to context
3. Update `user` state to include `tenantMemberships` object
4. Add `currentTenantId` to context state
5. Load tenant memberships on auth state change
6. Check for multiple tenants on login and show selector if needed

**New Context Methods:**
```typescript
interface AuthContextType {
  // ... existing fields ...
  currentTenantId: string | null;
  tenantMemberships: User['tenantMemberships'];
  switchTenant: (tenantId: string) => Promise<void>;
  signupWithInvitation: (token: string, displayName: string, password: string, phoneNumber?: string) => Promise<void>;
}
```

### TenantContext Updates

No changes required. Current implementation already handles tenant detection and loading.

### Admin Panel Updates

**Add Navigation Item:**
- New sidebar button: "Team" or "Users" with icon
- Routes to InvitationManager component
- Only visible to admin role

**Update AdminPanel Component:**
```typescript
case 'team':
  return <InvitationManager />;
```

### API Functions (firebase/api-multitenant.ts)

**New Functions to Add:**
```typescript
// Get invitations for a tenant (client-side listener)
export const streamInvitations = (
  tenantId: string,
  callback: (invitations: Invitation[]) => void
) => { ... }

// Check if user can invite (rate limit check - client-side preview)
export const checkInvitationRateLimit = async (
  tenantId: string
): Promise<{ canInvite: boolean; resetsAt?: Date }> => { ... }
```

Note: Actual invitation creation happens via Cloud Function to ensure security.

## Email Templates and Content

### Template Variables

All email templates use these standard variables:
- `{businessName}`: Tenant business name
- `{inviterName}`: Display name of admin who sent invitation
- `{inviterEmail}`: Email of inviting admin
- `{role}`: Role being assigned (capitalized)
- `{signupUrl}`: Full URL to signup page with token
- `{expirationDateTime}`: Human-readable expiration date/time
- `{userName}`: Display name of invited user (acceptance email only)
- `{userEmail}`: Email of invited user (acceptance email only)

### Text-Only Format

All emails are plain text (no HTML) to ensure maximum deliverability and simplicity.

**Line length:** Maximum 78 characters per line
**Encoding:** UTF-8
**Line endings:** CRLF (\r\n)

### Mailgun Integration

**API Endpoint:** `https://api.mailgun.net/v3/{domain}/messages`

**Request Format:**
```typescript
{
  from: 'OrderFlow <noreply@orderflow.app>',
  to: recipientEmail,
  subject: emailSubject,
  text: emailBody,
  'o:tag': ['invitation', 'tenant:{tenantId}'],
  'o:tracking': 'yes',
  'o:tracking-clicks': 'no'
}
```

**Error Handling:**
- 200: Success, log message ID
- 400: Bad request, log error and mark invitation as error
- 401: Authentication failed, alert admin
- 402: Payment required, alert admin (Mailgun account issue)
- 429: Rate limit, retry with exponential backoff
- 500+: Server error, retry up to 3 times

## Reusable Components from Existing Codebase

### Existing Patterns to Leverage

**Modal Overlay Pattern:**
- Use existing modal styling from `ProductOptionsModal.tsx`
- Overlay: `styles.modalOverlay` with onClick close
- Content: `styles.optionsModalContent` with stopPropagation
- Header: `styles.modalHeader` with title and close button

**Form Input Patterns:**
- Follow `SettingsManager.tsx` controlled input pattern
- Use `useState` for form data
- Validation on submit
- Disabled state during API calls
- Success/error toast notifications (react-hot-toast)

**Real-Time Data Streaming:**
- Use `streamOrders`, `streamProducts` pattern from `api-multitenant.ts`
- Firestore `onSnapshot` with cleanup in `useEffect` return
- Set loading state while initial data loads

**Admin Panel Layout:**
- Follow `AdminPanel.tsx` structure with sidebar navigation
- Use existing `styles.adminContainer`, `styles.adminMain`
- Consistent header styling with `styles.adminHeader`

**Authentication Context:**
- Extend existing `AuthContext.tsx` pattern
- Add methods to context without breaking existing functionality
- Maintain loading states during async operations

### New Components Required

**InvitationManager.tsx:**
- Main admin component for invitation management
- Table view with real-time updates
- Modal form for creating invitations
- Status badges and filtering

**InvitationSignup.tsx:**
- Public page for invited users
- Token validation on mount
- Account creation form
- Auto-login on success

**TenantSelector.tsx:**
- Modal for multi-tenant users
- Shows all accessible tenants
- Switches context on selection
- Stores preference in localStorage

**SelfRegistrationPage.tsx:**
- Public signup for end customers
- Similar to InvitationSignup but all fields editable
- Auto-detects tenant from subdomain
- Assigns customer role by default

## Technical Approach

### Multi-Tenant User Data Model

**Problem:** Original design assumed one user = one tenant. Now users can work for multiple restaurants.

**Solution:** Replace single `tenantId` field with `tenantMemberships` object:

```typescript
// OLD (current)
{
  uid: 'user123',
  email: 'staff@example.com',
  tenantId: 'cafe-a'
}

// NEW (multi-tenant)
{
  uid: 'user123',
  email: 'staff@example.com',
  tenantMemberships: {
    'cafe-a': { role: 'staff', joinedAt: Timestamp, invitedBy: 'admin1', isActive: true },
    'cafe-b': { role: 'admin', joinedAt: Timestamp, invitedBy: 'admin2', isActive: true }
  },
  currentTenantId: 'cafe-a' // Last selected
}
```

**Migration Strategy:**
1. Add `tenantMemberships` field to existing users via Cloud Function
2. Copy existing `tenantId` and `role` into memberships object
3. Keep legacy `tenantId` field for backward compatibility temporarily
4. Update all queries to use `tenantMemberships` after migration

### Token Security

**Generation:**
```typescript
import * as crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex'); // 64-character hex string
```

**Storage:** Tokens stored in plaintext in `/invitations` collection. This is acceptable because:
- Tokens are single-use (status checked before acceptance)
- Tokens expire after 72 hours
- Access to Firestore requires authentication
- No sensitive data in token itself (just a random string)

**Validation:** Server-side only (Cloud Function), never client-side JavaScript.

### Rate Limiting Implementation

**Data Structure:**
```typescript
{
  invitationRateLimit: {
    lastResetAt: Timestamp(2025-10-25T10:00:00Z),
    invitationsSentThisHour: 7
  }
}
```

**Algorithm:**
1. On invite creation, read current counter and timestamp
2. If `now - lastResetAt > 1 hour`, reset counter to 0 and update timestamp
3. If counter >= 10, return error with reset time
4. Else, increment counter and allow invitation
5. Use Firestore transaction to prevent race conditions

**Client-Side Preview:**
- Read rate limit data to show warning when approaching limit
- Display count: "7/10 invitations sent this hour"
- Show reset time: "Limit resets at 11:00 AM"

### Email Deliverability

**Best Practices:**
1. Use verified Mailgun domain (SPF, DKIM, DMARC configured)
2. Keep emails under 100KB
3. Plain text only (higher deliverability than HTML)
4. Include unsubscribe link (future enhancement)
5. Monitor bounce rates and spam complaints
6. Use consistent "from" address and name

**Monitoring:**
- Log all email sends to Firestore
- Track delivery status via Mailgun webhooks (future)
- Alert admin if failure rate > 5%

### Offline Support

**Limitation:** This feature requires online connectivity for:
- Creating invitations (calls Cloud Function)
- Sending emails
- Validating tokens
- Creating user accounts

**Graceful Degradation:**
- Show offline indicator if network unavailable
- Queue invitation creation attempts (retry when online)
- Invitation list uses Firestore offline cache (read-only)

## Out of Scope Items

The following features are explicitly excluded from this implementation and may be added in future iterations:

**Invitation Management:**
- Bulk invitation uploads via CSV
- Invitation revocation (canceling pending invitations)
- Resending expired invitations with same link
- User explicitly declining invitations
- Custom invitation messages from admin
- Invitation templates with variables
- Invitation analytics (acceptance rates, time-to-accept)

**User Management:**
- Admin ability to delete/deactivate users
- User profile editing after signup
- Changing user roles after invitation
- Removing users from tenant
- User permission management beyond role
- Two-factor authentication
- SSO/SAML integration

**Email Enhancements:**
- Email branding (tenant logos, colors)
- HTML email templates
- Invitation expiry notifications (separate from reminder)
- Weekly digest of pending invitations for admins
- Email personalization based on role
- Internationalization (different languages)

**Communication:**
- SMS notifications for invitations
- Phone number verification
- In-app notifications (push notifications)
- Slack/Teams integration for notifications

**Advanced Features:**
- Invitation links with unlimited uses (public signup links)
- Invitation quotas per tenant plan
- Temporary guest access (time-limited roles)
- Role-based invitation templates
- Custom signup flows per tenant
- Integration with third-party HR systems

## Implementation Phases and Milestones

### Phase 1: Foundation (Days 1-3)

**Milestone 1.1: Database Schema and Security Rules**
- Create `/invitations` collection structure
- Update `/users` schema to support `tenantMemberships`
- Write Firestore security rules for invitations
- Test security rules with Firebase Emulator
- **Deliverable:** Schema documented, rules deployed, tests passing

**Milestone 1.2: Cloud Functions Setup**
- Initialize Cloud Functions project structure
- Configure Mailgun API credentials in Secret Manager
- Create helper functions for email rendering
- Set up Cloud Scheduler for reminder and cleanup functions
- **Deliverable:** Functions project structure ready, secrets configured

**Milestone 1.3: Multi-Tenant User Migration**
- Write migration script for existing users
- Add `tenantMemberships` to all users
- Update AuthContext to handle new structure
- Test with existing users
- **Deliverable:** All existing users migrated, AuthContext updated

### Phase 2: Backend Implementation (Days 4-6)

**Milestone 2.1: Invitation Creation Function**
- Implement `createInvitation` callable function
- Add rate limiting logic
- Add duplicate invitation checking
- Add token generation
- Write unit tests
- **Deliverable:** Working invitation creation with tests

**Milestone 2.2: Email Sending Functions**
- Implement `sendInvitationEmail` background function
- Implement Mailgun API integration
- Add error handling and logging
- Test with real email delivery
- **Deliverable:** Emails sending successfully

**Milestone 2.3: Signup and Acceptance Function**
- Implement `acceptInvitation` callable function
- Add token validation logic
- Add Firebase Auth user creation
- Add multi-tenant user handling
- Write unit tests
- **Deliverable:** Working signup flow with tests

**Milestone 2.4: Scheduled Functions**
- Implement `sendInvitationReminder` scheduled function
- Implement `sendAcceptanceNotification` background function
- Implement `cleanupExpiredInvitations` scheduled function
- Configure Cloud Scheduler triggers
- **Deliverable:** All scheduled functions working

### Phase 3: Frontend Implementation (Days 7-10)

**Milestone 3.1: InvitationManager Component**
- Create invitation table with real-time updates
- Implement "Invite User" modal form
- Add form validation and error handling
- Add status badges and filtering
- Style to match admin panel
- **Deliverable:** Working invitation management UI

**Milestone 3.2: InvitationSignup Page**
- Create signup page at `/signup/:token`
- Add token validation on mount
- Create signup form
- Implement auto-login on success
- Add error states for invalid/expired tokens
- **Deliverable:** Working signup flow for invited users

**Milestone 3.3: TenantSelector Component**
- Create tenant selector modal
- Load user's tenant memberships
- Implement tenant switching logic
- Add localStorage persistence
- Style to match app theme
- **Deliverable:** Multi-tenant switching working

**Milestone 3.4: Self-Registration Page**
- Create public signup page at `/register`
- Implement form with validation
- Auto-detect tenant from subdomain
- Auto-assign customer role
- Add auto-login on success
- **Deliverable:** Self-registration working for customers

### Phase 4: Testing and Polish (Days 11-12)

**Milestone 4.1: Integration Testing**
- Test end-to-end invitation flow (admin → email → signup → login)
- Test multi-tenant user scenarios
- Test rate limiting with rapid invitations
- Test expired invitation handling
- Test email delivery and reminders
- **Deliverable:** All core flows tested and working

**Milestone 4.2: Error Handling and Edge Cases**
- Test with invalid tokens
- Test with expired invitations
- Test duplicate invitations
- Test rate limit exceeded
- Test Mailgun API failures
- Test Firebase Auth errors
- **Deliverable:** Robust error handling in place

**Milestone 4.3: UI Polish and Accessibility**
- Add loading states to all async operations
- Add success/error toast notifications
- Ensure keyboard navigation works
- Test on mobile devices
- Add ARIA labels for screen readers
- **Deliverable:** Polished, accessible UI

**Milestone 4.4: Documentation and Deployment**
- Document environment variables setup
- Document Mailgun configuration
- Write admin user guide
- Deploy to staging environment
- **Deliverable:** Feature ready for production

### Phase 5: Production Deployment (Days 13-14)

**Milestone 5.1: Staging Testing**
- Deploy all functions to staging
- Deploy frontend to staging
- Test with real email addresses
- Invite test users and verify flow
- Monitor Cloud Functions logs
- **Deliverable:** Feature working on staging

**Milestone 5.2: Production Deployment**
- Deploy Cloud Functions to production
- Deploy frontend to production
- Update Firestore security rules
- Monitor first 24 hours for errors
- **Deliverable:** Feature live in production

**Total Timeline:** 14 days (2 weeks) with 1 developer

## Risk Analysis

### Technical Risks

**Risk 1: Email Deliverability Issues**
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:**
  - Use established provider (Mailgun) with good reputation
  - Configure SPF, DKIM, DMARC properly
  - Monitor bounce rates and spam complaints
  - Test with multiple email providers (Gmail, Outlook, etc.)
  - Have fallback to manual invitation copy/paste

**Risk 2: Rate Limiting Race Conditions**
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:**
  - Use Firestore transactions for counter updates
  - Add server-side validation as final check
  - Log all rate limit events for monitoring
  - Set conservative limits (10/hour very low risk)

**Risk 3: Token Security Vulnerabilities**
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - Use cryptographically secure random generation
  - 64-character tokens = 2^256 possible values (brute force impossible)
  - Short expiration time (72 hours)
  - Single-use tokens (status checked)
  - HTTPS-only links

**Risk 4: Multi-Tenant Data Leakage**
- **Likelihood:** Low
- **Impact:** Critical
- **Mitigation:**
  - Comprehensive Firestore security rules
  - Security rule unit tests
  - Test cross-tenant access attempts
  - Regular security audits
  - Principle of least privilege in all queries

**Risk 5: Firebase Auth User Conflicts**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Check if email exists before creating user
  - Handle existing user case gracefully
  - Provide clear error message to contact support
  - Admin can resend to different email if needed

### Product Risks

**Risk 6: Invitation Spam/Abuse**
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:**
  - Rate limiting (10/hour very conservative)
  - Admin-only invitation creation
  - Audit log of all invitations
  - Monitor for patterns of abuse
  - Can blacklist email domains if needed

**Risk 7: User Confusion on Multi-Tenant Login**
- **Likelihood:** Medium
- **Impact:** Low
- **Mitigation:**
  - Clear tenant selector UI with business names
  - Remember last selected tenant
  - Provide visual cues (logos in future)
  - Document in user guide
  - Add help text in UI

**Risk 8: Low Invitation Acceptance Rate**
- **Likelihood:** Low
- **Impact:** Low
- **Mitigation:**
  - Clear, professional email copy
  - Reminder email 24 hours before expiry
  - 72-hour window (generous)
  - Provide inviter contact for questions
  - Track acceptance rates to identify issues

### Operational Risks

**Risk 9: Mailgun Service Outage**
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:**
  - Retry logic for transient failures
  - Log failed sends for manual retry
  - Admin can view pending invitations
  - Have backup email provider ready (SendGrid)
  - Monitor Mailgun status page

**Risk 10: Cloud Functions Cold Start Delays**
- **Likelihood:** Medium
- **Impact:** Low
- **Mitigation:**
  - Set minimum instances for critical functions
  - Optimize function code size
  - Accept 3-5 second delay on first invite (rare)
  - Show loading state in UI
  - Consider Cloud Run for production if needed

## Acceptance Criteria

### Admin Invitation Flow

- [ ] Admin can access "Team" or "Users" section in admin panel
- [ ] Admin can click "Invite User" button to open modal
- [ ] Admin can enter email address with validation (shows error for invalid format)
- [ ] Admin can select role from dropdown (admin, staff, customer)
- [ ] Admin can submit invitation and see success message
- [ ] Admin can see invitation appear in table with "pending" status
- [ ] Admin receives error if rate limit exceeded with clear message
- [ ] Admin cannot send duplicate invitation to same email+tenant
- [ ] Admin can see who sent each invitation and when
- [ ] Admin can filter invitations by status

### Email Delivery

- [ ] Invitation email arrives within 60 seconds of creation
- [ ] Email contains correct business name, inviter name, role
- [ ] Email contains working signup link with token
- [ ] Email states expiration time clearly
- [ ] Email provides inviter contact information
- [ ] Reminder email sent approximately 24 hours before expiration
- [ ] Acceptance notification email sent to inviter when user signs up
- [ ] Failed email sends marked as error in invitation table

### Signup Flow

- [ ] User can click link in email and reach signup page
- [ ] Email field pre-filled and disabled
- [ ] Form validates all required fields (display name, password)
- [ ] Password meets minimum 8 character requirement
- [ ] Phone number is optional and accepts international formats
- [ ] Submit button disabled until form valid
- [ ] User sees error for invalid/expired tokens
- [ ] User sees error for already-used tokens
- [ ] Successful signup creates Firebase Auth account
- [ ] Successful signup creates/updates user document with tenant membership
- [ ] User automatically logged in after signup
- [ ] User redirected to appropriate page based on role

### Multi-Tenant Functionality

- [ ] User invited to multiple tenants sees tenant selector after login
- [ ] Tenant selector shows all accessible tenants with role badges
- [ ] User can select tenant and enter application
- [ ] Selected tenant persists in localStorage
- [ ] User can switch tenants from account settings
- [ ] Each tenant sees only their own invitations
- [ ] Each tenant has independent rate limiting
- [ ] Security rules prevent cross-tenant data access

### Self-Registration

- [ ] Public `/register` page accessible without authentication
- [ ] Form accepts email, display name, password, phone number
- [ ] User automatically assigned "customer" role
- [ ] User automatically associated with tenant based on subdomain
- [ ] Self-registered users cannot access admin panel
- [ ] Self-registered users cannot access kitchen display
- [ ] User automatically logged in after registration

### Rate Limiting

- [ ] Tenant can send up to 10 invitations per hour
- [ ] 11th invitation in same hour returns error
- [ ] Error message shows when rate limit will reset
- [ ] Counter resets after 1 hour from first invitation
- [ ] Counter persists across admin sessions
- [ ] Counter specific to each tenant (not global)

### Security

- [ ] Invitation tokens are 64 characters (32 bytes hex)
- [ ] Tokens cannot be reused after acceptance
- [ ] Expired tokens show clear error message
- [ ] Only admins can create invitations for their tenant
- [ ] Users cannot modify their own tenant memberships
- [ ] Users cannot read other users' documents
- [ ] Security rules tested with Firebase Emulator
- [ ] All HTTPS connections enforced

### Performance

- [ ] Email delivery within 60 seconds
- [ ] Signup page loads in under 2 seconds
- [ ] Token validation response under 500ms
- [ ] Invitation table updates in real-time (under 200ms)
- [ ] Form submission provides immediate feedback

### User Experience

- [ ] All forms have clear validation messages
- [ ] Loading states shown during API calls
- [ ] Success/error toast notifications for all actions
- [ ] Mobile-responsive design (works on phones)
- [ ] Keyboard navigation functional
- [ ] ARIA labels for screen readers
- [ ] Clear help text and placeholders
- [ ] Consistent styling with existing admin panel

---

**Document Version:** 1.0
**Created:** October 25, 2025
**Author:** Spec Writer Agent
**Status:** Ready for Implementation
**Estimated Effort:** 14 days (2 weeks)
**Feature Priority:** High (Phase 2, Roadmap Item #2)
