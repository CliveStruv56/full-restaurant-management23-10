# Customer Flow Redesign - Requirements Document

**Feature:** Customer Flow Redesign with Landing Pages, QR Codes, and Reservations
**Date:** October 26, 2025
**Status:** Requirements Gathering Complete - Ready for Spec Writing
**Phase:** Phase 3
**Effort:** XL (3-4 weeks)

---

## Executive Summary

This feature redesigns the entire customer journey from the moment they discover the restaurant to placing their order. It introduces tenant-branded landing pages, QR code-based table ordering, a reservation system, and clear differentiation between eat-in and takeaway flows.

**Key Objectives:**
1. Create a professional, branded first impression for each tenant
2. Streamline the ordering process based on customer intent (dining now vs. booking later)
3. Enable seamless table ordering via QR codes
4. Build a reservation system that captures essential details without complexity
5. Support different menu availability for dine-in vs. takeaway
6. Allow guest checkout without forcing account creation

---

## Detailed Requirements

### 1. Tenant-Branded Landing Pages

**Requirement:** Each tenant gets a customizable landing page as the entry point for customers.

**Scope:**
- **Per-Tenant Pages:** Each tenant has unique landing page at their subdomain (e.g., `demo-cafe.orderflow.app`)
- **Customizable Elements:**
  - Restaurant name (from tenant metadata)
  - Logo image (uploaded to Firebase Storage)
  - Hero image or background (uploaded to Firebase Storage)
  - Primary brand color (hex color picker)
  - Welcome message / tagline (text input, max 200 chars)
  - Operating hours display (auto-populated from settings)
  - Location/address (text input)
  - Contact information (phone, email)

**Admin Configuration:**
- New "Landing Page Settings" section in SettingsManager
- Image upload functionality for logo and hero image
- Color picker for brand color
- Text inputs for tagline, address, phone, email
- Preview functionality to see changes before saving
- Save to tenant settings in Firestore

**Landing Page Structure:**
```
┌─────────────────────────────────────┐
│          Logo / Brand Name           │
├─────────────────────────────────────┤
│         Hero Image / Banner          │
│       "Welcome to [Name]!"           │
│          [Tagline]                   │
├─────────────────────────────────────┤
│    Operating Hours: [Display]        │
│    Location: [Address]               │
│    Contact: [Phone/Email]            │
├─────────────────────────────────────┤
│   [Continue to Order] Button         │
└─────────────────────────────────────┘
```

**Technical Notes:**
- Landing page data stored in `tenants/{tenantId}/settings` document
- Images stored in Firebase Storage: `tenants/{tenantId}/branding/logo.png`, `hero.jpg`
- Use React component: `components/LandingPage.tsx`
- Mobile-responsive design (critical for mobile ordering)

---

### 2. Order Type Selection Flow

**Requirement:** After landing page, customers choose their ordering intent.

**Flow Option A (Selected):**
```
Landing Page
    ↓
"Are you here now or want to book for later?"
    ├─ "I'm here now / Arriving soon"
    │     ↓
    │  "Eat In or Take Away?"
    │     ├─ Eat In → [Menu with dine-in items]
    │     └─ Take Away → [Menu with takeaway items]
    │
    └─ "Book for Later"
           ↓
       Reservation Form
           ↓
       [Confirmation - No immediate ordering]
```

**UI Components:**
1. **Intent Selection Screen:**
   - Two large, friendly buttons:
     - "I'm Here Now / Arriving Soon" (e.g., green, inviting)
     - "Book for Later" (e.g., blue, calendar icon)
   - Clear, concise copy
   - Skip this screen if arrived via QR code (go straight to menu)

2. **Order Type Selection Screen (for "here now" flow):**
   - Two toggle buttons:
     - "Eat In" (🍽️ icon)
     - "Take Away" (📦 icon)
   - Contextual message: "Will you be dining with us or taking away?"
   - Skip this screen if arrived via QR code with table number (auto-select "Eat In")

**State Management:**
- Store customer intent in React state: `customerIntent: 'now' | 'later' | null`
- Store order type in state: `orderType: 'dine-in' | 'takeaway' | null`
- Pass to menu and cart components

---

### 3. QR Code Table Ordering System

**Requirement:** Each table has a unique QR code that bypasses landing page and pre-fills context.

**QR Code Generation:**
- Admin generates QR codes from admin panel
- Each QR encodes URL: `https://{tenant}.orderflow.app/order?table={tableNumber}`
- QR codes can be:
  - Downloaded as PNG images for printing
  - Printed on table tents/stands
  - Displayed on laminated cards

