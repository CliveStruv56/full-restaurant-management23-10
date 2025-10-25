# Deployment Guide: User Invitation System Backend (Phase 2)

## Prerequisites

Before deploying the Cloud Functions, ensure you have:

1. Firebase CLI installed and authenticated
2. Firebase project set up (staging and production)
3. Mailgun account with verified domain
4. Cloud Scheduler API enabled in Firebase project

---

## Step 1: Configure Mailgun

### 1.1 Create Mailgun Account

1. Go to https://www.mailgun.com/
2. Sign up for an account
3. Verify your email address

### 1.2 Add and Verify Domain

1. In Mailgun dashboard, go to "Sending" > "Domains"
2. Click "Add New Domain"
3. Enter your domain (e.g., `mg.orderflow.app`)
4. Follow instructions to add DNS records:
   - TXT record for domain verification
   - TXT record for SPF
   - CNAME records for DKIM
   - MX records (optional, for receiving)
5. Wait for verification (can take up to 48 hours)

### 1.3 Get API Key

1. In Mailgun dashboard, go to "Settings" > "API Keys"
2. Copy your "Private API key"
3. Keep this secure - you'll need it for configuration

---

## Step 2: Configure Firebase Secrets

### 2.1 Set Mailgun API Key (Secret Manager)

```bash
# Navigate to functions directory
cd functions

# Set the Mailgun API key as a secret
firebase functions:secrets:set MAILGUN_API_KEY

# When prompted, paste your Mailgun API key
# Press Enter when done
```

### 2.2 Set Other Configuration Values

```bash
# Set Mailgun domain
firebase functions:config:set mailgun.domain="mg.orderflow.app"

# Set from email address
firebase functions:config:set mailgun.from_email="noreply@orderflow.app"

# Set from name
firebase functions:config:set mailgun.from_name="OrderFlow"

# Set application base URL (optional, defaults to https://orderflow.app)
firebase functions:config:set app.base_url="https://orderflow.app"
```

### 2.3 Verify Configuration

```bash
# View current configuration
firebase functions:config:get
```

Expected output:
```json
{
  "mailgun": {
    "domain": "mg.orderflow.app",
    "from_email": "noreply@orderflow.app",
    "from_name": "OrderFlow"
  },
  "app": {
    "base_url": "https://orderflow.app"
  }
}
```

---

## Step 3: Enable Cloud Scheduler API

### 3.1 Enable API

```bash
# Enable Cloud Scheduler API (required for scheduled functions)
gcloud services enable cloudscheduler.googleapis.com --project=YOUR_PROJECT_ID
```

Or enable via Firebase Console:
1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "APIs & Services" > "Library"
4. Search for "Cloud Scheduler API"
5. Click "Enable"

### 3.2 Set Region (First-Time Setup)

```bash
# Set App Engine region (required for Cloud Scheduler)
# Choose a region close to your users
gcloud app create --region=us-central
```

Note: You can only set this once per project.

---

## Step 4: Deploy to Staging

### 4.1 Build Functions

```bash
# From functions directory
npm run build
```

Verify no errors in the build output.

### 4.2 Deploy Functions Only

```bash
# Deploy all functions to staging
firebase deploy --only functions --project staging

# Or deploy specific functions
firebase deploy --only functions:createInvitation,functions:acceptInvitation --project staging
```

### 4.3 Verify Deployment

```bash
# List deployed functions
firebase functions:list --project staging

# Expected output should show 6 functions:
# - createInvitation
# - sendInvitationEmailTrigger
# - acceptInvitation
# - sendInvitationReminderScheduled
# - sendAcceptanceNotificationTrigger
# - cleanupExpiredInvitationsScheduled
```

### 4.4 Verify Cloud Scheduler Jobs

1. Go to Cloud Console: https://console.cloud.google.com/cloudscheduler
2. Select your staging project
3. Verify 2 scheduled jobs exist:
   - `sendInvitationReminderScheduled` (runs hourly)
   - `cleanupExpiredInvitationsScheduled` (runs daily at 2 AM UTC)

---

## Step 5: Test Functions

### 5.1 Test Invitation Creation

1. Log in to staging app as an admin user
2. Open browser console
3. Run:

