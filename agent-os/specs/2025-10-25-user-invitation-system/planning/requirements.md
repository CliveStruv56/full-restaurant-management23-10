# Spec Requirements: User Invitation System

## Initial Description

Cloud Functions-based invitation flow where tenant admins can invite staff and customers via email. Invited users receive temporary credentials, set their password, and are automatically assigned to the correct tenant with appropriate role permissions.

**Details:**
- Admins can invite users to their tenant
- Email integration for sending invitations
- Temporary credential system
- Password setup flow for invited users
- Automatic tenant assignment
- Role-based permissions (admin, staff, customer)
- Effort estimate: L (2 weeks)

## Requirements Discussion

### First Round Questions

**Q1: Role Selection During Invitation**
**Question Asked:** Should the admin specify the role (admin/staff/customer) during invitation creation, or should we have separate flows for inviting staff vs. customers?
**Answer:** Admin should specify the role during invitation creation (single flow with role selector)

**Q2: Email Branding**
**Question Asked:** For invitation emails, should they include the tenant's branding (logo, colors), or should we start with a simple text-based email template?
**Answer:** Just text emails (no logo/brand colors)

**Q3: Invitation Expiration**
**Question Asked:** What should the invitation expiration timeframe be? I'm assuming 7 days, is that correct, or would you prefer shorter (24-48 hours) or longer (30 days)?
**Answer:** 72 hours (3 days)

**Q4: Password Requirements**
**Question Asked:** For password setup, should we enforce specific requirements (minimum length, complexity), or rely on Firebase Auth defaults?
**Answer:** Firebase auth default (8 characters minimum) is fine

**Q5: Signup Flow Fields**
**Question Asked:** When invited users set up their account, what information should they provide? I'm thinking: password, display name, and optional phone number. Should we require anything else?
**Answer:** Password, display name, and optional phone number for updates

**Q6: Bulk Invitations**
**Question Asked:** Should admins be able to send bulk invitations (e.g., upload CSV), or is one-at-a-time sufficient for MVP?
**Answer:** One at a time for now

**Q7: Invitation Tracking**
**Question Asked:** Should the admin panel show a list of pending/accepted invitations with status tracking?
**Answer:** Yes, show list of pending/accepted invitations

**Q8: Rate Limiting**
**Question Asked:** Should we implement rate limiting to prevent abuse (e.g., max 10 invitations per hour per tenant)?
**Answer:** Yes, implement rate limiting

**Q9: Auto-Login After Signup**
**Question Asked:** After an invited user completes password setup, should they be automatically logged in, or should they be redirected to the login page?
**Answer:** Yes, auto-login after password setup

**Q10: Multi-Tenant Users**
**Question Asked:** Can a single user (identified by email) belong to multiple tenants? For example, if user@example.com is invited to Tenant A as staff, and then invited to Tenant B as admin, should:
- a) The second invitation be rejected (one user = one tenant)
- b) The user's role be updated in their original tenant
- c) The user have separate roles in both tenants (multi-tenant support)
**Answer:** Support multi-tenant users (option c) - users can have separate roles in different tenants

**Q11: Email Service Provider**
**Question Asked:** Which email service provider would you prefer? Options include SendGrid (mentioned in tech stack), Mailgun, AWS SES, or Firebase Extensions' email triggers.
**Answer:** Mailgun preferred

**Q12: Follow-up Emails**
**Question Asked:** Should the system send reminder emails for pending invitations (e.g., 24 hours before expiry), or notify admins when invitations are accepted?
**Answer:** Send reminder emails and notify admins when invitations are accepted

**Q13: Invited vs Self-Registered Users**
**Question Asked:** Should we also support self-registration for end customers (restaurant/cafe patrons), or should ALL users be invited? If we support both, how do we differentiate access levels?
**Answer:** Invited users get access level set by invite; self-registered should only be for end customers (restaurant/cafe patrons)

**Q14: Out of Scope Confirmation**
**Question Asked:** For MVP, I'm assuming we'll exclude:
- Invitation revocation (canceling pending invitations)
- Declining invitations (user explicitly rejecting)
- Resending expired invitations
- Invitation expiry notifications
Are these assumptions correct, or should any of these be included?
**Answer:** All listed items are out of scope (declining invitations, resending expired, expiry notifications, revocation)

### Existing Code to Reference

**Similar Features Identified:**
- Basic Firebase authentication flow exists for customers and admins (needs refining)
- Admin panel has product and settings management
- Basic role-based access (admin/customer) - needs refining to support staff role