**QR Code Flow:**
```
Customer scans QR code
    ↓
App opens with table number pre-filled
    ↓
Skips landing page
    ↓
Skips intent selection (assumes "here now")
    ↓
Skips order type (auto-selects "Eat In")
    ↓
Goes directly to Menu with:
    - orderType = 'dine-in'
    - tableNumber = {from QR}
    - Shows dine-in menu items only
```

**Admin QR Management:**
- New "QR Codes" section in admin panel
- Shows list of tables with "Download QR Code" button for each
- Optionally: Bulk download all QR codes as ZIP
- Preview QR code before download

**Technical Implementation:**
- Use `qrcode.react` library for QR generation
- Route: `/order?table=X` detected in App.tsx
- Parse table number from URL query params
- Auto-populate order context state
- Skip navigation screens if table param present

---

### 4. Reservation System

**Requirement:** Customers can book a table for future date/time without ordering immediately.

**Reservation Form Fields:**
1. **Date** (required)
   - Date picker (future dates only, no past dates)
   - Respect restaurant operating hours and service periods

2. **Time** (required)
   - Time slot dropdown (15-minute intervals)
   - Generated based on service period settings (lunch, dinner)
   - Show available slots only

3. **Party Size** (required)
   - Number input (min: 1, max: configurable, default: 20)
   - Affects table availability calculation (future enhancement)

4. **Contact Details** (required)
   - Name (text input)
   - Phone number (tel input with validation)
   - Email (email input with validation)

5. **Table Preference** (optional)
   - Dropdown of available table numbers or "No Preference"
   - Note: "We'll do our best to accommodate your preference"

6. **Special Requests** (optional)
   - Textarea (max 500 chars)
   - Examples: "Window seat please", "Celebrating anniversary", "High chair needed"

**Reservation Flow:**
```
Customer selects "Book for Later"
    ↓
Fills reservation form
    ↓
Submits reservation
    ↓
Backend creates reservation document
    ↓
Confirmation screen with details
    ↓
(Optional) Confirmation email sent
    ↓
Customer arrives at restaurant
    ↓
Staff checks reservation in admin panel
    ↓
Customer orders at table (via QR or in-person)
```

**Important:** Reservations do NOT include pre-ordering. Customers order when they arrive.

**Reservation Status Workflow:**
- `pending` - Just created, awaiting staff confirmation
- `confirmed` - Staff confirmed the reservation
- `seated` - Customer arrived and seated
- `completed` - Service finished
- `cancelled` - Cancelled by customer or auto-cancelled
- `no-show` - Customer didn't arrive

**Auto-Cancellation Rules:**
- If customer doesn't arrive within 15 minutes of reservation time, status → `no-show`
- Automated via scheduled Cloud Function (runs every 5 minutes)

