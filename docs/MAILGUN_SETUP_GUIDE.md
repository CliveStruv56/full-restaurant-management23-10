# Mailgun Configuration Guide

**For**: System Administrators and DevOps
**Version**: 1.0
**Date**: October 25, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [Domain Verification](#domain-verification)
4. [DNS Configuration](#dns-configuration)
5. [API Key Generation](#api-key-generation)
6. [Firebase Configuration](#firebase-configuration)
7. [Testing Email Delivery](#testing-email-delivery)
8. [Production Checklist](#production-checklist)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Mailgun is the email delivery service used by the User Invitation System to send:
- Invitation emails to new users
- Reminder emails before invitation expiration
- Acceptance notification emails to admins

### Why Mailgun?

- **Reliable**: 99.99% uptime SLA
- **Scalable**: Handles millions of emails
- **Developer-friendly**: Simple REST API
- **Affordable**: Generous free tier
- **Deliverability**: Built-in email best practices

### Prerequisites

- Domain name (e.g., orderflow.app)
- DNS management access
- Firebase project with billing enabled
- Credit card for Mailgun account (required even for free tier)

---

## Account Setup

### Step 1: Create Mailgun Account

1. **Visit Mailgun Website**
   - Go to: https://www.mailgun.com
   - Click "Start Sending" or "Sign Up"

2. **Registration**
   - Enter business email address
   - Create strong password
   - Complete email verification
   - Verify phone number (SMS)

3. **Account Details**
   - Company name: Your restaurant/company name
   - Website: orderflow.app (or your domain)
   - Number of emails per month: Select appropriate tier
   - Use case: "Transactional emails"

4. **Billing Setup**
   - Add credit card (required for verification)
   - Select plan:
     - **Foundation** (Free): 5,000 emails/month - Good for testing
     - **Growth** ($35/month): 50,000 emails/month - Good for production
     - **Scale** ($80/month): 100,000 emails/month - For large deployments

### Step 2: Verify Your Account

1. Check your email for verification link
2. Click link to verify email address
3. Complete any additional verification steps
4. Log in to Mailgun dashboard

### Step 3: Dashboard Overview

Navigate to main dashboard to see:
- **Sending** tab: Domain configuration
- **Analytics** tab: Delivery statistics
- **API Keys** tab: Credentials
- **Settings** tab: Account settings

---

## Domain Verification

### Option 1: Subdomain (Recommended)

**Subdomain approach**: Use a subdomain specifically for email sending
- Example: `mg.orderflow.app`
- Advantages: Doesn't affect main domain reputation, easier DNS management
- Use case: Most installations

**Steps**:

1. **Add Domain in Mailgun**
   ```
   Dashboard > Sending > Domains > Add New Domain
   Domain Name: mg.orderflow.app
   Domain Region: Choose closest to your users (US, EU)
   Click "Add Domain"
   ```

2. **Choose Domain Type**
   - Select: "I will use this domain for sending"
   - DKIM key length: 2048 bits (more secure)

3. **Get DNS Records**
   - Mailgun will display required DNS records
   - Keep this page open (you'll need these values)

---

### Option 2: Root Domain

**Root domain approach**: Use main domain for email
- Example: `orderflow.app`
- Advantages: Professional sender address
- Disadvantages: More complex DNS, affects main domain reputation
- Use case: Established brands with good email practices

**Steps**: Same as subdomain but use root domain name

---

## DNS Configuration

### Required DNS Records

Mailgun requires 4 types of DNS records:

1. **TXT Record** (SPF) - Sender Policy Framework
2. **TXT Record** (DKIM) - DomainKeys Identified Mail
3. **TXT Record** (DMARC) - Domain-based Message Authentication
4. **CNAME Record** (Tracking) - For click/open tracking

### Getting Your DNS Records

1. In Mailgun dashboard, go to: Sending > Domains > [Your Domain]
2. Click "DNS Records" tab
3. Copy each record value (don't modify them)

### Example DNS Records

For domain: `mg.orderflow.app`

```
# SPF Record
Type: TXT
Host: mg.orderflow.app
Value: v=spf1 include:mailgun.org ~all
TTL: 3600

# DKIM Record
Type: TXT
Host: k1._domainkey.mg.orderflow.app
Value: k=rsa; p=MIGfMA0GCSqGSIb3DQEBA... (very long string provided by Mailgun)
TTL: 3600

# DMARC Record (optional but recommended)
Type: TXT
Host: _dmarc.mg.orderflow.app
Value: v=DMARC1; p=none; rua=mailto:admin@orderflow.app
TTL: 3600

# Tracking Domain (optional)
Type: CNAME
Host: email.mg.orderflow.app
Value: mailgun.org
TTL: 3600
```

### Adding Records to Your DNS Provider

Instructions vary by provider. Here are guides for common providers:

#### Cloudflare

1. Log in to Cloudflare
2. Select your domain
3. Click "DNS" in sidebar
4. Click "Add record"
5. For each record:
   - Type: Select type (TXT or CNAME)
   - Name: Enter host (without domain suffix)
   - Content: Paste value from Mailgun
   - TTL: Auto
   - Proxy status: DNS only (gray cloud)
   - Click "Save"

#### Google Domains

1. Log in to Google Domains
2. Select your domain
3. Click "DNS" in sidebar
4. Scroll to "Custom records"
5. Click "Manage custom records"
6. For each record:
   - Host name: Enter host
   - Type: Select type
   - TTL: 3600
   - Data: Paste value
   - Click "Add"

#### AWS Route 53

1. Log in to AWS Console
2. Go to Route 53 > Hosted zones
3. Select your domain
4. Click "Create record"
5. For each record:
   - Record name: Enter host
   - Record type: Select type
   - Value: Paste value
   - TTL: 3600
   - Click "Create records"

#### Namecheap

1. Log in to Namecheap
2. Domain List > Manage > Advanced DNS
3. Click "Add new record"
4. For each record:
   - Type: Select type
   - Host: Enter host
   - Value: Paste value
   - TTL: Automatic
   - Click checkmark to save

### DNS Propagation

- **Time**: DNS changes take 1-48 hours to propagate globally
- **Typical**: Most changes visible within 1-4 hours
- **Check status**: Use Mailgun's verification tool

### Verify DNS Configuration

1. **Wait for Propagation**
   - Minimum: 1 hour
   - Recommended: 4 hours before testing

2. **Check in Mailgun Dashboard**
   ```
   Sending > Domains > [Your Domain] > DNS Records
   Look for green checkmarks next to each record
   ```

3. **Manual DNS Verification**
   ```bash
   # Check SPF record
   dig TXT mg.orderflow.app +short

   # Check DKIM record
   dig TXT k1._domainkey.mg.orderflow.app +short

   # Check DMARC record
   dig TXT _dmarc.mg.orderflow.app +short
   ```

4. **Online Tools**
   - MXToolbox: https://mxtoolbox.com/SuperTool.aspx
   - Google Admin Toolbox: https://toolbox.googleapps.com/apps/dig/

### Common DNS Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Record not found | DNS not propagated yet | Wait 4-24 hours |
| Wrong value | Copied incorrectly | Double-check value from Mailgun |
| DKIM fails | Value too long, split by DNS provider | Contact DNS provider for large TXT records |
| Multiple SPF records | Existing SPF record | Merge records: `v=spf1 include:mailgun.org include:other.com ~all` |

---

## API Key Generation

### Step 1: Generate API Key

1. **Navigate to API Keys**
   ```
   Mailgun Dashboard > Settings > API Keys
   ```

2. **Create New Key**
   - Click "Add new key"
   - Name: "OrderFlow Production" (or appropriate name)
   - Click "Create"

3. **Copy API Key**
   - Key format: `key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **IMPORTANT**: Copy immediately - you can only see it once
   - Store securely (password manager or secrets vault)

### API Key Types

| Key Type | Use Case | Permissions |
|----------|----------|-------------|
| **Private API key** | Server-side functions | Full access to Mailgun API |
| **Public API key** | Client-side (not used here) | Limited validation operations |
| **SMTP credentials** | SMTP sending (not used here) | Email sending only |

**For OrderFlow**: Use **Private API key** in Cloud Functions

### Security Best Practices

1. **Never Commit to Git**
   - Don't add API key to code
   - Use environment variables or secrets manager
   - Add to .gitignore

2. **Rotate Keys Regularly**
   - Rotate every 90 days
   - Rotate immediately if exposed
   - Keep old key active briefly during rotation

3. **Limit Key Scope**
   - Create separate keys for staging/production
   - Use restricted keys if possible
   - Monitor key usage in dashboard

---

## Firebase Configuration

### Method 1: Firebase Secret Manager (Recommended)

**For**: Production deployments

**Steps**:

1. **Install Firebase CLI** (if not already)
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Set Mailgun API Key as Secret**
   ```bash
   firebase functions:secrets:set MAILGUN_API_KEY
   ```
   When prompted, paste your Mailgun API key

3. **Grant Functions Access to Secret**
   ```bash
   # Secret is automatically accessible to functions
   # Verify with:
   firebase functions:secrets:access MAILGUN_API_KEY
   ```

4. **Configure Other Settings** (non-secret)
   ```bash
   firebase functions:config:set mailgun.domain="mg.orderflow.app"
   firebase functions:config:set mailgun.from_email="noreply@orderflow.app"
   firebase functions:config:set mailgun.from_name="OrderFlow"
   ```

5. **Update Function Code**
   ```typescript
   // functions/src/email/mailgun.ts
   import * as functions from 'firebase-functions';

   const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
   const MAILGUN_DOMAIN = functions.config().mailgun.domain || 'mg.orderflow.app';
   const FROM_EMAIL = functions.config().mailgun.from_email || 'noreply@orderflow.app';
   const FROM_NAME = functions.config().mailgun.from_name || 'OrderFlow';
   ```

### Method 2: Environment Variables (Development)

**For**: Local testing and staging

**Steps**:

1. **Create `.env` File** (in `/functions` directory)
   ```bash
   cd functions
   touch .env
   ```

2. **Add Mailgun Configuration**
   ```env
   # .env file (DO NOT COMMIT TO GIT)
   MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   MAILGUN_DOMAIN=mg.orderflow.app
   MAILGUN_FROM_EMAIL=noreply@orderflow.app
   MAILGUN_FROM_NAME=OrderFlow
   ```

3. **Add to .gitignore**
   ```bash
   echo "functions/.env" >> .gitignore
   ```

4. **Load in Functions** (for emulator)
   ```typescript
   // Only for local development
   if (process.env.NODE_ENV !== 'production') {
     require('dotenv').config();
   }
   ```

### Method 3: Firebase Environment Config (Legacy)

**For**: Older Firebase projects

```bash
# Set all config at once
firebase functions:config:set \
  mailgun.api_key="key-xxxx" \
  mailgun.domain="mg.orderflow.app" \
  mailgun.from_email="noreply@orderflow.app" \
  mailgun.from_name="OrderFlow"

# View current config
firebase functions:config:get

# Access in code
const config = functions.config();
const apiKey = config.mailgun.api_key;
```

### Verify Configuration

1. **Check Secrets**
   ```bash
   firebase functions:secrets:access MAILGUN_API_KEY
   # Should display: MAILGUN_API_KEY=key-xxxx
   ```

2. **Check Config**
   ```bash
   firebase functions:config:get
   # Should display JSON with mailgun settings
   ```

3. **Test in Function**
   ```typescript
   console.log('Mailgun configured:', {
     domain: MAILGUN_DOMAIN,
     fromEmail: FROM_EMAIL,
     apiKeySet: !!MAILGUN_API_KEY
   });
   ```

---

## Testing Email Delivery

### Test 1: Send Test Email via Mailgun Dashboard

1. **Navigate to Test Tool**
   ```
   Mailgun Dashboard > Sending > [Your Domain] > Send a test message
   ```

2. **Send Test**
   - From: noreply@mg.orderflow.app
   - To: your-email@example.com
   - Subject: Test Email
   - Body: This is a test
   - Click "Send"

3. **Verify Receipt**
   - Check inbox within 60 seconds
   - Check spam folder if not in inbox
   - Verify "From" address matches

### Test 2: cURL Test

```bash
curl -s --user 'api:YOUR_MAILGUN_API_KEY' \
  https://api.mailgun.net/v3/mg.orderflow.app/messages \
  -F from='OrderFlow <noreply@mg.orderflow.app>' \
  -F to='test@example.com' \
  -F subject='Test Email from cURL' \
  -F text='This is a test email sent via Mailgun API'
```

**Expected Response**:
```json
{
  "id": "<20250125123456.1.XXXXX@mg.orderflow.app>",
  "message": "Queued. Thank you."
}
```

### Test 3: Test Invitation Function

1. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

2. **Create Test Invitation**
   - Log in to admin panel
   - Send invitation to your email
   - Check logs: `firebase functions:log`

3. **Verify Email**
   - Check inbox within 60 seconds
   - Verify email content
   - Click signup link to test flow

### Test 4: Email Deliverability Test

Use online tools to check email quality:

1. **Mail Tester**
   - Send invitation to: test@mail-tester.com
   - Visit: https://www.mail-tester.com
   - Check score (should be 8/10 or higher)
   - Review recommendations

2. **GlockApps**
   - https://glockapps.com
   - Tests spam filters across providers
   - Shows inbox placement rates

3. **Send to Multiple Providers**
   - Gmail
   - Outlook/Hotmail
   - Yahoo Mail
   - Corporate email
   - Check delivery and spam placement

### Common Test Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Email not received | Domain not verified | Complete DNS setup, wait for propagation |
| 401 Unauthorized | Wrong API key | Verify API key in Firebase secrets |
| 400 Bad Request | Invalid "from" address | Must match verified domain |
| Lands in spam | DNS not configured | Add SPF, DKIM, DMARC records |
| Long delay | Mailgun server load | Normal for first email, check Mailgun status |

---

## Production Checklist

Before going live with production email:

### Pre-Launch Checklist

- [ ] Mailgun account created and verified
- [ ] Domain added and verified in Mailgun
- [ ] All DNS records added (SPF, DKIM, DMARC)
- [ ] DNS records verified (green checkmarks in Mailgun)
- [ ] API key generated and stored securely
- [ ] API key added to Firebase Secret Manager
- [ ] Mailgun domain config set in Firebase
- [ ] Test email sent and received successfully
- [ ] Invitation test completed end-to-end
- [ ] Email deliverability score 8/10 or higher
- [ ] Tested on Gmail, Outlook, Yahoo
- [ ] Emails not landing in spam
- [ ] All emails < 100KB size
- [ ] Unsubscribe link added (future enhancement)
- [ ] Function logs show no Mailgun errors
- [ ] Production billing plan selected on Mailgun
- [ ] Credit card on file for Mailgun account
- [ ] Alert thresholds configured
- [ ] Monitoring dashboard set up

### Launch Day

1. **Monitor Closely**
   - Watch Mailgun dashboard
   - Check bounce rate
   - Monitor spam complaints
   - Review function logs

2. **Key Metrics**
   - Delivery rate: Should be > 98%
   - Bounce rate: Should be < 2%
   - Complaint rate: Should be < 0.1%
   - Average delivery time: < 60 seconds

3. **First 24 Hours**
   - Check every 4 hours
   - Address any issues immediately
   - Document any problems
   - Collect user feedback

### Ongoing Maintenance

- Review Mailgun dashboard weekly
- Monitor delivery rates
- Check for bounces and complaints
- Rotate API keys quarterly
- Update DNS records if changed
- Review and optimize email content
- Track user acceptance rates

---

## Monitoring and Maintenance

### Mailgun Dashboard Metrics

**Key Metrics to Monitor**:

1. **Delivery Rate**
   - Target: > 98%
   - Location: Analytics > Overview
   - Action if low: Check bounces, verify DNS

2. **Bounce Rate**
   - Target: < 2%
   - Types:
     - Hard bounce: Invalid email address
     - Soft bounce: Temporary issue (full inbox)
   - Action: Remove hard bounced addresses

3. **Complaint Rate**
   - Target: < 0.1%
   - Meaning: Users marked email as spam
   - Action: Review email content, remove complainers

4. **Click/Open Rates**
   - Optional tracking
   - Requires tracking CNAME
   - Useful for invitation acceptance prediction

### Set Up Alerts

1. **Mailgun Alerts**
   ```
   Settings > Alerts > Add Alert
   Options:
   - High bounce rate (> 5%)
   - High complaint rate (> 0.5%)
   - Delivery rate drops (< 95%)
   ```

2. **Firebase Monitoring**
   ```
   Firebase Console > Functions > Metrics
   Set alerts for:
   - Function error rate > 5%
   - Function execution time > 30s
   - Function failures
   ```

### Webhook Setup (Advanced)

Configure webhooks to receive real-time delivery events:

1. **Create Webhook Endpoint**
   ```typescript
   // New Cloud Function
   export const mailgunWebhook = functions.https.onRequest(async (req, res) => {
     // Verify webhook signature
     // Process event (delivered, bounced, complained)
     // Update invitation status in Firestore
   });
   ```

2. **Add Webhook in Mailgun**
   ```
   Settings > Webhooks > Add Webhook
   URL: https://us-central1-PROJECT.cloudfunctions.net/mailgunWebhook
   Events: delivered, failed, complained
   ```

3. **Verify Webhook Signature**
   ```typescript
   const crypto = require('crypto');

   function verifyWebhookSignature(timestamp, token, signature) {
     const key = MAILGUN_WEBHOOK_SIGNING_KEY;
     const hmac = crypto.createHmac('sha256', key);
     hmac.update(timestamp + token);
     return hmac.digest('hex') === signature;
   }
   ```

---

## Troubleshooting

### Issue: Domain Not Verifying

**Symptoms**: Red X next to DNS records in Mailgun

**Solutions**:
1. Wait 4-24 hours for DNS propagation
2. Verify DNS records with `dig` command
3. Check for typos in DNS values
4. Contact DNS provider for TXT record limits
5. Try removing and re-adding records

### Issue: Emails Going to Spam

**Causes**:
- DNS records not configured
- Domain reputation low (new domain)
- Email content triggers spam filters
- No DMARC policy

**Solutions**:
1. Ensure SPF, DKIM, DMARC all verified
2. Warm up domain gradually (start with low volume)
3. Keep email plain text (no HTML)
4. Include physical address in footer
5. Avoid spam trigger words
6. Test with mail-tester.com

### Issue: High Bounce Rate

**Causes**:
- Invalid email addresses
- Typos in email addresses
- Abandoned email accounts
- Corporate email blocking

**Solutions**:
1. Implement email validation on client
2. Use email verification API (future enhancement)
3. Remove hard bounced emails from system
4. Ask users to whitelist sender address

### Issue: API Authentication Fails

**Symptoms**: 401 Unauthorized error

**Solutions**:
1. Verify API key in Firebase secrets
2. Check API key format: `key-xxxxx`
3. Ensure key hasn't been rotated/deleted
4. Generate new key if needed
5. Redeploy functions after changing secrets

### Issue: Rate Limit on Mailgun

**Symptoms**: 429 Too Many Requests error

**Solutions**:
1. Check Mailgun plan limits
2. Upgrade plan if needed
3. Implement exponential backoff retry
4. Spread invitations over time
5. Contact Mailgun for temporary increase

### Getting Support

**Mailgun Support**:
- Dashboard: Help > Contact Support
- Email: support@mailgun.com
- Docs: https://documentation.mailgun.com
- Status: https://status.mailgun.com

**Include in Support Request**:
- Account email
- Domain name
- API key (first/last 4 chars only)
- Error messages
- Timestamp of issue
- Steps to reproduce

---

## Cost Estimation

### Mailgun Pricing (as of 2025)

| Plan | Monthly Cost | Emails Included | Per Additional Email |
|------|-------------|-----------------|---------------------|
| Foundation | $0 | 5,000 | $0.80 per 1,000 |
| Growth | $35 | 50,000 | $0.80 per 1,000 |
| Scale | $80 | 100,000 | $0.50 per 1,000 |

### Usage Estimation

**For Typical Restaurant**:
- Staff size: 10-20 people
- Onboarding invitations: 20 emails
- Monthly new hires: 2-5 invitations
- Reminder emails: ~30% of invitations
- Acceptance notifications: ~70% of invitations
- **Total monthly**: ~50-100 emails

**Recommendation**: Foundation plan (free tier) is sufficient for most restaurants

**For Multi-Location Chain**:
- 10 locations x 20 staff = 200 initial invitations
- Monthly turnover: ~50 invitations
- Reminders and notifications: +100 emails
- **Total monthly**: ~300-500 emails

**Recommendation**: Foundation plan with pay-as-you-go

**For Enterprise**:
- 100+ locations
- Thousands of staff
- **Total monthly**: 10,000+ emails

**Recommendation**: Growth or Scale plan

---

## Additional Resources

### Official Documentation
- Mailgun API Docs: https://documentation.mailgun.com
- Firebase Secrets: https://firebase.google.com/docs/functions/config-env
- Email Best Practices: https://www.mailgun.com/blog/email-best-practices

### Tools
- DNS Checker: https://dnschecker.org
- SPF Validator: https://www.kitterman.com/spf/validate.html
- DMARC Validator: https://dmarc.org/dmarc-tools/
- Mail Tester: https://www.mail-tester.com

### Email Deliverability Resources
- Return Path: https://returnpath.com/solutions/email-deliverability/
- Email on Acid: https://www.emailonacid.com
- Litmus: https://www.litmus.com

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Next Review**: Quarterly or when Mailgun updates pricing/features
