# Auto-Cancellation Cloud Function Deployment Guide

**Function:** `autoCancelNoShows`
**Version:** 1.0
**Date:** October 26, 2025
**Status:** Ready for Deployment

---

## Overview

This document provides step-by-step instructions for deploying the `autoCancelNoShows` Cloud Function to Firebase. This function automatically cancels confirmed reservations that are more than 15 minutes past their scheduled time.

---

## Prerequisites

Before deploying, ensure you have:

1. **Firebase CLI Installed**
   ```bash
   npm install -g firebase-tools
   ```

2. **Authenticated with Firebase**
   ```bash
   firebase login
   ```

3. **Correct Firebase Project Selected**
   ```bash
   firebase use <your-project-id>
   ```

4. **Node.js 18 Installed**
   ```bash
   node --version  # Should be v18.x or higher
   ```

5. **Functions Dependencies Installed**
   ```bash
   cd /Users/clivestruver/Projects/restaurant-management-system/functions
   npm install
   ```

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests documented in `AutoCancellation.tests.md` have been reviewed
- [ ] Function compiles without errors (`npm run build`)
- [ ] Firestore security rules allow Cloud Functions to update reservations
- [ ] Firebase project has billing enabled (required for scheduled functions)
- [ ] Team has been notified of deployment schedule
- [ ] Rollback plan is understood and documented

---

## Deployment Steps

### Step 1: Build the Function

Compile TypeScript to JavaScript:

```bash
cd /Users/clivestruver/Projects/restaurant-management-system/functions
npm run build
```

**Expected Output:**
```
> build
> tsc
```

If there are no errors, proceed to the next step.

---

### Step 2: Deploy to Staging/Test Environment (Recommended)

First, deploy to a test environment to verify functionality:

```bash
firebase use <staging-project-id>
firebase deploy --only functions:autoCancelNoShows
```

**Expected Output:**
```
=== Deploying to '<staging-project-id>'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudscheduler.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudscheduler.googleapis.com is enabled
i  functions: preparing codebase default for deployment
i  functions: packaged /path/to/functions (XX KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 18 function autoCancelNoShows(us-central1)...
✔  functions[autoCancelNoShows(us-central1)] Successful create operation.
i  scheduler: creating job firebase-schedule-autoCancelNoShows-us-central1...
✔  scheduler[firebase-schedule-autoCancelNoShows-us-central1] Successful create operation.
Function URL (autoCancelNoShows(us-central1)): https://us-central1-<project-id>.cloudfunctions.net/autoCancelNoShows

✔  Deploy complete!
```

---

### Step 3: Verify Staging Deployment

1. **Check Function Exists:**
   - Open Firebase Console: https://console.firebase.google.com
   - Navigate to: Functions section
   - Verify `autoCancelNoShows` is listed
   - Check status is "Healthy" (green)

2. **Verify Schedule:**
   - Click on the function name
   - Check "Trigger" tab shows: `every 5 minutes`
   - Verify timezone is set to `UTC`

3. **Check Initial Logs:**
   ```bash
   firebase functions:log --only autoCancelNoShows
   ```

   Wait 5-10 minutes for first execution, then check logs again.

4. **Create Test Reservation:**
   - Use Firebase Console > Firestore Database
   - Create a test reservation with time >15 minutes ago
   - Wait for next function execution (up to 5 minutes)
   - Verify reservation status changes to `'no-show'`

---

### Step 4: Deploy to Production

Once staging tests pass, deploy to production:

```bash
firebase use <production-project-id>
firebase deploy --only functions:autoCancelNoShows
```

**Important Notes:**
- This will create a new scheduled function
- First execution will occur within 5 minutes of deployment
- Function will continue to run every 5 minutes indefinitely
- Monitor logs closely for the first hour after deployment

---

### Step 5: Post-Deployment Verification

After production deployment:

1. **Monitor Function Logs:**
   ```bash
   firebase functions:log --only autoCancelNoShows --limit 50
   ```

2. **Check Execution Metrics:**
   - Firebase Console > Functions > `autoCancelNoShows`
   - Verify "Executions" count increases every 5 minutes
   - Check "Execution time" is reasonable (<10 seconds)
   - Verify "Memory usage" is within limits (<256 MiB)
   - Ensure "Error rate" is 0%

