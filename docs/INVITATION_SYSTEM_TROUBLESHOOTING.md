# User Invitation System - Troubleshooting Guide

**For**: Developers, System Administrators, and Support Staff
**Version**: 1.0
**Date**: October 25, 2025

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Email Delivery Issues](#email-delivery-issues)
3. [Token Validation Errors](#token-validation-errors)
4. [Account Creation Failures](#account-creation-failures)
5. [Rate Limiting Problems](#rate-limiting-problems)
6. [Multi-Tenant Issues](#multi-tenant-issues)
7. [Cloud Functions Errors](#cloud-functions-errors)
8. [Firestore Issues](#firestore-issues)
9. [Security Rule Problems](#security-rule-problems)
10. [Performance Issues](#performance-issues)
11. [Diagnostic Tools](#diagnostic-tools)

---

## Quick Reference

### Common Error Messages

| Error Message | Likely Cause | Quick Fix |
|--------------|--------------|-----------|
| "Rate limit exceeded" | Tenant sent 10+ invitations in hour | Wait for reset time or contact support |
| "Invalid or expired invitation" | Token expired, used, or doesn't exist | Send new invitation |
| "Email already registered" | User already has Firebase Auth account | Continue signup to add tenant membership |
| "Permission denied" | Non-admin trying to create invitation | Verify user has admin role |
| "An active invitation already exists" | Duplicate invitation to same email | Wait for expiration or use different email |
| "Failed to send invitation" | Mailgun API error | Check Mailgun credentials and logs |
| "Account creation failed" | Firebase Auth error | Check function logs for details |

### Emergency Contacts

- **Firebase Console**: https://console.firebase.google.com
- **Mailgun Dashboard**: https://app.mailgun.com
- **Cloud Functions Logs**: Firebase Console > Functions > Logs
- **Support Email**: support@orderflow.app

---

## Email Delivery Issues

### Issue 1: Invitation Emails Not Being Sent

**Symptoms**:
- Invitation created in Firestore
- Status shows "error" with red badge
- User never receives email

**Diagnostic Steps**:

1. **Check Invitation Document**
   ```
   Navigate to Firestore Console
   Collection: /invitations/{invitationId}
   Check fields:
   - status: should be 'pending' or 'error'
   - error: contains error message if failed
   - createdAt: verify invitation was created
   ```

2. **Check Cloud Function Logs**
   ```bash
   firebase functions:log --only sendInvitationEmailTrigger
   ```
   Look for:
   - Mailgun API errors
   - Network connectivity issues
   - Configuration errors

3. **Verify Mailgun Configuration**
   ```bash
   # Check if secret is set
   firebase functions:secrets:access MAILGUN_API_KEY

   # Check function config
   firebase functions:config:get
   ```

4. **Test Mailgun API Directly**
   ```bash
   curl -s --user 'api:YOUR_MAILGUN_API_KEY' \
     https://api.mailgun.net/v3/YOUR_DOMAIN/messages \
     -F from='OrderFlow <noreply@orderflow.app>' \
     -F to='test@example.com' \
     -F subject='Test Email' \
     -F text='Testing Mailgun configuration'
   ```

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Missing Mailgun API key | Set: `firebase functions:secrets:set MAILGUN_API_KEY` |
| Wrong domain configuration | Update function config with correct domain |
| Mailgun account suspended | Check Mailgun dashboard, resolve billing issues |
| Mailgun domain not verified | Complete domain verification in Mailgun |
| DNS records missing | Add SPF, DKIM, DMARC records to domain |
| Rate limit on Mailgun side | Check Mailgun dashboard for limits |
| Function timeout | Increase timeout in function config |

**Resolution Steps**:

1. **Fix Configuration**:
   ```bash
   # Update Mailgun secret
   firebase functions:secrets:set MAILGUN_API_KEY

   # Update domain config
   firebase functions:config:set mailgun.domain="mg.orderflow.app"
   firebase functions:config:set mailgun.from_email="noreply@orderflow.app"

   # Redeploy function
   firebase deploy --only functions:sendInvitationEmailTrigger
   ```

2. **Retry Failed Invitations**:
   - Failed invitations remain in Firestore
   - Update invitation status to 'pending' and remove error field
   - Function will automatically retry on next trigger

3. **Monitor Mailgun Dashboard**:
   - Check delivery rate
   - Review bounce logs
   - Check spam complaints

---

### Issue 2: Emails Going to Spam

**Symptoms**:
- Emails being sent successfully
- Users reporting they don't receive emails
- Emails found in spam folders

**Diagnostic Steps**:

1. **Check Mailgun Delivery Stats**
   - Log into Mailgun dashboard
   - View delivery rate and bounce rate
   - Check spam complaint rate

2. **Verify DNS Configuration**
   ```bash
   # Check SPF record
   dig TXT mg.orderflow.app | grep spf

   # Check DKIM record
   dig TXT k1._domainkey.mg.orderflow.app

   # Check DMARC record
   dig TXT _dmarc.mg.orderflow.app
   ```

3. **Test Email with Mail Tester**
   - Send test invitation to: test@mail-tester.com
   - Visit mail-tester.com to see score
   - Review recommendations

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| SPF record not configured | Add SPF record to DNS |
| DKIM signature missing | Configure DKIM in Mailgun |
| DMARC policy not set | Add DMARC record to DNS |
| Sender reputation low | Warm up sending domain gradually |
| Email content triggers spam filters | Review email template content |
| "From" address not verified | Verify sending domain in Mailgun |

**Resolution Steps**:

1. **Configure DNS Records** (via DNS provider):
   ```
   # SPF Record
   Type: TXT
   Host: mg.orderflow.app
   Value: v=spf1 include:mailgun.org ~all

   # DKIM Record (get from Mailgun dashboard)
   Type: TXT
   Host: k1._domainkey.mg.orderflow.app
   Value: [provided by Mailgun]

   # DMARC Record
   Type: TXT
   Host: _dmarc.mg.orderflow.app
   Value: v=DMARC1; p=none; rua=mailto:admin@orderflow.app
   ```

2. **Improve Email Content**:
   - Ensure email template has unsubscribe link (future enhancement)
   - Avoid spam trigger words
   - Keep email plain text (already implemented)
   - Include physical address (add to template)

3. **Warm Up Domain** (new domains):
   - Day 1-3: Send 10-20 emails/day
   - Day 4-7: Send 50-100 emails/day
   - Week 2+: Gradually increase volume

---

### Issue 3: Emails Delayed (> 60 seconds)

**Symptoms**:
- Emails eventually delivered
- Delivery time exceeds 60 second target
- Users report long wait times

**Diagnostic Steps**:

1. **Check Function Execution Time**
   ```bash
   firebase functions:log --only sendInvitationEmailTrigger
   ```
   Look for execution duration in logs

2. **Check Mailgun API Response Time**
   - Review function logs for Mailgun API latency
   - Check Mailgun status page: https://status.mailgun.com

3. **Verify Function Cold Start**
   - First execution after deployment may be slow
   - Check if function is "cold starting" frequently

**Resolution Steps**:

1. **Optimize Function**:
   ```typescript
   // Reduce function cold start time
   // - Minimize dependencies
   // - Use Firebase admin SDK efficiently
   // - Cache tenant metadata
   ```

2. **Set Minimum Instances** (production):
   ```javascript
   // In function definition
   export const sendInvitationEmailTrigger = functions
     .runWith({
       minInstances: 1, // Keep function warm
       memory: '256MB'
     })
     .firestore.document('/invitations/{invitationId}')
     .onCreate(async (snap, context) => {
       // ... function code
     });
   ```

3. **Monitor Mailgun Performance**:
   - Check Mailgun dashboard for API latency
   - Consider alternative SMTP provider if persistent issues

---

## Token Validation Errors

### Issue 4: "Invalid or Expired Invitation" Error

**Symptoms**:
- User clicks invitation link
- Sees error page: "Invalid or expired invitation"
- Cannot complete signup

**Diagnostic Steps**:

1. **Extract Token from URL**
   ```
   URL format: https://app.orderflow.com/signup/TOKEN_HERE
   Token length: 64 characters (hex string)
   ```

2. **Check Invitation in Firestore**
   ```
   Navigate to Firestore Console
   Collection: /invitations
   Query: where('token', '==', 'EXTRACTED_TOKEN')
   ```

3. **Verify Invitation Details**:
   - `status`: Should be 'pending'
   - `expiresAt`: Should be > current time
   - `acceptedAt`: Should be null/undefined

**Common Causes & Solutions**:

| Cause | Solution |
|-------|----------|
| Token expired (> 72 hours) | Send new invitation |
| Token already used | Check status; if 'accepted', direct user to login |
| Token doesn't exist in database | Verify URL wasn't truncated; send new invitation |
| Token malformed in URL | Check URL encoding; resend invitation |
| Database query failing | Check Firestore indexes and security rules |

**Resolution Steps**:

1. **If Expired**:
   - Send new invitation from admin panel
   - Update user documentation to note 72-hour expiration
   - Consider sending reminder email before expiration

2. **If Already Used**:
   - Check invitation acceptance date
   - Verify user account was created
   - Direct user to login page

3. **If Missing**:
   - Check invitation was created in Firestore
   - Verify Cloud Function executed successfully
   - Resend invitation

4. **If Malformed**:
   - Check URL encoding in email template
   - Verify email client didn't break link
   - Send new invitation

---

### Issue 5: Token Validation Timeout

**Symptoms**:
- Signup page stuck on "Validating invitation..."
- Eventually times out with error
- Function logs show slow queries

**Diagnostic Steps**:

1. **Check Firestore Indexes**
   ```bash
   firebase firestore:indexes
   ```
   Verify index exists:
   - Collection: invitations
   - Field: token (Ascending)

2. **Check Security Rules**
   ```
   Navigate to Firestore Console > Rules
   Verify rules allow reading invitations by token
   ```

3. **Check Network**
   - Open browser dev tools
   - Check Network tab for failed requests
   - Look for CORS errors

**Resolution Steps**:

1. **Create Missing Index**:
   ```bash
   # Deploy Firestore indexes
   firebase deploy --only firestore:indexes
   ```

2. **Optimize Query**:
   ```typescript
   // In validateInvitationToken function
   const invitationQuery = db.collection('invitations')
     .where('token', '==', token)
     .limit(1); // Limit to 1 result for faster query
   ```

3. **Add Timeout Handling**:
   ```typescript
   // Client-side timeout
   const timeout = setTimeout(() => {
     setError('Request timed out. Please try again.');
   }, 10000); // 10 second timeout
   ```

---

## Account Creation Failures

### Issue 6: Firebase Auth User Creation Fails

**Symptoms**:
- User completes signup form
- Error: "Failed to create account"
- Function logs show Firebase Auth errors

**Diagnostic Steps**:

1. **Check Function Logs**
   ```bash
   firebase functions:log --only acceptInvitation
   ```
   Look for Firebase Auth error codes

2. **Verify Firebase Auth Configuration**
   ```
   Firebase Console > Authentication > Settings
   Check:
   - Email/password provider enabled
   - Email enumeration protection settings
   ```

3. **Check User Already Exists**
   ```
   Firebase Console > Authentication > Users
   Search for email address
   ```

**Common Auth Errors**:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/email-already-exists` | Email registered | Add to existing user (multi-tenant) |
| `auth/invalid-email` | Email format invalid | Validate email on client |
| `auth/weak-password` | Password < 6 chars | Enforce 8 char minimum |
| `auth/operation-not-allowed` | Email/password disabled | Enable in Firebase Console |
| `auth/too-many-requests` | Rate limit hit | Implement retry logic |

**Resolution Steps**:

1. **Handle Existing User**:
   ```typescript
   try {
     // Try to create user
     const userRecord = await admin.auth().createUser({
       email: invitation.email,
       password: password,
       displayName: displayName
     });
   } catch (error: any) {
     if (error.code === 'auth/email-already-exists') {
       // Get existing user
       const existingUser = await admin.auth().getUserByEmail(invitation.email);
       // Add tenant membership to existing user document
       // ... handle multi-tenant case
     } else {
       throw error; // Re-throw other errors
     }
   }
   ```

2. **Enable Email/Password Provider**:
   ```
   Firebase Console > Authentication > Sign-in method
   Click "Email/Password"
   Toggle "Enable"
   Save
   ```

3. **Adjust Password Requirements**:
   - Client-side validation: minimum 8 characters
   - Firebase default: minimum 6 characters
   - Consider adding complexity requirements

---

### Issue 7: User Document Creation Fails

**Symptoms**:
- Firebase Auth user created successfully
- Firestore user document not created
- User can't log in (missing tenant membership)

**Diagnostic Steps**:

1. **Check Function Logs**
   ```bash
   firebase functions:log --only acceptInvitation
   ```
   Look for Firestore write errors

2. **Check Firestore Security Rules**
   ```
   Navigate to Firestore Console > Rules
   Test rules with Firebase Emulator
   ```

3. **Verify User Document**
   ```
   Firestore Console > users collection
   Search for user ID
   Check tenantMemberships structure
   ```

**Common Causes**:

- Security rules blocking write
- Firestore quota exceeded
- Network timeout
- Invalid document structure
- Transaction conflict

**Resolution Steps**:

1. **Fix Security Rules**:
   ```javascript
   // Security rules should allow Cloud Functions to write
   match /users/{userId} {
     // Cloud Functions bypass rules by default (using Admin SDK)
     // But explicit rule for debugging:
     allow create: if false; // Client can't create
     // Functions use Admin SDK and bypass this
   }
   ```

2. **Validate Document Structure**:
   ```typescript
   // Ensure structure matches types.ts
   const userDoc = {
     id: userRecord.uid,
     email: invitation.email.toLowerCase(),
     displayName: displayName,
     phoneNumber: phoneNumber || null,
     createdAt: admin.firestore.FieldValue.serverTimestamp(),
     tenantMemberships: {
       [invitation.tenantId]: {
         role: invitation.role,
         joinedAt: admin.firestore.FieldValue.serverTimestamp(),
         invitedBy: invitation.invitedBy,
         isActive: true
       }
     },
     currentTenantId: invitation.tenantId
   };
   ```

3. **Add Error Recovery**:
   ```typescript
   try {
     await db.collection('users').doc(userRecord.uid).set(userDoc);
   } catch (error) {
     // Rollback: delete Firebase Auth user
     await admin.auth().deleteUser(userRecord.uid);
     throw new functions.https.HttpsError(
       'internal',
       'Failed to create user document'
     );
   }
   ```

---

## Rate Limiting Problems

### Issue 8: Rate Limit Not Resetting

**Symptoms**:
- Tenant can't send invitations
- Rate limit shows "10/10" but hour has passed
- Reset time in past but still blocked

**Diagnostic Steps**:

1. **Check Tenant Metadata**
   ```
   Firestore Console > tenantMetadata/{tenantId}
   Field: invitationRateLimit
   Check:
   - lastResetAt: timestamp
   - invitationsSentThisHour: number
   ```

2. **Verify Time Calculation**
   ```typescript
   // In createInvitation function
   const now = Date.now();
   const lastReset = rateLimitData.lastResetAt.toMillis();
   const hourInMs = 60 * 60 * 1000;
   const shouldReset = (now - lastReset) > hourInMs;
   ```

3. **Check Function Logs**
   ```bash
   firebase functions:log --only createInvitation
   ```
   Look for rate limit logic execution

**Resolution Steps**:

1. **Manual Reset** (emergency):
   ```javascript
   // In Firestore Console or via script
   db.collection('tenantMetadata').doc(tenantId).update({
     'invitationRateLimit.invitationsSentThisHour': 0,
     'invitationRateLimit.lastResetAt': admin.firestore.FieldValue.serverTimestamp()
   });
   ```

2. **Fix Time Calculation**:
   ```typescript
   // Ensure timezone-independent calculation
   const now = Date.now();
   const lastReset = rateLimitData.lastResetAt.toMillis();
   const oneHourAgo = now - (60 * 60 * 1000);

   if (lastReset < oneHourAgo) {
     // Reset counter
     transaction.update(metadataRef, {
       'invitationRateLimit.invitationsSentThisHour': 0,
       'invitationRateLimit.lastResetAt': admin.firestore.FieldValue.serverTimestamp()
     });
   }
   ```

3. **Add Logging**:
   ```typescript
   console.log('Rate limit check:', {
     now: new Date(now).toISOString(),
     lastReset: new Date(lastReset).toISOString(),
     timeSinceReset: (now - lastReset) / 1000 / 60, // minutes
     count: rateLimitData.invitationsSentThisHour
   });
   ```

---

### Issue 9: Race Condition in Rate Limiting

**Symptoms**:
- Multiple admins sending invitations simultaneously
- Counter exceeds 10
- Some invitations fail, others succeed unexpectedly

**Diagnostic Steps**:

1. **Check Recent Invitations**
   ```
   Firestore Console > invitations
   Filter by tenantId and recent createdAt
   Count invitations in last hour
   ```

2. **Review Function Logs**
   Look for concurrent executions of createInvitation

**Resolution Steps**:

1. **Use Firestore Transactions**:
   ```typescript
   // Ensure rate limit check is in transaction
   const result = await db.runTransaction(async (transaction) => {
     const metadataDoc = await transaction.get(metadataRef);
     const rateLimitData = metadataDoc.data().invitationRateLimit;

     // Check and update in same transaction
     if (rateLimitData.invitationsSentThisHour >= 10) {
       throw new Error('Rate limit exceeded');
     }

     transaction.update(metadataRef, {
       'invitationRateLimit.invitationsSentThisHour':
         rateLimitData.invitationsSentThisHour + 1
     });

     // Create invitation in same transaction
     transaction.create(invitationRef, invitationData);
   });
   ```

2. **Add Retry Logic**:
   ```typescript
   // Retry transaction if conflict
   for (let i = 0; i < 3; i++) {
     try {
       await createInvitationTransaction();
       break;
     } catch (error) {
       if (i === 2) throw error;
       await sleep(100 * Math.pow(2, i)); // Exponential backoff
     }
   }
   ```

---

## Multi-Tenant Issues

### Issue 10: Tenant Selector Not Showing

**Symptoms**:
- User belongs to multiple tenants
- Logs in but selector doesn't appear
- Automatically redirected to first tenant

**Diagnostic Steps**:

1. **Check User Document**
   ```
   Firestore Console > users/{userId}
   Field: tenantMemberships
   Verify: multiple tenant IDs present
   ```

2. **Check AuthContext Logic**
   ```typescript
   // In login flow
   if (Object.keys(user.tenantMemberships).length > 1) {
     // Should show selector
   }
   ```

3. **Check Browser Console**
   - Look for JavaScript errors
   - Check component rendering logic

**Resolution Steps**:

1. **Verify Multi-Tenant Logic**:
   ```typescript
   // In AuthContext after login
   const tenantIds = Object.keys(userData.tenantMemberships || {});

   if (tenantIds.length > 1) {
     setShowTenantSelector(true);
   } else if (tenantIds.length === 1) {
     setCurrentTenantId(tenantIds[0]);
   }
   ```

2. **Check Component Mount**:
   ```typescript
   // TenantSelector component
   useEffect(() => {
     if (user && Object.keys(user.tenantMemberships).length > 1) {
       setIsVisible(true);
     }
   }, [user]);
   ```

3. **Add Debug Logging**:
   ```typescript
   console.log('User tenants:', Object.keys(user.tenantMemberships));
   console.log('Should show selector:', tenantIds.length > 1);
   ```

---

### Issue 11: Wrong Tenant Context After Switch

**Symptoms**:
- User switches tenant
- UI still shows previous tenant's data
- Orders/products from wrong tenant displayed

**Diagnostic Steps**:

1. **Check Current Tenant State**
   ```typescript
   // In browser console
   localStorage.getItem('lastSelectedTenantId')
   ```

2. **Check Context State**
   ```typescript
   // Add to component
   console.log('Auth context tenant:', authContext.currentTenantId);
   console.log('Tenant context:', tenantContext.tenant?.id);
   ```

3. **Check Data Queries**
   - Verify all Firestore queries filter by tenantId
   - Check API calls use correct tenant parameter

**Resolution Steps**:

1. **Fix Tenant Switching**:
   ```typescript
   const switchTenant = async (tenantId: string) => {
     // Update user document
     await db.collection('users').doc(user.uid).update({
       currentTenantId: tenantId
     });

     // Update local state
     setCurrentTenantId(tenantId);

     // Update localStorage
     localStorage.setItem('lastSelectedTenantId', tenantId);

     // Reload tenant context
     await loadTenantData(tenantId);

     // Reload app data
     window.location.reload(); // Or selective reload
   };
   ```

2. **Ensure Data Isolation**:
   ```typescript
   // All queries should include tenant filter
   const ordersQuery = db.collection('orders')
     .where('tenantId', '==', currentTenantId)
     .orderBy('createdAt', 'desc');
   ```

3. **Clear Cached Data**:
   ```typescript
   // When switching tenants
   const switchTenant = (tenantId: string) => {
     // Clear cached data
     setOrders([]);
     setProducts([]);
     // ... clear other state

     // Then load new tenant
     setCurrentTenantId(tenantId);
   };
   ```

---

## Cloud Functions Errors

### Issue 12: Function Deployment Fails

**Symptoms**:
- `firebase deploy --only functions` fails
- TypeScript compilation errors
- Deployment hangs or times out

**Diagnostic Steps**:

1. **Check Build Errors**
   ```bash
   cd functions
   npm run build
   ```

2. **Check Dependencies**
   ```bash
   npm install
   npm audit
   ```

3. **Check Function Size**
   ```bash
   du -sh lib/
   ```

**Resolution Steps**:

1. **Fix TypeScript Errors**:
   ```bash
   npm run build
   # Fix any compilation errors
   ```

2. **Update Dependencies**:
   ```bash
   npm update
   npm audit fix
   ```

3. **Reduce Function Size**:
   ```javascript
   // Remove unused imports
   // Use dynamic imports for large libraries
   // Consider splitting into multiple functions
   ```

4. **Increase Deployment Timeout**:
   ```bash
   firebase deploy --only functions --debug
   ```

---

### Issue 13: Function Timeout During Execution

**Symptoms**:
- Function execution exceeds timeout (default 60s)
- Incomplete operations
- Error: "Function execution took too long"

**Diagnostic Steps**:

1. **Check Function Duration**
   ```bash
   firebase functions:log --only functionName
   ```
   Look for execution time in logs

2. **Profile Function**
   ```typescript
   // Add timing logs
   console.time('mailgun-api-call');
   await sendEmail();
   console.timeEnd('mailgun-api-call');
   ```

**Resolution Steps**:

1. **Increase Timeout**:
   ```typescript
   export const createInvitation = functions
     .runWith({
       timeoutSeconds: 120, // 2 minutes
       memory: '256MB'
     })
     .https.onCall(async (data, context) => {
       // ... function code
     });
   ```

2. **Optimize Slow Operations**:
   - Cache frequently accessed data
   - Reduce external API calls
   - Use batch operations
   - Implement pagination

3. **Use Background Functions**:
   - Move slow operations to background triggers
   - Return immediately to user
   - Process asynchronously

---

## Diagnostic Tools

### Tool 1: Invitation Debugger Script

```typescript
// scripts/debug-invitation.ts
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function debugInvitation(token: string) {
  console.log('Debugging invitation with token:', token);

  // Find invitation
  const snapshot = await db.collection('invitations')
    .where('token', '==', token)
    .get();

  if (snapshot.empty) {
    console.error('Invitation not found');
    return;
  }

  const invitation = snapshot.docs[0].data();
  console.log('Invitation found:', {
    id: snapshot.docs[0].id,
    email: invitation.email,
    status: invitation.status,
    createdAt: invitation.createdAt.toDate(),
    expiresAt: invitation.expiresAt.toDate(),
    expired: invitation.expiresAt.toDate() < new Date(),
    tenantId: invitation.tenantId,
    role: invitation.role
  });

  // Check tenant
  const tenantDoc = await db.collection('tenantMetadata')
    .doc(invitation.tenantId)
    .get();

  if (!tenantDoc.exists) {
    console.error('Tenant not found');
  } else {
    console.log('Tenant:', tenantDoc.data().businessName);
  }

  // Check user if accepted
  if (invitation.acceptedByUserId) {
    const userDoc = await db.collection('users')
      .doc(invitation.acceptedByUserId)
      .get();

    if (userDoc.exists) {
      console.log('User created:', {
        id: userDoc.id,
        email: userDoc.data().email,
        tenants: Object.keys(userDoc.data().tenantMemberships)
      });
    }
  }
}

// Usage: node debug-invitation.js TOKEN_HERE
const token = process.argv[2];
if (token) {
  debugInvitation(token).then(() => process.exit(0));
} else {
  console.error('Usage: node debug-invitation.js <token>');
  process.exit(1);
}
```

---

### Tool 2: Rate Limit Checker

```typescript
// scripts/check-rate-limit.ts
async function checkRateLimit(tenantId: string) {
  const metadataDoc = await db.collection('tenantMetadata')
    .doc(tenantId)
    .get();

  const rateLimit = metadataDoc.data().invitationRateLimit;
  const now = Date.now();
  const lastReset = rateLimit.lastResetAt.toMillis();
  const minutesSinceReset = (now - lastReset) / 1000 / 60;

  console.log('Rate Limit Status:', {
    invitationsSent: rateLimit.invitationsSentThisHour,
    maxInvitations: 10,
    canSendMore: rateLimit.invitationsSentThisHour < 10,
    lastResetAt: new Date(lastReset).toISOString(),
    minutesSinceReset: Math.round(minutesSinceReset),
    willResetIn: Math.max(0, 60 - minutesSinceReset) + ' minutes'
  });

  // Count actual invitations in last hour
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const recentInvitations = await db.collection('invitations')
    .where('tenantId', '==', tenantId)
    .where('createdAt', '>', oneHourAgo)
    .get();

  console.log('Actual invitations in last hour:', recentInvitations.size);
}
```

---

### Tool 3: Email Delivery Monitor

```typescript
// scripts/monitor-email-delivery.ts
async function monitorEmailDelivery(tenantId: string) {
  const invitations = await db.collection('invitations')
    .where('tenantId', '==', tenantId)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  const stats = {
    total: invitations.size,
    pending: 0,
    accepted: 0,
    expired: 0,
    error: 0,
    avgDeliveryTime: 0
  };

  invitations.forEach(doc => {
    const data = doc.data();
    stats[data.status]++;

    if (data.emailSentAt && data.createdAt) {
      const deliveryTime = data.emailSentAt.toMillis() - data.createdAt.toMillis();
      stats.avgDeliveryTime += deliveryTime;
    }
  });

  stats.avgDeliveryTime = stats.avgDeliveryTime / invitations.size / 1000; // seconds

  console.log('Email Delivery Statistics:', stats);
  console.log('Delivery Rate:', ((stats.accepted / stats.total) * 100).toFixed(1) + '%');
  console.log('Error Rate:', ((stats.error / stats.total) * 100).toFixed(1) + '%');
}
```

---

## Emergency Procedures

### Procedure 1: Disable Invitation System

If critical issue discovered:

```bash
# Stop all invitation functions
firebase functions:delete createInvitation
firebase functions:delete sendInvitationEmailTrigger
firebase functions:delete acceptInvitation

# Or update functions to return error
firebase deploy --only functions
```

### Procedure 2: Rollback Deployment

```bash
# List recent deployments
firebase hosting:clone SOURCE_SITE_ID:VERSION_ID DESTINATION_SITE_ID

# Rollback functions
firebase rollback functions --message "Rollback due to issue"
```

### Procedure 3: Emergency Contact

- **On-Call Engineer**: [contact info]
- **Firebase Support**: support@firebase.google.com
- **Mailgun Support**: support@mailgun.com

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Next Review**: After production deployment
