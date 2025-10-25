# Environment Variables and Configuration

**For**: Developers and System Administrators
**Version**: 1.0
**Date**: October 25, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Cloud Functions Configuration](#cloud-functions-configuration)
4. [Firebase Configuration](#firebase-configuration)
5. [Development Setup](#development-setup)
6. [Staging Setup](#staging-setup)
7. [Production Setup](#production-setup)
8. [Security Best Practices](#security-best-practices)

---

## Overview

This document describes all environment variables and configuration required for the OrderFlow Restaurant Management System, with specific focus on the User Invitation System.

### Configuration Locations

| Environment | Frontend | Functions | Database |
|-------------|----------|-----------|----------|
| **Local Dev** | `.env.local` | `functions/.env` | Firebase Emulator |
| **Staging** | Firebase Hosting Config | Secret Manager + Config | Cloud Firestore |
| **Production** | Firebase Hosting Config | Secret Manager + Config | Cloud Firestore |

---

## Frontend Environment Variables

### Required Variables

Create `.env.local` in the project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=orderflow-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=orderflow-app
VITE_FIREBASE_STORAGE_BUCKET=orderflow-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Application Configuration
VITE_APP_BASE_URL=http://localhost:5173
VITE_ENABLE_ANALYTICS=false

# Feature Flags
VITE_ENABLE_INVITATIONS=true
VITE_ENABLE_MULTI_TENANT=true
```

### How to Get Firebase Config

1. **Firebase Console**
   - Go to: https://console.firebase.google.com
   - Select your project
   - Click gear icon > Project Settings
   - Scroll to "Your apps" section
   - Select web app or create one
   - Copy configuration values

2. **Firebase CLI**
   ```bash
   firebase apps:sdkconfig web
   ```

### Variable Descriptions

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | Yes | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | Yes | `app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes | `orderflow-app` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket name | Yes | `app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Yes | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes | `1:123...` |
| `VITE_APP_BASE_URL` | App base URL | No | `https://app.orderflow.com` |
| `VITE_ENABLE_ANALYTICS` | Enable Google Analytics | No | `true` or `false` |
| `VITE_ENABLE_INVITATIONS` | Enable invitation system | No | `true` or `false` |
| `VITE_ENABLE_MULTI_TENANT` | Enable multi-tenant support | No | `true` or `false` |

### Building for Production

When building for production, environment variables are embedded at build time:

```bash
# Production build
npm run build

# Variables used: .env.production (if exists) or .env.local
```

**Important**: Frontend environment variables are PUBLIC and visible in browser. Never put secrets here.

---

## Cloud Functions Configuration

### Method 1: Firebase Secret Manager (Recommended for Production)

**Sensitive Data** (API keys, passwords):

```bash
# Set Mailgun API Key
firebase functions:secrets:set MAILGUN_API_KEY
# Paste key when prompted: key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Set other secrets if needed
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set TWILIO_AUTH_TOKEN
```

**View Secrets**:
```bash
# List all secrets
firebase functions:secrets:list

# Access specific secret
firebase functions:secrets:access MAILGUN_API_KEY
```

**Delete Secrets**:
```bash
firebase functions:secrets:destroy MAILGUN_API_KEY
```

### Method 2: Firebase Functions Config (Non-Secret Data)

**Non-sensitive configuration**:

```bash
# Set Mailgun configuration
firebase functions:config:set mailgun.domain="mg.orderflow.app"
firebase functions:config:set mailgun.from_email="noreply@orderflow.app"
firebase functions:config:set mailgun.from_name="OrderFlow"

# Set application URLs
firebase functions:config:set app.base_url="https://orderflow.app"
firebase functions:config:set app.admin_panel_url="https://admin.orderflow.app"

# Set feature flags
firebase functions:config:set features.invitation_reminders="true"
firebase functions:config:set features.rate_limit_per_hour="10"
```

**View Config**:
```bash
# View all config
firebase functions:config:get

# View specific namespace
firebase functions:config:get mailgun
```

**Delete Config**:
```bash
firebase functions:config:unset mailgun.domain
```

### Method 3: Local Development (.env)

**For local emulator**:

Create `functions/.env`:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.orderflow.app
MAILGUN_FROM_EMAIL=noreply@orderflow.app
MAILGUN_FROM_NAME=OrderFlow

# Application URLs
APP_BASE_URL=http://localhost:5173
ADMIN_PANEL_URL=http://localhost:5173/admin

# Feature Configuration
INVITATION_EXPIRY_HOURS=72
RATE_LIMIT_PER_HOUR=10
REMINDER_HOURS_BEFORE_EXPIRY=24

# Development Flags
NODE_ENV=development
ENABLE_EMAIL_SENDING=false  # Set to false to disable actual email sending in dev
LOG_LEVEL=debug
```

**Load in Functions**:

```typescript
// functions/src/config.ts
import * as functions from 'firebase-functions';

// Load .env for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

export const config = {
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY || '',
    domain: process.env.MAILGUN_DOMAIN || functions.config().mailgun?.domain || 'mg.orderflow.app',
    fromEmail: process.env.MAILGUN_FROM_EMAIL || functions.config().mailgun?.from_email || 'noreply@orderflow.app',
    fromName: process.env.MAILGUN_FROM_NAME || functions.config().mailgun?.from_name || 'OrderFlow',
  },
  app: {
    baseUrl: process.env.APP_BASE_URL || functions.config().app?.base_url || 'https://orderflow.app',
    adminPanelUrl: process.env.ADMIN_PANEL_URL || functions.config().app?.admin_panel_url || 'https://admin.orderflow.app',
  },
  invitations: {
    expiryHours: parseInt(process.env.INVITATION_EXPIRY_HOURS || '72'),
    rateLimitPerHour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '10'),
    reminderHoursBeforeExpiry: parseInt(process.env.REMINDER_HOURS_BEFORE_EXPIRY || '24'),
  },
  dev: {
    enableEmailSending: process.env.ENABLE_EMAIL_SENDING === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
  }
};
```

### Complete Functions Configuration Reference

| Variable | Type | Purpose | Default | Required |
|----------|------|---------|---------|----------|
| `MAILGUN_API_KEY` | Secret | Mailgun API key | None | Yes |
| `MAILGUN_DOMAIN` | Config | Mailgun sending domain | `mg.orderflow.app` | Yes |
| `MAILGUN_FROM_EMAIL` | Config | Default sender email | `noreply@orderflow.app` | Yes |
| `MAILGUN_FROM_NAME` | Config | Default sender name | `OrderFlow` | Yes |
| `APP_BASE_URL` | Config | Application base URL | `https://orderflow.app` | Yes |
| `ADMIN_PANEL_URL` | Config | Admin panel URL | `https://admin.orderflow.app` | No |
| `INVITATION_EXPIRY_HOURS` | Config | Hours until invitation expires | `72` | No |
| `RATE_LIMIT_PER_HOUR` | Config | Max invitations per hour | `10` | No |
| `REMINDER_HOURS_BEFORE_EXPIRY` | Config | When to send reminder | `24` | No |
| `ENABLE_EMAIL_SENDING` | Env | Enable actual email sending | `true` | No |
| `LOG_LEVEL` | Env | Logging verbosity | `info` | No |

---

## Firebase Configuration

### Firebase Project Setup

1. **Create Firebase Project**
   ```bash
   firebase projects:create orderflow-app
   ```

2. **Initialize Firebase**
   ```bash
   firebase init
   # Select:
   # - Firestore
   # - Functions
   # - Hosting
   # - Storage
   ```

3. **Set Default Project**
   ```bash
   firebase use orderflow-app
   ```

### Multiple Environments

Configure different Firebase projects for each environment:

```bash
# Add staging project
firebase use --add
# Select staging project from list
# Alias: staging

# Add production project
firebase use --add
# Select production project from list
# Alias: production

# Switch between environments
firebase use staging
firebase use production
firebase use default  # Usually development
```

### .firebaserc Configuration

```json
{
  "projects": {
    "default": "orderflow-dev",
    "staging": "orderflow-staging",
    "production": "orderflow-prod"
  }
}
```

### Deploy to Specific Environment

```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy

# Or specify project inline
firebase deploy --project staging
firebase deploy --project production
```

---

## Development Setup

### Prerequisites

- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Git repository cloned

### Step-by-Step Setup

1. **Install Dependencies**
   ```bash
   # Root dependencies (frontend)
   npm install

   # Functions dependencies
   cd functions
   npm install
   cd ..
   ```

2. **Configure Firebase**
   ```bash
   # Login to Firebase
   firebase login

   # Select project
   firebase use orderflow-dev
   ```

3. **Create Frontend Environment File**
   ```bash
   # Copy example
   cp .env.example .env.local

   # Edit with your Firebase config
   nano .env.local
   ```

4. **Create Functions Environment File**
   ```bash
   # Create functions env
   touch functions/.env

   # Add Mailgun config (use test credentials for dev)
   nano functions/.env
   ```

5. **Start Firebase Emulators**
   ```bash
   firebase emulators:start
   ```
   This starts:
   - Firestore: http://localhost:8080
   - Functions: http://localhost:5001
   - Auth: http://localhost:9099
   - Hosting: http://localhost:5000

6. **Start Frontend Dev Server**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:5173

### Development Environment Variables

```bash
# .env.local (frontend)
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=demo-project
VITE_FIREBASE_STORAGE_BUCKET=demo-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:demo
VITE_APP_BASE_URL=http://localhost:5173
VITE_USE_EMULATOR=true
VITE_ENABLE_ANALYTICS=false
```

```bash
# functions/.env (backend)
MAILGUN_API_KEY=key-test-not-real-for-local-dev
MAILGUN_DOMAIN=sandbox-mailgun-domain.mailgun.org
MAILGUN_FROM_EMAIL=test@localhost
MAILGUN_FROM_NAME=OrderFlow Dev
APP_BASE_URL=http://localhost:5173
NODE_ENV=development
ENABLE_EMAIL_SENDING=false  # Don't send real emails in dev
LOG_LEVEL=debug
```

### Testing Locally

```bash
# Run emulators with UI
firebase emulators:start --import=./seed-data

# Run frontend tests
npm run test

# Run functions tests
cd functions
npm run test
```

---

## Staging Setup

### Purpose

Staging environment mirrors production for final testing before deployment.

### Configuration

1. **Firebase Project**
   ```bash
   firebase use staging
   ```

2. **Frontend Variables** (.env.staging)
   ```bash
   VITE_FIREBASE_API_KEY=AIza... # Real staging API key
   VITE_FIREBASE_AUTH_DOMAIN=orderflow-staging.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=orderflow-staging
   VITE_FIREBASE_STORAGE_BUCKET=orderflow-staging.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:staging123
   VITE_APP_BASE_URL=https://staging.orderflow.app
   VITE_ENABLE_ANALYTICS=false  # Don't pollute production analytics
   ```

3. **Functions Secrets** (Staging)
   ```bash
   firebase use staging

   # Use sandbox Mailgun domain for staging
   firebase functions:secrets:set MAILGUN_API_KEY
   # Enter: key-staging-xxxxxxxxxxxxxxxxxxxxxxxxxx

   firebase functions:config:set mailgun.domain="sandbox.mg.orderflow.app"
   firebase functions:config:set mailgun.from_email="staging@mg.orderflow.app"
   firebase functions:config:set app.base_url="https://staging.orderflow.app"
   ```

4. **Deploy to Staging**
   ```bash
   # Build frontend with staging config
   npm run build

   # Deploy everything
   firebase deploy --project staging
   ```

### Staging Testing Checklist

- [ ] Frontend loads correctly
- [ ] Can log in with test account
- [ ] Can create invitation
- [ ] Email sends to real address
- [ ] Signup flow works
- [ ] No errors in function logs
- [ ] Data isolated from production

---

## Production Setup

### Pre-Production Checklist

- [ ] Production Firebase project created
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Mailgun production domain verified
- [ ] All DNS records configured
- [ ] Billing enabled on Firebase
- [ ] Backup strategy in place

### Configuration

1. **Firebase Project**
   ```bash
   firebase use production
   ```

2. **Frontend Variables** (.env.production)
   ```bash
   VITE_FIREBASE_API_KEY=AIza... # Real production API key
   VITE_FIREBASE_AUTH_DOMAIN=orderflow-prod.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=orderflow-prod
   VITE_FIREBASE_STORAGE_BUCKET=orderflow-prod.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=987654321098
   VITE_FIREBASE_APP_ID=1:987654321098:web:prod123
   VITE_APP_BASE_URL=https://app.orderflow.com
   VITE_ENABLE_ANALYTICS=true
   ```

3. **Functions Secrets** (Production)
   ```bash
   firebase use production

   # Use production Mailgun domain
   firebase functions:secrets:set MAILGUN_API_KEY
   # Enter: key-production-real-api-key-here

   firebase functions:config:set mailgun.domain="mg.orderflow.app"
   firebase functions:config:set mailgun.from_email="noreply@orderflow.app"
   firebase functions:config:set mailgun.from_name="OrderFlow"
   firebase functions:config:set app.base_url="https://app.orderflow.com"
   firebase functions:config:set features.rate_limit_per_hour="10"
   ```

4. **Deploy to Production**
   ```bash
   # Build with production config
   npm run build

   # Deploy with confirmation
   firebase deploy --project production

   # Or deploy incrementally
   firebase deploy --only functions --project production
   firebase deploy --only hosting --project production
   firebase deploy --only firestore:rules --project production
   ```

### Production Deployment Process

1. **Pre-Deployment**
   ```bash
   # Run tests
   npm run test
   cd functions && npm run test && cd ..

   # Lint code
   npm run lint

   # Build and verify
   npm run build
   ```

2. **Backup Database**
   ```bash
   # Export Firestore
   gcloud firestore export gs://orderflow-prod-backups/$(date +%Y%m%d)

   # Or use Firebase Console > Firestore > Import/Export
   ```

3. **Deploy**
   ```bash
   firebase use production
   firebase deploy --project production
   ```

4. **Verify Deployment**
   - [ ] Visit production URL
   - [ ] Check function logs
   - [ ] Test critical flows
   - [ ] Monitor for errors

5. **Post-Deployment Monitoring**
   - Monitor for 1 hour actively
   - Check Firebase Console > Functions > Metrics
   - Review Mailgun dashboard
   - Check error rates

---

## Security Best Practices

### Never Commit Secrets

**Add to .gitignore**:
```gitignore
# Environment files
.env
.env.local
.env.development
.env.staging
.env.production
functions/.env
functions/.env.local

# Firebase config
.firebaserc.local

# Secrets
secrets/
*.pem
*.key
```

### Secret Rotation Schedule

| Secret Type | Rotation Frequency | Next Rotation |
|-------------|-------------------|---------------|
| Mailgun API Key | Quarterly (90 days) | 2025-01-24 |
| Firebase API Keys | Annually | 2025-10-25 |
| Admin Passwords | 60 days | Ongoing |
| Database Backups | Daily (automatic) | Continuous |

### Access Control

1. **Firebase IAM Roles**
   ```bash
   # Grant minimal permissions
   gcloud projects add-iam-policy-binding orderflow-prod \
     --member="user:developer@orderflow.com" \
     --role="roles/firebase.developer"
   ```

2. **Secrets Access**
   - Only production admins have access to production secrets
   - Developers use staging/dev secrets
   - Secrets never shared via email/chat
   - Use password manager (1Password, LastPass)

3. **Audit Logging**
   ```bash
   # Enable audit logs
   gcloud logging read "resource.type=cloud_function" \
     --project=orderflow-prod \
     --format=json
   ```

### Emergency Procedures

**If Secret Compromised**:

1. **Immediately Rotate**
   ```bash
   # Generate new Mailgun key
   # Update in Firebase Secret Manager
   firebase functions:secrets:set MAILGUN_API_KEY --force

   # Redeploy functions
   firebase deploy --only functions --force
   ```

2. **Revoke Old Secret**
   - Delete old Mailgun API key in Mailgun dashboard
   - Invalidate compromised tokens

3. **Audit Usage**
   - Check Mailgun logs for unusual activity
   - Review function logs
   - Check for unauthorized invitations

4. **Notify Team**
   - Document incident
   - Update security procedures
   - Review access controls

---

## Configuration Management Tools

### Recommended Tools

1. **Doppler** - https://doppler.com
   - Centralized secret management
   - Automatic syncing to multiple environments
   - Audit logs

2. **1Password** (Developer Tools)
   - Secret sharing within team
   - CLI access to secrets
   - Integration with deployment scripts

3. **HashiCorp Vault**
   - Enterprise-grade secret management
   - Dynamic secret generation
   - Full audit trail

### Configuration as Code

```bash
# scripts/setup-environment.sh
#!/bin/bash

ENV=$1  # staging or production

if [ "$ENV" == "staging" ]; then
  firebase use staging
  firebase functions:config:set \
    mailgun.domain="sandbox.mg.orderflow.app" \
    mailgun.from_email="staging@mg.orderflow.app" \
    app.base_url="https://staging.orderflow.app"

elif [ "$ENV" == "production" ]; then
  firebase use production
  firebase functions:config:set \
    mailgun.domain="mg.orderflow.app" \
    mailgun.from_email="noreply@orderflow.app" \
    app.base_url="https://app.orderflow.com"
else
  echo "Usage: ./setup-environment.sh [staging|production]"
  exit 1
fi

echo "Environment $ENV configured"
```

---

## Troubleshooting

### Issue: Environment Variables Not Loading

**Symptoms**: `undefined` values in application

**Solutions**:
1. Check file name: `.env.local` (not `.env`)
2. Restart dev server after changes
3. Ensure `VITE_` prefix for frontend variables
4. Check for syntax errors in .env file

### Issue: Firebase Config Not Working

**Symptoms**: Firebase initialization fails

**Solutions**:
1. Verify all required Firebase variables present
2. Check API key is correct (no extra spaces)
3. Ensure project ID matches Firebase Console
4. Try creating new web app in Firebase Console

### Issue: Functions Can't Access Secrets

**Symptoms**: Mailgun API returns 401

**Solutions**:
1. Verify secret set: `firebase functions:secrets:access MAILGUN_API_KEY`
2. Redeploy functions after setting secrets
3. Check IAM permissions
4. Ensure functions runtime has access to secrets

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Next Review**: When adding new environment variables or configuration
