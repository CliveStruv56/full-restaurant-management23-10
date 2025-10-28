# Specification: Customer Flow Redesign

**Feature:** Customer Flow Redesign with Landing Pages, QR Codes, and Reservations
**Date:** October 26, 2025
**Phase:** Phase 3
**Effort:** XL (3-4 weeks)
**Status:** Ready for Implementation

---

## Goal

Transform the customer journey from discovery to order placement by introducing tenant-branded landing pages, streamlined intent-based flows, QR code table ordering, and a reservation system. Enable guests to order without account creation while differentiating menus for dine-in versus takeaway service.

---

## User Stories

- As a **restaurant owner**, I want a customizable landing page so that customers see my brand when they discover my restaurant
- As a **customer**, I want to clearly indicate whether I'm dining now or booking later so that I get the right ordering flow
- As a **dine-in customer**, I want to scan a QR code at my table so that I can order immediately without extra navigation
- As a **customer**, I want to book a table for later so that I can secure my spot without ordering ahead
- As a **restaurant owner**, I want to configure which products are available for dine-in vs takeaway so that I can offer appropriate menus
- As a **customer**, I want to order as a guest so that I don't have to create an account to place my first order
- As a **restaurant owner**, I want automatic no-show cancellation so that I don't have to manually manage missed reservations

---

## Core Requirements

### 1. Tenant-Branded Landing Pages
- Each tenant has a customizable landing page as the entry point for customers
- Admins can configure: logo, hero image, brand color, tagline, operating hours, location, contact info
- Mobile-responsive design with fast load times (<2 seconds)
- "Continue to Order" button proceeds to intent selection

### 2. Order Intent & Type Selection
- Two-step flow: "I'm here now / Arriving soon" vs "Book for later"
- For "here now": Second screen asks "Eat In" vs "Take Away"
- QR code entries skip both screens and go directly to menu
- State management tracks customer journey throughout session

### 3. QR Code Table Ordering
- Generate unique QR codes per table in admin panel
- QR codes encode URL: `https://{tenant}.orderflow.app/order?table={tableNumber}`
- Downloadable as PNG images (individual or bulk ZIP)
- Scanning bypasses landing page, auto-selects dine-in, pre-fills table number

### 4. Reservation System
- Capture: date, time, party size, contact details (name, phone, email)
- Optional: table preference, special requests
- No pre-ordering - customers order when they arrive
- Admin can view, confirm, cancel, mark as seated/completed
- Auto-cancellation after 15-minute grace period via Cloud Function

### 5. Menu Differentiation by Order Type
- Products have `availableFor` field: `['dine-in', 'takeaway', 'both']`
- Admin configures per product in ProductManager
- Menu automatically filters based on customer's selected order type
- Default to `['both']` for backward compatibility

### 6. Guest Checkout
- Complete order flow without account creation
- Capture name, phone, email in order form
- Optional account creation prompt after first order
- Firebase Anonymous Auth for guest sessions
- Account upgrade flow links guest orders to new account

### 7. Table Occupation Settings (Foundation)
- Admin configures typical occupation times by service period (breakfast, lunch, dinner)
- Party size modifiers adjust base times
- Stored in Firestore but NOT used for real-time availability in Phase 3
- Foundation for Phase 4 smart availability algorithm

---

## Visual Design

### Landing Page Layout
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

### Intent Selection Screen
- Two large, friendly buttons with icons
- "I'm Here Now / Arriving Soon" (green, inviting)
- "Book for Later" (blue, calendar icon)
- Clear, concise copy

### Order Type Selection Screen
- Two toggle buttons: "Eat In" (plate icon) vs "Take Away" (box icon)
- Contextual message: "Will you be dining with us or taking away?"

### Mobile-First Design
- 90% of traffic is mobile - prioritize mobile experience
- Touch-friendly button sizes (minimum 44x44px)
- Fast image loading with lazy loading for hero images
- Responsive breakpoints: 320px, 768px, 1024px

---

## Reusable Components

### Existing Code to Leverage

**Authentication & User Management:**
- `contexts/AuthContext.tsx` - Already supports Firebase Auth, multi-tenant memberships
- `useAuth()` hook - Provides user, login, signup, logout functions
- Anonymous auth support via `signInWithCustomToken()` for guest checkout

**Multi-Tenant Architecture:**
- `contexts/TenantContext.tsx` - Tenant isolation already implemented
- `useTenant()` hook - Provides current tenant context
- Firestore structure: `tenants/{tenantId}/...` for all tenant data

**State Management Patterns:**
- React useState/useEffect for local component state
- Context API for cross-component state (Auth, Tenant)
- Real-time Firestore subscriptions via `stream*` functions in `firebase/api-multitenant.ts`

**UI Components:**
- Modal pattern from `CartModal.tsx` - Overlay with close button, form actions
- Form patterns from `SettingsManager.tsx` - Form groups, validation, save feedback
- Image upload from `ImagePicker.tsx` - Firebase Storage integration, grid layout
- Toggle switch from `SettingsManager.tsx` - Custom styled toggle component

**Firebase Integration:**
- `firebase/config.ts` - Already configured: Firestore, Auth, Storage, Functions
- `firebase/api-multitenant.ts` - Tenant-scoped CRUD operations
- Offline persistence enabled with `enableIndexedDbPersistence()`
- Storage already configured for image uploads

**Routing Patterns:**
- URL parsing in `App.tsx` - Detects paths like `/signup/{token}`, `/register`
- Query parameter handling for special flows (can extend for `?table={number}`)

### New Components Required