**Data Model:**
```typescript
interface Reservation {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour)
  partySize: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  tablePreference?: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Admin Management:**
- View list of reservations (filterable by date, status)
- Manually confirm/cancel reservations
- See contact details and special requests
- Mark as seated when customer arrives
- Mark as completed when service finished

---

### 5. Menu Differentiation by Order Type

**Requirement:** Different products available for dine-in vs. takeaway.

**Product Configuration:**
- Each product has new field: `availableFor: ('dine-in' | 'takeaway' | 'both')[]`
- Admin sets this when creating/editing products in ProductManager
- Default: `['both']` (available for all order types)

**Examples:**
- Coffee to-go with disposable cup: `['takeaway']`
- Dine-in ceramic mug coffee: `['dine-in']`
- Pastries: `['both']`
- Hot soup (not suitable for takeaway): `['dine-in']`

**Menu Filtering Logic:**
```typescript
const filteredProducts = products.filter(product => {
  if (!product.availableFor) return true; // Backward compatibility
  return product.availableFor.includes(currentOrderType);
});
```

**UI Updates:**
- ProductManager shows "Available For" field with checkboxes:
  - ☑️ Dine-In
  - ☑️ Takeaway
- Customer menu only shows products matching their selected order type
- If order type changes (unlikely but possible), menu re-filters

**Database Schema Update:**
```typescript
interface Product {
  // ... existing fields
  availableFor?: ('dine-in' | 'takeaway' | 'both')[];
}
```

---

### 6. Phase Scope and Priorities

**Requirement:** Focus on customer-facing flow first. Save complex admin features for later.

**IN SCOPE for Phase 3 (Customer Flow Redesign):**
- ✅ Landing page with branding
- ✅ Intent selection (now vs. later)
- ✅ Order type selection (eat in vs. takeaway)
- ✅ QR code generation and routing
- ✅ Reservation form and submission
- ✅ Admin reservation viewing
- ✅ Menu filtering by order type
- ✅ Product availability configuration
- ✅ Auto-cancellation of no-shows
- ✅ Guest checkout (no forced login)

**OUT OF SCOPE for Phase 3 (Deferred to Future):**
- ❌ Visual floor plan builder
- ❌ Smart table assignment algorithm
- ❌ Real-time table availability checking
- ❌ Table occupation status tracking (occupied, available, reserved)
- ❌ Drag-and-drop table editor
- ❌ Automatic table merging for large parties
- ❌ Waitlist management
- ❌ SMS reservation reminders (Twilio integration)
- ❌ Email reservation confirmations (SendGrid integration)

**Rationale:**
- Customer flow improvements provide immediate value
- Reservation system gets restaurants started quickly
- Advanced table management can be Phase 4+ based on feedback
- Avoid scope creep and over-engineering

---

### 7. Walk-In vs. Reservation Priority

**Requirement:** Simple rules for managing walk-ins and reservations without complex availability checks.

**Walk-In Handling:**
- **No real-time availability check** for walk-ins
- Customers who select "I'm here now" can always proceed to menu
- Staff manually manages table seating in the real world
- System assumes restaurant can accommodate walk-ins
- If full, staff communicates wait times in person

**Reservation Rules:**
- **15-Minute Grace Period:** Reservations auto-cancel if customer doesn't arrive within 15 mins of booking time
- Scheduled Cloud Function runs every 5 minutes:
  ```typescript
  // Pseudo-code
  const now = new Date();
  const reservations = await getReservations({ status: 'confirmed' });

  for (const res of reservations) {
    const reservationDateTime = new Date(`${res.date} ${res.time}`);
    const minutesPast = (now - reservationDateTime) / 60000;

    if (minutesPast > 15) {
      await updateReservation(res.id, { status: 'no-show' });
    }
  }
  ```

**Table Occupation Settings:**
- Admin configures "typical table occupation time" by service period and party size
- **Service Periods:**
  - Breakfast: 45 minutes
  - Lunch: 60 minutes
  - Dinner: 90 minutes
- **Party Size Modifiers:**
  - Solo (1 person): -15 minutes
  - Couple (2 people): base time
  - Small group (3-4): +15 minutes
  - Large group (5+): +30 minutes

**Example Calculation:**
- Dinner reservation for 5 people
- Base dinner time: 90 minutes
- Large group modifier: +30 minutes
- Expected occupation: 120 minutes (2 hours)

**Configuration UI:**
- New section in SettingsManager: "Table Occupation Times"
- Input fields for each service period
- Party size modifiers table
- Used for future availability calculations (Phase 4+)

**Phase 3 Implementation:**
- Store settings in Firestore
- **Do NOT** use for real-time availability yet
- Foundation for Phase 4 smart availability algorithm

---

### 8. Authentication Flow

**Requirement:** Flexible authentication that doesn't interrupt the ordering experience.

**Philosophy:** "Guest-first, account-optional"

**Guest Checkout:**
- Customers can complete entire order flow without creating account
- Required info captured in order form:
  - Name (for order identification)
  - Phone (for pickup notification)
  - Email (optional, for receipt)
- Order saved with `guestEmail` and `guestPhone` fields
- No password, no account, no friction

**Optional Account Creation:**
- **When:** After first order placement
- **Where:** Post-order confirmation screen
- **Prompt:** "Want to track your order and earn rewards? Create a free account!"
- **Benefits highlighted:**
  - Order history
  - Loyalty points
  - Faster checkout next time
  - Reservation management
- **Action:** "Create Account" button (optional, skippable)

**Account Creation Flow:**
```
Order placed as guest
    ↓
Confirmation screen shows
    ↓
[Optional] "Create Account" button
    ↓
If clicked:
    - Email already captured from order
    - Ask for password
    - Create Firebase Auth user
    - Link guest order to new user account
    ↓
