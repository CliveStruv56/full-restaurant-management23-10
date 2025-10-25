# Cloud Functions - User Invitation System

This directory contains Firebase Cloud Functions for the User Invitation System.

## Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Node.js 18 or higher
- Firebase project configured

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Mailgun Credentials

You need to set up Mailgun API credentials in Firebase Secret Manager:

```bash
# Set Mailgun API key
firebase functions:secrets:set MAILGUN_API_KEY

# Configure Mailgun domain in Firebase config (alternative to secret)
firebase functions:config:set mailgun.domain="mg.orderflow.app"
firebase functions:config:set mailgun.from_email="noreply@orderflow.app"
firebase functions:config:set mailgun.from_name="OrderFlow"
```

### 3. Mailgun Setup

1. Create a Mailgun account at https://www.mailgun.com/
2. Verify your sending domain (e.g., mg.orderflow.app)
3. Configure DNS records for SPF, DKIM, and DMARC
4. Generate an API key from the Mailgun dashboard
5. Use the API key in the `MAILGUN_API_KEY` secret (step 2 above)

## Development

### Build Functions

```bash
npm run build
```

### Run Emulator Locally

```bash
npm run serve
```

This will start the Firebase emulators for Functions, Firestore, and Auth.

### Watch Mode (Auto-rebuild)

```bash
npm run build:watch
```

## Deployment

### Deploy All Functions

```bash
npm run deploy
```

### Deploy Specific Function

```bash
firebase deploy --only functions:createInvitation
```

## Functions Overview

### 1. `createInvitation` (Callable)
- **Trigger**: HTTPS Callable
- **Purpose**: Creates invitation and sends email
- **Auth**: Required (admin only)
- **Rate Limit**: 10 invitations/hour/tenant

### 2. `sendInvitationEmail` (Background)
- **Trigger**: Firestore onCreate `/invitations/{id}`
- **Purpose**: Sends invitation email via Mailgun
- **Auth**: N/A (background function)

### 3. `acceptInvitation` (Callable)
- **Trigger**: HTTPS Callable
- **Purpose**: Validates token and creates user account
- **Auth**: Not required (user doesn't exist yet)

### 4. `sendInvitationReminder` (Scheduled)
- **Trigger**: Cloud Scheduler (hourly)
- **Purpose**: Sends reminder emails 24h before expiration
- **Auth**: N/A (scheduled function)

### 5. `sendAcceptanceNotification` (Background)
- **Trigger**: Firestore onUpdate `/invitations/{id}`
- **Purpose**: Notifies inviter when invitation is accepted
- **Auth**: N/A (background function)

### 6. `cleanupExpiredInvitations` (Scheduled)
- **Trigger**: Cloud Scheduler (daily at 2 AM UTC)
- **Purpose**: Marks expired invitations as 'expired'
- **Auth**: N/A (scheduled function)

## Environment Variables

The following environment variables are used:

- `MAILGUN_API_KEY` - Secret stored in Firebase Secret Manager
- `MAILGUN_DOMAIN` - Mailgun domain (default: mg.orderflow.app)
- `MAILGUN_FROM_EMAIL` - From email address (default: noreply@orderflow.app)
- `MAILGUN_FROM_NAME` - From name (default: OrderFlow)

## Monitoring

### View Logs

```bash
npm run logs
```

### Realtime Logs

```bash
firebase functions:log --only createInvitation
```

## Testing

### Manual Testing

1. Start emulator: `npm run serve`
2. Call functions from your app pointed at `http://localhost:5001`
3. Check emulator logs for errors

### Integration Tests

(TODO: Add integration tests in Phase 4)

## Troubleshooting

### Email Not Sending

1. Check Mailgun API key is set correctly
2. Verify domain is verified in Mailgun dashboard
3. Check DNS records (SPF, DKIM, DMARC)
4. Review function logs for errors

### Rate Limiting Issues

1. Check `/tenantMetadata/{tenantId}` for rate limit data
2. Verify timestamp is being updated correctly
3. Check for race conditions in batch operations

### Invitation Token Invalid

1. Verify token exists in `/invitations` collection
2. Check expiration time hasn't passed
3. Ensure status is 'pending'
4. Review security rules for `/invitations`

## Security Notes

- All invitation operations go through Cloud Functions (not client-side)
- Tokens are cryptographically secure (32 bytes random)
- Security rules prevent client-side manipulation
- Rate limiting enforced server-side
- Audit trail preserved (no deletion of invitations)

## Production Checklist

- [ ] Mailgun API key configured in Secret Manager
- [ ] Mailgun domain verified with proper DNS records
- [ ] Test email delivery to multiple providers (Gmail, Outlook, etc.)
- [ ] Verify rate limiting works correctly
- [ ] Check scheduled functions are running (Cloud Scheduler)
- [ ] Monitor first 24 hours for errors
- [ ] Set up alerting for failed email sends

## Support

For issues or questions:
1. Check function logs: `npm run logs`
2. Review Firestore security rules
3. Verify Mailgun account status
4. Check Firebase project quotas