**Features NOT Yet Implemented:**
- No user management UI yet
- No token-based verification currently implemented
- No email sending infrastructure

### Follow-up Questions

No follow-up questions were needed. The user provided comprehensive answers covering all aspects of the feature.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets provided. Implementation will follow existing admin panel patterns and create new UI components for invitation management.

## Requirements Summary

### Functional Requirements

**Core Invitation Flow:**
- Admin can create invitation by providing email address and selecting role (admin, staff, or customer)
- System generates unique invitation token and stores invitation record in Firestore
- System sends invitation email via Mailgun with link containing token
- Invitation expires after 72 hours
- System sends reminder email 24 hours before expiration
- Admin receives notification email when invitation is accepted

**User Signup Flow:**
- Invited user clicks link in email, redirected to signup page
- Signup page validates token (checks expiration, not already used)
- User provides: password, display name, optional phone number
- Password must meet Firebase Auth default requirements (8 characters minimum)
- On submit, system creates Firebase Auth user and associates with tenant + role
- User is automatically logged in after successful signup
- Invitation record marked as "accepted" in Firestore

**Multi-Tenant User Support:**
- Users can be invited to multiple tenants with different roles
- User identified by email address (Firebase Auth email)
- User data structure supports multiple tenant memberships
- When user logs in, they select which tenant to access (if member of multiple)
- Each tenant-user relationship has its own role assignment