```javascript
// Get Firebase Functions instance
const functions = firebase.functions();

// Call createInvitation
const createInvitation = functions.httpsCallable('createInvitation');

createInvitation({
  email: 'test@example.com',
  role: 'staff'
})
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### 5.2 Check Email Delivery

1. Check the inbox of the invited email address
2. Email should arrive within 60 seconds
3. Verify email contains:
   - Inviter name
   - Business name
   - Role
   - Signup link with token
   - Expiration time

### 5.3 Test Invitation Acceptance

1. Copy the signup URL from the invitation email
2. Open in a new browser window
3. Fill out the signup form:
   - Display name
   - Password (8+ characters)
   - Phone number (optional)
4. Click "Create Account & Sign In"
5. Verify auto-login works
6. Check that admin receives acceptance notification email

### 5.4 Test Rate Limiting

```javascript
// Send 11 invitations rapidly to test rate limit
const functions = firebase.functions();
const createInvitation = functions.httpsCallable('createInvitation');

for (let i = 1; i <= 11; i++) {
  createInvitation({
    email: `test${i}@example.com`,
    role: 'staff'
  })
    .then(result => console.log(`Invitation ${i}:`, result))
    .catch(error => console.error(`Invitation ${i} failed:`, error));
}

// Expected: First 10 succeed, 11th fails with rate limit error
```

### 5.5 Monitor Function Logs

```bash
# View all function logs
firebase functions:log --project staging

# View logs for specific function
firebase functions:log --only createInvitation --project staging

# Stream logs in real-time
firebase functions:log --project staging --follow
```

---

## Step 6: Deploy to Production

### 6.1 Pre-Deployment Checklist

- [ ] All staging tests passed
- [ ] Email delivery working correctly
- [ ] Rate limiting working as expected
- [ ] Multi-tenant user flows tested
- [ ] Cloud Scheduler jobs running correctly
- [ ] Mailgun production credentials configured
- [ ] Production database backup created

### 6.2 Configure Production Secrets

```bash
# Switch to production project
firebase use production

# Set Mailgun API key
firebase functions:secrets:set MAILGUN_API_KEY

# Set other configuration
firebase functions:config:set mailgun.domain="mg.orderflow.app"
firebase functions:config:set mailgun.from_email="noreply@orderflow.app"
firebase functions:config:set mailgun.from_name="OrderFlow"
firebase functions:config:set app.base_url="https://orderflow.app"
```

### 6.3 Deploy Functions

```bash
# Build
npm run build

# Deploy to production
firebase deploy --only functions --project production
```

### 6.4 Verify Production Deployment

1. Check Cloud Functions console
2. Verify all 6 functions deployed
3. Check Cloud Scheduler jobs created
4. Test with a real invitation
5. Monitor logs for 24 hours

---

## Step 7: Monitoring and Maintenance

### 7.1 Set Up Alerts

Configure alerts for:
- Function execution errors
- Email delivery failures
- Rate limit exceeded events
- Scheduled job failures

### 7.2 Monitor Metrics

Track:
- Invitation creation rate
- Email delivery success rate
- Acceptance rate
- Function execution times
- Mailgun delivery stats

### 7.3 Regular Checks

Weekly:
- Review function error logs
- Check Mailgun delivery stats
- Verify scheduled jobs running

Monthly:
- Review rate limiting effectiveness
- Analyze invitation/acceptance metrics
- Check for security issues

---

## Troubleshooting

### Email Not Sending

**Symptom:** Invitation created but no email received

**Diagnosis:**
```bash
# Check function logs
firebase functions:log --only sendInvitationEmailTrigger --project staging

# Check invitation document status
# In Firestore console, check /invitations/{id}
# Look for status='error' or missing emailSentAt
```

**Solutions:**
1. Verify Mailgun API key is set correctly
2. Check Mailgun domain verification status
3. Verify from email address
4. Check Mailgun account status (paid/free limits)
5. Review function error logs for specific error

### Rate Limit Not Working

**Symptom:** Can send more than 10 invitations per hour

**Diagnosis:**
```bash
# Check tenantMetadata document
# /tenantMetadata/{tenantId}
# Look at invitationRateLimit object
```

**Solutions:**
1. Verify Firestore transaction is working
2. Check for clock skew issues
3. Ensure tenantMetadata document exists
4. Review rate limit logic in createInvitation function

### Scheduled Functions Not Running

**Symptom:** Reminders not sent or expired invitations not cleaned up

**Diagnosis:**
1. Go to Cloud Scheduler console
2. Check job status
3. View job logs

**Solutions:**
1. Verify Cloud Scheduler API is enabled
2. Check App Engine region is set
3. Verify function deployment was successful
4. Manually trigger job to test
5. Check function execution logs

### Token Validation Failing

**Symptom:** Users can't accept invitations with valid tokens

**Diagnosis:**
```bash
# Check acceptInvitation logs
firebase functions:log --only acceptInvitation --project staging

