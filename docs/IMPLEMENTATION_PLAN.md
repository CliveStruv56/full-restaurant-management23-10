# Multi-Tenant Restaurant Management System - Implementation Plan

**Version:** 1.0
**Date:** October 23, 2025
**Status:** In Progress - Phase 1
**Estimated Timeline:** 20 weeks (5 months)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decisions](#architecture-decisions)
3. [Phase 1: Multi-Tenant Foundation (Weeks 1-6)](#phase-1-multi-tenant-foundation-weeks-1-6)
4. [Phase 2: Table Management Module (Weeks 7-14)](#phase-2-table-management-module-weeks-7-14)
5. [Phase 3: Simplified Management Module (Weeks 15-18)](#phase-3-simplified-management-module-weeks-15-18)
6. [Phase 4: Payment System (Weeks 19-20)](#phase-4-payment-system-weeks-19-20)
7. [Testing Strategy](#testing-strategy)
8. [Deployment & Best Practices](#deployment--best-practices)
9. [Success Metrics](#success-metrics)
10. [Progress Tracking](#progress-tracking)

---

## Executive Summary

### Current State
- **Existing:** Fully functional Restaurant Management System MVP with real Firebase/Firestore
- **Features:** Customer ordering, KDS, admin panel, loyalty program, AI daily specials
- **Architecture:** Single-tenant React 18 + TypeScript + Firebase

### Target State
- **Product:** Multi-tenant restaurant management platform
- **Clients:** 2 committed test clients (mobile café + sit-down restaurant)
- **Revenue Target:** £517 MRR by Month 5
- **Deployment:** Subdomain-based multi-tenancy (client1.yourapp.com)

### Key Decisions Made

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Multi-tenancy** | Subdomain-based (Option B) | Standard SaaS architecture, scales to 100+ clients |
| **Authentication** | Full invite system with Cloud Functions | Admin can invite users, proper tenant isolation |
| **Offline Strategy** | Intelligent cache priming + graceful degradation | Critical for restaurants with unreliable WiFi |
| **Payments** | Pluggable gateway architecture | Support Stripe, Square, custom integrations |
| **Table Management** | Floor plan is priority | Core value for Client 2, competitive differentiator |
| **Management Module** | Simplified (sales + visitor tracking only) | Reduce scope, add features based on client feedback |
| **Testing** | Automated (critical paths) + Manual (features) | Balance speed with quality |
| **Deployment** | Staging + Production, CI/CD via GitHub Actions | Industry best practice |

---

## Architecture Decisions

### Data Structure Migration

#### Before (Single-Tenant)
```
/products/{productId}
/categories/{categoryId}
/orders/{orderId}
/users/{userId}
/app/settings
```

#### After (Multi-Tenant)
```
/tenantMetadata/{tenantId}
  ├── businessName
  ├── subdomain
  ├── enabledModules
  ├── subscription
  ├── paymentGateway
  └── branding

/tenants/{tenantId}/
  ├── settings/
  │   ├── baseModule
  │   ├── tableModule
  │   └── managementModule
  ├── products/{productId}
  ├── categories/{categoryId}
  ├── orders/{orderId}
  ├── tables/{tableId}
  └── reservations/{reservationId}

/users/{userId}
  ├── tenantId (NEW - critical for isolation)
  ├── role
  ├── email
  └── ...
```

### Security Model

**Firestore Rules Principles:**
1. Users can only access data from their own tenant
2. Role-based permissions (customer, staff, admin)
3. Tenant admins can invite users to their tenant only
4. Cross-tenant queries are blocked at database level

**Custom Claims:**
- NOT used (complexity)
- Tenant ID stored in user document instead
- Security rules read from user document

---

## Phase 1: Multi-Tenant Foundation (Weeks 1-6)

**Goal:** Migrate existing MVP to multi-tenant architecture with 2 paying clients

### Week 1-2: Data Migration & Tenant Context

#### Deliverables
- [x] Multi-tenant data structure implemented
- [ ] TenantContext with subdomain detection
- [ ] Migration script for existing data
- [ ] Updated Firestore security rules
- [ ] All API functions scoped to tenantId

#### New Files to Create
1. `contexts/TenantContext.tsx` - Tenant state management
2. `scripts/migrate-to-multitenant.ts` - One-time data migration
3. `firestore.rules` - Complete rewrite with tenant isolation

#### Files to Update
1. `firebase/api.ts` - Add tenantId parameter to all functions
2. `types.ts` - Add Tenant, BaseModuleSettings, update Order/User
3. `App.tsx` - Wrap with TenantProvider
4. All components - Pass tenantId from context

#### Testing Checklist
- [ ] Demo tenant loads correctly
- [ ] Subdomain detection works (localhost testing)
- [ ] Migrated data appears correctly
- [ ] Security rules prevent cross-tenant access
- [ ] Existing functionality still works

#### Estimated Hours
60-80 hours

---

### Week 3-4: Authentication & User Management

#### Deliverables
- [ ] Firebase Cloud Functions project set up
- [ ] User invitation system (admin invites users)
- [ ] Email integration for invitation emails
- [ ] Admin UI for user management
- [ ] Password reset flow for invited users

#### New Files to Create
1. `firebase/functions/src/index.ts` - Cloud Functions
   - `inviteUser` - Admin invites new user to tenant
   - `acceptInvitation` - User sets password and activates account
   - `sendInvitationEmail` - Email integration
2. `components/admin/UserManager.tsx` - Admin UI for managing users
3. `components/auth/InvitationAcceptance.tsx` - User accepts invitation

#### Cloud Functions Setup
```bash
cd firebase/functions
npm install firebase-functions firebase-admin
npm install --save-dev typescript @types/node
```

#### Files to Update
1. `contexts/AuthContext.tsx` - Add invitation acceptance flow
2. `components/admin/AdminPanel.tsx` - Add "Users" tab

#### Testing Checklist
- [ ] Admin can invite customer (email sent)
- [ ] Admin can invite staff member
- [ ] Invited user receives email with temp password
- [ ] User can log in with temp password
- [ ] User can set new password
- [ ] User belongs to correct tenant
- [ ] User has correct role assigned
- [ ] Cannot invite users to other tenants

#### Estimated Hours
40-60 hours

---

### Week 5-6: Offline Sync & Dine-In Orders

#### Deliverables
- [ ] Firestore offline persistence enabled
- [ ] Offline cache priming for critical queries
- [ ] Online/Offline indicator UI
- [ ] Order type selection (Takeaway/Dine-In)
- [ ] Table number picker for dine-in orders
- [ ] KDS shows table numbers prominently
- [ ] Base module settings (admin config)

#### New Files to Create
1. `firebase/offlineCache.ts` - Cache priming utilities
2. `components/OfflineIndicator.tsx` - Connection status UI
3. `components/OrderTypeSelector.tsx` - Takeaway/Dine-In/Delivery choice
4. `components/TableNumberPicker.tsx` - Select table for dine-in
5. `components/admin/BaseModuleSettings.tsx` - Admin configuration

#### Files to Update
1. `firebase/config.ts` - Enable offline persistence
2. `types.ts` - Add orderType, tableNumber, guestCount to Order
3. `components/CartModal.tsx` - Add order type selection before checkout
4. `components/admin/KitchenDisplaySystem.tsx` - Display table numbers
5. `firebase/api.ts` - Update placeOrder to include orderType

#### Offline Strategy
**Works Offline:**
- ✅ View menu (cached products/categories)
- ✅ View existing orders (cached)
- ✅ Create new orders (queued for sync)
- ✅ Browse settings

**Requires Online:**
- ❌ Payment processing
- ❌ Admin analytics/reports
- ❌ User invitation

**Cache Priming (on app load):**
- Today's orders (for KDS)
- All products
- All categories
- Settings

#### Testing Checklist - Client 1 (Mobile Café)
- [ ] Customer places takeaway order
- [ ] Time slots work as before
- [ ] Orders appear in KDS real-time
- [ ] Staff updates order status
- [ ] **Offline test:** Disconnect WiFi, create order, reconnect, order syncs
- [ ] No data from Client 2 visible

#### Testing Checklist - Client 2 (Restaurant)
- [ ] All above, PLUS:
- [ ] Customer chooses "Dine-In"
- [ ] Selects table number (1-8)
- [ ] Order shows table number in KDS
- [ ] Admin can configure number of tables
- [ ] **Offline test:** Waiter takes dine-in order offline, syncs when reconnected

#### Estimated Hours
60-80 hours

---

### Phase 1 Summary

**Total Duration:** 6 weeks
**Total Hours:** 160-220 hours
**Deliverables:**
- ✅ Multi-tenant architecture fully operational
- ✅ 2 tenants set up (Client 1 + Client 2)
- ✅ Subdomain routing working
- ✅ User invitation system
- ✅ Offline support for critical operations
- ✅ Dine-in orders with table numbers

**Revenue:**
- Client 1: £49/month (Base Module)
- Client 2: £49/month (Base Module)
- **Total MRR: £98**

---

## Phase 2: Table Management Module (Weeks 7-14)

**Goal:** Full reservation system with floor plan for Client 2 + acquire 3-5 new restaurant clients

### Week 7-8: Floor Plan Builder

#### Deliverables
- [ ] Grid-based floor plan editor
- [ ] Table creation with properties (capacity, shape)
- [ ] Table positioning on grid
- [ ] Table merging configuration
- [ ] Save/load floor plans from Firestore

#### New Files to Create
1. `components/admin/FloorPlanBuilder.tsx` - Visual editor
2. `components/admin/TableEditor.tsx` - Edit table properties modal
3. `components/FloorPlanView.tsx` - Read-only view for customers
4. `utils/floorPlanUtils.ts` - Grid calculations

#### TypeScript Types
```typescript
export interface Table {
  id: string;
  number: number;
  capacity: number; // max guests
  shape: 'square' | 'rectangle' | 'circle';
  position: { x: number; y: number }; // grid coordinates
  mergeable: string[]; // IDs of tables that can merge with this
  status: 'available' | 'occupied' | 'reserved';
}
```

#### Features
- Grid: 10x10 cells (configurable)
- Click empty cell → add table
- Click table → edit properties
- Drag table to reposition (Phase 2.1 enhancement)
- Visual representation (shapes/colors)

#### Testing Checklist - Client 2
- [ ] Admin opens floor plan builder
- [ ] Creates 8 tables in layout matching restaurant
- [ ] Sets table capacities (2-seater, 4-seater, 6-seater)
- [ ] Marks adjacent tables as mergeable
- [ ] Saves floor plan
- [ ] Floor plan persists after reload

#### Estimated Hours
60-70 hours

---

### Week 9-10: Reservation System (Basic)

#### Deliverables
- [ ] Customer-facing reservation form
- [ ] Date/time/party size selection
- [ ] Contact details collection
- [ ] Reservation creation in Firestore
- [ ] Admin view of all reservations
- [ ] Manual table assignment by admin

#### New Files to Create
1. `components/ReservationModal.tsx` - Customer booking form
2. `components/admin/ReservationManager.tsx` - Admin reservation list
3. `firebase/reservations.ts` - Reservation CRUD operations

#### TypeScript Types
```typescript
export interface Reservation {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: number;
  dateTime: string; // ISO 8601
  duration: number; // minutes
  tableIds: string[]; // assigned tables
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  specialRequests?: string;
  createdAt: string;
  notes?: string; // admin notes
}
```

#### Customer Flow
1. Click "Make Reservation"
2. Select date (calendar picker)
3. Select party size (dropdown 1-20)
4. Select time (available slots shown)
5. Enter contact details
6. Submit → Status: "pending"

#### Admin Flow
1. View list of reservations
2. Manually assign table(s)
3. Change status to "confirmed"
4. On arrival, mark as "seated"
5. After dining, mark as "completed"

#### Testing Checklist - Client 2
- [ ] Customer creates reservation for 4 people
- [ ] Admin receives notification (future: email)
- [ ] Admin assigns Table 3 to reservation
- [ ] Admin confirms reservation
- [ ] Reservation appears in admin list
- [ ] Customer can view their reservation status

#### Estimated Hours
50-60 hours

---

### Week 11-12: Availability Algorithm & Auto-Assignment

#### Deliverables
- [ ] Service period configuration (Lunch, Dinner)
- [ ] Real-time availability calculation
- [ ] Auto-assign best table for party size
- [ ] Show available time slots to customers
- [ ] Table merging for large parties
- [ ] Turn time rules by party size

#### New Files to Create
1. `components/admin/ServicePeriodManager.tsx` - Configure lunch/dinner periods
2. `utils/reservationAvailability.ts` - Availability algorithm
3. `utils/tableMerging.ts` - Find mergeable table combinations

#### TypeScript Types
```typescript
export interface ServicePeriod {
  id: string;
  name: string; // 'Lunch', 'Dinner'
  daysOfWeek: number[]; // [1,2,3,4,5] = Mon-Fri
  startTime: string; // '12:00'
  endTime: string; // '15:00'
  turnTime: number; // minutes per table (e.g., 90)
  slotInterval: number; // booking slots every X minutes (e.g., 30)
  maxReservationsPerSlot: number;
}
```

#### Availability Algorithm
```typescript
function getAvailableSlots(date, partySize):
  1. Get service periods for date
  2. Generate time slots (e.g., 12:00, 12:30, 13:00...)
  3. For each slot:
     a. Find tables that fit party size
     b. Check if table is free at that time
     c. If yes, add slot to available list
  4. Return available slots
```

#### Auto-Assignment Logic
```typescript
function autoAssignTable(reservation):
  1. Find tables with capacity >= partySize
  2. Sort by capacity (smallest first - best fit)
  3. Check availability at requested time
  4. If single table works, assign it
  5. If not, try merged table combinations
  6. Return assigned tableIds or error
```

#### Testing Checklist - Client 2
- [ ] Admin configures Lunch (12-3pm) and Dinner (6-10pm)
- [ ] Sets turn time: 90 minutes
- [ ] Customer searches for "Saturday 7pm, 6 people"
- [ ] System shows available slots: 6:00, 6:30, 7:00, 7:30
- [ ] Customer books 7:00pm
- [ ] System auto-assigns Table 5 (6-seater)
- [ ] Next customer searches "Saturday 7pm, 2 people"
- [ ] Slot still available (Table 1 free)
- [ ] Large party (12 people) triggers table merging
- [ ] System suggests Tables 5+6 merged

#### Estimated Hours
70-80 hours

---

### Week 13-14: Refinement & Client 2 Testing

#### Deliverables
- [ ] Polish floor plan UI
- [ ] Add reservation editing
- [ ] Add reservation cancellation
- [ ] Email confirmations (SendGrid/Mailgun)
- [ ] SMS reminders (optional - Twilio)
- [ ] Comprehensive testing with Client 2

#### Testing Scenarios

**Scenario 1: Walk-In Customer**
1. Host seats customer at Table 3
2. Waiter opens app, selects "Dine-In"
3. Enters Table 3
4. Takes order
5. Order appears on KDS with "Table 3"
6. Kitchen prepares
7. Waiter serves
8. Process payment
9. Mark order complete

**Scenario 2: Reserved Customer Arrives**
1. Customer has reservation at 7pm, Table 5
2. Host checks reservation list
3. Marks reservation as "seated"
4. Table 5 status → "occupied"
5. Waiter takes order (links to reservation)
6. Process as normal

**Scenario 3: Busy Service**
- 15 reservations tonight
- 5 walk-ins
- All tables occupied at 8pm
- System shows "No tables available" for new reservations
- Customer books 9:30pm instead

#### Bug Fixes & Polish
- [ ] Edge cases handled (double-booking prevention)
- [ ] UI responsive on tablets
- [ ] Loading states for all async operations
- [ ] Error messages user-friendly
- [ ] Performance optimized (queries indexed)

#### Estimated Hours
40-50 hours

---

### Phase 2 Summary

**Total Duration:** 8 weeks
**Total Hours:** 220-260 hours
**Deliverables:**
- ✅ Floor plan builder (Client 2 can design layout)
- ✅ Reservation system (customers can book tables)
- ✅ Auto-assignment algorithm
- ✅ Service period configuration
- ✅ Table merging for large groups

**Revenue:**
- Client 1: £49/month (Base only)
- Client 2: £49 + £29 = £78/month (Base + Table)
- 3 new restaurant clients × £78 = £234
- **Total MRR: £361**

**Client Acquisition:**
- Demo to 10 local restaurants
- Offer 14-day free trial
- White-glove onboarding
- Target: Convert 3-5 to paid

---

## Phase 3: Simplified Management Module (Weeks 15-18)

**Goal:** Sales analytics & visitor tracking to upsell existing clients

### Week 15-16: Sales Analytics

#### Deliverables
- [ ] Sales dashboard with charts
- [ ] Revenue trending (daily, weekly, monthly)
- [ ] Top 10 selling products
- [ ] Order type breakdown (dine-in vs takeaway)
- [ ] Average order value
- [ ] Export to CSV

#### New Files to Create
1. `components/admin/SalesDashboard.tsx` - Main analytics view
2. `components/admin/RevenueChart.tsx` - Line chart component
3. `components/admin/ProductRanking.tsx` - Top products table
4. `utils/analytics.ts` - Data aggregation functions

#### TypeScript Types
```typescript
export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
  }[];
  revenueByHour: {
    hour: number;
    revenue: number;
  }[];
  orderTypeBreakdown: {
    type: 'takeaway' | 'dine-in' | 'delivery';
    count: number;
    revenue: number;
  }[];
}
```

#### Charts Library
Use **Recharts** (lightweight, React-friendly):
```bash
npm install recharts
```

#### Analytics Queries
```typescript
// Get orders in date range
const ordersQuery = query(
  collection(db, `tenants/${tenantId}/orders`),
  where('orderTime', '>=', startDate),
  where('orderTime', '<=', endDate)
);

// Aggregate on client-side (small datasets)
// For large datasets, use Cloud Functions
```

#### Testing Checklist
- [ ] Admin selects "Last 7 days"
- [ ] Revenue chart shows daily breakdown
- [ ] Top products list accurate
- [ ] Can export to CSV
- [ ] Date range picker works
- [ ] Works offline (cached data)

#### Estimated Hours
60-70 hours

---

### Week 17-18: Visitor Tracking

#### Deliverables
- [ ] Track dine-in customer count
- [ ] Track takeaway customer count
- [ ] Peak hours analysis
- [ ] Table occupancy rate (for table module users)
- [ ] Customer retention metrics (repeat customers)

#### New Files to Create
1. `components/admin/VisitorMetrics.tsx` - Customer tracking dashboard
2. `components/admin/PeakHoursHeatmap.tsx` - Visual heat map
3. `utils/visitorTracking.ts` - Metrics calculations

#### Metrics to Calculate
```typescript
export interface VisitorMetrics {
  totalCustomers: number; // sum of guestCount for dine-in
  totalOrders: number;
  averagePartySize: number;
  peakHours: {
    hour: number;
    customerCount: number;
  }[];
  repeatCustomerRate: number; // % of customers who ordered 2+ times
  tableOccupancyRate?: number; // for table module users
}
```

#### Peak Hours Heat Map
- X-axis: Days of week (Mon-Sun)
- Y-axis: Hours (10am-10pm)
- Color intensity: Number of customers
- Helps identify staffing needs

#### Testing Checklist
- [ ] Dine-in orders increment customer count by guestCount
- [ ] Takeaway orders increment by 1
- [ ] Heat map shows Saturday dinner as peak
- [ ] Repeat customer identification works
- [ ] Table occupancy shows 65% for last week

#### Estimated Hours
40-50 hours

---

### Phase 3 Summary

**Total Duration:** 4 weeks
**Total Hours:** 100-120 hours
**Deliverables:**
- ✅ Sales analytics dashboard
- ✅ Visitor tracking metrics
- ✅ Peak hours identification
- ✅ CSV export functionality

**Revenue:**
- Upsell Management Module to existing clients: +£39/month each
- Client 1: £49 + £39 = £88/month
- Client 2: £78 + £39 = £117/month
- 3 other clients: £78 + £39 = £117/month each
- **Total MRR: £556**

---

## Phase 4: Payment System (Weeks 19-20)

**Goal:** Enable payment processing with pluggable gateway architecture

### Week 19: Payment Gateway Abstraction

#### Deliverables
- [ ] Payment gateway interface
- [ ] Stripe implementation
- [ ] Square implementation
- [ ] Custom gateway stub (for future integrations)
- [ ] Cloud Function for payment creation

#### New Files to Create
1. `payment/PaymentGateway.interface.ts` - Abstract interface
2. `payment/StripeGateway.ts` - Stripe implementation
3. `payment/SquareGateway.ts` - Square implementation
4. `payment/CustomGateway.ts` - Stub for custom integrations
5. `firebase/functions/src/payment.ts` - Cloud Functions for payments

#### TypeScript Interface
```typescript
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  clientSecret?: string; // Stripe-specific
  metadata: Record<string, any>;
}

export interface PaymentGateway {
  name: 'stripe' | 'square' | 'custom';

  createPayment(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent>;

  confirmPayment(paymentId: string): Promise<PaymentIntent>;

  refundPayment(paymentId: string, amount?: number): Promise<void>;

  getPaymentStatus(paymentId: string): Promise<PaymentIntent>;
}
```

#### Cloud Function Example
```typescript
export const createPayment = functions.https.onCall(async (data, context) => {
  const { tenantId, amount, currency, orderId } = data;

  // Get tenant's payment config
  const tenantDoc = await admin.firestore()
    .doc(`tenantMetadata/${tenantId}`)
    .get();

  const paymentConfig = tenantDoc.data()?.paymentGateway;

  // Initialize correct gateway
  let gateway: PaymentGateway;
  switch (paymentConfig.provider) {
    case 'stripe':
      gateway = new StripeGateway(paymentConfig.config.secretKey);
      break;
    case 'square':
      gateway = new SquareGateway(paymentConfig.config.accessToken);
      break;
    default:
      throw new Error('Unsupported payment gateway');
  }

  // Create payment
  const paymentIntent = await gateway.createPayment({
    amount,
    currency,
    metadata: { orderId, tenantId }
  });

  // Store payment record
  await admin.firestore()
    .doc(`tenants/${tenantId}/payments/${paymentIntent.id}`)
    .set({
      orderId,
      amount,
      currency,
      status: paymentIntent.status,
      gateway: paymentConfig.provider,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  return paymentIntent;
});
```

#### Testing Checklist
- [ ] Stripe test mode works
- [ ] Square sandbox works
- [ ] Payment creation returns clientSecret
- [ ] Payment confirmation updates order status
- [ ] Refunds work correctly
- [ ] Payment records stored in Firestore

#### Estimated Hours
50-60 hours

---

### Week 20: Payment UI & End-to-End Testing

#### Deliverables
- [ ] Payment modal for checkout
- [ ] Stripe Elements integration
- [ ] Square Web SDK integration
- [ ] Payment status tracking
- [ ] Receipt generation
- [ ] Admin payment management UI

#### New Files to Create
1. `components/PaymentModal.tsx` - Checkout UI
2. `components/StripeCheckout.tsx` - Stripe-specific UI
3. `components/SquareCheckout.tsx` - Square-specific UI
4. `components/admin/PaymentManager.tsx` - Admin view of payments

#### Customer Flow
1. Customer completes order
2. Click "Proceed to Payment"
3. System detects tenant's payment gateway
4. Loads appropriate checkout UI (Stripe/Square)
5. Customer enters payment details
6. Payment processed
7. Order status → "Paid"
8. Receipt emailed (optional)

#### Admin Configuration
1. Admin goes to Settings > Payments
2. Selects gateway (Stripe/Square/Custom)
3. Enters API keys (encrypted in Firestore)
4. Test mode toggle
5. Save

#### Testing Checklist
- [ ] Client 1 (Stripe): Customer pays with card
- [ ] Client 2 (Square): Customer pays with card
- [ ] Payment success → order marked as paid
- [ ] Payment failure → error shown, order remains unpaid
- [ ] Refund initiated by admin works
- [ ] Receipt generation works
- [ ] Admin can view payment history

#### Estimated Hours
40-50 hours

---

### Phase 4 Summary

**Total Duration:** 2 weeks
**Total Hours:** 90-110 hours
**Deliverables:**
- ✅ Pluggable payment gateway system
- ✅ Stripe integration
- ✅ Square integration
- ✅ Payment UI components
- ✅ Admin payment management

**Revenue:**
- All clients can now process payments
- No additional module fee (included in Base)
- Improved conversion (customers can pay immediately)

---

## Testing Strategy

### Automated Testing

**Framework:** Vitest + React Testing Library

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Test Coverage Goals:**
- Auth flows: 80%
- Order flows: 90%
- Payment flows: 95%
- Offline sync: 70%

#### Critical Path Tests

**1. Authentication Tests** (`__tests__/auth.test.tsx`)
```typescript
describe('Authentication', () => {
  test('User can sign up', async () => { /* ... */ });
  test('User can log in', async () => { /* ... */ });
  test('Admin can invite user', async () => { /* ... */ });
  test('Invited user can accept invitation', async () => { /* ... */ });
});
```

**2. Order Flow Tests** (`__tests__/orders.test.tsx`)
```typescript
describe('Order Placement', () => {
  test('Customer can place takeaway order', async () => { /* ... */ });
  test('Customer can place dine-in order with table', async () => { /* ... */ });
  test('Order appears in KDS real-time', async () => { /* ... */ });
  test('Staff can update order status', async () => { /* ... */ });
});
```

**3. Offline Sync Tests** (`__tests__/offline.test.tsx`)
```typescript
describe('Offline Functionality', () => {
  test('Menu loads from cache when offline', async () => { /* ... */ });
  test('Order queued when created offline', async () => { /* ... */ });
  test('Queued order syncs when online', async () => { /* ... */ });
});
```

**4. Payment Tests** (`__tests__/payment.test.tsx`)
```typescript
describe('Payment Processing', () => {
  test('Stripe payment succeeds', async () => { /* ... */ });
  test('Square payment succeeds', async () => { /* ... */ });
  test('Failed payment shows error', async () => { /* ... */ });
});
```

#### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.tsx

# Watch mode
npm test -- --watch
```

---

### Manual Testing

**Per-Client Testing Checklist**

#### Client 1 (Mobile Café) - Every Release
- [ ] Customer flow
  - [ ] Browse menu
  - [ ] Add items to cart
  - [ ] Customize items
  - [ ] Select time slot
  - [ ] Place order
  - [ ] Track order status
- [ ] Staff flow
  - [ ] View orders in KDS
  - [ ] Mark order as preparing
  - [ ] Mark order as ready
  - [ ] Mark order as completed
- [ ] Admin flow
  - [ ] Add/edit products
  - [ ] Manage categories
  - [ ] Configure settings
  - [ ] View analytics
  - [ ] Invite staff member
- [ ] Offline testing
  - [ ] Disconnect WiFi
  - [ ] Create order offline
  - [ ] Reconnect WiFi
  - [ ] Verify order synced
- [ ] Security testing
  - [ ] Cannot see Client 2's data
  - [ ] Customer cannot access admin panel
  - [ ] Staff cannot delete products

#### Client 2 (Restaurant) - Every Release
- [ ] All Client 1 tests, PLUS:
- [ ] Dine-in flow
  - [ ] Select "Dine-In"
  - [ ] Choose table number
  - [ ] Order appears with table in KDS
- [ ] Reservation flow
  - [ ] Customer creates reservation
  - [ ] Admin assigns table
  - [ ] Admin confirms reservation
  - [ ] Mark as seated on arrival
  - [ ] Mark as completed after service
- [ ] Floor plan
  - [ ] Admin creates/edits floor plan
  - [ ] Tables display correctly
  - [ ] Table capacity rules enforced
- [ ] Table management
  - [ ] Availability algorithm works
  - [ ] Auto-assignment works
  - [ ] Table merging for large parties
- [ ] Payments
  - [ ] Square payment succeeds
  - [ ] Receipt generated
  - [ ] Payment recorded in admin

#### Bug Tracking
Use **GitHub Issues** with labels:
- `bug` - Something broken
- `enhancement` - New feature request
- `client-1` - Specific to mobile café
- `client-2` - Specific to restaurant
- `critical` - Blocks usage
- `high` - Important but has workaround
- `medium` - Should fix soon
- `low` - Nice to have

---

## Deployment & Best Practices

### Environment Setup

#### Staging Environment
- **Firebase Project:** `restaurant-mgmt-staging`
- **URL:** `*.staging.yourapp.com`
- **Purpose:** Test all changes before production
- **Data:** Synthetic test data only

#### Production Environment
- **Firebase Project:** `restaurant-mgmt-prod`
- **URL:** `*.yourapp.com`
- **Purpose:** Live client data
- **Data:** Real business data

#### Local Development
- **URL:** `localhost:5173`
- **Tenant:** Demo tenant by default
- **Data:** Local Firestore emulator (optional)

---

### CI/CD Pipeline

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}'
          projectId: restaurant-mgmt-staging

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}'
          projectId: restaurant-mgmt-prod
```

**Deployment Workflow:**
1. Developer creates feature branch
2. Opens PR to `staging`
3. Tests run automatically
4. Merge to `staging` → auto-deploys to staging environment
5. Test on staging
6. Create PR from `staging` to `main`
7. Merge to `main` → auto-deploys to production

---

### Error Monitoring

**Tool:** Sentry

**Setup:**
```bash
npm install @sentry/react
```

**Configuration: `main.tsx`**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Error Boundary:**
```typescript
import { ErrorBoundary } from "@sentry/react";

<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

**Benefits:**
- Real-time error notifications
- Stack traces for debugging
- Performance monitoring
- User session replay
- Release tracking

---

### Performance Monitoring

**Firebase Performance Monitoring:**
```bash
npm install firebase
```

**Setup: `firebase/config.ts`**
```typescript
import { getPerformance } from "firebase/performance";

const perf = getPerformance(app);
```

**Track Custom Metrics:**
```typescript
import { trace } from "firebase/performance";

const placeOrderTrace = trace(perf, 'place_order');
placeOrderTrace.start();
await placeOrder(/* ... */);
placeOrderTrace.stop();
```

**Metrics to Monitor:**
- Page load time
- Order placement duration
- KDS update latency
- Payment processing time
- Image upload time

---

### Security Best Practices

#### API Key Protection
```typescript
// ✅ CORRECT: Use environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// ❌ WRONG: Hardcoded keys
const apiKey = "AIzaSyALe8znJtnhiRUe6CrPAMRWq04lS2gGduY";
```

#### Firestore Rules Testing
```bash
# Test rules before deploying
firebase emulators:start
npm run test:rules
```

#### Payment Security
- **Never** store card details in Firestore
- Use tokenization (Stripe Elements, Square SDK)
- PCI compliance via gateway
- Encrypt payment gateway credentials

#### User Data Protection
- Hash passwords (Firebase Auth handles this)
- Encrypt sensitive tenant config
- GDPR compliance (data export/deletion)
- Audit logs for admin actions

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | 99.9% | Firebase status + Sentry |
| **Page Load Time** | < 2 seconds | Firebase Performance |
| **API Response Time** | < 500ms | Firebase Performance |
| **Error Rate** | < 0.1% | Sentry error count / total users |
| **Test Coverage** | > 80% | Vitest coverage report |
| **Build Time** | < 3 minutes | GitHub Actions logs |
| **Offline Sync Success** | > 95% | Custom analytics event |

### Business Metrics

| Month | Target Clients | Target MRR | Actual Clients | Actual MRR | Notes |
|-------|----------------|------------|----------------|------------|-------|
| Month 1 | 2 | £98 | - | - | Phase 1 completion |
| Month 2 | 3 | £176 | - | - | First new client |
| Month 3 | 5 | £361 | - | - | Phase 2 completion |
| Month 4 | 7 | £478 | - | - | 2 more clients |
| Month 5 | 8 | £556 | - | - | Phase 3 completion |
| Month 6 | 10 | £780 | - | - | Target milestone |

### Client Satisfaction Metrics

**Monthly Survey (NPS Score):**
- How likely are you to recommend this system? (0-10)
- Target: NPS > 50 (Excellent)

**Support Tickets:**
- Target: < 5 tickets per client per month
- Resolution time: < 24 hours for critical, < 72 hours for normal

**Feature Requests:**
- Track in GitHub Issues
- Prioritize based on # of clients requesting
- Aim to implement top 3 requests per quarter

---

## Progress Tracking

### Phase 1 Checklist

#### Week 1-2: Multi-Tenant Architecture ✅ **COMPLETED - October 24, 2025**
- [x] Create `contexts/TenantContext.tsx`
- [x] Update `types.ts` with Tenant interface
- [x] Create `scripts/migrate-to-multitenant.ts` (+ .cjs version)
- [x] Create `firebase/api-multitenant.ts` (new file, all functions tenant-scoped)
- [x] Write new `firestore.rules` (tenant isolation implemented)
- [x] Create `storage.rules` for Firebase Storage
- [x] Update `App.tsx` with TenantProvider
- [x] Update all admin components to use multi-tenant API
- [x] Update all admin components to use `tenant?.id` pattern
- [x] Test subdomain detection locally (demo-tenant)
- [x] Run migration script successfully
- [x] Deploy security rules to production
- [x] Deploy storage rules to production
- [x] Verify basic tenant isolation works
- [x] **BONUS:** Add customer names to Order interface
- [x] **BONUS:** Display customer names in OrderManager
- [x] **BONUS:** Display customer names in KitchenDisplaySystem
- [x] **BONUS:** Auto-migrate legacy users (add tenantId on first order)
- [x] **FIX:** All components use correct tenantId access pattern
- [x] **FIX:** Order placement working for legacy and new users
- [x] **DOCS:** Created PROJECT_STATUS.md
- [x] **DOCS:** Created TROUBLESHOOTING_GUIDE.md

#### Week 3-4: Authentication & User Management ⏸️ NOT STARTED
- [ ] Set up Firebase Cloud Functions project
- [ ] Implement `inviteUser` function
- [ ] Implement `acceptInvitation` function
- [ ] Integrate email service (SendGrid/Mailgun)
- [ ] Create `components/admin/UserManager.tsx`
- [ ] Create `components/auth/InvitationAcceptance.tsx`
- [ ] Update `contexts/AuthContext.tsx`
- [ ] Test invitation flow end-to-end
- [ ] Deploy functions to staging
- [ ] Test with Client 1 & 2

#### Week 5-6: Offline Sync & Dine-In ⏸️ NOT STARTED
- [ ] Enable offline persistence in `firebase/config.ts`
- [ ] Create `firebase/offlineCache.ts`
- [ ] Create `components/OfflineIndicator.tsx`
- [ ] Create `components/OrderTypeSelector.tsx`
- [ ] Create `components/TableNumberPicker.tsx`
- [ ] Update Order type with orderType/tableNumber
- [ ] Update `components/CartModal.tsx`
- [ ] Update KDS to show table numbers
- [ ] Test offline order creation
- [ ] Test with Client 1 (takeaway only)
- [ ] Test with Client 2 (dine-in)

---

### Phase 2 Checklist ⏸️ NOT STARTED

#### Week 7-8: Floor Plan Builder
- [ ] Create Table interface in `types.ts`
- [ ] Create `components/admin/FloorPlanBuilder.tsx`
- [ ] Create `components/admin/TableEditor.tsx`
- [ ] Create `components/FloorPlanView.tsx`
- [ ] Implement grid system
- [ ] Implement table creation/editing
- [ ] Save floor plan to Firestore
- [ ] Test with Client 2 (8 tables)

#### Week 9-10: Reservation System (Basic)
- [ ] Create Reservation interface
- [ ] Create `components/ReservationModal.tsx`
- [ ] Create `components/admin/ReservationManager.tsx`
- [ ] Create `firebase/reservations.ts`
- [ ] Implement manual table assignment
- [ ] Test reservation creation
- [ ] Test admin workflow

#### Week 11-12: Availability Algorithm
- [ ] Create ServicePeriod interface
- [ ] Create `components/admin/ServicePeriodManager.tsx`
- [ ] Implement availability algorithm
- [ ] Implement auto-assignment
- [ ] Implement table merging
- [ ] Test with various scenarios

#### Week 13-14: Refinement
- [ ] Polish UI/UX
- [ ] Add email confirmations
- [ ] Comprehensive testing with Client 2
- [ ] Bug fixes
- [ ] Performance optimization

---

### Phase 3 Checklist ⏸️ NOT STARTED

#### Week 15-16: Sales Analytics
- [ ] Install Recharts
- [ ] Create SalesMetrics interface
- [ ] Create `components/admin/SalesDashboard.tsx`
- [ ] Create `utils/analytics.ts`
- [ ] Implement revenue charts
- [ ] Implement top products ranking
- [ ] Add CSV export
- [ ] Test with real data

#### Week 17-18: Visitor Tracking
- [ ] Create VisitorMetrics interface
- [ ] Create `components/admin/VisitorMetrics.tsx`
- [ ] Create `components/admin/PeakHoursHeatmap.tsx`
- [ ] Implement metrics calculation
- [ ] Test with Client 1 & 2

---

### Phase 4 Checklist ⏸️ NOT STARTED

#### Week 19: Payment Gateway Abstraction
- [ ] Create `payment/PaymentGateway.interface.ts`
- [ ] Implement `payment/StripeGateway.ts`
- [ ] Implement `payment/SquareGateway.ts`
- [ ] Create `firebase/functions/src/payment.ts`
- [ ] Test Stripe integration
- [ ] Test Square integration

#### Week 20: Payment UI
- [ ] Create `components/PaymentModal.tsx`
- [ ] Create `components/StripeCheckout.tsx`
- [ ] Create `components/SquareCheckout.tsx`
- [ ] Create `components/admin/PaymentManager.tsx`
- [ ] End-to-end testing
- [ ] Deploy to production

---

## Risks & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Offline sync conflicts** | Medium | High | Use Firestore's built-in conflict resolution, timestamp-based |
| **Payment gateway downtime** | Low | High | Implement retry logic, fallback to manual payment |
| **Security breach** | Low | Critical | Follow best practices, regular security audits, Sentry alerts |
| **Firebase quota limits** | Medium | Medium | Monitor usage, upgrade plan if needed, optimize queries |
| **Performance degradation** | Medium | Medium | Firebase Performance Monitoring, CDN for images, lazy loading |
| **Data migration failure** | Low | High | Test migration script extensively on staging, backup before running |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Client churn** | Medium | High | Excellent support, regular check-ins, feature requests prioritized |
| **Competitor emerges** | Medium | Medium | Differentiate with offline support, integrated system, white-glove service |
| **Slow client acquisition** | High | Medium | Improve demos, offer extended trials, referral program |
| **Scope creep** | High | Medium | Strict phase boundaries, "parking lot" for future features |
| **Development delays** | Medium | Medium | Buffer time in estimates, AI assistance (Claude Code/Cursor) |

---

## Next Steps (Immediate)

### Week 1 Tasks - Starting Now

**Priority 1: Firebase Cloud Functions Setup**
1. Create `firebase/functions` directory
2. Initialize Functions project
3. Install dependencies
4. Set up TypeScript configuration
5. Deploy hello-world function to test

**Priority 2: Data Migration**
1. Review migration script
2. Test on staging environment
3. Backup production data
4. Run migration
5. Verify data integrity

**Priority 3: Tenant Context**
1. Create `contexts/TenantContext.tsx`
2. Update `types.ts`
3. Wrap App with TenantProvider
4. Test subdomain detection (localhost)

**Priority 4: Security Rules**
1. Write comprehensive Firestore rules
2. Test rules with Firebase Emulator
3. Deploy to staging
4. Verify tenant isolation

**Priority 5: Update API Functions**
1. Refactor all functions in `firebase/api.ts`
2. Add tenantId parameter
3. Update all component calls
4. Test existing functionality

---

## Communication Plan

### Client Updates

**Weekly Email (Fridays):**
- Progress this week
- Completed features
- Next week's plan
- Any blockers

**Monthly Demo (Last Friday of Month):**
- Live demo of new features
- Collect feedback
- Prioritize next month
- Q&A session

### Internal Progress Tracking

**Daily Standup (Self):**
- What did I complete yesterday?
- What will I work on today?
- Any blockers?

**Weekly Review:**
- Review this document
- Update progress checkboxes
- Adjust timeline if needed
- Update risk assessment

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 23, 2025 | Claude Code | Initial comprehensive plan |
| - | - | - | - |
| - | - | - | - |

---

## Appendix

### Glossary

- **Tenant:** A business (restaurant/café) using the platform
- **Multi-tenancy:** Architecture where multiple businesses share the same codebase but have isolated data
- **KDS:** Kitchen Display System - screen showing orders for kitchen staff
- **Base Module:** Core ordering system (takeaway/dine-in)
- **Table Module:** Reservation & floor plan management
- **Management Module:** Analytics & reporting
- **MRR:** Monthly Recurring Revenue
- **NPS:** Net Promoter Score (customer satisfaction metric)

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests
npm test -- --coverage   # Run tests with coverage

# Firebase
firebase login                              # Authenticate
firebase use staging                        # Switch to staging project
firebase use production                     # Switch to production project
firebase deploy --only hosting              # Deploy frontend only
firebase deploy --only functions            # Deploy functions only
firebase emulators:start                    # Start local emulators

# Git
git checkout -b feature/floor-plan-builder  # Create feature branch
git add .                                   # Stage changes
git commit -m "Implement floor plan grid"   # Commit
git push origin feature/floor-plan-builder  # Push to remote
```

### Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **React Docs:** https://react.dev
- **Firestore Best Practices:** https://firebase.google.com/docs/firestore/best-practices
- **Stripe Docs:** https://stripe.com/docs
- **Square Docs:** https://developer.squareup.com

---

**End of Implementation Plan**

*Last Updated: October 23, 2025*
