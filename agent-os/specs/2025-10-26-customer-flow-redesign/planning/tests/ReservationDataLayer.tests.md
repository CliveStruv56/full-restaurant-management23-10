# Reservation Data Layer Tests

**Component:** Reservation Data Layer (Task Group 8)
**Test Type:** Unit & Integration Tests
**Total Tests:** 6
**Status:** Documentation Complete

---

## Test Overview

These tests verify the reservation data layer functionality including CRUD operations, validation, real-time streaming, and Firestore security rules.

**Note:** This project lacks a formal test infrastructure. The tests below should be executed manually or as integration tests once a testing framework is established.

---

## Test 1: Create Reservation Successfully

**Objective:** Verify that a valid reservation can be created in Firestore

**Prerequisites:**
- Tenant exists in Firestore
- Valid reservation data

**Test Steps:**
1. Call `createReservation(tenantId, validReservationData)`
2. Verify function returns a reservation ID (string)
3. Query Firestore for the created reservation
4. Verify all fields are saved correctly

**Expected Data:**
```typescript
const validReservationData = {
  date: '2025-10-30',
  time: '19:00',
  partySize: 4,
  contactName: 'John Doe',
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com',
  specialRequests: 'Window seat preferred'
};
```

**Expected Result:**
- Function returns non-empty string (reservation ID)
- Firestore document created at `tenants/{tenantId}/reservations/{reservationId}`
- Document contains all provided fields
- `status` field set to 'pending'
- `createdAt` and `updatedAt` timestamps are ISO 8601 strings
- `tenantId` field matches provided tenant

**Success Criteria:**
- Reservation ID returned
- Document exists in Firestore
- All fields match input data
- Timestamps are valid ISO 8601 format

---

## Test 2: Validate Required Fields

**Objective:** Verify that the createReservation function validates required fields and rejects invalid data

**Test Cases:**