3. **Verify Reservations Are Updated:**
   - Create a test reservation with confirmed status and past time
   - Wait 5-10 minutes
   - Check Firestore to verify status changed to `'no-show'`
   - Verify `adminNotes` field is populated correctly

4. **Check for Errors:**
   - Monitor logs for any error messages
   - If errors occur, see Troubleshooting section below

---

## Configuration Details

### Function Configuration

The function is configured with the following settings:

```typescript
{
  schedule: 'every 5 minutes',
  timeZone: 'UTC',
  memory: '256MiB',
}
```

**Schedule Explanation:**
- Runs every 5 minutes, 24/7
- Approximately 288 executions per day
- ~8,640 executions per month

**Memory Allocation:**
- 256 MiB is sufficient for processing hundreds of reservations
- Can be increased if needed (max 8 GiB)

**Timezone:**
- UTC is used for consistent scheduling across all regions
- Reservation times are parsed assuming ISO 8601 format

---

## Cost Estimation

### Cloud Functions Pricing (as of Oct 2025)

**Invocations:**
- 8,640 executions/month
- First 2 million invocations free
- Cost: $0.00/month

**Compute Time:**
- Assume 2 seconds per execution average
- 8,640 executions × 2 seconds = 17,280 seconds/month
- 256 MiB memory allocation
- First 400,000 GB-seconds free (enough for ~1.5 million seconds at 256MiB)
- Cost: $0.00/month (within free tier)

**Cloud Scheduler:**
- 1 job running every 5 minutes
- First 3 jobs free
- Cost: $0.00/month

**Firestore Operations:**
- Read: ~10 reservations per execution average
- Write: ~2 updates per execution average (cancellations)
- Reads: 8,640 × 10 = 86,400 reads/month
- Writes: 8,640 × 2 = 17,280 writes/month
- First 50,000 reads free, then $0.06 per 100,000 reads
- First 20,000 writes free, then $0.18 per 100,000 writes
- Cost: ~$0.00/month (within free tier for typical usage)

**Total Estimated Cost:** $0.00 - $0.10/month

---

## Monitoring and Alerts

### Set Up Alerts

Configure Cloud Monitoring alerts for:

1. **Error Rate Alert:**
   - Condition: Error rate > 5% for 10 minutes
   - Action: Email admin team

2. **Execution Time Alert:**
   - Condition: Execution time > 30 seconds
   - Action: Email DevOps team

3. **Memory Usage Alert:**
   - Condition: Memory usage > 200 MiB consistently
   - Action: Review and increase allocation if needed

### Logs to Monitor

Key log patterns to watch:

```
[AUTO-CANCEL] Job started at ...
[AUTO-CANCEL] Found X confirmed reservations to check
[AUTO-CANCEL] Cancelling reservation {id} for {name}: X.X minutes past
[AUTO-CANCEL] Job completed at ... Checked X reservations, cancelled X no-shows
```

**Warning Signs:**
- Errors in logs
- Execution time consistently >10 seconds
- Memory usage approaching 256 MiB
- No executions for >10 minutes (scheduler issue)

---

## Rollback Procedure

If issues are detected after deployment:

### Option 1: Delete the Function

Stop all executions immediately:

```bash
firebase functions:delete autoCancelNoShows --force
```

This will:
- Delete the Cloud Function
- Remove the Cloud Scheduler job
- Stop all future executions immediately

### Option 2: Deploy Previous Version

If you have a previous working version:

```bash
# Switch to previous version branch/commit
git checkout <previous-commit>

# Redeploy
cd functions
npm run build
firebase deploy --only functions:autoCancelNoShows
```

### Option 3: Manual Intervention

If reservations were incorrectly cancelled:

1. Query Firestore for recently updated reservations:
   ```javascript
   collectionGroup('reservations')
     .where('status', '==', 'no-show')
     .where('updatedAt', '>', last24Hours)
   ```

2. Manually review and revert incorrect cancellations

3. Update `adminNotes` to explain the correction

---

## Troubleshooting

### Issue: Function Not Executing

**Symptoms:**
- No logs appearing
- No executions showing in metrics

**Possible Causes:**
1. Cloud Scheduler job not created
2. Billing not enabled on project
3. Required APIs not enabled

