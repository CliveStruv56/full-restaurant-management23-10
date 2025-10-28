# Specification: Table-Reservation Linking & Double-Booking Prevention

## Goal

Prevent double-bookings by linking reservations to specific tables and enforcing time-based availability checks. Currently, reservations and tables operate independently, allowing multiple customers to book the same table at overlapping times. This specification implements automatic table assignment, conflict detection, and real-time status synchronization to ensure tables cannot be double-booked.

## User Stories

- As Marcus (Restaurant Manager), I want reservations to be automatically linked to specific tables so that I prevent double-bookings
- As a customer, I want to see only tables that are available for my selected date and time when making a reservation
- As staff, I want table status to automatically update when reservations are confirmed/completed so that the floor plan shows accurate real-time availability
- As an admin, I want to manually assign tables to existing pending reservations that were created before this feature existed

## Core Requirements

### Reservation-Table Linking
- Extend Reservation interface with `assignedTableId` and `assignedTableNumber` fields (both optional for backward compatibility)
- Automatically assign an available table when reservation status changes to 'confirmed'
- Prevent assigning the same table to multiple reservations with overlapping time slots
- Store both table ID (for database lookups) and table number (for customer display)

### Time-Based Availability Checking
- Check table availability based on reservation date, time, and calculated duration
- Use `AppSettings.tableOccupation` for duration calculation (default to 90 minutes if not configured)
- Detect time conflicts: A table is unavailable if another confirmed/seated reservation overlaps the requested time window
- Reservation time window = [startTime, startTime + duration]
- Two reservations conflict if their time windows overlap (startTime1 < endTime2 AND startTime2 < endTime1)

### Automatic Table Assignment
- Triggered when reservation status changes from 'pending' to 'confirmed'
- Assignment algorithm (simple "first available" for Phase 3A):
  1. Query all tables ordered by number ascending
  2. For each table, check if it has capacity >= partySize
  3. Check if table is available for the requested date/time window
  4. Assign the first table that meets both criteria
  5. If no tables available, keep reservation pending and notify admin
- Update table status to 'reserved' when assigned
- Store assignedTableId and assignedTableNumber in reservation document

### Table Status Lifecycle
- Status transitions based on reservation status:
  - Reservation 'confirmed' → Table status 'reserved'
  - Reservation 'seated' → Table status 'occupied'
  - Reservation 'completed' → Table status 'available'
  - Reservation 'cancelled' → Table status 'available' (if no other reservations conflict)
  - Reservation 'no-show' → Table status 'available'
- Status updates must happen atomically with reservation status changes
- Handle edge case: If table has multiple reservations for different time slots, status reflects the active reservation

