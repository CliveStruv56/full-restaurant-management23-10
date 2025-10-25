# User Invitation System - Test Plan

**Feature**: User Invitation System
**Version**: 1.0
**Date**: October 25, 2025
**Status**: Phase 4 - Testing and Polish

---

## Executive Summary

This document provides comprehensive test scenarios for the User Invitation System. These tests are designed to verify all core functionality, error handling, and edge cases before production deployment.

**Note**: These are test scenarios and manual test plans, not automated test suites. They document what should be tested and how to test it manually or through integration testing.

---

## Table of Contents

1. [End-to-End Invitation Flow Tests](#end-to-end-invitation-flow-tests)
2. [Multi-Tenant User Tests](#multi-tenant-user-tests)
3. [Rate Limiting Tests](#rate-limiting-tests)
4. [Expired Invitation Tests](#expired-invitation-tests)
5. [Email Delivery Tests](#email-delivery-tests)
6. [Token Validation Tests](#token-validation-tests)
7. [Error Handling Tests](#error-handling-tests)
8. [Security Tests](#security-tests)
9. [UI/UX Tests](#ui-ux-tests)
10. [Performance Tests](#performance-tests)

---

## End-to-End Invitation Flow Tests

### Test 1.1: Happy Path - Staff Invitation

**Objective**: Verify complete invitation flow from creation to acceptance

**Prerequisites**:
- Admin user logged into tenant "Test Restaurant"
- Valid Mailgun configuration
- Test email account accessible

**Steps**:
1. Admin navigates to Admin Panel > Team
2. Admin clicks "Invite User" button
3. Admin enters email: `teststaff@example.com`
4. Admin selects role: "Staff"
5. Admin clicks "Send Invitation"
6. Admin sees success toast: "Invitation sent to teststaff@example.com!"
7. Admin sees invitation appear in table with "pending" status
8. Check test email inbox within 60 seconds
9. Email received with subject: "You've been invited to join Test Restaurant on OrderFlow"
10. Email contains signup link with token
11. Click signup link in email
12. Redirected to signup page with pre-filled email
13. Enter display name: "Test Staff Member"
14. Enter password: "SecurePass123"
15. Enter phone number: "+44 7123 456789"
16. Click "Create Account & Sign In"
17. Account created and user auto-logged in
18. User redirected to appropriate dashboard
19. Admin receives acceptance notification email

**Expected Results**:
- ✅ Invitation created in Firestore with status "pending"
- ✅ Email delivered within 60 seconds
- ✅ Signup page validates token and shows invitation details
- ✅ User account created in Firebase Auth
- ✅ User document created with correct tenant membership
- ✅ Invitation status updated to "accepted"
- ✅ Admin receives acceptance notification
- ✅ User can access staff features

**Failure Scenarios to Check**:
- Email not received (check spam folder, check function logs)
- Signup page shows "invalid token" (check invitation document)
- Account creation fails (check Firebase Auth errors)
- User not auto-logged in (check custom token generation)

---

### Test 1.2: Admin Invitation Flow

**Objective**: Verify admin role assignment and access

**Prerequisites**: Same as Test 1.1

**Steps**:
1. Follow Test 1.1 steps but select role: "Admin"
2. Complete signup
3. Verify admin user has access to:
   - Admin Panel
   - All management sections
   - Settings
   - Team invitations

**Expected Results**:
- ✅ User has admin role in tenantMemberships
- ✅ User can access all admin features
- ✅ User appears in admin list with "Admin" badge

---

### Test 1.3: Customer Invitation Flow

**Objective**: Verify customer role limitations

**Prerequisites**: Same as Test 1.1

**Steps**:
1. Follow Test 1.1 steps but select role: "Customer"
2. Complete signup
3. Verify customer user CANNOT access:
   - Admin Panel
   - Kitchen Display
   - Management features
4. Verify customer user CAN access:
   - Menu
   - Order placement
   - Order history

**Expected Results**:
- ✅ User has customer role in tenantMemberships
- ✅ User cannot see admin navigation
- ✅ Customer features work correctly

---

## Multi-Tenant User Tests

### Test 2.1: Same User, Multiple Tenants

**Objective**: Verify user can be invited to multiple tenants with different roles

**Prerequisites**:
- Admin user for "Test Restaurant A"
- Admin user for "Test Restaurant B"
- Test email: `multitenantuser@example.com`

**Steps**:
1. Admin A invites `multitenantuser@example.com` as "Staff" to Restaurant A
2. User accepts invitation and completes signup
3. User logs out
4. Admin B invites SAME email `multitenantuser@example.com` as "Admin" to Restaurant B
5. User clicks second invitation link
6. User completes signup (should add to existing account, not create new)
7. User logs in
8. User sees tenant selector modal with both restaurants
9. User selects Restaurant A
10. Verify user has "Staff" role in Restaurant A
11. User switches to Restaurant B via account screen
12. Verify user has "Admin" role in Restaurant B

**Expected Results**:
- ✅ Only one Firebase Auth user created
- ✅ User document has tenantMemberships with both tenants
- ✅ Each tenant has correct role assignment
- ✅ Tenant selector shows both restaurants
- ✅ User can switch between tenants seamlessly
- ✅ Role enforcement works per tenant

**Edge Cases**:
- User already has account from self-registration
- User invited to 3+ tenants
- User invited to same tenant twice (should fail with duplicate error)

---

### Test 2.2: Multi-Tenant Login Flow

**Objective**: Verify tenant selector appears when needed

**Prerequisites**: User from Test 2.1 with multiple tenants

**Steps**:
1. User logs in with email/password
2. Verify tenant selector modal appears
3. Verify both tenants shown with correct roles
4. Select tenant and verify app loads for that tenant
5. Check localStorage for saved tenant preference
6. Log out and log in again
7. Verify last selected tenant auto-loads (or selector shows again)

**Expected Results**:
- ✅ Selector only shows if user has multiple tenants
- ✅ Selector prevents background interaction
- ✅ Tenant preference persisted
- ✅ Correct tenant context loaded

---

## Rate Limiting Tests

### Test 3.1: Rate Limit Enforcement

**Objective**: Verify 10 invitations per hour limit enforced

**Prerequisites**:
- Admin user logged in
- Fresh tenant (no invitations sent this hour)

**Steps**:
1. Send invitation #1 - Should succeed
2. Send invitation #2 - Should succeed
3. Continue sending invitations #3-10 - All should succeed
4. Verify rate limit indicator shows "10/10"
5. Attempt to send invitation #11
6. Verify error message: "Rate limit exceeded. You can send 10 invitations per hour. Try again at [time]."
7. Verify "Invite User" button disabled
8. Wait for 1 hour (or manually reset timestamp in Firestore)
9. Attempt invitation #12 - Should succeed
10. Verify counter reset to 1/10

**Expected Results**:
- ✅ Exactly 10 invitations allowed in first hour
- ✅ 11th invitation blocked with clear error message
- ✅ Reset time displayed correctly
- ✅ Counter resets after 1 hour
- ✅ No race conditions (all requests processed correctly)

**Edge Cases**:
- Multiple admins sending invitations simultaneously
- Counter reset at exactly 1 hour boundary
- Invitation failures don't increment counter

---

### Test 3.2: Rate Limit Per Tenant Isolation

**Objective**: Verify rate limits are per-tenant, not global

**Prerequisites**: Two tenants with different admins

**Steps**:
1. Tenant A admin sends 10 invitations (reaches limit)
2. Tenant B admin sends 10 invitations (should all succeed)
3. Verify Tenant A still blocked
4. Verify Tenant B can send all 10

**Expected Results**:
- ✅ Each tenant has independent rate limit counter
- ✅ One tenant hitting limit doesn't affect others

---

## Expired Invitation Tests

### Test 4.1: Token Expiration After 72 Hours

**Objective**: Verify invitations expire after 72 hours

**Prerequisites**: Admin user, test email

**Steps**:
1. Create invitation
2. In Firestore, manually set `expiresAt` to past date (e.g., 2 days ago)
3. User attempts to access signup page with token
4. Verify error message: "This invitation has expired"
5. Verify no account can be created
6. Verify invitation status remains "pending" (not changed by attempt)

**Expected Results**:
- ✅ Expired token rejected
- ✅ Clear error message displayed
- ✅ No user account created
- ✅ Invitation cannot be used

---

### Test 4.2: Cleanup Function Marks Expired

**Objective**: Verify daily cleanup marks expired invitations

**Prerequisites**: Invitation with past expiration date

**Steps**:
1. Create invitation with manual `expiresAt` in past
2. Manually trigger `cleanupExpiredInvitations` function
3. Verify invitation status updated to "expired"
4. Verify function logs count of expired invitations
5. Verify expired invitation appears gray in admin panel

**Expected Results**:
- ✅ Status changed from "pending" to "expired"
- ✅ Cleanup function runs without errors
- ✅ Function logs indicate successful cleanup

---

## Email Delivery Tests

### Test 5.1: Invitation Email Delivery

**Objective**: Verify invitation emails sent successfully

**Prerequisites**: Valid Mailgun configuration

**Steps**:
1. Create invitation
2. Wait up to 60 seconds
3. Check recipient inbox
4. Verify email received with correct:
   - Subject: "You've been invited to join [Business Name] on OrderFlow"
   - From: "OrderFlow <noreply@orderflow.app>"
   - Body contains: inviter name, business name, role, signup link, expiration time
   - Signup link is valid (https, contains token)

**Expected Results**:
- ✅ Email delivered within 60 seconds
- ✅ All template variables replaced correctly
- ✅ Signup link is clickable and valid
- ✅ Email passes spam filters (check spam folder)

**Test Multiple Providers**:
- Gmail
- Outlook/Hotmail
- Yahoo Mail
- Corporate email servers

---

### Test 5.2: Reminder Email After 24 Hours

**Objective**: Verify reminder emails sent before expiration

**Prerequisites**: Pending invitation created 48 hours ago

**Steps**:
1. Create invitation
2. Manually set `createdAt` to 48 hours ago (simulates time passing)
3. Ensure `expiresAt` is 24 hours from now
4. Ensure `reminderSentAt` is null
5. Manually trigger `sendInvitationReminder` scheduled function
6. Verify reminder email sent to recipient
7. Verify `reminderSentAt` timestamp updated in invitation document
8. Trigger function again
9. Verify NO second reminder sent (reminderSentAt exists)

**Expected Results**:
- ✅ Reminder email sent 24h before expiration
- ✅ Reminder only sent once
- ✅ Reminder timestamp recorded
- ✅ Reminder email contains correct information

---

### Test 5.3: Acceptance Notification Email

**Objective**: Verify inviter notified when invitation accepted

**Prerequisites**: Pending invitation, test accounts

**Steps**:
1. Admin sends invitation
2. User accepts invitation
3. Check admin's email inbox
4. Verify notification email received with:
   - Subject: "[User Name] accepted your invitation to [Business Name]"
   - Body contains: user name, user email, role, business name

**Expected Results**:
- ✅ Notification sent immediately after acceptance
- ✅ Correct inviter email used
- ✅ All details accurate

---

### Test 5.4: Email Failure Handling

**Objective**: Verify graceful handling of Mailgun failures

**Prerequisites**: Invalid Mailgun credentials or simulated failure

**Steps**:
1. Temporarily misconfigure Mailgun API key
2. Create invitation
3. Verify invitation status updated to "error"
4. Verify error message logged in invitation document
5. Verify function logs show error details
6. Fix Mailgun configuration
7. Manually retry sending (or create new invitation)
8. Verify email now sends successfully

**Expected Results**:
- ✅ Failed emails marked with "error" status
- ✅ Error message visible in admin panel (red badge)
- ✅ Error details logged for debugging
- ✅ No crashes or unhandled exceptions

---

## Token Validation Tests

### Test 6.1: Invalid Token Handling

**Objective**: Verify invalid tokens rejected gracefully

**Test Cases**:

**Case A: Random/Non-Existent Token**
- Navigate to `/signup/invalidtoken123456789`
- Expected: "Invalid invitation" error message

**Case B: Malformed Token**
- Navigate to `/signup/short`
- Expected: "Invalid invitation" error message

**Case C: Empty Token**
- Navigate to `/signup/`
- Expected: Redirect or error page

**Case D: SQL Injection Attempt**
- Navigate to `/signup/'; DROP TABLE invitations;--`
- Expected: Safe handling, no database impact

**Expected Results**:
- ✅ All invalid tokens rejected
- ✅ No server errors
- ✅ User-friendly error messages
- ✅ No security vulnerabilities exposed

---

### Test 6.2: Already Used Token

**Objective**: Verify tokens cannot be reused

**Steps**:
1. User accepts invitation successfully
2. Note the invitation token from URL
3. User logs out
4. User attempts to access same signup URL again
5. Verify error: "This invitation has already been accepted"
6. Verify no duplicate account created

**Expected Results**:
- ✅ Token marked as used (status "accepted")
- ✅ Reuse attempt blocked
- ✅ Clear error message

---

## Error Handling Tests

### Test 7.1: Duplicate Invitation Prevention

**Objective**: Verify same email cannot be invited twice to same tenant

**Steps**:
1. Admin invites `user@example.com` as "Staff"
2. Admin attempts to invite `user@example.com` again as "Admin"
3. Verify error: "An active invitation already exists for this email"
4. Verify only one invitation exists in Firestore
5. First invitation remains "pending"

**Expected Results**:
- ✅ Duplicate invitation blocked
- ✅ Clear error message to admin
- ✅ No duplicate invitation documents created

---

### Test 7.2: Firebase Auth Conflicts

**Objective**: Handle case where email already registered

**Steps**:
1. User self-registers as customer: `existing@example.com`
2. Admin invites same email as staff
3. User clicks invitation link
4. User attempts to create account
5. Verify error handled gracefully
6. Verify user added to new tenant with staff role (multi-tenant support)

**Expected Results**:
- ✅ Existing user recognized
- ✅ New tenant membership added to existing account
- ✅ No duplicate Firebase Auth user created
- ✅ User can access both tenants

---

### Test 7.3: Network Failures

**Objective**: Verify graceful handling of network issues

**Test Scenarios**:
- User submits signup form with no internet connection
- Admin creates invitation with intermittent connectivity
- Token validation request times out

**Expected Results**:
- ✅ Loading states shown during operations
- ✅ Error messages displayed on failure
- ✅ User can retry operations
- ✅ No data corruption

---

### Test 7.4: Validation Errors

**Objective**: Verify form validation catches errors

**Test Cases**:

**Invalid Email Format**
- Enter: "notanemail"
- Expected: "Please enter a valid email address"

**Short Password**
- Enter: "short"
- Expected: "Password must be at least 8 characters"

**Password Mismatch**
- Password: "SecurePass123"
- Confirm: "DifferentPass456"
- Expected: "Passwords do not match"

**Missing Required Fields**
- Leave display name empty
- Expected: "Please fill in all required fields"

**Expected Results**:
- ✅ All validation errors caught client-side
- ✅ Clear error messages displayed
- ✅ Form submission prevented until valid

---

## Security Tests

### Test 8.1: Authorization Checks

**Objective**: Verify only admins can create invitations

**Steps**:
1. Log in as customer user (not admin)
2. Attempt to access Admin Panel > Team
3. Verify access denied or section not visible
4. Attempt to call `createInvitation` Cloud Function directly via API
5. Verify error: "permission-denied"

**Expected Results**:
- ✅ Non-admin users cannot access invitation manager
- ✅ Cloud Function enforces admin role check
- ✅ Firestore rules prevent unauthorized reads

---

### Test 8.2: Cross-Tenant Isolation

**Objective**: Verify tenants cannot see each other's invitations

**Steps**:
1. Tenant A admin creates invitations
2. Tenant B admin logs in
3. Verify Tenant B admin only sees their own invitations
4. Attempt to read Tenant A invitation document directly
5. Verify Firestore security rules block access

**Expected Results**:
- ✅ Each tenant sees only their invitations
- ✅ Security rules enforce isolation
- ✅ No data leakage between tenants

---

### Test 8.3: Token Security

**Objective**: Verify token generation is secure

**Steps**:
1. Create 100 invitations
2. Extract all tokens
3. Verify each token is 64 characters (hex string)
4. Verify all tokens are unique (no duplicates)
5. Analyze token entropy (should be random, not sequential)
6. Verify tokens not guessable

**Expected Results**:
- ✅ Tokens are cryptographically secure (32 bytes random)
- ✅ No collisions in token generation
- ✅ Tokens cannot be predicted or brute-forced

---

## UI/UX Tests

### Test 9.1: Loading States

**Objective**: Verify all async operations show loading states

**Components to Test**:
- Invitation form submission
- Signup form submission
- Invitation list loading
- Token validation
- Tenant selector

**Expected Results**:
- ✅ Spinner or loading indicator shown
- ✅ Buttons disabled during operations
- ✅ User cannot trigger duplicate actions
- ✅ Loading text indicates what's happening

---

### Test 9.2: Toast Notifications

**Objective**: Verify success/error messages displayed

**Test Cases**:
- Invitation sent successfully → Green success toast
- Rate limit exceeded → Error toast with details
- Account created → Success toast
- Invalid token → Error toast
- Network error → Error toast

**Expected Results**:
- ✅ All operations show toast notifications
- ✅ Success messages are green
- ✅ Error messages are red
- ✅ Toasts auto-dismiss after appropriate time
- ✅ Loading toasts update to success/error

---

### Test 9.3: Mobile Responsiveness

**Objective**: Verify all components work on mobile devices

**Devices to Test**:
- iPhone (Safari)
- Android (Chrome)
- iPad (tablet view)

**Components**:
- Invitation Manager table (scrolls horizontally)
- Invitation modal (adapts to screen width)
- Signup form (single column on mobile)
- Tenant selector (full-width cards)

**Expected Results**:
- ✅ All forms usable on small screens
- ✅ Buttons touch-friendly (min 44x44px)
- ✅ Text readable without zooming
- ✅ No horizontal overflow

---

### Test 9.4: Keyboard Navigation

**Objective**: Verify keyboard accessibility

**Steps**:
1. Navigate to invitation manager using Tab key only
2. Open modal with Enter key
3. Tab through all form fields
4. Submit form with Enter key
5. Close modal with Escape key
6. Repeat for signup form

**Expected Results**:
- ✅ All interactive elements reachable via Tab
- ✅ Focus indicators visible
- ✅ Enter key submits forms
- ✅ Escape key closes modals
- ✅ Tab order is logical

---

### Test 9.5: Screen Reader Accessibility

**Objective**: Verify accessibility for visually impaired users

**Tools**: VoiceOver (Mac), NVDA (Windows), TalkBack (Android)

**Steps**:
1. Enable screen reader
2. Navigate through invitation manager
3. Verify labels read correctly
4. Verify status badges announced
5. Verify form fields have labels
6. Verify error messages announced

**Expected Results**:
- ✅ All elements have ARIA labels
- ✅ Form fields properly labeled
- ✅ Status information announced
- ✅ Error messages accessible

---

## Performance Tests

### Test 10.1: Email Delivery Speed

**Objective**: Verify emails sent within performance targets

**Steps**:
1. Create invitation and note timestamp
2. Check email inbox
3. Measure time from creation to email receipt
4. Repeat 10 times
5. Calculate average delivery time

**Expected Results**:
- ✅ Average delivery time < 60 seconds
- ✅ 95th percentile < 90 seconds
- ✅ No emails lost

---

### Test 10.2: Signup Page Load Time

**Objective**: Verify signup page loads quickly

**Steps**:
1. Clear browser cache
2. Click invitation link
3. Measure time to page fully interactive
4. Test from different geographic locations
5. Test with slow 3G network simulation

**Expected Results**:
- ✅ Page loads in < 2 seconds (good network)
- ✅ Page usable in < 5 seconds (slow network)
- ✅ Token validation completes quickly

---

### Test 10.3: Real-Time Invitation List Updates

**Objective**: Verify invitation list updates immediately

**Steps**:
1. Admin A opens invitation manager on Device 1
2. Admin B sends invitation on Device 2
3. Measure time for invitation to appear on Device 1
4. Repeat with acceptance (user accepts on Device 2, admin sees update on Device 1)

**Expected Results**:
- ✅ Updates appear within 200ms
- ✅ No manual refresh needed
- ✅ Real-time listener works correctly

---

## Test Execution Checklist

### Pre-Deployment Testing

- [ ] All End-to-End tests passing
- [ ] Multi-tenant scenarios verified
- [ ] Rate limiting working correctly
- [ ] Email delivery tested on all major providers
- [ ] Token security verified
- [ ] Error handling graceful
- [ ] Security rules enforced
- [ ] UI responsive on mobile
- [ ] Accessibility requirements met
- [ ] Performance targets met

### Staging Environment Testing

- [ ] Deploy to staging
- [ ] Run full test suite
- [ ] Test with real email addresses
- [ ] Monitor function logs
- [ ] Check Mailgun delivery rates
- [ ] Performance testing under load
- [ ] Security audit passed

### Production Readiness

- [ ] All critical tests passing
- [ ] No known blockers
- [ ] Documentation complete
- [ ] Rollback plan prepared
- [ ] Monitoring configured
- [ ] Alert thresholds set

---

## Test Reporting

### Test Results Format

For each test, record:
- Test ID
- Status (Pass/Fail/Blocked)
- Date executed
- Environment (Local/Staging/Production)
- Notes/Comments
- Screenshots (if applicable)

### Issue Tracking

When tests fail:
1. Create issue in project tracker
2. Assign priority (Critical/High/Medium/Low)
3. Link to test case
4. Include reproduction steps
5. Attach logs/screenshots

---

## Continuous Testing

### Regression Testing

After any code changes:
- Re-run affected test scenarios
- Verify no breaking changes introduced
- Test backward compatibility

### Performance Monitoring

In production:
- Monitor email delivery rates
- Track invitation acceptance rates
- Measure function execution times
- Alert on anomalies

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Next Review**: After Phase 5 deployment