**Customer-Facing Components:**
- `LandingPage.tsx` - Branded entry point (doesn't exist yet)
- `IntentSelection.tsx` - "Now" vs "Later" flow (new component)
- `OrderTypeSelection.tsx` - "Eat In" vs "Take Away" (new component)
- `ReservationForm.tsx` - Booking form with validation (new component)
- `ReservationConfirmation.tsx` - Post-booking confirmation screen (new component)

**Admin Components:**
- `QRCodeManager.tsx` - QR generation and download UI (new component)
- `ReservationManager.tsx` - View and manage reservations (new component)
- `LandingPageSettings.tsx` - Configure branding (new admin section)
- `TableOccupationSettings.tsx` - Configure occupation times (new admin section)

**Why New Code is Needed:**
- Landing page is a new customer entry point with branding requirements
- Intent/order type selection is a new navigation flow not in current app
- QR code generation requires new library (`qrcode.react`) and download logic
- Reservation system is an entirely new feature domain
- Guest checkout requires anonymous auth flow not currently implemented

---

## Technical Approach

### Architecture Overview

```
Customer Journey Flow:
┌─────────────┐
│ Landing Page│
└──────┬──────┘
       │
       ├─> QR Code Scan? ──> Skip to Menu (dine-in, table pre-filled)
       │
       └─> Intent Selection
           │
           ├─> "Here Now" ──> Order Type Selection ──> Menu
           │
           └─> "Book Later" ──> Reservation Form ──> Confirmation
```

### State Management Strategy

**Customer Journey State (React Context):**
```typescript
interface CustomerJourneyState {
  entryPoint: 'landing' | 'qr-code' | 'direct';
  customerIntent: 'now' | 'later' | null;
  orderType: 'dine-in' | 'takeaway' | null;
  tableNumber?: number;
}
```

Store in `CustomerJourneyContext.tsx` with provider wrapping customer-facing app.

**Navigation Logic:**
- If `?table={number}` in URL: Set `entryPoint='qr-code'`, `customerIntent='now'`, `orderType='dine-in'`, `tableNumber={number}`, skip to menu
- If landing page entry: Show landing page -> intent selection
- If intent is "later": Show reservation form
- If intent is "now": Show order type selection -> menu

### Routing Updates

**New Routes in `App.tsx`:**
```typescript
const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);

// Check for QR code entry
const tableNumber = params.get('table');
const isQRCodeEntry = path === '/order' && tableNumber;

// Check for reservation confirmation
const isReservationConfirmation = path === '/reservation/confirmed';
```

**Route Handling:**
- `/` - Landing page (if not logged in or customer role)
- `/order?table={number}` - QR code entry, skip to menu
- `/reservation/confirmed` - Reservation confirmation page
- Existing routes: `/signup/{token}`, `/register`, admin routes

### Component Hierarchy

```
App
├─ AuthProvider
│  ├─ TenantProvider
│  │  ├─ CustomerJourneyProvider (NEW)
│  │  │  ├─ LandingPage (NEW)
│  │  │  ├─ IntentSelection (NEW)
│  │  │  ├─ OrderTypeSelection (NEW)
│  │  │  ├─ ReservationFlow (NEW)
│  │  │  │  ├─ ReservationForm
│  │  │  │  └─ ReservationConfirmation
│  │  │  └─ CustomerApp (Existing - Menu/Cart/Order)
│  │  └─ AdminPanel
│  │     ├─ LandingPageSettings (NEW)
│  │     ├─ QRCodeManager (NEW)
│  │     ├─ ReservationManager (NEW)
│  │     └─ TableOccupationSettings (NEW)
```

---

## Data Models

### Updated TypeScript Interfaces

#### Reservation (NEW)

```typescript
interface Reservation {
  id: string; // Auto-generated Firestore ID
  tenantId: string; // Tenant isolation

  // Booking details
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm 24-hour format (e.g., "19:00")
  partySize: number; // Number of guests

  // Contact information
  contactName: string;
  contactPhone: string; // Format: +1234567890 (validated)
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

**Firestore Path:** `tenants/{tenantId}/reservations/{reservationId}`

**Indexes Required:**
```
Collection: reservations
Fields: tenantId (Ascending), date (Ascending), status (Ascending)
```

#### Product (UPDATED)

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

**Migration Strategy:**
- Existing products without `availableFor` default to `['both']` via code logic
- No data migration script needed - backward compatible
- Admin UI adds checkboxes to set this field

#### AppSettings (UPDATED)

```typescript
interface AppSettings {
  // ... existing fields ...

  // NEW: Landing page branding
  landingPage?: {
    logoUrl?: string; // Firebase Storage URL
    heroImageUrl?: string; // Firebase Storage URL
    primaryColor?: string; // Hex color (e.g., "#3498db")
    tagline?: string; // Max 200 chars
    address?: string;
    phone?: string;
    email?: string;
  };

  // NEW: Table occupation times (foundation for Phase 4)
  tableOccupation?: {
    servicePeriods: {
      breakfast: number; // minutes (default: 45)
      lunch: number; // minutes (default: 60)
      dinner: number; // minutes (default: 90)
    };
    partySizeModifiers: {
      solo: number; // minutes offset (default: -15)
      couple: number; // minutes offset (default: 0)
      smallGroup: number; // minutes offset (default: +15)
      largeGroup: number; // minutes offset (default: +30)
    };
  };

  // Existing fields
  weekSchedule: { ... };
  slotDuration: number;
  storeOpen: boolean;
  maxDaysInAdvance: number;
  maxOrdersPerSlot: number;
  minLeadTimeMinutes: number;
  openingBufferMinutes: number;
  closingBufferMinutes: number;
  currency: 'USD' | 'GBP' | 'EUR';
  loyaltyEnabled: boolean;
  pointsPerDollar: number;
  pointsToReward: number;
  availableTables?: number[];
}
```

**Storage Paths for Images:**
- Logo: `tenants/{tenantId}/branding/logo.png`
- Hero: `tenants/{tenantId}/branding/hero.jpg`

#### Order (UPDATED - Guest Support)

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

---

## API Specifications

### Firestore CRUD Operations (New)

#### Reservations

**Create Reservation:**
```typescript
async function createReservation(
  tenantId: string,
  reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const reservationsRef = collection(db, `tenants/${tenantId}/reservations`);
  const docRef = await addDoc(reservationsRef, {
    ...reservationData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}
```

**Update Reservation Status:**
```typescript
async function updateReservationStatus(
  tenantId: string,
  reservationId: string,
  status: Reservation['status'],
  adminNotes?: string
): Promise<void> {
  const reservationRef = doc(db, `tenants/${tenantId}/reservations/${reservationId}`);
  await updateDoc(reservationRef, {
    status,
    adminNotes,
    updatedAt: serverTimestamp(),
  });
}
```

**Stream Reservations (Real-time):**
```typescript
function streamReservations(
  tenantId: string,
  filters: { date?: string; status?: string },
  callback: (reservations: Reservation[]) => void
): () => void {
  let q = query(
    collection(db, `tenants/${tenantId}/reservations`),
    where('tenantId', '==', tenantId),
    orderBy('date', 'desc'),
    orderBy('time', 'asc')
  );

  if (filters.date) {
    q = query(q, where('date', '==', filters.date));
  }
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }

  return onSnapshot(q, (snapshot) => {
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Reservation[];
    callback(reservations);
  });
}
```

#### Landing Page Settings

**Update Landing Page Settings:**
```typescript
async function updateLandingPageSettings(
  tenantId: string,
  settings: AppSettings['landingPage']
): Promise<void> {
  const settingsRef = doc(db, `tenants/${tenantId}/settings`, 'appSettings');
  await updateDoc(settingsRef, {
    'landingPage': settings,
  });
}
```

**Upload Branding Image:**
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function uploadBrandingImage(
  tenantId: string,
  file: File,
  type: 'logo' | 'hero'
): Promise<string> {
  const extension = file.name.split('.').pop();
  const fileName = `${type}.${extension}`;
  const storageRef = ref(storage, `tenants/${tenantId}/branding/${fileName}`);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
```

### Cloud Functions (NEW)

#### Auto-Cancel No-Show Reservations

**Function Trigger:** Scheduled (runs every 5 minutes)

**Function Code (Firebase Functions v2):**
```typescript
// functions/src/scheduledJobs.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const autoCancelNoShows = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
  },
  async (event) => {
    const db = getFirestore();
    const now = new Date();

    // Query all confirmed reservations
    const reservationsSnapshot = await db
      .collectionGroup('reservations')
      .where('status', '==', 'confirmed')
      .get();

    const updates: Promise<any>[] = [];

    for (const doc of reservationsSnapshot.docs) {
      const reservation = doc.data() as Reservation;

      // Parse reservation datetime
      const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);

      // Calculate minutes past reservation time
      const minutesPast = (now.getTime() - reservationDateTime.getTime()) / 60000;

      // Auto-cancel if more than 15 minutes past
      if (minutesPast > 15) {
        console.log(`Auto-cancelling no-show reservation ${doc.id}`);
        updates.push(
          doc.ref.update({
            status: 'no-show',
            updatedAt: Timestamp.now(),
            adminNotes: `Auto-cancelled: ${minutesPast.toFixed(0)} minutes past reservation time`,
          })
        );
      }
    }

    await Promise.all(updates);
    console.log(`Processed ${reservationsSnapshot.size} reservations, cancelled ${updates.length}`);
  }
);
```

**Deployment:**
```bash
firebase deploy --only functions:autoCancelNoShows
```

---

## UI/UX Specifications

### Screen Flows

#### Flow 1: Landing Page Entry (Normal Customer)

```
1. Customer visits https://demo-cafe.orderflow.app/
   - Show: LandingPage component
   - Display: Logo, hero image, tagline, hours, location, contact
   - Action: "Continue to Order" button

2. Click "Continue to Order"
   - Navigate to: IntentSelection component
   - Display: "I'm here now" vs "Book for later" buttons

3a. Select "I'm here now"
    - Navigate to: OrderTypeSelection component
    - Display: "Eat In" vs "Take Away" buttons

3b. Select "Book for later"
    - Navigate to: ReservationForm component
    - Display: Date, time, party size, contact form

4a. Select order type (Eat In or Take Away)
    - Navigate to: MenuScreen (existing)
    - Filter menu by selected order type

4b. Complete reservation form
    - Submit reservation to Firestore
    - Navigate to: ReservationConfirmation component
    - Display: Confirmation message, reservation details
```

#### Flow 2: QR Code Entry (Table Ordering)

```
1. Customer scans QR code at table
   - URL: https://demo-cafe.orderflow.app/order?table=5
   - Parse: tableNumber=5

2. App detects QR code entry
   - Skip: LandingPage, IntentSelection, OrderTypeSelection
   - Set state: orderType='dine-in', tableNumber=5
   - Navigate to: MenuScreen (existing)
   - Display: Filtered dine-in menu with table number badge
```

#### Flow 3: Guest Checkout

```
1. Customer adds items to cart (normal flow)
   - Display: Cart with items

2. Click "Place Order" in CartModal
   - Check: Is user authenticated?
   - If NO: Show guest checkout fields in cart modal
     - Fields: Name, Phone, Email (optional)
   - If YES: Pre-fill with user data

3. Submit order
   - Create anonymous Firebase Auth user if guest
   - Save order with userId = anonymous UID
   - Set: isGuestOrder=true, guestEmail, guestPhone

4. Order confirmation screen
   - Display: Order details, order number
   - If guest: Show "Create Account" prompt (optional)
     - "Want to track orders and earn rewards?"
     - Button: "Create Account" (skippable)

5. If "Create Account" clicked
   - Show: Account creation form (email pre-filled, ask for password)
   - Create permanent account
   - Upgrade anonymous user to permanent user
   - Link guest orders to new account
```

### Component Specifications

#### LandingPage Component

**File:** `components/LandingPage.tsx`

**Props:**
```typescript
interface LandingPageProps {
  onContinue: () => void;
}
```

**Layout:**
- Full-screen (100vh) container
- Hero section: Background image with overlay, logo centered, tagline
- Info section: Grid layout for hours, location, contact (responsive: 1 column mobile, 3 columns desktop)
- CTA button: Large, centered, primary color, "Continue to Order"

**Styling:**
- Mobile-first responsive design
- Hero image: `object-fit: cover`, lazy loading
- Logo: Max height 80px mobile, 120px desktop
- Font: Tagline in larger font (24px mobile, 36px desktop)
- Spacing: Generous padding (20px mobile, 40px desktop)

**Data Source:**
- Fetch from `AppSettings.landingPage`
- Fallback: Default values if not configured

**Example JSX Structure:**
```tsx
<div style={styles.landingPageContainer}>
  <section style={styles.heroSection}>
    <img src={logoUrl} alt="Logo" style={styles.logo} />
    <h1 style={styles.heroTitle}>Welcome to {businessName}!</h1>
    <p style={styles.tagline}>{tagline}</p>
  </section>

  <section style={styles.infoSection}>
    <div style={styles.infoCard}>
      <h3>Hours</h3>
      <p>{formattedHours}</p>
    </div>
    <div style={styles.infoCard}>
      <h3>Location</h3>
      <p>{address}</p>
    </div>
    <div style={styles.infoCard}>
      <h3>Contact</h3>
      <p>{phone}</p>
      <p>{email}</p>
    </div>
  </section>

  <button style={styles.ctaButton} onClick={onContinue}>
    Continue to Order
  </button>
</div>
```

#### IntentSelection Component

**File:** `components/IntentSelection.tsx`

**Props:**
```typescript
interface IntentSelectionProps {
  onSelectIntent: (intent: 'now' | 'later') => void;
}
```

**Layout:**
- Centered container, max-width 600px
- Heading: "How can we serve you today?"
- Two large buttons (min 120px height), stacked on mobile, side-by-side on desktop
- Icons: Clock icon for "now", calendar icon for "later"

**Styling:**
- Buttons: Large touch targets, rounded corners, icon + text
- "Here Now" button: Green (#2ecc71) background
- "Book Later" button: Blue (#3498db) background
- Hover: Slight scale transform (1.05x)

**Example JSX Structure:**
```tsx
<div style={styles.intentContainer}>
  <h2 style={styles.intentHeading}>How can we serve you today?</h2>
  <div style={styles.intentButtonGrid}>
    <button style={styles.intentButtonNow} onClick={() => onSelectIntent('now')}>
      <span style={styles.intentIcon}>🕐</span>
      <span style={styles.intentText}>I'm Here Now</span>
      <span style={styles.intentSubtext}>Order for pickup or dine-in</span>
    </button>
    <button style={styles.intentButtonLater} onClick={() => onSelectIntent('later')}>
      <span style={styles.intentIcon}>📅</span>
      <span style={styles.intentText}>Book for Later</span>
      <span style={styles.intentSubtext}>Reserve a table</span>
    </button>
  </div>
</div>
```

#### OrderTypeSelection Component

**File:** `components/OrderTypeSelection.tsx`

**Props:**
```typescript
interface OrderTypeSelectionProps {
  onSelectType: (type: 'dine-in' | 'takeaway') => void;
}
```

**Layout:**
- Similar to IntentSelection but with "Eat In" vs "Take Away"
- Heading: "Will you be dining with us or taking away?"
- Two buttons with plate/box icons

**Validation:**
- None required - simple navigation

#### ReservationForm Component

**File:** `components/ReservationForm.tsx`

**Props:**
```typescript
interface ReservationFormProps {
  onSubmit: (reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'status'>) => Promise<void>;
  onCancel: () => void;
  availableTables: number[];
}
```

**Form Fields:**
1. **Date Picker** (required)
   - Library: `react-datepicker` or native HTML5 date input
   - Min date: Today
   - Max date: Today + 30 days (configurable)
   - Disabled dates: Respect operating hours from AppSettings

2. **Time Picker** (required)
   - Dropdown of 15-minute intervals
   - Filtered by service period settings
   - Only show times within operating hours

3. **Party Size** (required)
   - Number input, min: 1, max: 20
   - Step: 1

4. **Contact Name** (required)
   - Text input, max 100 chars

5. **Phone Number** (required)
   - Tel input with format validation
   - Library: `libphonenumber-js`
   - Format: E.164 (e.g., +1234567890)

6. **Email** (required)
   - Email input with HTML5 validation
   - Format: Standard email regex

7. **Table Preference** (optional)
   - Dropdown of available tables + "No Preference"
   - Default: "No Preference"

8. **Special Requests** (optional)
   - Textarea, max 500 chars
   - Placeholder: "High chair needed, window seat preferred, etc."

**Validation Rules:**
```typescript
const validationRules = {
  date: (value: string) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today ? null : 'Date must be today or future';
  },
  time: (value: string) => value ? null : 'Time is required',
  partySize: (value: number) => {
    if (value < 1) return 'Party size must be at least 1';
    if (value > 20) return 'Party size cannot exceed 20';
    return null;
  },
  contactName: (value: string) => value.trim() ? null : 'Name is required',
  contactPhone: (value: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(value) ? null : 'Invalid phone number';
  },
  contactEmail: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email address';
  },
};
```

**Submit Handler:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate all fields
  const errors = validateForm(formData);
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  // Show loading state
  setIsSubmitting(true);

  try {
    await onSubmit({
      date: formData.date,
      time: formData.time,
      partySize: formData.partySize,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      tablePreference: formData.tablePreference,
      specialRequests: formData.specialRequests,
      status: 'pending',
    });

    // Success handled by parent (navigation to confirmation)
  } catch (error) {
    toast.error('Failed to create reservation. Please try again.');
    setIsSubmitting(false);
  }
};
```

#### QRCodeManager Component (Admin)

**File:** `components/admin/QRCodeManager.tsx`

**Props:**
```typescript
interface QRCodeManagerProps {
  availableTables: number[];
}
```

**Layout:**
- Header: "QR Code Generator"
- Table list with "Download QR" button per table
- Bulk actions: "Download All as ZIP"

**QR Generation:**
```typescript
import QRCode from 'qrcode.react';

const generateQRCodeURL = (tableNumber: number) => {
  const subdomain = tenant.subdomain;
  return `https://${subdomain}.orderflow.app/order?table=${tableNumber}`;
};

// Render QR code
<QRCode value={generateQRCodeURL(tableNumber)} size={256} />

// Download as PNG
const downloadQRCode = (tableNumber: number) => {
  const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = `table-${tableNumber}-qr.png`;
  link.click();
};
```

**Bulk Download (ZIP):**
```typescript
import JSZip from 'jszip';

const downloadAllQRCodes = async () => {
  const zip = new JSZip();

  for (const tableNumber of availableTables) {
    const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    zip.file(`table-${tableNumber}-qr.png`, base64, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'qr-codes.zip';
  link.click();
};
```

#### ReservationManager Component (Admin)

**File:** `components/admin/ReservationManager.tsx`

**Features:**
- Real-time reservation list (using `streamReservations`)
- Filters: Date picker, status dropdown
- Table view: Date, time, party size, name, phone, status
- Actions per row: Confirm, Cancel, Mark Seated, Mark Completed
- Modal for viewing full details (special requests, admin notes)

**Table Columns:**
```
| Date       | Time  | Party Size | Contact Name | Phone       | Status    | Actions         |
|------------|-------|------------|--------------|-------------|-----------|-----------------|
| 2025-10-27 | 19:00 | 4          | John Doe     | +1234567890 | Confirmed | [View][Cancel]  |
```

**Status Badge Colors:**
- Pending: Yellow (#ffc107)
- Confirmed: Green (#28a745)
- Seated: Blue (#007bff)
- Completed: Gray (#6c757d)
- Cancelled: Red (#dc3545)
- No-show: Dark red (#bd2130)

---

## State Management

### Customer Journey Context

**File:** `contexts/CustomerJourneyContext.tsx`

```typescript
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomerJourneyState {
  entryPoint: 'landing' | 'qr-code' | 'direct';
  customerIntent: 'now' | 'later' | null;
  orderType: 'dine-in' | 'takeaway' | null;
  tableNumber?: number;
}

interface CustomerJourneyContextType {
  journey: CustomerJourneyState;
  setIntent: (intent: 'now' | 'later') => void;
  setOrderType: (type: 'dine-in' | 'takeaway') => void;
  setTableNumber: (number: number) => void;
  resetJourney: () => void;
}

const CustomerJourneyContext = createContext<CustomerJourneyContextType | undefined>(undefined);

export const CustomerJourneyProvider = ({ children }: { children: ReactNode }) => {
  const [journey, setJourney] = useState<CustomerJourneyState>({
    entryPoint: 'landing',
    customerIntent: null,
    orderType: null,
  });

  const setIntent = (intent: 'now' | 'later') => {
    setJourney(prev => ({ ...prev, customerIntent: intent }));
  };

  const setOrderType = (type: 'dine-in' | 'takeaway') => {
    setJourney(prev => ({ ...prev, orderType: type }));
  };

  const setTableNumber = (number: number) => {
    setJourney(prev => ({
      ...prev,
      entryPoint: 'qr-code',
      customerIntent: 'now',
      orderType: 'dine-in',
      tableNumber: number,
    }));
  };

  const resetJourney = () => {
    setJourney({
      entryPoint: 'landing',
      customerIntent: null,
      orderType: null,
    });
  };

  return (
    <CustomerJourneyContext.Provider value={{ journey, setIntent, setOrderType, setTableNumber, resetJourney }}>
      {children}
    </CustomerJourneyContext.Provider>
  );
};

export const useCustomerJourney = () => {
  const context = useContext(CustomerJourneyContext);
  if (!context) throw new Error('useCustomerJourney must be used within CustomerJourneyProvider');
  return context;
};
```

### Navigation Logic in App.tsx

```typescript
// In App.tsx, parse URL and set journey state

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tableNumber = params.get('table');

  if (tableNumber) {
    // QR code entry
    setTableNumber(parseInt(tableNumber, 10));
  }
}, []);

// Conditional rendering based on journey state
const renderCustomerFlow = () => {
  const { journey } = useCustomerJourney();

  // QR code entry: Skip to menu
  if (journey.entryPoint === 'qr-code') {
    return <CustomerApp />;
  }

  // No intent selected: Show landing page or intent selection
  if (!journey.customerIntent) {
    return <LandingPage onContinue={() => navigate to intent selection} />;
  }

  // Intent is "later": Show reservation flow
  if (journey.customerIntent === 'later') {
    return <ReservationFlow />;
  }

  // Intent is "now" but no order type: Show order type selection
  if (!journey.orderType) {
    return <OrderTypeSelection onSelectType={setOrderType} />;
  }

  // Order type selected: Show menu
  return <CustomerApp />;
};
```

---

## Security & Validation

### Firestore Security Rules Updates

**File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... existing rules ...

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

    // Updated products rule: Allow availableFor field
    match /tenants/{tenantId}/products/{productId} {
      allow read: if true; // Public read
      allow write: if isAdmin(tenantId);
    }

    // Updated settings rule: Allow landingPage and tableOccupation fields
    match /tenants/{tenantId}/settings/{settingId} {
      allow read: if true; // Public read for landing page
      allow write: if isAdmin(tenantId);
    }

    // Helper functions
    function isAdmin(tenantId) {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships[tenantId].role == 'admin';
    }

    function isAdminOrStaff(tenantId) {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantMemberships[tenantId].role in ['admin', 'staff'];
    }
  }
}
```

### Storage Security Rules

**File:** `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Branding images: Admin can upload, public can read
    match /tenants/{tenantId}/branding/{imageFile} {
      allow read: if true;
      allow write: if request.auth != null
                   && isAdmin(tenantId)
                   && request.resource.size < 5 * 1024 * 1024 // Max 5MB
                   && request.resource.contentType.matches('image/.*');
    }

    // ... existing rules for product images ...
  }

  function isAdmin(tenantId) {
    // Note: Storage rules can't access Firestore directly
    // Rely on client-side enforcement + server-side validation
    return request.auth != null;
  }
}
```

### Form Validation Summary

| Field | Validation | Error Message |
|-------|------------|---------------|
| Date | Future date only | "Date must be today or in the future" |
| Time | Required, within operating hours | "Please select a valid time" |
| Party Size | 1-20 | "Party size must be between 1 and 20" |
| Contact Name | Required, max 100 chars | "Name is required" |
| Phone | E.164 format | "Invalid phone number format" |
| Email | RFC 5322 format | "Invalid email address" |
| Special Requests | Max 500 chars | "Requests cannot exceed 500 characters" |

---

## Testing Strategy

### Unit Tests

**Test Files:**
- `contexts/CustomerJourneyContext.test.tsx`
- `components/ReservationForm.test.tsx`
- `components/IntentSelection.test.tsx`
- `components/OrderTypeSelection.test.tsx`
- `utils/qrCodeGeneration.test.ts`

**Example Test: ReservationForm Validation**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ReservationForm } from './ReservationForm';

describe('ReservationForm', () => {
  it('should show error for past date', () => {
    render(<ReservationForm onSubmit={jest.fn()} onCancel={jest.fn()} availableTables={[1,2,3]} />);

    const dateInput = screen.getByLabelText('Date');
    fireEvent.change(dateInput, { target: { value: '2025-10-20' } }); // Past date
    fireEvent.blur(dateInput);

    expect(screen.getByText('Date must be today or in the future')).toBeInTheDocument();
  });

  it('should show error for invalid phone number', () => {
    render(<ReservationForm onSubmit={jest.fn()} onCancel={jest.fn()} availableTables={[1,2,3]} />);

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: 'invalid' } });
    fireEvent.blur(phoneInput);

    expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
  });

  it('should submit valid reservation', async () => {
    const onSubmit = jest.fn();
    render(<ReservationForm onSubmit={onSubmit} onCancel={jest.fn()} availableTables={[1,2,3]} />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-10-27' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '19:00' } });
    fireEvent.change(screen.getByLabelText('Party Size'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@example.com' } });

    fireEvent.click(screen.getByText('Submit Reservation'));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      date: '2025-10-27',
      time: '19:00',
      partySize: 4,
      contactName: 'John Doe',
      contactPhone: '+1234567890',
      contactEmail: 'john@example.com',
    }));
  });
});
```

### Integration Tests

**Test Scenarios:**
1. **QR Code Flow:** Scan QR -> Navigate to menu -> Place order -> Verify table number in order
2. **Reservation Flow:** Landing page -> Book later -> Fill form -> Submit -> Verify Firestore document
3. **Guest Checkout:** Add to cart -> Checkout as guest -> Submit order -> Verify order saved with guest fields
4. **Menu Filtering:** Select "Eat In" -> Verify only dine-in products shown

**Example Integration Test:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import App from './App';
import { createMockTenant, createMockSettings } from './test-utils';

describe('QR Code Flow', () => {
  it('should skip to menu when QR code scanned', async () => {
    // Set up URL with table parameter
    window.history.pushState({}, '', '/order?table=5');

    render(
      <MemoryRouter initialEntries={['/order?table=5']}>
        <App />
      </MemoryRouter>
    );

    // Should skip landing page and intent selection
    expect(screen.queryByText('Welcome to')).not.toBeInTheDocument();
    expect(screen.queryByText('How can we serve you today?')).not.toBeInTheDocument();

    // Should show menu with table badge
    await waitFor(() => {
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Table 5')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Cypress/Playwright)

**Test Scenarios:**
1. Complete reservation flow end-to-end
2. QR code scan to order placement
3. Guest checkout to account creation
4. Admin: Configure landing page, download QR codes, manage reservations

**Example E2E Test:**
```typescript
// cypress/e2e/reservation-flow.cy.ts
describe('Reservation Flow', () => {
  it('should allow customer to book a reservation', () => {
    cy.visit('https://demo-cafe.orderflow.app');

    // Landing page
    cy.contains('Continue to Order').click();

    // Intent selection
    cy.contains('Book for Later').click();

    // Reservation form
    cy.get('input[name="date"]').type('2025-10-27');
    cy.get('select[name="time"]').select('19:00');
    cy.get('input[name="partySize"]').type('4');
    cy.get('input[name="contactName"]').type('John Doe');
    cy.get('input[name="contactPhone"]').type('+1234567890');
    cy.get('input[name="contactEmail"]').type('john@example.com');
    cy.get('textarea[name="specialRequests"]').type('Window seat please');

    cy.contains('Submit Reservation').click();

    // Confirmation page
    cy.contains('Reservation Confirmed').should('be.visible');
    cy.contains('October 27, 2025 at 7:00 PM').should('be.visible');
    cy.contains('Party of 4').should('be.visible');
  });
});
```

---

## Migration & Deployment

### Data Migration

#### Existing Products: Add `availableFor` Field

**Strategy:** Backward-compatible default via code logic (no migration script needed)

**Implementation in Menu Filtering:**
```typescript
// In MenuScreen.tsx
const filteredProducts = products.filter(product => {
  // If product doesn't have availableFor field, assume 'both' (backward compatible)
  const availability = product.availableFor || ['both'];

  // If 'both' is in the array, show for all order types
  if (availability.includes('both')) return true;

  // Otherwise, check if current order type is in the array
  return availability.includes(currentOrderType);
});
```

**Admin UI Update:**
- ProductManager shows checkboxes for "Dine-In" and "Takeaway"
- If both unchecked, default to ['both'] on save
- Existing products without field will show both checkboxes checked

#### Settings Migration: Add `landingPage` and `tableOccupation`

**Strategy:** Add fields to existing settings document (non-breaking)

**Migration Script (optional):**
```typescript
// scripts/migrate-settings.ts
import { getFirestore, collection, getDocs, updateDoc } from 'firebase/firestore';