### FloorPlanDisplay Integration
- Pass date and time parameters to FloorPlanDisplay component
- Filter tables to show only those available for the selected date/time
- Visual indicators:
  - Available tables: green (#10b981)
  - Reserved tables (other bookings): orange (#f59e0b)
  - Occupied tables: red (#ef4444)
- Update customer reservation flow to pass selected date/time to floor plan

### Admin UI Enhancements
- ReservationManager: Add "Assigned Table" column to reservations table
- Show "Table X" if assigned, "Unassigned" if not
- For pending reservations: Add "Assign Table" dropdown button
- Dropdown lists all available tables for that reservation's date/time
- Admin can manually assign table to pending reservation
- Show warning toast if no tables available: "No tables available for this party size and time. Consider changing reservation time or splitting party."

## Data Models

### Extended Reservation Interface

```typescript
export interface Reservation {
  // ... existing fields ...

  // NEW FIELDS (Phase 3A)
  assignedTableId?: string; // Firestore table document ID
  assignedTableNumber?: number; // Table number for display (e.g., "Table 5")
  duration?: number; // Reservation duration in minutes (calculated from settings or default 90)

  // Existing fields (no changes):
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  tablePreference?: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}
```

### Duration Calculation Logic

- Duration is calculated when reservation is created/confirmed
- Source 1: Use `AppSettings.tableOccupation.servicePeriods[period]` if configured
  - Determine service period by reservation time:
    - Breakfast: 06:00-11:00 → use breakfast duration
    - Lunch: 11:00-15:00 → use lunch duration
    - Dinner: 15:00-22:00 → use dinner duration
- Source 2: If tableOccupation not configured, default to 90 minutes
- Store calculated duration in reservation.duration field for consistency
- Duration does NOT change if settings are updated after reservation created

### Firestore Paths

```
tenants/{tenantId}/reservations/{reservationId}
  - assignedTableId: string (optional)
  - assignedTableNumber: number (optional)
  - duration: number (minutes)

tenants/{tenantId}/tables/{tableId}
  - status: 'available' | 'occupied' | 'reserved'
  - (no new fields needed)
```

### Firestore Indexes Required

```
Collection: tenants/{tenantId}/reservations
Composite Index 1 (for availability checking):
  - Fields: assignedTableId (Ascending), date (Ascending), status (Ascending)
  - Used by: checkTableAvailability() to find conflicting reservations

Composite Index 2 (for admin filtering):
  - Fields: date (Descending), time (Ascending), status (Ascending)
  - Used by: streamReservations() with filters (already exists)
```

## Technical Approach

### Availability Checking Algorithm

```typescript
// Pseudocode for checkTableAvailability()
function checkTableAvailability(
  tenantId: string,
  tableId: string,
  date: string, // YYYY-MM-DD
  startTime: string, // HH:mm
  duration: number, // minutes
  excludeReservationId?: string // For editing existing reservations
): Promise<boolean> {
  // 1. Calculate time window
  const requestedStart = parseDateTime(date, startTime);
  const requestedEnd = addMinutes(requestedStart, duration);

  // 2. Query reservations for this table on this date
  const reservations = await queryReservations({
    tenantId,
    assignedTableId: tableId,
    date: date,
    status: ['confirmed', 'seated'] // Only check active reservations
  });

  // 3. Check each reservation for time conflict
  for (const reservation of reservations) {
    // Skip the reservation being edited
    if (reservation.id === excludeReservationId) continue;

    const existingStart = parseDateTime(reservation.date, reservation.time);
    const existingEnd = addMinutes(existingStart, reservation.duration);

    // Conflict check: intervals overlap if start1 < end2 AND start2 < end1
    if (requestedStart < existingEnd && existingStart < requestedEnd) {
      return false; // Time conflict detected
    }
  }

  return true; // No conflicts, table is available
}
```

### Assignment Logic

```typescript
// Pseudocode for assignTableToReservation()
async function assignTableToReservation(
  tenantId: string,
  reservationId: string
): Promise<void> {
  // 1. Get reservation details
  const reservation = await getReservation(tenantId, reservationId);

  // 2. Calculate duration if not already set
  const duration = reservation.duration || calculateDuration(reservation.time, settings);

  // 3. Get all tables, ordered by number
  const allTables = await getTables(tenantId, { orderBy: 'number', direction: 'asc' });

  // 4. Filter tables by capacity
  const suitableTables = allTables.filter(table => table.capacity >= reservation.partySize);

  // 5. Find first available table
  for (const table of suitableTables) {
    const isAvailable = await checkTableAvailability(
      tenantId,
      table.id,
      reservation.date,
      reservation.time,
      duration
    );

    if (isAvailable) {
      // 6. Assign table (atomic update)
      await updateReservation(tenantId, reservationId, {
        assignedTableId: table.id,
        assignedTableNumber: table.number,
        duration: duration,
        updatedAt: new Date().toISOString()
      });

      // 7. Update table status to 'reserved'
      await updateTable(tenantId, table.id, {
        status: 'reserved'
      });

      return; // Success
    }
  }

  // 8. No tables available - throw error
  throw new Error('No tables available for this party size and time slot');
}
```

### Status Lifecycle State Machine

```
Reservation Status Change → Table Status Update

pending → confirmed:
  - Call assignTableToReservation()
  - Table status: 'reserved'

confirmed → seated:
  - Table status: 'occupied'

seated → completed:
  - Table status: 'available'
  - Clear reservation from active list

confirmed → cancelled:
  - Table status: 'available'
  - Remove table assignment

confirmed → no-show:
  - Table status: 'available'
  - Keep assignment for records

pending → cancelled:
  - No table assignment exists, no action needed
```

### Real-Time Synchronization Strategy

- Leverage existing `streamTables(tenantId, callback)` listener for table status updates
- Leverage existing `streamReservations(tenantId, filters, callback)` listener for reservation updates
- When reservation status changes:
  1. Update reservation document in Firestore
  2. Update linked table status in separate transaction
  3. Firestore onSnapshot callbacks propagate changes to all connected clients
- Handle race conditions:
  - Use Firestore transactions for atomic updates (reservation + table)
  - If transaction fails (e.g., table already assigned), retry with next available table
  - Show user-friendly error if all retries fail
- Optimistic updates not needed (server-side assignment, user waits for confirmation)

## API Specifications

### Updated createReservation()

```typescript
/**
 * Create a new reservation
 * Phase 3A: Calculate duration and store, but do NOT auto-assign table
 * Table assignment happens when status changes to 'confirmed'
 */
export const createReservation = async (
  tenantId: string,
  reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'tenantId' | 'duration'>
): Promise<string> => {
  // 1. Validate required fields (existing logic)

  // 2. Calculate reservation duration
  const settings = await getSettings(tenantId);
  const duration = calculateReservationDuration(
    reservationData.time,
    settings.tableOccupation
  );

  // 3. Create reservation with duration
  const docRef = await addDoc(collection(db, `tenants/${tenantId}/reservations`), {
    ...reservationData,
    tenantId,
    status: 'pending', // Start as pending
    duration, // NEW: Store calculated duration
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // assignedTableId and assignedTableNumber not set yet
  });

  return docRef.id;
};
```

### New checkTableAvailability()

```typescript
/**
 * Check if a table is available for a specific date/time window
 * Returns true if no conflicting reservations exist
 */
export const checkTableAvailability = async (
  tenantId: string,
  tableId: string,
  date: string, // YYYY-MM-DD format
  startTime: string, // HH:mm format
  duration: number, // minutes
  excludeReservationId?: string // Optional: skip this reservation (for editing)
): Promise<boolean> => {
  // 1. Parse requested time window
  const requestedStart = new Date(`${date}T${startTime}`);
  const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

  // 2. Query reservations for this table on this date
  const reservationsRef = collection(db, `tenants/${tenantId}/reservations`);
  const q = query(
    reservationsRef,
    where('assignedTableId', '==', tableId),
    where('date', '==', date),
    where('status', 'in', ['confirmed', 'seated'])
  );

  const snapshot = await getDocs(q);

  // 3. Check each reservation for time conflict
  for (const doc of snapshot.docs) {
    const reservation = doc.data() as Reservation;

    // Skip the reservation being edited
    if (excludeReservationId && reservation.id === excludeReservationId) {
      continue;
    }

    const existingStart = new Date(`${reservation.date}T${reservation.time}`);
    const existingEnd = new Date(existingStart.getTime() + (reservation.duration || 90) * 60000);

    // Conflict detection: intervals overlap if start1 < end2 AND start2 < end1
    if (requestedStart < existingEnd && existingStart < requestedEnd) {
      return false; // Conflict found
    }
  }

  return true; // No conflicts
};
```

### New assignTableToReservation()

```typescript
/**
 * Manually assign a table to a reservation
 * Used by admin UI for pending reservations
 * Also called automatically when reservation status changes to 'confirmed'
 */
export const assignTableToReservation = async (
  tenantId: string,
  reservationId: string,
  tableId?: string // Optional: if provided, assign this specific table; if not, auto-assign first available
): Promise<void> => {
  // 1. Get reservation
  const reservation = await getReservation(tenantId, reservationId);

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  // 2. Ensure duration is set
  const duration = reservation.duration || 90;

  // 3. If tableId provided, validate availability
  if (tableId) {
    const table = await getTable(tenantId, tableId);

    if (!table) {
      throw new Error('Table not found');
    }

    if (table.capacity < reservation.partySize) {
      throw new Error(`Table ${table.number} has capacity ${table.capacity}, but party size is ${reservation.partySize}`);
    }

    const isAvailable = await checkTableAvailability(
      tenantId,
      tableId,
      reservation.date,
      reservation.time,
      duration,
      reservationId // Exclude current reservation when checking
    );

    if (!isAvailable) {
      throw new Error(`Table ${table.number} is not available for the selected time slot`);
    }

    // Assign the specific table
    await assignTable(tenantId, reservationId, table, duration);
    return;
  }

  // 4. Auto-assign: Find first available table
  const tablesRef = collection(db, `tenants/${tenantId}/tables`);
  const tablesQuery = query(tablesRef, orderBy('number', 'asc'));
  const tablesSnapshot = await getDocs(tablesQuery);

  for (const doc of tablesSnapshot.docs) {
    const table = { id: doc.id, ...doc.data() } as Table;

    // Check capacity
    if (table.capacity < reservation.partySize) {
      continue;
    }

    // Check availability
    const isAvailable = await checkTableAvailability(
      tenantId,
      table.id,
      reservation.date,
      reservation.time,
      duration,
      reservationId
    );

    if (isAvailable) {
      await assignTable(tenantId, reservationId, table, duration);
      return; // Success
    }
  }

  // No tables available
  throw new Error('No tables available for this party size and time slot');
};

// Helper function for atomic assignment
async function assignTable(
  tenantId: string,
  reservationId: string,
  table: Table,
  duration: number
): Promise<void> {
  const batch = writeBatch(db);

  // Update reservation
  const reservationRef = doc(db, `tenants/${tenantId}/reservations`, reservationId);
  batch.update(reservationRef, {
    assignedTableId: table.id,
    assignedTableNumber: table.number,
    duration,
    updatedAt: new Date().toISOString(),
  });

  // Update table status
  const tableRef = doc(db, `tenants/${tenantId}/tables`, table.id);
  batch.update(tableRef, {
    status: 'reserved',
  });

  await batch.commit();
}
```

### Updated updateReservationStatus()

```typescript
/**
 * Update reservation status with automatic table status synchronization
 * Phase 3A: Handle status lifecycle and table assignment
 */
export const updateReservationStatus = async (
  tenantId: string,
  reservationId: string,
  status: Reservation['status'],
  adminNotes?: string
): Promise<void> => {
  // 1. Get current reservation
  const reservation = await getReservation(tenantId, reservationId);

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  const batch = writeBatch(db);
  const reservationRef = doc(db, `tenants/${tenantId}/reservations`, reservationId);

  // 2. Update reservation status
  const updateData: any = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  // 3. Handle table status updates based on status transition
  if (status === 'confirmed' && !reservation.assignedTableId) {
    // Auto-assign table when confirming
    // Note: This is done OUTSIDE batch to handle errors gracefully
    await assignTableToReservation(tenantId, reservationId);
    return; // assignTableToReservation already updates reservation
  }

  if (reservation.assignedTableId) {
    const tableRef = doc(db, `tenants/${tenantId}/tables`, reservation.assignedTableId);

    switch (status) {
      case 'seated':
        batch.update(tableRef, { status: 'occupied' });
        break;

      case 'completed':
      case 'cancelled':
      case 'no-show':
        batch.update(tableRef, { status: 'available' });
        // Optionally clear assignment for completed/cancelled
        if (status === 'cancelled') {
          updateData.assignedTableId = null;
          updateData.assignedTableNumber = null;
        }
        break;

      // 'confirmed' and 'pending' don't change table status (already 'reserved' or unassigned)
    }
  }

  batch.update(reservationRef, updateData);
  await batch.commit();
};
```

### Helper Function: calculateReservationDuration()

```typescript
/**
 * Calculate reservation duration based on time and settings
 * Returns duration in minutes
 */
function calculateReservationDuration(
  time: string, // HH:mm format
  tableOccupation?: AppSettings['tableOccupation']
): number {
  // Default to 90 minutes if no settings
  if (!tableOccupation || !tableOccupation.servicePeriods) {
    return 90;
  }

  // Parse time to get hour
  const [hourStr] = time.split(':');
  const hour = parseInt(hourStr, 10);

  // Determine service period
  if (hour >= 6 && hour < 11) {
    return tableOccupation.servicePeriods.breakfast || 45;
  } else if (hour >= 11 && hour < 15) {
    return tableOccupation.servicePeriods.lunch || 60;
  } else {
    return tableOccupation.servicePeriods.dinner || 90;
  }
}
```

## UI/UX Changes

### ReservationForm Component
- No visual changes to form fields
- Table assignment happens backend-side when reservation is confirmed
- Duration calculation is transparent to customer
- Existing tablePreference field remains optional (for customer requests, not binding)

### ReservationManager Component

**New Column: "Assigned Table"**
- Add column to reservations table between "Party" and "Name" columns
- Display logic:
  - If `assignedTableNumber` exists: "Table {number}" (e.g., "Table 5")
  - If not assigned: "Unassigned" in gray text
- Styling: Match existing table cell styling

**New Action: "Assign Table" Dropdown**
- Show for reservations with status 'pending' and no assignedTableId
- Render as dropdown button in Actions column
- Dropdown content:
  - List all tables available for reservation's date/time
  - Format: "Table {number} (Capacity: {capacity})"
  - If no tables available: Show "No tables available" disabled option
- On selection:
  - Call assignTableToReservation(tenantId, reservationId, selectedTableId)
  - Show loading state during assignment
  - Show success toast: "Table {number} assigned to reservation"
  - Handle error: Show error toast with specific message

**Code Location:** `/Users/clivestruver/Projects/restaurant-management-system/components/admin/ReservationManager.tsx`

**Implementation Notes:**
- Add state for available tables: `const [availableTables, setAvailableTables] = useState<Map<string, Table[]>>(new Map())`
- Fetch available tables when dropdown is opened (lazy loading)
- Cache results to avoid repeated API calls
- Use existing `streamTables()` for table list, then filter with `checkTableAvailability()`

### FloorPlanDisplay Component

**New Props:**
- `date?: string` - Filter tables by this date (YYYY-MM-DD)
- `time?: string` - Filter tables by this time (HH:mm)
- `duration?: number` - Reservation duration in minutes (default 90)
- `onTableSelect?: (tableNumber: number) => void` - Callback when customer selects table

**Filtering Logic:**
- If date/time provided, only show tables available for that date/time window
- Call `checkTableAvailability()` for each table
- Render unavailable tables as grayed out with red/orange tint
- Show tooltip on hover: "Table X is unavailable for selected time"

**Visual Indicators:**
- Available tables: Bright green (#10b981), clickable
- Reserved tables (other bookings): Orange (#f59e0b), not clickable, show "Reserved" label
- Occupied tables: Red (#ef4444), not clickable, show "Occupied" label
- Unavailable (filtered out): Light gray with red tint, not clickable

**Code Location:** `/Users/clivestruver/Projects/restaurant-management-system/components/customer/FloorPlanDisplay.tsx`

### ReservationFlow Integration

**Update ReservationFlow Component:**
- Pass selected date/time from ReservationForm to FloorPlanDisplay
- When customer selects date/time in form, update FloorPlanDisplay props
- When customer clicks table in floor plan, populate tablePreference field in form
- Show visual feedback: Highlight selected table in blue (#2563eb)

**Code Location:** `/Users/clivestruver/Projects/restaurant-management-system/components/ReservationFlow.tsx`

## Integration Points

### Existing API Functions
- `streamTables(tenantId, callback)` - Real-time table updates, no changes needed
- `streamReservations(tenantId, filters, callback)` - Real-time reservation updates, no changes needed
- `updateTable(tenantId, table)` - Used for status updates, no signature changes
- `getReservation(tenantId, reservationId)` - Used for fetching reservation details, no changes needed

### Existing Components
- `ReservationManager` - Extend with new column and assign dropdown
- `FloorPlanDisplay` - Add date/time filtering props
- `ReservationFlow` - Pass date/time to FloorPlanDisplay

### AppSettings Integration
- Use `settings.tableOccupation.servicePeriods` for duration calculation
- Fallback to 90 minutes if not configured
- Settings can be updated without breaking existing reservations (duration stored in reservation document)

### Firestore Listeners
- `streamTables()` automatically propagates table status changes
- `streamReservations()` automatically propagates reservation updates
- No new listeners needed, leverage existing real-time infrastructure

## Testing Strategy

### Unit Tests

**Test: checkTableAvailability() with various conflict scenarios**
- Scenario 1: No existing reservations → returns true
- Scenario 2: Existing reservation before requested window → returns true
- Scenario 3: Existing reservation after requested window → returns true
- Scenario 4: Existing reservation overlaps start of requested window → returns false
- Scenario 5: Existing reservation overlaps end of requested window → returns false
- Scenario 6: Existing reservation completely contained in requested window → returns false
- Scenario 7: Requested window completely contained in existing reservation → returns false
- Scenario 8: Exclude reservation ID parameter → returns true (ignores specified reservation)

**Test: calculateReservationDuration() with different times**
- Time 09:00 → returns breakfast duration (45 min)
- Time 13:00 → returns lunch duration (60 min)
- Time 19:00 → returns dinner duration (90 min)
- Time with no tableOccupation settings → returns 90 min default

**Test: assignTableToReservation() edge cases**
- No tables with sufficient capacity → throws error
- All tables booked for time slot → throws error
- Multiple tables available → assigns lowest table number
- Table preference matches available table → assigns preferred table

### Integration Tests

**Test: Create reservation → verify table assigned → attempt double-booking**
1. Create reservation for Table 1 at 19:00 on 2025-11-01 (party size 2)
2. Confirm reservation (status = 'confirmed')
3. Verify assignedTableId and assignedTableNumber are set
4. Verify Table 1 status = 'reserved'
5. Attempt to create second reservation for Table 1 at 19:30 on 2025-11-01 (party size 2)
6. Confirm second reservation
7. Verify second reservation assigned to different table (Table 2)
8. Verify Table 1 still assigned to first reservation

**Test: Reservation status lifecycle updates table status**
1. Create and confirm reservation → table status 'reserved'
2. Update reservation to 'seated' → table status 'occupied'
3. Update reservation to 'completed' → table status 'available'
4. Verify table can be assigned to new reservation

**Test: Manual table assignment by admin**
1. Create pending reservation (not confirmed)
2. Admin opens ReservationManager
3. Admin clicks "Assign Table" dropdown
4. Admin selects Table 3 from dropdown
5. Verify reservation.assignedTableId = Table 3 ID
6. Verify Table 3 status = 'reserved'

### End-to-End Tests

**Test: Customer selects table → books → admin sees assignment**
1. Customer opens reservation form
2. Customer selects date 2025-11-15, time 18:00, party size 4
3. FloorPlanDisplay filters tables by availability
4. Customer clicks on available Table 2 in floor plan
5. Customer fills contact info and submits reservation
6. Verify reservation created with tablePreference = 2
7. Admin confirms reservation in ReservationManager
8. Verify assignedTableNumber = 2 in admin UI
9. Verify Table 2 shows as "Reserved" in FloorPlanDisplay for that date/time

**Test: Double-booking prevention in real-time**
1. Admin 1 creates reservation A for Table 1 at 19:00 (party size 2)
2. Admin 2 (different browser) creates reservation B for Table 1 at 19:30 (party size 2)
3. Admin 1 confirms reservation A
4. Verify Table 1 assigned to reservation A
5. Admin 2 confirms reservation B
6. Verify Table 1 NOT assigned to reservation B (different table assigned)
7. Verify both admins see correct assignments via real-time updates

## Migration Strategy

### Existing Reservations Without assignedTableId

**Approach: Graceful Degradation + Manual Admin Assignment**
- Existing pending/confirmed reservations without assignedTableId continue to work
- Show "Unassigned" in ReservationManager for legacy reservations
- Admin can manually assign tables using new "Assign Table" dropdown
- No automatic migration script (admin assigns on-demand)
- New reservations automatically get assignments when confirmed

**Admin Workflow:**
1. Admin opens ReservationManager
2. Filter by status = 'confirmed' and date >= today
3. Review reservations with "Unassigned" label
4. Click "Assign Table" dropdown for each
5. Select appropriate table from available list
6. Repeat until all upcoming reservations have assignments

**No Breaking Changes:**
- `assignedTableId` and `assignedTableNumber` are optional fields (backward compatible)
- Existing reservation creation flow unchanged (still creates 'pending' status)
- Existing table CRUD operations unchanged
- Existing Firestore queries continue to work (optional fields ignored)

### Data Integrity Checks

**Post-Deployment Validation:**
- Query all confirmed/seated reservations created after deployment
- Verify all have assignedTableId and assignedTableNumber
- Query all tables with status 'reserved'
- Verify each has a corresponding confirmed/seated reservation
- If mismatches found, admin can manually fix via UI (no data corruption)

### Rollback Plan

If critical bug detected:
1. Deploy hotfix to skip auto-assignment (set feature flag `disableAutoAssignment = true`)
2. Reservations continue to work without table assignments
3. Admin can manually manage table assignments via existing Table CRUD
4. Existing assignments preserved in database (not deleted)
5. Fix bug and re-enable auto-assignment with feature flag

## Out of Scope

### Explicitly Deferred to Phase 3B-E

- **ServicePeriod configuration UI**: Use hardcoded time ranges (breakfast/lunch/dinner) for duration calculation
- **SittingTimeRule complex calculations**: Use fixed durations from settings, no party size modifiers
- **Walk-in booking processing**: Focus on reservations only, walk-ins managed separately
- **Smart auto-assignment algorithm with scoring**: Use simple "first available table by number" approach
- **AvailabilityCache for performance optimization**: Query Firestore directly for each availability check
- **Table merging for large parties**: Assign single table only, no automatic table merging
- **Multi-table assignment**: One reservation = one table (no support for parties requiring multiple tables)
- **Buffer time between reservations**: Use exact reservation duration, no padding/turnover time
- **Priority reservations or VIP handling**: All reservations treated equally in assignment algorithm
- **Reservation modification**: If customer changes date/time, must cancel and create new reservation

### Not in Scope for Table Management Module

- External integration with OpenTable, Resy, or other reservation platforms
- SMS/email notifications for reservation confirmations (future enhancement)
- Customer waitlist management
- Deposit or prepayment requirement for reservations
- No-show penalty or blacklist system
- Guest history and preference tracking
- Table section assignment to specific servers

## Success Criteria

### Measurable Outcomes

- **Zero double-bookings**: No two confirmed reservations assigned to same table with overlapping time windows
- **100% auto-assignment for available tables**: All confirmed reservations with available tables get assigned within 2 seconds
- **Admin efficiency**: Assigning table to pending reservation takes < 5 seconds (3 clicks)
- **Real-time sync**: Table status changes visible in FloorPlanDisplay within 500ms
- **Backward compatibility**: All existing reservations continue to function without data migration

### User Experience Goals

- **Marcus's confidence**: Restaurant manager can trust that double-bookings are prevented
- **Customer clarity**: Floor plan shows only genuinely available tables for selected date/time
- **Staff awareness**: Kitchen and front-of-house see accurate table assignments in real-time
- **Admin control**: Ability to manually override assignments for special cases

### Technical Quality

- **Code reuse**: 90%+ of backend logic reuses existing CRUD operations (updateTable, updateReservation, streamTables)
- **Type safety**: Full TypeScript coverage, all new functions strictly typed
- **Transaction safety**: Reservation + table updates happen atomically (Firestore batched writes)
- **Error handling**: Graceful degradation if auto-assignment fails (reservation stays pending, admin can manually assign)
- **Performance**: Availability checks complete in < 500ms (Firestore composite index required)

### Launch Readiness

- **Beta test success**: Marcus successfully manages 20+ reservations over 3 days with zero double-bookings
- **Admin training**: Marcus understands how to manually assign tables to pending reservations
- **Data integrity**: All confirmed reservations have valid assignedTableId and assignedTableNumber
- **Monitoring**: Firestore read/write counts within expected range (no performance degradation)
- **Documentation**: Admin guide for manual table assignment workflow

## Implementation Priority

### Phase 3A Timeline (3-5 Days)

**Day 1: Data Model & API Foundation**
- Extend Reservation interface with optional fields
- Implement calculateReservationDuration() helper
- Update createReservation() to calculate and store duration
- Write unit tests for duration calculation

**Day 2: Availability Checking**
- Implement checkTableAvailability() function
- Create Firestore composite index for availability queries
- Write unit tests for conflict detection scenarios
- Test with various time windows and edge cases

**Day 3: Automatic Assignment Logic**
- Implement assignTableToReservation() function
- Implement automatic table assignment in updateReservationStatus()
- Write integration tests for assignment flow
- Handle error cases (no tables available)

**Day 4: Admin UI Enhancements**
- Add "Assigned Table" column to ReservationManager
- Implement "Assign Table" dropdown for pending reservations
- Connect dropdown to assignTableToReservation() API
- Test manual assignment workflow

**Day 5: FloorPlanDisplay Integration & Testing**
- Add date/time props to FloorPlanDisplay
- Implement table filtering by availability
- Update ReservationFlow to pass date/time to floor plan
- End-to-end testing with beta customer
- Fix bugs and edge cases

### Risk Mitigation

**Risk: Firestore composite index not deployed**
- Mitigation: Deploy index first, verify with test query before code deployment
- Fallback: Fetch all reservations and filter in application code (slower but functional)

**Risk: Race condition with simultaneous bookings**
- Mitigation: Use Firestore transactions for atomic reservation + table updates
- Fallback: Last-write-wins (acceptable for MVP, very rare scenario)

**Risk: Performance degradation with many reservations**
- Mitigation: Monitor Firestore read counts, optimize queries if needed
- Fallback: Implement AvailabilityCache in Phase 3B (out of scope for MVP)

**Risk: Customer confusion with filtered floor plan**
- Mitigation: Clear visual indicators (grayed out tables, tooltips explaining why unavailable)
- Fallback: Show all tables but disable selection for unavailable ones

**Risk: Admin forgets to assign tables to legacy reservations**
- Mitigation: Persistent notification banner in ReservationManager: "X unassigned reservations need table assignment"
- Fallback: Admin can assign tables day-of via TableManager status updates
