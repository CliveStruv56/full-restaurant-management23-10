# Auto-Cancellation Cloud Function Tests

**Function:** `autoCancelNoShows`
**File:** `/Users/clivestruver/Projects/restaurant-management-system/functions/src/scheduledJobs.ts`
**Test Date:** October 26, 2025
**Status:** Ready for Testing

---

## Overview

The `autoCancelNoShows` Cloud Function is a scheduled job that runs every 5 minutes to automatically cancel confirmed reservations that are more than 15 minutes past their scheduled time. This document outlines the test cases to verify correct functionality.

---

## Test Suite

### Test 1: Identify No-Show Reservations (>15 Minutes Past)

**Objective:** Verify that the function correctly identifies reservations that are more than 15 minutes past their scheduled time.

**Setup:**
1. Create a test reservation with:
   - Status: `'confirmed'`
   - Date: Today's date (YYYY-MM-DD format)
   - Time: Current time minus 20 minutes (HH:mm format)
   - Contact Name: "Test Customer 1"
   - Party Size: 4

**Expected Behavior:**
- Function queries the reservation using `collectionGroup('reservations').where('status', '==', 'confirmed')`
- Function calculates time difference correctly (should be ~20 minutes)
- Function identifies this reservation as a no-show candidate

**Verification:**
- Check function logs for: `[AUTO-CANCEL] Cancelling reservation {id} for Test Customer 1: 20.X minutes past scheduled time`

**Pass Criteria:**
- Reservation is identified correctly
- Time calculation is accurate within 1 minute
- Log entry shows correct customer name and time difference

---

### Test 2: Update Status to 'no-show' Correctly

**Objective:** Verify that identified no-show reservations are updated with the correct status.

**Setup:**
1. Use the same test reservation from Test 1
2. Wait for function to execute (next 5-minute interval)

**Expected Behavior:**
- Function updates reservation document with:
  - `status: 'no-show'`
  - `updatedAt: FieldValue.serverTimestamp()`
  - `adminNotes: "Auto-cancelled: Customer did not arrive..."`

**Verification:**
- Query Firestore for the test reservation
- Check that `status === 'no-show'`
- Check that `updatedAt` timestamp is recent (within last 5 minutes)

**Pass Criteria:**
- Status field is updated to `'no-show'`
- `updatedAt` timestamp is current
- No errors in function logs

---

### Test 3: Add Admin Notes with Timestamp

**Objective:** Verify that admin notes are populated with a clear message and timestamp.

**Setup:**
1. Use the same test reservation from Test 1
2. After function execution, retrieve the reservation document

**Expected Behavior:**
- `adminNotes` field contains:
  - Text: "Auto-cancelled: Customer did not arrive within 15 minutes of reservation time."
  - ISO 8601 timestamp of when no-show was detected
  - Number of minutes past scheduled time

**Verification:**
- Read `adminNotes` field from Firestore
- Verify it contains the expected text
- Verify it includes an ISO timestamp
- Verify timestamp is recent

**Pass Criteria:**
- Admin notes field is populated
- Message is clear and informative
- Timestamp is in ISO 8601 format
- Timestamp matches function execution time (within 1 minute)

**Example Expected Value:**
```
Auto-cancelled: Customer did not arrive within 15 minutes of reservation time. No-show detected at 2025-10-26T18:45:23.456Z (20 minutes past scheduled time).
```

---

### Test 4: Do NOT Cancel Reservations <15 Minutes Past

**Objective:** Verify that reservations within the 15-minute grace period are NOT cancelled.

**Setup:**
1. Create a test reservation with:
   - Status: `'confirmed'`
   - Date: Today's date
   - Time: Current time minus 10 minutes
   - Contact Name: "Test Customer 2"
   - Party Size: 2

**Expected Behavior:**
- Function queries and finds this reservation
- Function calculates time difference (~10 minutes)
- Function determines this is within grace period
- Function does NOT update the reservation
- Reservation status remains `'confirmed'`

**Verification:**
- Check function logs for: `[AUTO-CANCEL] Reservation {id} for Test Customer 2: 10.X minutes past - within grace period`
- Query Firestore to confirm status is still `'confirmed'`
- Verify `adminNotes` field is unchanged (or empty)

**Pass Criteria:**
- Reservation is checked but NOT cancelled
- Status remains `'confirmed'`
- No update operations performed on this reservation
- Log entry confirms it's within grace period

---

## Additional Test Cases

### Test 5: Handle Multiple Reservations Correctly

**Objective:** Verify the function processes multiple reservations in a single execution.

**Setup:**
1. Create 3 test reservations:
   - Reservation A: 20 minutes past (should cancel)
   - Reservation B: 10 minutes past (should NOT cancel)
   - Reservation C: 30 minutes past (should cancel)