Account created, user logged in
```

**Returning Customers:**
- **If logged in:** Name/email pre-filled, loyalty points visible
- **If guest:** Normal guest flow, option to "Sign In" in top nav

**Sign In / Sign Up Location:**
- Small "Sign In" link in header navigation
- Does NOT block ordering flow
- Separate screens for sign in and sign up
- Social auth supported (Google, Facebook) via Firebase Auth

**Technical Notes:**
- Use Firebase Anonymous Auth for guest checkout
- Upgrade anonymous user to permanent account when they sign up
- Link orders via `userId` field (null for guests, populated for accounts)
- Guest orders stored with `guestEmail` and `guestPhone` for tracking

---

## Implementation Milestones

### Milestone 1: Landing Page & Branding (Week 1)
- Create LandingPage component
- Admin settings UI for branding config
- Image upload to Firebase Storage
- Mobile-responsive design
- Preview functionality

### Milestone 2: Order Intent & Type Selection (Week 1-2)
- Intent selection screen ("Now" vs "Later")
- Order type selection screen ("Eat In" vs "Take Away")
- State management for customer journey
- Navigation flow logic
- Skip logic for QR code entries

### Milestone 3: QR Code System (Week 2)
- QR code generation utility
- Admin QR management UI
- Download functionality (individual & bulk)
- URL routing with table parameter
- Auto-population of order context

### Milestone 4: Reservation System (Week 2-3)
- Reservation form component
- Form validation
- Backend reservation creation
- Admin reservation list view
- Status management (pending, confirmed, etc.)
- Auto-cancellation Cloud Function

### Milestone 5: Menu Differentiation (Week 3)
- Update Product interface with availableFor
- Admin UI in ProductManager for availability settings
- Menu filtering logic by order type
- Migration script for existing products (default to 'both')

### Milestone 6: Guest Checkout & Auth (Week 3-4)
- Guest checkout flow
- Anonymous auth integration
- Post-order account creation prompt
- Account upgrade logic
- Sign in / sign up screens
- Social auth integration

---

## Success Criteria

**Customer Experience:**
- ✅ Professional landing page loads within 2 seconds
- ✅ Order intent clear within 2 clicks from landing
- ✅ QR code scan takes customer directly to menu in <3 seconds
- ✅ Reservation form completable in <2 minutes
- ✅ Guest checkout requires <5 fields
- ✅ No forced account creation

**Admin Experience:**
- ✅ Branding configured in <10 minutes
- ✅ QR codes downloadable in 1 click per table
- ✅ Reservations visible and manageable
- ✅ Product availability easily configured

**Technical:**
- ✅ Mobile-responsive design (90% of traffic is mobile)
- ✅ No breaking changes to existing functionality
- ✅ TypeScript compilation successful
- ✅ All routes accessible and functional
- ✅ Firestore security rules enforce tenant boundaries

**Business Impact:**
- ✅ 30% reduction in time-to-order for walk-ins
- ✅ 50% increase in table ordering adoption (via QR codes)
- ✅ Reservation no-show rate <10%
- ✅ Guest checkout conversion >80%

---

## Open Questions (Resolved)

All 8 clarifying questions answered:

1. ✅ **Landing Page Scope** - Per-tenant, fully customizable with logo, hero image, colors, tagline, hours, location, contact
2. ✅ **Order Type Flow** - Option A selected: Intent first ("Now" vs "Later"), then order type ("Eat In" vs "Take Away")
3. ✅ **QR Code System** - Unique per table, bypasses landing, pre-fills table number, auto-selects dine-in
4. ✅ **Reservations** - Capture date, time, party size, contact details, table preference, special requests - NO pre-ordering, order on arrival
5. ✅ **Menu Differentiation** - Products have `availableFor` field, admin selects per product, menu filters by order type
6. ✅ **Phase 3 Scope** - Focus on customer flow, defer advanced table management to Phase 4+
7. ✅ **Walk-In Priority** - No availability check for walk-ins, 15-min auto-cancel for no-shows, configurable occupation times stored but not used yet
8. ✅ **Authentication** - Guest-first checkout, optional account creation after first order, no forced login

---

## Dependencies

**External Services:**
- Firebase Authentication (already configured)
- Firebase Storage (for branding images)
- Firebase Cloud Functions (for auto-cancellation)

**Internal Dependencies:**
- Phase 2 complete (User Invitation, Offline Persistence, Dine-In Order Types) ✅
- Existing multi-tenant architecture ✅
- Existing product and category management ✅
- Existing order placement system ✅

**New Libraries:**
- `qrcode.react` - QR code generation
- `react-datepicker` or `date-fns` - Date/time pickers
- `libphonenumber-js` - Phone number validation

---

## Next Steps

1. ✅ Requirements gathering complete
2. ⏳ Run `/write-spec` to generate comprehensive specification
3. ⏳ Run `/create-tasks` to generate detailed task breakdown
4. ⏳ Begin implementation (Milestone 1: Landing Page)
5. ⏳ Iterative development and testing
6. ⏳ User acceptance testing with pilot tenant
7. ⏳ Production deployment

---

**Document Status:** ✅ COMPLETE - Ready for specification writing
**Last Updated:** October 26, 2025
**Next Action:** Run `/write-spec` command to generate detailed specification document