# Check invitation document
# Verify status='pending' and expiresAt > now
```

**Solutions:**
1. Verify token in URL matches invitation document
2. Check expiration timestamp
3. Ensure invitation hasn't been accepted already
4. Review function logs for specific error

### Multi-Tenant User Issues

**Symptom:** Users can't be added to multiple tenants

**Diagnosis:**
- Check user document structure
- Verify tenantMemberships object
- Check acceptInvitation logic

**Solutions:**
1. Ensure user document has tenantMemberships object
2. Verify existing memberships are preserved
3. Check that currentTenantId is updated
4. Review multi-tenant logic in acceptInvitation

---

## Rollback Procedure

If issues occur after deployment:

### 1. Immediate Rollback

```bash
# Roll back functions to previous version
firebase functions:rollback --project production

# Specify a specific deployment
firebase functions:rollback DEPLOYMENT_ID --project production
```

### 2. Disable Problematic Function

```bash
# Delete specific function
firebase functions:delete FUNCTION_NAME --project production

# Deploy old version of specific function
# (checkout previous code version first)
firebase deploy --only functions:FUNCTION_NAME --project production
```

### 3. Disable Scheduled Functions

Via Cloud Scheduler console:
1. Go to Cloud Scheduler
2. Select the job
3. Click "Pause"

---

## Performance Optimization

### Cold Start Reduction

```bash
# Set minimum instances for critical functions
firebase functions:config:set functions.createInvitation.minInstances=1
firebase functions:config:set functions.acceptInvitation.minInstances=1
```

Note: This increases costs but reduces cold start latency.

### Timeout Configuration

Default timeout is 60 seconds. Adjust if needed:

```typescript
// In function definition
export const myFunction = functions
  .runWith({ timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    // ...
  });
```

### Memory Allocation

Default memory is 256MB. Increase for heavy processing:

```typescript
export const myFunction = functions
  .runWith({ memory: '512MB' })
  .https.onCall(async (data, context) => {
    // ...
  });
```

---

## Security Considerations

### 1. Protect API Keys

- Never commit API keys to version control
- Use Firebase Secret Manager for sensitive values
- Rotate API keys periodically
- Restrict API key access in Mailgun dashboard

### 2. Monitor for Abuse

- Set up alerts for rate limit exceeded events
- Monitor for unusual invitation patterns
- Review invited email domains for spam
- Track acceptance rates

### 3. Audit Trail

- All invitations logged in Firestore
- Function execution logs retained
- Track who invited whom
- Monitor failed attempts

---

## Cost Estimation

### Cloud Functions Costs

**Invocations (per million):**
- First 2 million: Free
- Additional: $0.40/million

**Compute Time (per 100,000 GB-seconds):**
- First 400,000: Free
- Additional: $0.0000025/GB-second

**Estimated Monthly Cost:**
- 1,000 invitations: ~$0.01
- 10,000 invitations: ~$0.10
- 100,000 invitations: ~$1.00

### Mailgun Costs

**Free Tier:**
- First 1,000 emails/month: Free

**Paid Plans:**
- Foundation: $35/month (50,000 emails)
- Growth: $80/month (100,000 emails)

### Total Estimated Cost

For 10,000 invitations/month:
- Cloud Functions: ~$0.10
- Mailgun: $35 (Foundation plan)
- **Total: ~$35.10/month**

---

## Support and Resources

### Documentation

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Mailgun API Docs](https://documentation.mailgun.com/en/latest/)
- [Cloud Scheduler Docs](https://cloud.google.com/scheduler/docs)

### Project Documentation

- Spec: `agent-os/specs/2025-10-25-user-invitation-system/spec.md`
- Requirements: `agent-os/specs/2025-10-25-user-invitation-system/planning/requirements.md`
- Tasks: `agent-os/specs/2025-10-25-user-invitation-system/tasks.md`
- Phase 2 Summary: `agent-os/specs/2025-10-25-user-invitation-system/PHASE2_IMPLEMENTATION_SUMMARY.md`

### Getting Help

1. Check function logs for error details
2. Review this troubleshooting guide
3. Check Firebase status page
4. Contact Mailgun support for email issues
5. Review project documentation

---

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Status:** Ready for Deployment
