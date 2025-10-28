# Task Breakdown: Customer Flow Redesign - Task Groups 8-16

**Feature:** Customer Flow Redesign with Landing Pages, QR Codes, and Reservations
**Phase:** Phase 3 (Continuation)
**Status:** Ready for Implementation
**This Document:** Task Groups 8-16 (Milestones 4-6, Testing, Deployment)

---

## Task List (Continued from Task Group 7)

### Milestone 4: Reservation System

#### Task Group 8: Reservation Data Layer
**Dependencies:** Task Group 7
**Effort:** 1.5 days
**Specialist:** Backend Engineer

- [ ] 8.0 Create reservation data models and Firestore functions
  - [ ] 8.1 Write 2-6 focused tests for reservation data layer
    - Test: Create reservation successfully
    - Test: Validate required fields (date, time, partySize, contact info)
    - Test: Update reservation status (pending → confirmed → seated)
    - Test: Stream reservations by date filter
    - Test: Stream reservations by status filter
    - Test: Reject invalid party size (<1 or >20)
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/ReservationDataLayer.tests.md`
  - [ ] 8.2 Create `Reservation` interface in `/Users/clivestruver/Projects/restaurant-management-system/types.ts`
    - Add interface:
      ```typescript
      interface Reservation {
        id: string; // Auto-generated Firestore ID
        tenantId: string; // Tenant isolation

        // Booking details
        date: string; // YYYY-MM-DD format
        time: string; // HH:mm 24-hour format (e.g., "19:00")
        partySize: number; // Number of guests (1-20)

        // Contact information
        contactName: string;
        contactPhone: string; // E.164 format: +1234567890
        contactEmail: string; // Validated email

        // Optional preferences
        tablePreference?: number; // Requested table number
        specialRequests?: string; // Max 500 chars

        // Status tracking
        status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';

        // Timestamps
        createdAt: Timestamp; // Firestore Timestamp
        updatedAt: Timestamp; // Firestore Timestamp

        // Admin notes
        adminNotes?: string; // Internal staff notes
      }
      ```
    - Export type from types.ts
  - [ ] 8.3 Create CRUD functions in `/Users/clivestruver/Projects/restaurant-management-system/firebase/api-multitenant.ts`
    - Function: `createReservation(tenantId: string, reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string>`
      - Validate required fields
      - Set status to 'pending' by default
      - Add createdAt and updatedAt timestamps using serverTimestamp()
      - Return reservation ID
    - Function: `updateReservationStatus(tenantId: string, reservationId: string, status: Reservation['status'], adminNotes?: string): Promise<void>`
      - Update status field
      - Update adminNotes if provided
      - Update updatedAt timestamp
    - Function: `getReservation(tenantId: string, reservationId: string): Promise<Reservation | null>`
      - Fetch single reservation by ID
      - Return null if not found
  - [ ] 8.4 Create real-time streaming function
    - Function: `streamReservations(tenantId: string, filters: { date?: string; status?: string }, callback: (reservations: Reservation[]) => void): () => void`
      - Query: `tenants/{tenantId}/reservations`
      - Filter by tenantId (always)
      - Optional filter by date (exact match)
      - Optional filter by status
      - Order by date descending, time ascending
      - Return unsubscribe function
      - Use onSnapshot for real-time updates
  - [ ] 8.5 Update Firestore Security Rules in `/Users/clivestruver/Projects/restaurant-management-system/firestore.rules`
    - Add reservation rules:
      ```javascript
      // Reservations: Tenant-isolated, customers can create, admins can manage
      match /tenants/{tenantId}/reservations/{reservationId} {
        // Anyone can create a reservation (guest checkout)
        allow create: if request.resource.data.tenantId == tenantId
                      && request.resource.data.status == 'pending'
                      && request.resource.data.date is string
                      && request.resource.data.time is string
                      && request.resource.data.partySize is int
                      && request.resource.data.partySize >= 1
                      && request.resource.data.partySize <= 20
                      && request.resource.data.contactName is string
                      && request.resource.data.contactPhone is string
                      && request.resource.data.contactEmail is string;

        // Admin/staff can read all reservations for their tenant
        allow read: if isAdminOrStaff(tenantId);

        // Admin/staff can update reservation status and notes
        allow update: if isAdminOrStaff(tenantId)
                      && request.resource.data.tenantId == resource.data.tenantId;

        // Admin can delete reservations
        allow delete: if isAdmin(tenantId);
      }
      ```
    - Add helper function if not exists:
      ```javascript
      function isAdminOrStaff(tenantId) {
        return request.auth != null
          && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships[tenantId].role in ['admin', 'staff'];
      }
      ```
  - [ ] 8.6 Create Firestore index for reservations
    - Required composite index:
      - Collection: `reservations`
      - Fields: `tenantId` (Ascending), `date` (Ascending), `time` (Ascending)
    - Note: Index will be auto-created on first query, or manually create in Firebase Console
  - [ ] 8.7 Run reservation data layer tests
    - Run ONLY the 2-6 tests from 8.1
    - Verify reservation creation works
    - Verify status updates work
    - Verify streaming with filters works
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Tests from 8.1 pass (2-6 tests)
- Reservation interface defined and exported
- All CRUD functions work correctly
- Real-time streaming works with filters
- Security rules enforce tenant isolation
- Firestore index created

---

#### Task Group 9: Reservation Form UI
**Dependencies:** Task Group 8
**Effort:** 2 days
**Specialist:** Frontend Engineer

- [ ] 9.0 Create customer-facing reservation form
  - [ ] 9.1 Write 2-6 focused tests for reservation form
    - Test: Form renders with all required fields
    - Test: Date validation (future dates only)
    - Test: Phone number validation (E.164 format)
    - Test: Email validation (valid email format)
    - Test: Party size validation (1-20)
    - Test: Submit reservation successfully
    - Test: Show error on submission failure
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/ReservationForm.tests.md`
  - [ ] 9.2 Create `ReservationForm.tsx` component in `/Users/clivestruver/Projects/restaurant-management-system/components/`
    - Props:
      ```typescript
      interface ReservationFormProps {
        onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'status'>) => Promise<void>;
        onCancel: () => void;
        availableTables: number[];
      }
      ```
    - Import react-datepicker for date picker
    - Import libphonenumber-js for phone validation
  - [ ] 9.3 Implement form fields
    - **Date Picker** (required):
      - Use `react-datepicker` component
      - Min date: today
      - Max date: today + 30 days (or from AppSettings.maxDaysInAdvance)
      - Disable dates outside operating hours (check AppSettings.weekSchedule)
      - Label: "Reservation Date"
    - **Time Picker** (required):
      - Dropdown with 15-minute intervals
      - Filter times by service periods (breakfast, lunch, dinner from AppSettings)
      - Only show times within operating hours for selected date
      - Label: "Reservation Time"
    - **Party Size** (required):
      - Number input
      - Min: 1, Max: 20
      - Step: 1
      - Label: "Party Size"
    - **Contact Name** (required):
      - Text input
      - Max length: 100 chars
      - Label: "Your Name"
    - **Phone Number** (required):
      - Tel input
      - Format: E.164 (e.g., +1234567890)
      - Validation using libphonenumber-js
      - Label: "Phone Number"
      - Placeholder: "+1 (555) 123-4567"
    - **Email** (required):
      - Email input
      - HTML5 validation
      - Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
      - Label: "Email Address"
    - **Table Preference** (optional):
      - Dropdown
      - Options: "No Preference" + all availableTables
      - Default: "No Preference"
      - Label: "Table Preference (Optional)"
    - **Special Requests** (optional):
      - Textarea
      - Max length: 500 chars
      - Character counter below
      - Label: "Special Requests (Optional)"
      - Placeholder: "High chair needed, window seat preferred, celebrating anniversary, etc."
  - [ ] 9.4 Implement form validation
    - Client-side validation:
      ```typescript
      const validateForm = (data: FormData): FormErrors => {
        const errors: FormErrors = {};

        // Date validation
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          errors.date = 'Date must be today or in the future';
        }

        // Time validation
        if (!data.time) {
          errors.time = 'Time is required';
        }

        // Party size validation
        if (data.partySize < 1) {
          errors.partySize = 'Party size must be at least 1';
        }
        if (data.partySize > 20) {
          errors.partySize = 'Party size cannot exceed 20';
        }

        // Contact name validation
        if (!data.contactName.trim()) {
          errors.contactName = 'Name is required';
        }

        // Phone validation (E.164 format)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(data.contactPhone)) {
          errors.contactPhone = 'Invalid phone number format';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.contactEmail)) {
          errors.contactEmail = 'Invalid email address';
        }

        // Special requests length
        if (data.specialRequests && data.specialRequests.length > 500) {
          errors.specialRequests = 'Special requests cannot exceed 500 characters';
        }

        return errors;
      };
      ```
    - Show error messages inline below each field
    - Disable submit button until form is valid
  - [ ] 9.5 Implement submit handler
    - Function: `handleSubmit(e: React.FormEvent)`
    - Validate form
    - Show loading state (disable button, show spinner)
    - Call onSubmit prop with form data
    - Handle success: navigate to confirmation screen
    - Handle error: show error toast, re-enable form
  - [ ] 9.6 Apply styling
    - Form layout: vertical stack, max-width 600px, centered
    - Form groups: label + input + error message
    - Labels: 14px, medium weight, margin-bottom 8px
    - Inputs: 16px font (prevents iOS zoom), padding 12px, border-radius 8px
    - Error messages: red (#dc3545), 14px, margin-top 4px
    - Submit button: large (min 48px height), primary color, full width on mobile
    - Cancel button: secondary style, full width on mobile
    - Mobile: stack buttons, desktop: side-by-side
  - [ ] 9.7 Implement time slot generation logic
    - Function: `generateTimeSlots(date: string, settings: AppSettings): string[]`
    - Get day of week from date
    - Get operating hours from settings.weekSchedule
    - Generate 15-minute intervals within operating hours
    - Return array of times (e.g., ["09:00", "09:15", "09:30", ...])
  - [ ] 9.8 Run reservation form tests
    - Run ONLY the 2-6 tests from 9.1
    - Verify all validation rules work
    - Test form submission
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Tests from 9.1 pass (2-6 tests)
- All form fields render correctly
- Validation works for all fields
- Date picker shows correct date range
- Time slots filtered by operating hours
- Form submits successfully
- Errors handled gracefully

---

#### Task Group 10: Reservation Confirmation and Admin Management
**Dependencies:** Task Group 9
**Effort:** 2 days
**Specialist:** Full-stack Engineer

- [ ] 10.0 Create reservation confirmation screen and admin management UI
  - [ ] 10.1 Write 2-6 focused tests for reservation management
    - Test: ReservationConfirmation displays reservation details
    - Test: ReservationManager lists reservations
    - Test: Filter reservations by date
    - Test: Filter reservations by status
    - Test: Update reservation status (confirm, cancel, seat, complete)
    - Test: View full reservation details modal
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/ReservationManagement.tests.md`
  - [ ] 10.2 Create `ReservationConfirmation.tsx` component in `/Users/clivestruver/Projects/restaurant-management-system/components/`
    - Props:
      ```typescript
      interface ReservationConfirmationProps {
        reservation: Reservation;
        onBackToHome: () => void;
      }
      ```
    - Layout: centered card, max-width 600px
    - Show success checkmark icon
    - Heading: "Reservation Confirmed!"
    - Display details:
      - Date (formatted: "October 27, 2025")
      - Time (formatted: "7:00 PM")
      - Party size ("Party of 4")
      - Contact name
      - Contact phone
      - Contact email
      - Table preference (if selected)
      - Special requests (if provided)
    - Message: "We look forward to serving you! Please arrive on time."
    - "Back to Home" button → navigate to landing page
    - "Order for Delivery/Pickup" button → navigate to order flow
  - [ ] 10.3 Create `ReservationManager.tsx` component in `/Users/clivestruver/Projects/restaurant-management-system/components/admin/`
    - Use streamReservations function for real-time updates
    - Display table view of reservations
  - [ ] 10.4 Implement reservation list table
    - Table columns:
      - Date (YYYY-MM-DD)
      - Time (HH:mm)
      - Party Size
      - Contact Name
      - Phone
      - Status (badge)
      - Actions (View/Confirm/Cancel buttons)
    - Sortable columns (default: date desc, time asc)
    - Responsive: scroll horizontally on mobile, full width on desktop
  - [ ] 10.5 Implement filters
    - Date filter: date picker, filter by exact date
    - Status filter: dropdown with all statuses + "All"
    - Apply filters to streamReservations query
    - Show "Clear Filters" button when filters active
    - Show reservation count: "Showing X reservations"
  - [ ] 10.6 Implement status badges
    - Status colors:
      - Pending: Yellow (#ffc107)
      - Confirmed: Green (#28a745)
      - Seated: Blue (#007bff)
      - Completed: Gray (#6c757d)
      - Cancelled: Red (#dc3545)
      - No-show: Dark Red (#bd2130)
    - Badge style: pill shape, white text, 12px font, medium weight
  - [ ] 10.7 Implement action buttons
    - "View" button: opens modal with full details
    - "Confirm" button: updates status to 'confirmed' (only shown for pending)
    - "Cancel" button: updates status to 'cancelled' (with confirmation dialog)
    - "Seat" button: updates status to 'seated' (only shown for confirmed)
    - "Complete" button: updates status to 'completed' (only shown for seated)
    - Disable buttons during update (show loading spinner)
    - Show success toast after status update
  - [ ] 10.8 Implement reservation details modal
    - Modal triggered by "View" button
    - Display all reservation fields:
      - Date, time, party size
      - Contact info
      - Table preference
      - Special requests (highlighted if present)
      - Status with badge
      - Created/updated timestamps
      - Admin notes
    - Admin notes textarea: editable, save button
    - Close button
  - [ ] 10.9 Add ReservationManager to AdminPanel
    - Update AdminPanel.tsx navigation
    - Add new section: "Reservations" with calendar icon
    - Render ReservationManager when selected
    - Position after QR Codes in sidebar
  - [ ] 10.10 Integrate reservation flow into app navigation
    - Update CustomerFlowRouter in App.tsx
    - When customerIntent === 'later', render ReservationForm
    - After form submission, navigate to ReservationConfirmation
    - Store reservation ID in state for confirmation screen
  - [ ] 10.11 Run reservation management tests
    - Run ONLY the 2-6 tests from 10.1
    - Verify confirmation screen displays correctly
    - Verify admin can view and update reservations
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Tests from 10.1 pass (2-6 tests)
- Confirmation screen shows reservation details
- Admin can view reservation list
- Filters work correctly
- Status updates work with real-time sync
- Details modal displays all information
- Component accessible from AdminPanel
- Customer flow integrated (intent 'later' → form → confirmation)

---

#### Task Group 11: Auto-Cancellation Cloud Function
**Dependencies:** Task Group 10
**Effort:** 1 day
**Specialist:** Backend Engineer / DevOps

- [ ] 11.0 Create scheduled Cloud Function for auto-cancellation
  - [ ] 11.1 Write 2-4 focused tests for auto-cancellation logic
    - Test: Identify no-show reservations (>15 mins past)
    - Test: Update status to 'no-show' correctly
    - Test: Add admin notes with timestamp
    - Test: Do NOT cancel reservations <15 mins past
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/AutoCancellation.tests.md`
  - [ ] 11.2 Set up Cloud Functions directory structure
    - Ensure `/Users/clivestruver/Projects/restaurant-management-system/functions/` exists
    - If not exists: run `firebase init functions` to initialize
    - Use TypeScript for functions
    - Install dependencies: `cd functions && npm install`
  - [ ] 11.3 Create scheduled function in `/Users/clivestruver/Projects/restaurant-management-system/functions/src/scheduledJobs.ts`
    - Import Firebase Admin SDK:
      ```typescript
      import { onSchedule } from 'firebase-functions/v2/scheduler';
      import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
      import * as admin from 'firebase-admin';

      if (!admin.apps.length) {
        admin.initializeApp();
      }
      ```
    - Create function:
      ```typescript
      export const autoCancelNoShows = onSchedule(
        {
          schedule: 'every 5 minutes',
          timeZone: 'UTC',
          memory: '256MiB',
        },
        async (event) => {
          const db = getFirestore();
          const now = new Date();

          console.log(`Running auto-cancel job at ${now.toISOString()}`);

          try {
            // Query all confirmed reservations across all tenants
            const reservationsSnapshot = await db
              .collectionGroup('reservations')
              .where('status', '==', 'confirmed')
              .get();

            const updates: Promise<any>[] = [];
            let cancelledCount = 0;

            for (const doc of reservationsSnapshot.docs) {
              const reservation = doc.data() as Reservation;

              // Parse reservation datetime
              const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);

              // Calculate minutes past reservation time
              const minutesPast = (now.getTime() - reservationDateTime.getTime()) / 60000;

              // Auto-cancel if more than 15 minutes past
              if (minutesPast > 15) {
                console.log(`Auto-cancelling reservation ${doc.id}: ${minutesPast.toFixed(0)} minutes past`);

                updates.push(
                  doc.ref.update({
                    status: 'no-show',
                    updatedAt: FieldValue.serverTimestamp(),
                    adminNotes: `Auto-cancelled: Customer did not arrive within 15 minutes. No-show detected at ${now.toISOString()}`,
                  })
                );
                cancelledCount++;
              }
            }

            await Promise.all(updates);

            console.log(`Processed ${reservationsSnapshot.size} reservations, cancelled ${cancelledCount}`);

            return {
              processed: reservationsSnapshot.size,
              cancelled: cancelledCount,
            };
          } catch (error) {
            console.error('Error in auto-cancel job:', error);
            throw error;
          }
        }
      );
      ```
  - [ ] 11.4 Export function in `/Users/clivestruver/Projects/restaurant-management-system/functions/src/index.ts`
    - Add export:
      ```typescript
      export { autoCancelNoShows } from './scheduledJobs';
      ```
  - [ ] 11.5 Configure function deployment settings
    - Update `functions/package.json` with correct engines:
      ```json
      {
        "engines": {
          "node": "18"
        }
      }
      ```
    - Ensure Firebase Admin SDK installed:
      ```bash
      cd functions
      npm install firebase-admin firebase-functions
      ```
  - [ ] 11.6 Test function locally (optional)
    - Use Firebase Emulator Suite:
      ```bash
      firebase emulators:start --only functions
      ```
    - Manually trigger function via emulator UI
    - Verify console logs show correct behavior
  - [ ] 11.7 Deploy Cloud Function
    - Run: `firebase deploy --only functions:autoCancelNoShows`
    - Verify deployment succeeds
    - Check Firebase Console > Functions for deployed function
    - Verify schedule is set to "every 5 minutes"
  - [ ] 11.8 Monitor function execution
    - Firebase Console > Functions > Logs
    - Verify function runs every 5 minutes
    - Check for errors in logs
    - Verify no-show reservations are updated correctly
  - [ ] 11.9 Run auto-cancellation tests
    - Create test reservations with past times
    - Wait 5-10 minutes for function to run
    - Verify status changes to 'no-show'
    - Verify adminNotes populated
    - Check function logs for execution

**Acceptance Criteria:**
- Tests from 11.1 pass (2-4 tests)
- Cloud Function deployed successfully
- Function runs every 5 minutes
- No-show reservations auto-cancelled after 15 mins
- Admin notes populated with timestamp
- Function logs show no errors
- Confirmed reservations <15 mins not affected

---

### Milestone 5: Menu Differentiation

#### Task Group 12: Product Availability Configuration
**Dependencies:** Task Group 11
**Effort:** 1 day
**Specialist:** Full-stack Engineer

- [ ] 12.0 Implement menu differentiation by order type
  - [ ] 12.1 Write 2-6 focused tests for product availability
    - Test: Product interface includes availableFor field
    - Test: Menu filters products by dine-in order type
    - Test: Menu filters products by takeaway order type
    - Test: Products with 'both' show for all order types
    - Test: Products without availableFor default to 'both' (backward compatibility)
    - Test: Admin can update product availability settings
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/ProductAvailability.tests.md`
  - [ ] 12.2 Update `Product` interface in `/Users/clivestruver/Projects/restaurant-management-system/types.ts`
    - Add field:
      ```typescript
      interface Product {
        id: string;
        name: string;
        categoryId: string;
        price: number;
        description: string;
        imageUrl: string;
        availableOptionNames?: string[];

        // NEW: Order type availability
        availableFor?: ('dine-in' | 'takeaway' | 'both')[]; // Default: ['both']
      }
      ```
    - Make field optional for backward compatibility
  - [ ] 12.3 Update ProductManager admin UI in `/Users/clivestruver/Projects/restaurant-management-system/components/admin/ProductManager.tsx`
    - Add "Available For" section to product form
    - Checkboxes:
      - ☑️ Dine-In
      - ☑️ Takeaway
    - Default: both checked (represents ['both'])
    - Save logic:
      - If both checked: save as `['both']`
      - If only dine-in checked: save as `['dine-in']`
      - If only takeaway checked: save as `['takeaway']`
      - If neither checked: default to `['both']` (prevent invalid state)
    - Show below description field, above save button
  - [ ] 12.4 Update menu filtering logic in customer app
    - Locate menu rendering logic (likely in MenuScreen or CustomerApp)
    - Implement filter:
      ```typescript
      const filteredProducts = products.filter(product => {
        // Backward compatibility: if no availableFor field, show for all types
        if (!product.availableFor || product.availableFor.length === 0) {
          return true;
        }

        // If 'both' is in array, show for all order types
        if (product.availableFor.includes('both')) {
          return true;
        }

        // Otherwise, check if current order type is in array
        const currentOrderType = journey.orderType; // from CustomerJourneyContext
        return currentOrderType && product.availableFor.includes(currentOrderType);
      });
      ```
    - Use `useCustomerJourney` hook to get current order type
    - Apply filter before rendering products
  - [ ] 12.5 Add visual indicator for availability (optional enhancement)
    - In ProductManager list view, show badges:
      - "Dine-In Only" - blue badge
      - "Takeaway Only" - orange badge
      - "Both" - green badge
    - Helps admin quickly identify product availability
  - [ ] 12.6 Update Firestore Security Rules (if needed)
    - Ensure products rule allows `availableFor` field:
      ```javascript
      match /tenants/{tenantId}/products/{productId} {
        allow read: if true; // Public read
        allow write: if isAdmin(tenantId)
                     && (!request.resource.data.keys().hasAny(['availableFor'])
                         || request.resource.data.availableFor is list);
      }
      ```
  - [ ] 12.7 Test backward compatibility
    - Verify existing products (without availableFor field) display correctly
    - Verify they show for both dine-in and takeaway
    - No migration script needed - handled by code logic
  - [ ] 12.8 Run product availability tests
    - Run ONLY the 2-6 tests from 12.1
    - Verify filtering works for dine-in
    - Verify filtering works for takeaway
    - Verify backward compatibility
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Tests from 12.1 pass (2-6 tests)
- Product interface updated with availableFor field
- Admin UI shows checkboxes for availability
- Menu filters correctly by order type
- Backward compatibility works (old products show for all types)
- No errors when updating products

---

### Milestone 6: Guest Checkout & Auth

#### Task Group 13: Guest Checkout Flow
**Dependencies:** Task Group 12
**Effort:** 2 days
**Specialist:** Full-stack Engineer

- [ ] 13.0 Implement guest checkout without forced account creation
  - [ ] 13.1 Write 2-6 focused tests for guest checkout
    - Test: Guest can complete order without login
    - Test: Anonymous auth user created for guest
    - Test: Guest order saved with guestEmail and guestPhone
    - Test: Order marked as isGuestOrder = true
    - Test: CartModal shows guest fields when not authenticated
    - Test: Pre-fill fields if user is authenticated
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/GuestCheckout.tests.md`
  - [ ] 13.2 Update `Order` interface in `/Users/clivestruver/Projects/restaurant-management-system/types.ts`
    - Add fields:
      ```typescript
      interface Order {
        id: string;
        userId: string; // Can be anonymous user ID for guests
        customerName: string;
        tenantId: string;

        // NEW: Guest contact info (for non-authenticated users)
        guestEmail?: string;
        guestPhone?: string;
        isGuestOrder?: boolean; // True if placed without account

        items: CartItem[];
        total: number;
        status: 'Placed' | 'Preparing' | 'Ready for Collection' | 'Completed';
        orderType: 'takeaway' | 'dine-in' | 'delivery';
        tableNumber?: number;
        guestCount?: number;
        collectionTime: string;
        orderTime: string;
        rewardApplied?: {
          itemName: string;
          discountAmount: number;
        };
        paymentStatus?: 'pending' | 'paid' | 'refunded';
        paymentMethod?: string;
      }
      ```
  - [ ] 13.3 Implement anonymous auth flow in `/Users/clivestruver/Projects/restaurant-management-system/contexts/AuthContext.tsx`
    - Add function: `signInAnonymously(): Promise<void>`
      ```typescript
      const signInAnonymously = async () => {
        try {
          const result = await firebaseSignInAnonymously(auth);
          // User is now anonymously authenticated
          console.log('Anonymous user created:', result.user.uid);
        } catch (error) {
          console.error('Anonymous sign-in error:', error);
          throw error;
        }
      };
      ```
    - Export from AuthContext
    - Auto-sign in anonymously if user tries to place order without auth
  - [ ] 13.4 Update CartModal component in `/Users/clivestruver/Projects/restaurant-management-system/components/` (or wherever cart is located)
    - Check if user is authenticated: `const { user } = useAuth()`
    - If user is authenticated:
      - Pre-fill name and email from user profile
      - Hide phone field (or pre-fill if available)
    - If user is NOT authenticated (guest):
      - Show guest checkout fields:
        - Customer Name (text input, required)
        - Phone Number (tel input, required)
        - Email (email input, optional)
      - Add disclaimer: "You can create an account after placing your order to track it and earn rewards!"
  - [ ] 13.5 Update order placement logic
    - In CartModal submit handler:
      ```typescript
      const handlePlaceOrder = async () => {
        // If not authenticated, sign in anonymously first
        if (!user) {
          await signInAnonymously();
          // Wait for auth state to update
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error('Authentication error. Please try again.');
          return;
        }

        const orderData: Order = {
          userId: currentUser.uid,
          customerName: formData.customerName,
          tenantId: tenant.id,
          guestEmail: formData.guestEmail || undefined,
          guestPhone: formData.guestPhone || undefined,
          isGuestOrder: currentUser.isAnonymous,
          // ... rest of order fields
        };

        await placeOrder(tenantId, orderData);
      };
      ```
  - [ ] 13.6 Update Firestore Security Rules for guest orders
    - Allow anonymous users to create orders:
      ```javascript
      match /tenants/{tenantId}/orders/{orderId} {
        // Guest users (anonymous) can create orders
        allow create: if request.auth != null
                      && request.resource.data.userId == request.auth.uid
                      && request.resource.data.tenantId == tenantId;

        // Users can read their own orders
        allow read: if request.auth != null
                    && (resource.data.userId == request.auth.uid
                        || isAdminOrStaff(tenantId));

        // Admin/staff can update and delete
        allow update, delete: if isAdminOrStaff(tenantId);
      }
      ```
  - [ ] 13.7 Test guest checkout flow
    - Log out of any existing account
    - Add items to cart
    - Click "Place Order"
    - Fill in guest fields (name, phone, email)
    - Submit order
    - Verify order created in Firestore
    - Verify isGuestOrder = true
    - Verify userId is anonymous UID
  - [ ] 13.8 Run guest checkout tests
    - Run ONLY the 2-6 tests from 13.1
    - Verify anonymous auth works
    - Verify guest order creation works
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Tests from 13.1 pass (2-6 tests)
- Order interface updated with guest fields
- Anonymous auth flow works
- Guest can place order without account
- Order saved with correct guest data
- Security rules allow guest order creation

---

#### Task Group 14: Account Creation and Upgrade Flow
**Dependencies:** Task Group 13
**Effort:** 1.5 days
**Specialist:** Full-stack Engineer

- [ ] 14.0 Implement post-order account creation and guest account upgrade
  - [ ] 14.1 Write 2-6 focused tests for account upgrade
    - Test: Post-order prompt displays for guest orders
    - Test: Account creation form pre-fills email
    - Test: Account creation succeeds
    - Test: Guest orders linked to new account
    - Test: Skip account creation continues without error
    - Test: Returning user (already authenticated) doesn't see prompt
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/AccountUpgrade.tests.md`
  - [ ] 14.2 Create `AccountCreationPrompt.tsx` component in `/Users/clivestruver/Projects/restaurant-management-system/components/`
    - Props:
      ```typescript
      interface AccountCreationPromptProps {
        guestEmail?: string;
        onCreateAccount: () => void;
        onSkip: () => void;
      }
      ```
    - Layout: modal or card
    - Heading: "Want to track your order and earn rewards?"
    - Benefits list:
      - ✓ View order history
      - ✓ Earn loyalty points
      - ✓ Faster checkout next time
      - ✓ Manage reservations
    - Two buttons:
      - "Create Free Account" (primary)
      - "Maybe Later" (secondary)
    - Skippable - no forced account creation
  - [ ] 14.3 Show prompt after guest order placement
    - In order confirmation screen or CartModal success handler:
      ```typescript
      const { user } = useAuth();
      const [showAccountPrompt, setShowAccountPrompt] = useState(false);

      useEffect(() => {
        // Show prompt only for anonymous users (guests)
        if (user && user.isAnonymous && orderPlaced) {
          setShowAccountPrompt(true);
        }
      }, [user, orderPlaced]);
      ```
    - Render AccountCreationPrompt conditionally
  - [ ] 14.4 Create account creation form
    - Component: `AccountCreationForm.tsx` (or modal within prompt)
    - Fields:
      - Email (pre-filled from guestEmail, editable)
      - Password (password input, min 6 chars)
      - Confirm Password (password input, must match)
    - Validation:
      - Email required and valid format
      - Password min 6 characters
      - Passwords match
    - Submit button: "Create Account"
  - [ ] 14.5 Implement account upgrade function in AuthContext
    - Function: `upgradeAnonymousAccount(email: string, password: string): Promise<void>`
      ```typescript
      const upgradeAnonymousAccount = async (email: string, password: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser || !currentUser.isAnonymous) {
          throw new Error('No anonymous user to upgrade');
        }

        try {
          // Create email credential
          const credential = EmailAuthProvider.credential(email, password);

          // Link anonymous account to email/password
          await linkWithCredential(currentUser, credential);

          // Update user profile with email
          await updateProfile(currentUser, { displayName: email.split('@')[0] });

          console.log('Account upgraded successfully');
          toast.success('Account created! Welcome!');
        } catch (error) {
          console.error('Account upgrade error:', error);
          throw error;
        }
      };
      ```
    - Export from AuthContext
  - [ ] 14.6 Implement order linking logic
    - After account upgrade, all orders with userId = anonymous UID are now linked to permanent account
    - No additional code needed - userId remains the same, just auth method changes
    - Firestore automatically maintains link
    - Update user document if needed:
      ```typescript
      const linkGuestOrders = async (userId: string) => {
        // Optional: Update isGuestOrder flag to false
        const ordersRef = collection(db, `tenants/${tenantId}/orders`);
        const q = query(ordersRef, where('userId', '==', userId), where('isGuestOrder', '==', true));
        const snapshot = await getDocs(q);

        const updates = snapshot.docs.map(doc =>
          updateDoc(doc.ref, { isGuestOrder: false })
        );

        await Promise.all(updates);
      };
      ```
  - [ ] 14.7 Handle account creation flow
    - Submit handler in AccountCreationForm:
      ```typescript
      const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) return;

        try {
          setIsSubmitting(true);

          // Upgrade anonymous account
          await upgradeAnonymousAccount(formData.email, formData.password);

          // Link guest orders (optional)
          await linkGuestOrders(user!.uid);

          // Close prompt
          onCreateAccount();

          // Navigate to account page or show success message
          navigate('/account');
        } catch (error) {
          console.error('Account creation error:', error);
          toast.error('Failed to create account. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
      };
      ```
  - [ ] 14.8 Handle skip action
    - "Maybe Later" button closes prompt without action
    - User remains as anonymous
    - Can create account later from account page (future enhancement)
  - [ ] 14.9 Add "Sign In" option for existing users
    - In AccountCreationPrompt, add small text:
      - "Already have an account? Sign In"
    - Link to sign-in page
    - Sign-in page allows existing users to log in
  - [ ] 14.10 Run account upgrade tests
    - Run ONLY the 2-6 tests from 14.1
    - Verify prompt shows for guests
    - Verify account creation works
    - Verify orders linked correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Tests from 14.1 pass (2-6 tests)
- Prompt displays after guest order
- Account creation form works
- Anonymous account upgrades successfully
- Orders linked to new account
- Skip option works without errors
- Sign-in option available for existing users

---

### Phase 7: Testing & Integration

#### Task Group 15: Integration Testing and Bug Fixes
**Dependencies:** Task Group 14
**Effort:** 2 days
**Specialist:** QA Engineer / Full-stack Engineer

- [ ] 15.0 Comprehensive integration testing and bug fixes
  - [ ] 15.1 Write end-to-end test scenarios
    - Scenario 1: Complete landing page to order flow (normal customer)
      - Visit landing page
      - Click "Continue to Order"
      - Select "I'm here now"
      - Select "Eat In"
      - Browse menu (verify dine-in products only)
      - Add items to cart
      - Place order as guest
      - Verify order created
    - Scenario 2: QR code to order flow (table ordering)
      - Navigate to `/order?table=5`
      - Verify skip to menu
      - Verify table number badge displays
      - Verify dine-in products only
      - Place order
      - Verify order includes table number
    - Scenario 3: Reservation flow
      - Visit landing page
      - Click "Continue to Order"
      - Select "Book for later"
      - Fill reservation form
      - Submit reservation
      - Verify confirmation screen
      - Admin: verify reservation appears in ReservationManager
    - Scenario 4: Guest checkout to account creation
      - Place order as guest
      - See account creation prompt
      - Create account
      - Verify account created
      - Verify orders linked
    - Scenario 5: Admin configuration workflow
      - Admin: configure landing page branding
      - Admin: generate QR codes
      - Admin: configure product availability
      - Admin: manage reservations
      - Verify all changes reflected in customer view
    - Note: Create test documentation in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/E2EIntegration.tests.md`
  - [ ] 15.2 Cross-browser testing
    - Test on browsers:
      - Chrome (latest)
      - Safari (latest)
      - Firefox (latest)
      - Mobile Safari (iOS)
      - Mobile Chrome (Android)
    - Verify all flows work on each browser
    - Document browser-specific issues
  - [ ] 15.3 Mobile device testing
    - Test on devices:
      - iPhone (latest iOS)
      - Android phone (latest Android)
      - iPad (tablet)
    - Verify responsive design works
    - Verify touch interactions work
    - Verify QR code scanning works (use camera app)
  - [ ] 15.4 Edge case testing
    - Test scenarios:
      - No tables configured - verify QR manager shows message
      - No landing page configured - verify defaults display
      - Operating hours closed - verify reservation times filtered
      - All products unavailable for order type - verify empty menu message
      - Anonymous auth fails - verify error handling
      - Network offline - verify offline persistence works
      - Reservation at capacity - verify graceful handling (Phase 4 feature, just document)
  - [ ] 15.5 Performance testing
    - Measure metrics:
      - Landing page load time (target: <2 seconds)
      - QR code to menu time (target: <3 seconds)
      - Reservation form submission time (target: <1 second)
      - Menu rendering with 50+ products (target: <1 second)
    - Use Chrome DevTools Performance tab
    - Document slow areas
  - [ ] 15.6 Accessibility testing
    - Run axe DevTools or Lighthouse accessibility audit
    - Check:
      - All images have alt text
      - All form inputs have labels
      - Color contrast ratios meet WCAG AA (4.5:1)
      - Keyboard navigation works (tab through forms)
      - Focus indicators visible
      - Screen reader compatibility (NVDA/VoiceOver)
    - Fix critical issues
  - [ ] 15.7 Bug fixing
    - Create bug tracker (GitHub Issues or similar)
    - Log all bugs found during testing
    - Prioritize: P0 (blocking), P1 (high), P2 (medium), P3 (low)
    - Fix P0 and P1 bugs before deployment
    - Document P2/P3 bugs for future sprints
  - [ ] 15.8 Regression testing
    - Verify existing features still work:
      - Product management
      - Category management
      - Order placement (non-guest)
      - Kitchen display system
      - User invitation system
      - Loyalty rewards
    - No breaking changes
  - [ ] 15.9 Security testing
    - Verify Firestore rules:
      - Guest cannot read other users' orders
      - Guest cannot update reservation status
      - Admin cannot access other tenants' data
      - Public cannot write to settings
    - Test with different user roles (admin, staff, customer, guest)
    - Verify tenant isolation
  - [ ] 15.10 Create test summary report
    - Document:
      - Total tests run
      - Pass/fail rate
      - Bugs found and fixed
      - Outstanding issues
      - Performance metrics
      - Browser compatibility results
      - Accessibility score
    - Save in `/Users/clivestruver/Projects/restaurant-management-system/agent-os/specs/2025-10-26-customer-flow-redesign/planning/tests/TestingSummary.md`

**Acceptance Criteria:**
- All 5 E2E scenarios pass
- Cross-browser testing complete (5 browsers)
- Mobile testing complete (3 devices)
- Edge cases handled gracefully
- Performance targets met
- Accessibility score >90%
- P0 and P1 bugs fixed
- Regression tests pass
- Security rules verified
- Test summary report complete

---

### Phase 8: Deployment & Rollout

#### Task Group 16: Deployment and Production Rollout
**Dependencies:** Task Group 15
**Effort:** 1 day
**Specialist:** DevOps Engineer / Full-stack Engineer

- [ ] 16.0 Deploy to production and monitor rollout
  - [ ] 16.1 Pre-deployment checklist
    - [ ] All tests passing (unit, integration, E2E)
    - [ ] Code reviewed and approved
    - [ ] Documentation updated
    - [ ] Changelog created
    - [ ] Rollback plan documented
    - [ ] Monitoring dashboards configured
    - [ ] Team notified of deployment window
  - [ ] 16.2 Deploy Firestore Security Rules
    - Review changes in `/Users/clivestruver/Projects/restaurant-management-system/firestore.rules`
    - Test rules in Firebase Emulator first:
      ```bash
      firebase emulators:start --only firestore
      ```
    - Deploy to production:
      ```bash
      firebase deploy --only firestore:rules
      ```
    - Verify deployment in Firebase Console
    - Monitor Firestore logs for denied requests
  - [ ] 16.3 Deploy Firebase Storage Rules
    - Review changes in `/Users/clivestruver/Projects/restaurant-management-system/storage.rules`
    - Deploy to production:
      ```bash
      firebase deploy --only storage
      ```
    - Verify deployment in Firebase Console
    - Test image upload permissions
  - [ ] 16.4 Deploy Cloud Functions
    - Build functions:
      ```bash
      cd functions
      npm run build
      ```
    - Deploy auto-cancel function:
      ```bash
      firebase deploy --only functions:autoCancelNoShows
      ```
    - Verify deployment in Firebase Console
    - Check function logs for successful execution
    - Verify schedule is active (every 5 minutes)
  - [ ] 16.5 Build and deploy frontend
    - Run production build:
      ```bash
      npm run build
      ```
    - Verify build succeeds without errors
    - Test build locally:
      ```bash
      npm run preview
      ```
    - Deploy to hosting:
      ```bash
      firebase deploy --only hosting
      ```
    - Verify deployment in Firebase Console
    - Test deployed app at production URL
  - [ ] 16.6 Staged rollout (optional, if multi-tenant)
    - Option 1: Deploy to all tenants at once
    - Option 2: Staged rollout
      - Week 1: Deploy to 1-2 pilot tenants
      - Gather feedback
      - Fix critical bugs
      - Week 2: Deploy to all tenants
    - Document rollout strategy chosen
  - [ ] 16.7 Post-deployment verification
    - Smoke tests:
      - [ ] Landing page loads
      - [ ] QR code entry works
      - [ ] Reservation form submits
      - [ ] Guest checkout works
      - [ ] Admin can configure settings
      - [ ] Cloud Function executes successfully
    - Check production logs for errors
    - Monitor error rate in Firebase Console
  - [ ] 16.8 Monitor key metrics
    - Set up monitoring for:
      - Landing page load time (Google Analytics)
      - Reservation submission rate
      - Guest checkout conversion rate
      - QR code scan rate
      - Error rate (Firebase Crashlytics)
      - Function execution count and errors
    - Create dashboard in Firebase Console or external tool (Grafana, Datadog)
    - Set up alerts for critical errors
  - [ ] 16.9 User communication
    - Prepare announcement:
      - Email to all tenant admins
      - In-app notification (if applicable)
      - Blog post or changelog (if public-facing)
    - Content:
      - New features available
      - How to configure landing page
      - How to generate QR codes
      - How to manage reservations
      - Link to documentation
    - Send announcement after deployment verified stable
  - [ ] 16.10 Documentation and knowledge transfer
    - Update user documentation:
      - Admin guide: how to configure landing page
      - Admin guide: how to generate QR codes
      - Admin guide: how to manage reservations
      - Customer guide: how to use QR codes (optional)
    - Create video tutorials (optional):
      - Landing page setup
      - QR code generation
      - Reservation management
    - Save documentation in `/Users/clivestruver/Projects/restaurant-management-system/docs/`
  - [ ] 16.11 Rollback plan (if needed)
    - If critical issues arise:
      1. Revert Firestore rules:
         ```bash
         firebase deploy --only firestore:rules
         # (deploy previous version from git history)
         ```
      2. Disable Cloud Function:
         ```bash
         firebase functions:delete autoCancelNoShows
         ```
      3. Revert frontend build:
         ```bash
         firebase hosting:rollback
         ```
      4. Communicate downtime to users
      5. Fix issues in development
      6. Re-test thoroughly
      7. Re-deploy when stable
    - Document rollback steps in runbook
  - [ ] 16.12 Post-deployment review
    - Schedule review meeting 1 week after deployment
    - Review:
      - Deployment process (what went well, what didn't)
      - User feedback
      - Bug reports
      - Performance metrics
      - Feature adoption rates
    - Document lessons learned
    - Create follow-up tasks for improvements

**Acceptance Criteria:**
- All deployment steps completed successfully
- Firestore rules deployed and verified
- Cloud Function deployed and running
- Frontend deployed and accessible
- Smoke tests pass in production
- Monitoring dashboards configured
- User communication sent
- Documentation updated
- No critical errors in production
- Rollback plan documented

---

## Execution Order Summary

**Recommended implementation sequence:**

1. **Milestone 4: Reservation System** (Task Groups 8-11) - Week 2-3
   - Task Group 8: Reservation Data Layer (1.5 days)
   - Task Group 9: Reservation Form UI (2 days)
   - Task Group 10: Reservation Confirmation and Admin Management (2 days)
   - Task Group 11: Auto-Cancellation Cloud Function (1 day)

2. **Milestone 5: Menu Differentiation** (Task Group 12) - Week 3
   - Task Group 12: Product Availability Configuration (1 day)

3. **Milestone 6: Guest Checkout & Auth** (Task Groups 13-14) - Week 3-4
   - Task Group 13: Guest Checkout Flow (2 days)
   - Task Group 14: Account Creation and Upgrade Flow (1.5 days)

4. **Phase 7: Testing & Integration** (Task Group 15) - Week 4
   - Task Group 15: Integration Testing and Bug Fixes (2 days)

5. **Phase 8: Deployment & Rollout** (Task Group 16) - Week 4
   - Task Group 16: Deployment and Production Rollout (1 day)

**Total Estimated Timeline:** 12.5 days (approximately 2.5-3 weeks for Task Groups 8-16)

---

## Important Constraints

- **Test-driven approach**: Each task group starts with writing 2-6 focused tests
- **Test verification**: Run ONLY the newly written tests for each group, not entire suite
- **Mobile-first**: All UI components must be mobile-responsive
- **Backward compatibility**: Existing features must continue working
- **Tenant isolation**: All data must be properly scoped to tenants
- **Security**: All Firestore and Storage rules must enforce proper access control
- **Performance**: Meet performance targets (landing page <2s, QR to menu <3s)
- **Accessibility**: Meet WCAG AA standards for all new components

---

## Success Metrics

**Customer Experience:**
- Landing page loads in <2 seconds
- QR code to menu in <3 seconds
- Reservation form completable in <2 minutes
- Guest checkout requires <5 fields
- No forced account creation

**Technical:**
- All tests pass (unit, integration, E2E)
- Mobile-responsive on 3+ devices
- Cross-browser compatible (5 browsers)
- No breaking changes to existing features
- Security rules enforce tenant boundaries

**Business Impact:**
- 30% reduction in time-to-order for walk-ins
- 50% increase in table ordering adoption
- Reservation no-show rate <10%
- Guest checkout conversion >80%

---

**Document Status:** Ready for Implementation
**Last Updated:** October 26, 2025
**Task Groups Covered:** 8-16 (Milestones 4-6, Testing, Deployment)
**Next Steps:** Begin Task Group 8 (Reservation Data Layer)