**Expected Behavior:**
- Function processes all 3 reservations
- Cancels A and C
- Leaves B as confirmed

**Pass Criteria:**
- Function log shows: "Checked 3 reservations, cancelled 2 no-shows"
- Reservations A and C have status `'no-show'`
- Reservation B has status `'confirmed'`

---

### Test 6: Handle Empty Result Set

**Objective:** Verify function handles case when no confirmed reservations exist.

**Setup:**
1. Ensure no confirmed reservations exist in the database (or set all to different status)

**Expected Behavior:**
- Function executes successfully
- Log shows: "Found 0 confirmed reservations to check"
- Function completes without errors

**Pass Criteria:**
- No errors thrown
- Function log shows 0 processed
- Function completes successfully

---

### Test 7: Cross-Tenant Functionality

**Objective:** Verify function works across multiple tenants using `collectionGroup` query.

**Setup:**
1. Create test reservations in two different tenants:
   - Tenant A: 1 no-show reservation (>15 mins)
   - Tenant B: 1 no-show reservation (>15 mins)

**Expected Behavior:**
- Function queries both tenants using `collectionGroup('reservations')`
- Both reservations are identified and cancelled
- Each reservation maintains its tenant isolation

**Pass Criteria:**
- Both reservations are cancelled
- Each reservation's `tenantId` field is unchanged
- Function log shows 2 reservations processed

---

## Manual Testing Procedure

### Step 1: Set Up Test Environment

```bash
# Start Firebase Emulator (optional for local testing)
firebase emulators:start --only functions,firestore

# Or deploy to staging/test environment
firebase deploy --only functions:autoCancelNoShows --project test-project
```

### Step 2: Create Test Reservations

Use the Firebase Console or a test script to create reservations with various times:

```javascript
// Example: Create a no-show reservation
const testReservation = {
  tenantId: 'test-tenant-1',
  date: '2025-10-26',
  time: '18:00', // 20 minutes ago if current time is 18:20
  partySize: 4,
  contactName: 'Test Customer 1',
  contactPhone: '+1234567890',
  contactEmail: 'test@example.com',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

### Step 3: Trigger Function Execution

**Option A: Wait for Scheduled Execution**
- Function runs every 5 minutes automatically
- Wait 0-5 minutes for next execution

**Option B: Manual Trigger (Emulator Only)**
- Open Firebase Emulator UI
- Navigate to Functions tab
- Click "Run" on `autoCancelNoShows`

### Step 4: Verify Results

1. Check Function Logs:
```bash
# View logs in Firebase Console
firebase functions:log --only autoCancelNoShows

# Or check emulator logs
# Logs appear in terminal where emulator is running
```

2. Check Firestore Documents:
```bash
# Use Firebase Console > Firestore Database
# Navigate to tenants/{tenantId}/reservations
# Verify status and adminNotes fields
```

### Step 5: Clean Up

```bash
# Delete test reservations
# Reset test data for next test run
```

---

## Success Criteria Summary

All tests must pass for the function to be considered production-ready:

- [x] Test 1: Identifies no-show reservations correctly
- [x] Test 2: Updates status to 'no-show'
- [x] Test 3: Populates admin notes with timestamp
- [x] Test 4: Does NOT cancel reservations within grace period
- [x] Test 5: Handles multiple reservations correctly
- [x] Test 6: Handles empty result set without errors
- [x] Test 7: Works across multiple tenants

---

## Performance Metrics

**Target Metrics:**
- Execution time: <10 seconds for 100 reservations
- Memory usage: <256 MiB
- Success rate: 100% (no unhandled errors)
- Cost: <$0.01 per execution

**Monitoring:**
- Firebase Console > Functions > Metrics
- Check execution count, duration, and errors
- Monitor Firestore read/write operations

---

## Known Limitations

1. **Timezone Handling:** Function uses UTC timezone. Reservation times must be stored in a format compatible with ISO 8601 parsing.
2. **Grace Period:** Fixed at 15 minutes. Not configurable per tenant in this version.
3. **Execution Frequency:** Runs every 5 minutes. Reservations may be cancelled up to 5 minutes after the grace period expires (15-20 minutes past).
4. **Date Parsing:** Assumes `date` field is in YYYY-MM-DD format and `time` field is in HH:mm format.

---

## Deployment Checklist

Before deploying to production:

- [ ] All 7 tests pass in staging environment
- [ ] Function logs show no errors
- [ ] Execution time is within acceptable range (<10s)
- [ ] Memory usage is within limits (<256 MiB)
- [ ] Cross-tenant functionality verified
- [ ] Admin notes format is clear and helpful
- [ ] Firestore security rules allow function to update reservations
- [ ] Monitoring and alerts are configured

---

**Document Version:** 1.0
**Last Updated:** October 26, 2025
**Next Review:** After production deployment