async function migrateSettings() {
  const db = getFirestore();
  const tenantsSnapshot = await getDocs(collection(db, 'tenants'));

  for (const tenantDoc of tenantsSnapshot.docs) {
    const tenantId = tenantDoc.id;
    const settingsRef = doc(db, `tenants/${tenantId}/settings/appSettings`);

    await updateDoc(settingsRef, {
      landingPage: {
        tagline: 'Welcome to our restaurant!',
        // Other fields remain undefined until admin configures
      },
      tableOccupation: {
        servicePeriods: {
          breakfast: 45,
          lunch: 60,
          dinner: 90,
        },
        partySizeModifiers: {
          solo: -15,
          couple: 0,
          smallGroup: 15,
          largeGroup: 30,
        },
      },
    });

    console.log(`Migrated settings for tenant: ${tenantId}`);
  }
}
```

**Note:** Migration is OPTIONAL. Code handles missing fields gracefully.

### Deployment Strategy

#### Phase 1: Backend & Data Layer (Week 1)
1. Deploy updated Firestore rules
2. Deploy updated Storage rules
3. Deploy Cloud Function: `autoCancelNoShows`
4. Verify: Function runs successfully, no errors in logs

#### Phase 2: Admin UI (Week 2)
1. Deploy admin components:
   - LandingPageSettings
   - QRCodeManager
   - ReservationManager
   - TableOccupationSettings
2. Deploy ProductManager updates (availableFor checkboxes)
3. Test: Admin can configure landing page, generate QR codes, view reservations

#### Phase 3: Customer UI - Part 1 (Week 2-3)
1. Deploy customer journey components:
   - LandingPage
   - IntentSelection
   - OrderTypeSelection
2. Deploy CustomerJourneyContext
3. Update App.tsx routing logic
4. Test: Normal landing page flow, navigation

#### Phase 4: Customer UI - Part 2 (Week 3)
1. Deploy reservation components:
   - ReservationForm
   - ReservationConfirmation
2. Deploy QR code entry logic
3. Update MenuScreen to filter by order type
4. Test: QR code flow, reservation flow, menu filtering

#### Phase 5: Guest Checkout (Week 4)
1. Update CartModal for guest fields
2. Deploy anonymous auth logic
3. Deploy account upgrade flow
4. Test: Guest checkout, order placement, account creation

#### Phase 6: Testing & Rollout (Week 4)
1. Run full E2E test suite
2. Pilot with 1-2 test tenants
3. Gather feedback, fix bugs
4. Deploy to production
5. Monitor Cloud Function logs, Firestore writes, user flows

### Rollback Plan

**If critical issues arise:**
1. Revert Firestore rules to previous version
2. Disable Cloud Function: `firebase functions:delete autoCancelNoShows`
3. Revert frontend to previous build
4. Communicate downtime to affected tenants

**Safe Rollback:**
- New data (reservations) won't break old code
- Old code ignores new fields (`availableFor`, `landingPage`)
- No destructive data changes

---

## Success Metrics

### Customer Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Landing page load time | <2 seconds | Google Lighthouse, real user monitoring |
| Time to order intent clarity | <2 clicks from landing | Analytics: Click tracking, conversion funnel |
| QR code to menu time | <3 seconds | Analytics: Time between scan and menu render |
| Reservation form completion time | <2 minutes | Analytics: Form start to submit timestamp |
| Guest checkout fields | <5 required fields | Count: name, phone, email = 3 (meets target) |
| Forced account creation | 0% | Analytics: Track guest checkout vs account signups |

### Admin Experience Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Branding configuration time | <10 minutes | User testing: Time admin to configure landing page |
| QR code download time | 1 click per table | UX review: Button click to download |
| Reservation visibility | Real-time updates | Test: Create reservation, verify admin sees it <5 seconds |
| Product availability configuration | Easy checkboxes | UX review: ProductManager interface |

### Technical Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Mobile responsiveness | 100% functional | Test on iPhone, Android, iPad |
| Breaking changes | 0 | Manual testing of existing features |
| TypeScript compilation | Success | CI/CD: `tsc --noEmit` |
| Route accessibility | 100% | E2E tests: Navigate to all new routes |
| Firestore security | Tenant-isolated | Security rules testing: Attempt cross-tenant access |

### Business Impact Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time-to-order reduction (walk-ins) | 30% faster | Compare: Old flow vs new flow user testing |
| Table ordering adoption | 50% of dine-in orders | Analytics: QR code entries / total dine-in orders |
| Reservation no-show rate | <10% | Query: Count no-shows / total reservations |
| Guest checkout conversion | >80% | Analytics: Guest orders / total orders (first-time customers) |

**Tracking Implementation:**
```typescript
// Analytics events to track
analytics.logEvent('landing_page_viewed', { tenantId });
analytics.logEvent('intent_selected', { intent: 'now' | 'later' });
analytics.logEvent('qr_code_scanned', { tableNumber });
analytics.logEvent('reservation_created', { partySize, leadTime });
analytics.logEvent('guest_checkout', { isGuest: true });
analytics.logEvent('account_created_post_order', { fromGuest: true });
```

---

## Implementation Plan

### Milestone 1: Landing Page & Branding (Week 1)
**Goal:** Admin can configure and customers can view branded landing pages

**Tasks:**
- [ ] Update `AppSettings` interface with `landingPage` field
- [ ] Create `LandingPageSettings.tsx` admin component
- [ ] Implement image upload to Firebase Storage (`uploadBrandingImage` function)
- [ ] Create `LandingPage.tsx` customer component
- [ ] Add color picker UI (use HTML5 `<input type="color">`)
- [ ] Implement preview functionality in admin
- [ ] Test: Upload logo/hero, set colors, view landing page
- [ ] Mobile-responsive styling

**Deliverables:**
- Admin can configure: logo, hero image, brand color, tagline, address, phone, email
- Customers see branded landing page on entry
- Images stored in `tenants/{tenantId}/branding/`

### Milestone 2: Order Intent & Type Selection (Week 1-2)
**Goal:** Customers can indicate intent and order type

**Tasks:**
- [ ] Create `CustomerJourneyContext.tsx` with state management
- [ ] Create `IntentSelection.tsx` component
- [ ] Create `OrderTypeSelection.tsx` component
- [ ] Update `App.tsx` routing logic to render components based on journey state
- [ ] Implement skip logic for QR code entries
- [ ] Test: Navigate through intent -> order type -> menu
- [ ] Mobile-responsive styling

**Deliverables:**
- Two-step flow: Intent selection -> Order type selection
- State persists throughout session
- Clean navigation between screens

### Milestone 3: QR Code System (Week 2)
**Goal:** Admin can generate QR codes, customers can scan to order

**Tasks:**
- [ ] Install `qrcode.react` library: `npm install qrcode.react`
- [ ] Create `QRCodeManager.tsx` admin component
- [ ] Implement QR code generation with table number in URL
- [ ] Implement individual QR download as PNG
- [ ] Implement bulk download as ZIP (install `jszip`: `npm install jszip`)
- [ ] Update `App.tsx` to parse `?table={number}` query param
- [ ] Update `CustomerJourneyContext` to handle QR code entry
- [ ] Update `MenuScreen` to display table number badge
- [ ] Test: Generate QR, scan (or manually enter URL), verify skip to menu

**Deliverables:**
- Admin can download QR codes per table
- QR codes encode correct URL format
- Scanning skips to menu with pre-filled context

### Milestone 4: Reservation System (Week 2-3)
**Goal:** Customers can book reservations, admins can manage them

**Tasks:**
- [ ] Install date picker library: `npm install react-datepicker`
- [ ] Install phone validation library: `npm install libphonenumber-js`
- [ ] Create `Reservation` TypeScript interface in `types.ts`
- [ ] Create `ReservationForm.tsx` component with validation
- [ ] Create `ReservationConfirmation.tsx` component
- [ ] Implement `createReservation` function in `firebase/api-multitenant.ts`
- [ ] Implement `streamReservations` function for real-time updates
- [ ] Create `ReservationManager.tsx` admin component
- [ ] Implement status update functions (confirm, cancel, seat, complete)
- [ ] Deploy Cloud Function: `autoCancelNoShows` (scheduled every 5 minutes)
- [ ] Update Firestore rules for reservations
- [ ] Test: Create reservation, verify in admin, auto-cancel after 15 mins

**Deliverables:**
- Customers can submit reservations with all required fields
- Admins can view, confirm, cancel, and manage reservations
- Auto-cancellation works via Cloud Function

### Milestone 5: Menu Differentiation (Week 3)
**Goal:** Products can be configured for specific order types

**Tasks:**
- [ ] Update `Product` interface with `availableFor` field
- [ ] Update `ProductManager.tsx` with checkboxes for dine-in/takeaway
- [ ] Update `ProductForm.tsx` to save `availableFor` field
- [ ] Update `MenuScreen.tsx` to filter products by order type
- [ ] Test backward compatibility: Existing products without field show for all types
- [ ] Test filtering: Select "Eat In", verify only dine-in products shown
- [ ] Update Firestore rules to allow `availableFor` field

**Deliverables:**
- Admin can configure product availability per order type
- Menu filters correctly based on customer's selection
- No breaking changes for existing products

### Milestone 6: Guest Checkout & Auth (Week 3-4)
**Goal:** Customers can order without account, with optional signup

**Tasks:**
- [ ] Update `Order` interface with `guestEmail`, `guestPhone`, `isGuestOrder` fields
- [ ] Update `CartModal.tsx` to show guest checkout fields when not authenticated
- [ ] Implement anonymous auth flow using Firebase Anonymous Auth
- [ ] Update `placeOrder` function to save guest info
- [ ] Create post-order account creation prompt (modal or screen)
- [ ] Implement account upgrade flow (link anonymous user to permanent account)
- [ ] Transfer guest orders to new account on signup
- [ ] Test: Place order as guest, create account, verify orders linked
- [ ] Update Firestore rules to allow guest order creation

**Deliverables:**
- Guests can complete checkout with name, phone, email
- Optional account creation after first order
- Guest orders linked to account on upgrade

---

## Out of Scope

The following features are explicitly **NOT** included in Phase 3:

### Visual Floor Plan Builder
- Drag-and-drop table editor
- Visual table layout designer
- Table shape customization (square, circle, rectangle)
- Grid positioning for tables
- **Why deferred:** Complex UI, low immediate ROI, can use simple table numbers for now

### Smart Table Assignment Algorithm
- Automatic table assignment based on party size
- Table merging for large parties
- Real-time table availability calculation
- Smart table rotation to balance server workload
- **Why deferred:** Requires floor plan data, advanced logic, can manually assign for now

### Real-Time Table Availability Checking
- Live availability when customers select reservation time
- Block times based on existing reservations and occupation settings
- Prevent overbooking
- **Why deferred:** Foundation (occupation settings) built in Phase 3, algorithm in Phase 4

### Table Occupation Status Tracking
- Real-time status: occupied, available, reserved, cleaning
- Visual indicators in admin panel
- Customer-facing availability display
- **Why deferred:** Requires staff interaction tracking, more complex than needed now

### Waitlist Management
- Add customers to waitlist when fully booked
- Automatic notification when table available
- Priority queue management
- **Why deferred:** Not critical for MVP, can manage manually for now

### Communication Features
- SMS reservation reminders (Twilio integration)
- Email confirmation emails (SendGrid integration)
- Push notifications for order status
- **Why deferred:** Requires third-party integrations, additional cost, can add in Phase 4+

---

## Dependencies

### External Services
- **Firebase Authentication** - Already configured, used for user management and anonymous auth
- **Firebase Firestore** - Already configured, multi-tenant data storage
- **Firebase Storage** - Already configured, image hosting for branding assets
- **Firebase Cloud Functions** - Already configured, needed for auto-cancellation scheduler

### Internal Dependencies
- **Phase 2 Complete** - User Invitation, Offline Persistence, Dine-In Order Types (DONE)
- **Multi-Tenant Architecture** - TenantContext, tenant-scoped Firestore paths (DONE)
- **Existing Product Management** - ProductManager, CategoryManager (DONE)
- **Existing Order System** - placeOrder function, order status workflow (DONE)

### New Libraries

**Install Commands:**
```bash
npm install qrcode.react
npm install react-datepicker @types/react-datepicker
npm install libphonenumber-js
npm install jszip # Optional: For bulk QR download
```

**Library Purposes:**
- `qrcode.react` - Generate QR codes in React components
- `react-datepicker` - Date/time picker UI for reservation form
- `libphonenumber-js` - Phone number validation and formatting
- `jszip` - Create ZIP files for bulk QR code download

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| QR code scanning fails on some devices | High | Medium | Test on multiple devices, provide manual table number entry fallback |
| Cloud Function auto-cancel has lag | Medium | Low | Run every 5 minutes, acceptable delay for no-shows |
| Image uploads fail or slow | High | Low | Add loading states, file size limits (5MB), error handling |
| Anonymous auth conflicts with existing users | High | Low | Thorough testing of account upgrade flow, ensure no data loss |
| Menu filtering breaks for existing products | High | Low | Backward-compatible default, test migration thoroughly |

### UX Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Too many screens slow down ordering | High | Medium | Skip screens where possible (QR code entry), measure time-to-order |
| Customers confused by intent selection | Medium | Medium | Clear copy, icons, user testing before launch |
| Reservation form too long | Medium | Low | Only 6 fields required, optional fields clearly marked |
| Guest checkout friction | High | Low | Only 3 required fields, optional account creation |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| No-show rate higher than expected | Medium | Medium | Monitor metrics, adjust grace period if needed (15 mins configurable) |
| Admins don't configure landing pages | Low | Medium | Provide good defaults, onboarding guide |
| QR codes not printed/displayed | Medium | Medium | Provide downloadable PDFs, table tent templates |

---

## Appendix

### Color Palette Recommendations

**For Intent Selection Buttons:**
- "Here Now" Green: `#2ecc71` (Emerald)
- "Book Later" Blue: `#3498db` (Peter River)