**Invitation Tracking:**
- Admin panel displays list of all invitations for their tenant
- Shows invitation status: pending, accepted, expired, or error
- Shows invitee email, role, invited date, accepted date (if applicable)
- Shows who sent the invitation (inviting admin's name)

**Self-Registration for End Customers:**
- Separate signup flow for restaurant/cafe patrons (end customers)
- Self-registered users automatically get "customer" role
- Self-registered users are associated with tenant based on subdomain they signed up from
- No invitation required for customer role

**Rate Limiting:**
- Maximum 10 invitations per hour per tenant
- Rate limit enforced in Cloud Function
- Clear error message shown to admin if limit exceeded

### Reusability Opportunities

**Existing Patterns to Reference:**
- Admin panel layout and navigation (components/admin/AdminPanel.tsx)
- Settings management UI patterns (components/admin/SettingsManager.tsx)
- Firebase Auth context (contexts/AuthContext.tsx)
- Firestore data access patterns in existing managers

**New Components to Build:**
- InvitationManager component for admin panel
- InvitationSignup page for invited users
- TenantSelector component for multi-tenant users at login
- Email templates for invitation, reminder, and acceptance notifications

**Backend Infrastructure:**
- Cloud Functions for sending emails (new)
- Cloud Functions for validating tokens and creating users (new)
- Mailgun integration (new)
- Multi-tenant user data model (extends existing auth context)

### Scope Boundaries

**In Scope:**
- Single invitation creation (one email at a time)
- Role selection during invitation (admin, staff, customer)
- Token-based invitation links with 72-hour expiration
- Email sending via Mailgun (invitation, reminder, acceptance notification)
- User signup flow with password, display name, phone number
- Multi-tenant user support (one user, multiple tenants, different roles)
- Invitation tracking UI in admin panel
- Rate limiting (10 invitations/hour/tenant)
- Auto-login after successful signup
- Self-registration flow for end customers
- Text-only email templates (no branding)

**Out of Scope (Future Enhancements):**
- Bulk invitation uploads via CSV
- Invitation revocation (canceling pending invitations)
- User declining invitations explicitly
- Resending expired invitations
- Invitation expiry notifications
- Email branding (logos, tenant colors)
- Custom invitation messages from admin
- Invitation analytics (acceptance rates, time-to-accept metrics)
- Admin ability to delete/deactivate users
- User profile editing after signup
- Phone number verification
- SMS notifications for invitations

### Technical Considerations

**Database Schema:**

**Collection: `/invitations/{invitationId}`**
```typescript
{
  id: string;                    // Auto-generated document ID
  tenantId: string;              // Tenant this invitation is for
  email: string;                 // Invitee email address
  role: 'admin' | 'staff' | 'customer'; // Role to assign
  token: string;                 // Unique secure token for signup link
  status: 'pending' | 'accepted' | 'expired' | 'error';
  invitedBy: string;             // User ID of admin who sent invitation
  invitedByName: string;         // Display name of inviting admin
  createdAt: Timestamp;          // When invitation was created
  expiresAt: Timestamp;          // 72 hours after createdAt
  acceptedAt?: Timestamp;        // When user completed signup
  reminderSentAt?: Timestamp;    // When reminder email was sent
  error?: string;                // Error message if email failed
}
```

**Collection: `/users/{userId}` (Extended)**
```typescript
{
  id: string;                    // Firebase Auth UID
  email: string;                 // User's email
  displayName: string;           // User's display name
  phoneNumber?: string;          // Optional phone number
  createdAt: Timestamp;          // Account creation time
  tenantMemberships: {           // NEW: Multi-tenant support
    [tenantId: string]: {
      role: 'admin' | 'staff' | 'customer';
      joinedAt: Timestamp;
      invitedBy?: string;        // User ID of inviting admin (if invited)
    }
  };
  currentTenantId?: string;      // Last selected tenant (for UX)
}
```

**Collection: `/tenantMetadata/{tenantId}` (Extended)**
```typescript
{
  // ... existing fields ...
  invitationRateLimit: {
    lastResetAt: Timestamp;
    invitationsSentThisHour: number;
  }
}
```

**Cloud Functions:**

**Function: `createInvitation` (Callable)**
- Input: `{ email: string, role: string }`
- Validates caller is admin of current tenant
- Checks rate limit (10/hour/tenant)
- Generates secure random token (crypto.randomBytes)
- Creates invitation document in Firestore
- Calls `sendInvitationEmail` function
- Returns: `{ success: boolean, invitationId: string }`

**Function: `sendInvitationEmail` (Background)**
- Triggered by invitation document creation
- Fetches tenant name and inviter name from Firestore
- Constructs email body with signup link
- Sends email via Mailgun API
- Updates invitation document with status/error

**Function: `sendInvitationReminder` (Scheduled - runs hourly)**
- Queries invitations where status='pending' and expiresAt is ~24 hours away
- For each, sends reminder email via Mailgun
- Updates reminderSentAt timestamp

**Function: `acceptInvitation` (Callable)**
- Input: `{ token: string, password: string, displayName: string, phoneNumber?: string }`
- Validates token exists and not expired
- Checks invitation status is 'pending'
- Creates Firebase Auth user with email/password
- Creates/updates user document with tenant membership
- Updates invitation status to 'accepted'
- Sends acceptance notification email to inviting admin
- Returns: `{ success: boolean, userId: string, customToken: string }` (for auto-login)

**Function: `cleanupExpiredInvitations` (Scheduled - runs daily)**
- Queries invitations where status='pending' and expiresAt < now
- Updates status to 'expired'

**Email Templates:**

**Invitation Email:**
```
Subject: You've been invited to join [Tenant Name] on OrderFlow

Hello,

[Inviter Name] has invited you to join [Tenant Name] as a [Role] on OrderFlow.

Click the link below to set up your account:
[Signup Link with Token]

This invitation will expire in 72 hours (on [Expiration Date/Time]).

If you have any questions, please contact [Inviter Name] at [Inviter Email].

---
OrderFlow Restaurant Management System
```

**Reminder Email:**
```
Subject: Reminder: Your invitation to [Tenant Name] expires soon

Hello,

This is a reminder that your invitation to join [Tenant Name] on OrderFlow will expire in 24 hours.

Click the link below to set up your account:
[Signup Link with Token]

If you have any questions, please contact [Inviter Name] at [Inviter Email].

---
OrderFlow Restaurant Management System
```

**Acceptance Notification Email:**
```
Subject: [User Name] accepted your invitation to [Tenant Name]

Hello [Inviter Name],

[User Name] ([User Email]) has accepted your invitation and joined [Tenant Name] as a [Role].

---
OrderFlow Restaurant Management System
```

**UI Components:**

**InvitationManager Component (Admin Panel):**
- "Invite User" button opens modal
- Modal form fields:
  - Email address (text input, email validation)
  - Role (dropdown: admin, staff, customer)
  - Submit button
- Invitations table:
  - Columns: Email, Role, Status, Invited By, Date, Actions
  - Status badges (color-coded)
  - Real-time updates via Firestore listener
- Rate limit warning if approaching limit
- Error toast notifications for failures

**InvitationSignup Page:**
- Route: `/signup/:token`
- Validates token on page load
- Shows error message if token invalid/expired
- Form fields:
  - Email (pre-filled, read-only)
  - Display Name (text input, required)
  - Password (password input, required, 8 char min)
  - Phone Number (tel input, optional)
  - Submit button
- On success, auto-login and redirect to appropriate dashboard

**TenantSelector Component:**
- Shown after login if user belongs to multiple tenants
- Lists all tenants user is member of
- Shows role for each tenant
- Click to select tenant and enter app
- Stores selection in localStorage for next login

**Self-Registration Page:**
- Route: `/register`
- Available on customer-facing app (based on subdomain)
- Form fields:
  - Email
  - Display Name
  - Password
  - Phone Number (optional)
- Auto-assigns "customer" role and current tenant
- Auto-login after registration

**Firestore Security Rules:**

```javascript
// Invitations collection
match /invitations/{invitationId} {
  // Only admins can create invitations for their tenant
  allow create: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships[request.resource.data.tenantId].role == 'admin';

  // Admins can read their tenant's invitations
  allow read: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships[resource.data.tenantId].role == 'admin';

  // Only Cloud Functions can update invitation status
  allow update: if false; // Functions use admin SDK
}

// Users collection (extended rules)
match /users/{userId} {
  // Users can read their own document
  allow read: if request.auth.uid == userId;

  // Users can update their own profile (but not tenantMemberships)
  allow update: if request.auth.uid == userId
    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['tenantMemberships']);

  // Only Cloud Functions can create users or modify tenant memberships
  allow create: if false; // Functions use admin SDK
}
```

**Integration with Existing Auth System:**
- Extend AuthContext to support multi-tenant user data
- Add `currentTenantId` to context state
- Add `switchTenant(tenantId)` method to context
- Update all Firestore queries to scope by `currentTenantId`
- Add tenant selector UI to account screen
- Modify login flow to check if user has multiple tenants

**Mailgun Integration:**
- Install Mailgun SDK in Cloud Functions: `npm install mailgun-js`
- Store Mailgun API key and domain in Firebase secret manager
- Create reusable `sendEmail(to, subject, text)` helper function
- Use Mailgun's API to send transactional emails
- Log email sends to Firestore for debugging

**Rate Limiting Implementation:**
- Store hourly invitation count in tenantMetadata
- Reset count every hour (check timestamp)
- Increment count in createInvitation function
- Return error if count >= 10
- Show clear message to admin in UI

**Security Considerations:**
- Invitation tokens must be cryptographically secure (crypto.randomBytes(32))
- Tokens stored hashed in Firestore (use bcrypt or similar)
- HTTPS-only signup links
- Validate email format on server side
- Prevent token reuse (check invitation status)
- Rate limit signup attempts per token (prevent brute force)
- Audit log all invitation creations and acceptances

**Success Criteria:**
- Admin can successfully create invitation and user receives email within 1 minute
- User can complete signup flow with valid token in < 2 minutes
- Multi-tenant users can switch between tenants seamlessly
- Rate limiting prevents abuse without false positives
- 95%+ email delivery rate via Mailgun
- Invitation list updates in real-time in admin panel
- Self-registered customers cannot access admin or staff features
- Zero security vulnerabilities in token generation/validation

### Implementation Dependencies

**Required Before Starting:**
- Mailgun account setup and API keys
- Firebase secret manager configured for Mailgun credentials
- Cloud Functions deployment pipeline established

**Builds Upon:**
- Existing Firebase Auth implementation (contexts/AuthContext.tsx)
- Existing admin panel structure (components/admin/AdminPanel.tsx)
- Existing tenant isolation architecture (tenantId in all queries)

**Enables Future Work:**
- Staff Management Module (depends on staff role invitations)
- User permission management (fine-grained permissions per tenant)
- Audit logging (tracks who invited whom)

### Testing Considerations

**Unit Tests:**
- Token generation and validation logic
- Rate limiting counter logic
- Email template rendering
- Multi-tenant user data model updates

**Integration Tests:**
- End-to-end invitation flow (create → email → signup)
- Multi-tenant user switching
- Rate limit enforcement
- Token expiration handling

**Manual Testing Scenarios:**
- Admin creates invitation → user receives email → user completes signup → admin sees acceptance
- User invited to 2 tenants → sees tenant selector → can switch between tenants
- Admin tries to send 11th invitation in hour → sees rate limit error
- User tries to use expired token → sees friendly error message
- Self-registered customer tries to access admin panel → denied

**Security Testing:**
- Attempt to reuse accepted invitation token
- Attempt to modify token in URL
- Attempt to accept invitation for different email than invited
- Attempt to create invitation as non-admin user