### Test 2a: Missing Date
```typescript
const missingDate = {
  time: '19:00',
  partySize: 4,
  contactName: 'John Doe',
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Date and time are required"

### Test 2b: Missing Time
```typescript
const missingTime = {
  date: '2025-10-30',
  partySize: 4,
  contactName: 'John Doe',
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Date and time are required"

### Test 2c: Missing Contact Name
```typescript
const missingContactName = {
  date: '2025-10-30',
  time: '19:00',
  partySize: 4,
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Contact information is required"

### Test 2d: Missing Contact Phone
```typescript
const missingContactPhone = {
  date: '2025-10-30',
  time: '19:00',
  partySize: 4,
  contactName: 'John Doe',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Contact information is required"

### Test 2e: Missing Contact Email
```typescript
const missingContactEmail = {
  date: '2025-10-30',
  time: '19:00',
  partySize: 4,
  contactName: 'John Doe',
  contactPhone: '+1234567890'
};
```
**Expected:** Function throws error "Contact information is required"

**Success Criteria:**
- All validation errors thrown correctly
- No Firestore documents created for invalid data

---

## Test 3: Update Reservation Status

**Objective:** Verify that reservation status can be updated through different state transitions

**Test Cases:**

### Test 3a: Pending → Confirmed
```typescript
await updateReservationStatus(tenantId, reservationId, 'confirmed');
```
**Expected:** Status updated to 'confirmed', updatedAt timestamp changed

### Test 3b: Confirmed → Seated
```typescript
await updateReservationStatus(tenantId, reservationId, 'seated', 'Customer arrived on time');
```
**Expected:**
- Status updated to 'seated'
- adminNotes set to 'Customer arrived on time'
- updatedAt timestamp changed

### Test 3c: Seated → Completed
```typescript
await updateReservationStatus(tenantId, reservationId, 'completed');
```
**Expected:** Status updated to 'completed', updatedAt timestamp changed

### Test 3d: Confirmed → Cancelled
```typescript
await updateReservationStatus(tenantId, reservationId, 'cancelled', 'Customer called to cancel');
```
**Expected:**
- Status updated to 'cancelled'
- adminNotes set to 'Customer called to cancel'
- updatedAt timestamp changed

**Success Criteria:**
- All status transitions work correctly
- Admin notes saved when provided
- updatedAt timestamp changes with each update
- createdAt timestamp remains unchanged

---

## Test 4: Stream Reservations by Date Filter

**Objective:** Verify real-time streaming of reservations filtered by date

**Test Steps:**
1. Create 3 reservations with different dates:
   - Reservation A: 2025-10-30
   - Reservation B: 2025-10-31
   - Reservation C: 2025-10-30
2. Call `streamReservations(tenantId, { date: '2025-10-30' }, callback)`
3. Verify callback receives only reservations A and C
4. Create a new reservation with date 2025-10-30
5. Verify callback fires again with new reservation included

**Expected Result:**
- Initial callback receives 2 reservations (A and C)
- Reservations ordered by date desc, time asc
- Real-time update when new reservation added
- Callback receives 3 reservations after new one created

**Success Criteria:**
- Date filter works correctly
- Only matching reservations returned
- Real-time updates work
- Unsubscribe function returned

---

## Test 5: Stream Reservations by Status Filter

**Objective:** Verify real-time streaming of reservations filtered by status

**Test Steps:**
1. Create 3 reservations with different statuses:
   - Reservation A: status 'pending'
   - Reservation B: status 'confirmed'
   - Reservation C: status 'pending'
2. Call `streamReservations(tenantId, { status: 'pending' }, callback)`
3. Verify callback receives only reservations A and C
4. Update reservation A status to 'confirmed'
5. Verify callback fires again with only reservation C

**Expected Result:**
- Initial callback receives 2 reservations (A and C)
- Real-time update when status changes
- Callback receives only 1 reservation (C) after update

**Success Criteria:**
- Status filter works correctly
- Only matching reservations returned
- Real-time updates reflect status changes
- Stream unsubscribes correctly

---

## Test 6: Reject Invalid Party Size

**Objective:** Verify that party size validation rejects values outside the valid range (1-20)

**Test Cases:**

### Test 6a: Party Size Zero
```typescript
const invalidPartySize = {
  date: '2025-10-30',
  time: '19:00',
  partySize: 0,
  contactName: 'John Doe',
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Party size must be between 1 and 20"

### Test 6b: Party Size Negative
```typescript
const invalidPartySize = {
  date: '2025-10-30',
  time: '19:00',
  partySize: -5,
  contactName: 'John Doe',
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Party size must be between 1 and 20"

### Test 6c: Party Size Too Large
```typescript
const invalidPartySize = {
  date: '2025-10-30',
  time: '19:00',
  partySize: 25,
  contactName: 'John Doe',
  contactPhone: '+1234567890',
  contactEmail: 'john@example.com'
};
```
**Expected:** Function throws error "Party size must be between 1 and 20"

### Test 6d: Valid Edge Cases
```typescript
// Party size 1 (minimum valid)
const validMin = { ...validData, partySize: 1 };
// Party size 20 (maximum valid)
const validMax = { ...validData, partySize: 20 };
```
**Expected:** Both create successfully

**Success Criteria:**
- Values <1 rejected
- Values >20 rejected
- Values 1-20 accepted
- No Firestore documents created for invalid sizes

---

## Additional Integration Tests

### Security Rules Test

**Objective:** Verify Firestore security rules enforce tenant isolation and permissions

**Test Cases:**

1. **Public Create Test:**
   - Attempt to create reservation without authentication
   - Expected: ALLOWED (public create for guest checkout)

2. **Tenant Isolation Test:**
   - Create reservation for tenantId A
   - Attempt to read as admin of tenantId B
   - Expected: DENIED (different tenant)

3. **Admin Read Test:**
   - Create reservation for tenantId A
   - Attempt to read as admin of tenantId A
   - Expected: ALLOWED

4. **Staff Update Test:**
   - Create reservation
   - Attempt to update status as staff member
   - Expected: ALLOWED

5. **Customer Update Test:**
   - Create reservation
   - Attempt to update status as customer (non-staff)
   - Expected: DENIED (only admin/staff can update)

6. **Validation Test:**
   - Attempt to create reservation with invalid party size (25)
   - Expected: DENIED by security rules

---

## Firestore Index Requirements

**Required Composite Index:**
```
Collection: reservations
Fields:
  - tenantId (Ascending)
  - date (Ascending)
  - time (Ascending)
```

**Alternative Index (for status filtering):**
```
Collection: reservations
Fields:
  - tenantId (Ascending)
  - status (Ascending)
  - date (Descending)
  - time (Ascending)
```

**Note:** These indexes will be auto-created when first query is run, or can be manually created in Firebase Console.

---

## Manual Testing Procedure

Since this project lacks automated test infrastructure, follow these steps to manually test:

1. **Set up test environment:**
   - Ensure Firebase project is configured
   - Create a test tenant in Firestore

2. **Test Create Reservation:**
   - Open browser console
   - Import createReservation function
   - Call with valid data
   - Verify in Firebase Console

3. **Test Validation:**
   - Call createReservation with missing fields
   - Verify error messages in console

4. **Test Status Update:**
   - Create reservation
   - Call updateReservationStatus
   - Verify in Firebase Console

5. **Test Streaming:**
   - Open browser console
   - Call streamReservations with callback
   - Create/update reservations in Firebase Console
   - Verify callback fires with correct data

6. **Test Security Rules:**
   - Use Firebase Emulator or production rules simulator
   - Test each permission scenario documented above

---

## Test Results Summary

**Test Execution Date:** [To be filled after testing]
**Environment:** [Development/Staging/Production]
**Tester:** [Name]

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Create Reservation Successfully | ⬜ Not Run | |
| 2 | Validate Required Fields | ⬜ Not Run | |
| 3 | Update Reservation Status | ⬜ Not Run | |
| 4 | Stream by Date Filter | ⬜ Not Run | |
| 5 | Stream by Status Filter | ⬜ Not Run | |
| 6 | Reject Invalid Party Size | ⬜ Not Run | |

**Legend:**
- ✅ Passed
- ❌ Failed
- ⚠️ Partial Pass
- ⬜ Not Run

---

## Known Limitations

1. **No automated test framework:** Tests must be run manually
2. **Real-time testing:** Requires active Firebase connection
3. **Security rules testing:** Requires Firebase Emulator or production environment
4. **Index creation:** Composite indexes may need manual creation in Firebase Console

---

## Next Steps

1. Implement automated testing framework (Jest + Firebase Test SDK)
2. Run all tests manually to verify functionality
3. Document any bugs found
4. Create Firestore indexes as documented above
5. Verify security rules in Firebase Console Rules Simulator

---

**Document Status:** Complete
**Last Updated:** October 26, 2025
**Related Tasks:** Task Group 8.1