**Solution:**
```bash
# Check Cloud Scheduler jobs
gcloud scheduler jobs list

# Enable required APIs
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable cloudfunctions.googleapis.com

# Redeploy function
firebase deploy --only functions:autoCancelNoShows
```

---

### Issue: Permission Errors

**Symptoms:**
- Logs show: "Missing or insufficient permissions"

**Possible Causes:**
- Cloud Function service account lacks Firestore write permissions

**Solution:**
1. Open Firebase Console > Functions
2. Note the service account email (e.g., `project-id@appspot.gserviceaccount.com`)
3. Go to IAM & Admin
4. Verify service account has "Cloud Datastore User" role
5. If missing, add role and redeploy

---

### Issue: Incorrect Time Calculations

**Symptoms:**
- Reservations cancelled too early or too late

**Possible Causes:**
1. Timezone mismatch
2. Date/time format parsing errors
3. Server time drift

**Solution:**
1. Check reservation date/time format in Firestore
2. Ensure dates are in `YYYY-MM-DD` format
3. Ensure times are in `HH:mm` format (24-hour)
4. Verify reservation times are stored in UTC or with timezone info
5. Review function logs for parsing errors

---

### Issue: High Costs

**Symptoms:**
- Unexpected charges in billing

**Possible Causes:**
1. Too many reservations being processed
2. Inefficient queries
3. Memory allocation too high

**Solution:**
1. Review Firestore query efficiency
2. Add query limits if needed
3. Consider reducing execution frequency (every 10 minutes instead of 5)
4. Optimize memory usage

---

## Maintenance

### Regular Checks

Perform these checks weekly:

- [ ] Review function execution logs
- [ ] Check error rate (should be 0%)
- [ ] Verify execution time is consistent
- [ ] Monitor memory usage trends
- [ ] Review cancelled reservations for accuracy

### Updates and Changes

To modify the function:

1. Update code in `/functions/src/scheduledJobs.ts`
2. Test locally with emulator
3. Deploy to staging first
4. Monitor staging for 24 hours
5. Deploy to production if no issues
6. Update this documentation

---

## Security Considerations

### Data Access

The function:
- Uses Firebase Admin SDK with full database access
- Queries all tenants using `collectionGroup`
- Only modifies reservations with `status === 'confirmed'`
- Maintains tenant isolation (doesn't modify `tenantId` field)

### Audit Trail

All cancellations are logged:
- Cloud Function logs: Execution details
- Firestore `updatedAt`: Timestamp of change
- Firestore `adminNotes`: Reason for cancellation

### Compliance

Ensure compliance with:
- Data retention policies
- Privacy regulations (GDPR, CCPA)
- Business policies for no-show handling

---

## Support and Escalation

### Issue Severity Levels

**Critical (P0):**
- Function causing data corruption
- Mass incorrect cancellations
- Function failing repeatedly

**High (P1):**
- Function not executing
- High error rate (>10%)
- Performance degradation

**Medium (P2):**
- Occasional errors
- Incorrect timezone handling for specific cases

**Low (P3):**
- Log formatting issues
- Minor performance optimization opportunities

### Contact Information

**For deployment issues:**
- DevOps Team: devops@company.com
- On-call: (555) 123-4567

**For business logic questions:**
- Product Team: product@company.com
- Reservation Manager: reservations@company.com

---

## References

- **Firebase Functions Documentation:** https://firebase.google.com/docs/functions
- **Cloud Scheduler Documentation:** https://cloud.google.com/scheduler/docs
- **Firestore Queries:** https://firebase.google.com/docs/firestore/query-data/queries
- **Function Source Code:** `/Users/clivestruver/Projects/restaurant-management-system/functions/src/scheduledJobs.ts`
- **Test Documentation:** `AutoCancellation.tests.md`
- **Customer Flow Redesign Spec:** `spec.md`

---

## Changelog

**Version 1.0 (October 26, 2025):**
- Initial deployment
- Schedule: Every 5 minutes
- Grace period: 15 minutes
- Memory: 256 MiB
- Region: us-central1

---

**Document Owner:** Backend Engineering Team
**Last Updated:** October 26, 2025
**Next Review:** After production deployment + 1 week