**For Status Badges:**
- Pending: `#ffc107` (Amber)
- Confirmed: `#28a745` (Green)
- Seated: `#007bff` (Blue)
- Completed: `#6c757d` (Gray)
- Cancelled: `#dc3545` (Red)
- No-show: `#bd2130` (Dark Red)

### Typography Guidelines

**Landing Page:**
- Hero Title: 36px (mobile), 48px (desktop), bold
- Tagline: 18px (mobile), 24px (desktop), regular
- Body Text: 16px, line-height 1.6

**Forms:**
- Labels: 14px, medium weight
- Input Text: 16px (prevents zoom on iOS)
- Error Messages: 14px, red (#dc3545)

### Accessibility Checklist

- [ ] All buttons have min 44x44px touch target
- [ ] Color contrast ratio ≥4.5:1 for text
- [ ] Form inputs have associated labels
- [ ] Error messages announced to screen readers
- [ ] Keyboard navigation supported
- [ ] Focus indicators visible
- [ ] Alt text for all images
- [ ] ARIA labels for icon-only buttons

### Performance Budget

| Metric | Budget |
|--------|--------|
| Landing Page Load (3G) | <3 seconds |
| Hero Image Size | <500KB |
| Logo Image Size | <100KB |
| JavaScript Bundle Size | <300KB gzipped |
| First Contentful Paint | <1.5 seconds |
| Time to Interactive | <3 seconds |

---

**Document Status:** Ready for Implementation
**Last Updated:** October 26, 2025
**Next Steps:**
1. Review specification with development team
2. Assign tasks from milestones to developers
3. Set up project tracking (GitHub Issues, Jira, etc.)
4. Begin Milestone 1: Landing Page & Branding
