# Dine-In Order Types - Implementation Tasks

**Feature:** Dine-In Order Types with Table Management
**Date:** October 25, 2025
**Status:** ✅ COMPLETED
**Git Commit:** `2234707`

---

## Task List

### Task 1: Update AppSettings Type with Table Configuration ✅

**Status:** COMPLETED
**Effort:** 5 minutes

**Description:**
Add `availableTables` field to AppSettings interface to allow tenant configuration of available table numbers.

**Files Modified:**
- `types.ts`

**Changes:**
```typescript
export interface AppSettings {
  // ... existing fields
  availableTables?: number[]; // NEW: Available table numbers for dine-in orders
}
```

**Default Behavior:**
- Optional field (backward compatible)
- Defaults to `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` in UI if not configured
- Future: Admin UI will allow customization

---

### Task 2: Update CartModal with Order Type Selection UI ✅

**Status:** COMPLETED
**Effort:** 45 minutes

**Description:**
Add order type selection (Takeaway/Dine-In) to CartModal with conditional table number and guest count inputs for dine-in orders.

**Files Modified:**
- `components/CartModal.tsx`

**Changes Made:**

**1. Update Props Interface:**
```typescript
interface CartModalProps {
  // ... existing props
  onPlaceOrder: (
    collectionTime: string,
    finalTotal: number,
    orderType: 'takeaway' | 'dine-in' | 'delivery',
    tableNumber?: number,
    guestCount?: number,
    rewardItem?: { name: string, price: number }
  ) => void;
}
```

**2. Add State:**
```typescript
const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | 'delivery'>('takeaway');
const [tableNumber, setTableNumber] = useState<number | undefined>(undefined);
const [guestCount, setGuestCount] = useState<number>(2);
```

**3. Add Order Type Selection UI:**
- Two toggle buttons: "Takeaway" and "Dine-In"
- Color-coded: Active = green (#10b981), Inactive = gray (#f3f4f6)
- Full-width buttons with clear labels

**4. Add Dine-In Conditional Fields:**
- Table number dropdown (populated from `settings.availableTables` or default 1-10)
- Guest count number input (min: 1, max: 20, default: 2)
- Only visible when orderType === 'dine-in'
- Side-by-side layout for space efficiency

**5. Add Validation:**
```typescript
if (orderType === 'dine-in') {
  if (tableNumber === undefined || tableNumber === null) {
    toast.error("Please select a table number for dine-in orders.");
    return;
  }
  if (!guestCount || guestCount < 1) {
    toast.error("Please enter the number of guests.");
    return;
  }
}
```

**6. Update handlePlaceOrderClick:**
```typescript
onPlaceOrder(
  selectedTime,
  finalTotal,
  orderType,
  orderType === 'dine-in' ? tableNumber : undefined,
  orderType === 'dine-in' ? guestCount : undefined,
  reward
);
```

**Testing:**
- ✅ Takeaway selected by default
- ✅ Dine-In button shows table/guest fields
- ✅ Validation prevents placing order without table number
- ✅ Validation prevents placing order with invalid guest count
- ✅ Guest count must be >= 1

---

### Task 3: Update App.tsx to Pass Order Details to placeOrder ✅

**Status:** COMPLETED
**Effort:** 10 minutes

**Description:**
Update `handlePlaceOrder` callback in App.tsx to accept and pass order type, table number, and guest count to backend.

**Files Modified:**
- `App.tsx`

**Changes:**

**1. Update Function Signature:**
```typescript
const handlePlaceOrder = useCallback(async (
  collectionTime: string,
  finalTotal: number,
  orderType: 'takeaway' | 'dine-in' | 'delivery',
  tableNumber?: number,
  guestCount?: number,
  rewardItem?: { name: string, price: number }
) => {
  // ... implementation
}, [cart, user, tenantId]);
```

**2. Pass Parameters to Backend:**
```typescript
await placeOrder(
  tenantId,
  user.uid,
  cart,
  finalTotal,
  collectionTime,
  orderType,      // NEW
  tableNumber,    // NEW
  guestCount,     // NEW
  rewardItem
);
```

**Backend Support:**
- Backend `placeOrder` function in `firebase/api-multitenant.ts` already supported these parameters
- No backend changes needed!

**Testing:**
- ✅ Orders placed with order type metadata
- ✅ Table number saved to Firestore
- ✅ Guest count saved to Firestore
- ✅ Takeaway orders don't include table/guest data

---

### Task 4: Update KDS to Display Table Numbers Prominently ✅

**Status:** COMPLETED
**Effort:** 20 minutes

**Description:**
Add prominent visual badges to Kitchen Display System showing table numbers for dine-in orders and order type for all orders.

**Files Modified:**
- `components/admin/KitchenDisplaySystem.tsx`

**Changes Made:**

**1. Add Dine-In Badge (after customer name):**
```typescript
{order.orderType === 'dine-in' && order.tableNumber && (
  <div style={{
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    padding: '10px 15px',
    borderRadius: '6px',
    textAlign: 'center',
    marginBottom: '10px',
    letterSpacing: '0.5px',
  }}>
    🍽️ TABLE {order.tableNumber} {order.guestCount && `(${order.guestCount} guests)`}
  </div>
)}
```

**2. Add Takeaway Badge:**
```typescript
{order.orderType === 'takeaway' && (
  <div style={{
    backgroundColor: '#10b981',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '6px 12px',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '10px',
  }}>
    📦 TAKEAWAY
  </div>
)}
```

**Visual Design:**
- **Dine-In:** Large blue badge (#2563eb) with table number prominently displayed
- **Takeaway:** Smaller green badge (#10b981) less prominent
- **Positioning:** After customer name, before overdue indicator
- **Icons:** 🍽️ for dine-in, 📦 for takeaway

**Benefits:**
- Staff can immediately identify table orders at a glance
- Color coding helps prioritize table service
- Guest count helps with portion expectations
- Clear visual distinction between order types

**Testing:**
- ✅ Dine-in orders show blue badge with table number
- ✅ Guest count displays correctly when present
- ✅ Takeaway orders show green badge
- ✅ Badges don't interfere with overdue indicators
- ✅ Responsive layout (works on mobile/tablet KDS)

---

### Task 5: Build and Test End-to-End Flow ✅

**Status:** COMPLETED
**Effort:** 15 minutes

**Description:**
Run production build and verify TypeScript compilation, then test complete order flow.

**Build Command:**
```bash
npm run build
```

**Build Result:**
```
✓ 482 modules transformed.
✓ built in 1.15s
dist/assets/index-ik_n8bxW.js  1,231.75 kB
```

**Verification:**
- ✅ No TypeScript errors
- ✅ No breaking changes
- ✅ Build successful

**Manual Testing:**
1. **Takeaway Order:**
   - Selected "Takeaway" in cart
   - Table/guest fields hidden ✅
   - Placed order successfully ✅
   - KDS shows green "📦 TAKEAWAY" badge ✅

2. **Dine-In Order:**
   - Selected "Dine-In" in cart
   - Table/guest fields appear ✅
   - Selected table 5, 2 guests ✅
   - Placed order successfully ✅
   - KDS shows blue "🍽️ TABLE 5 (2 guests)" badge ✅

3. **Validation:**
   - Tried placing dine-in order without table → error shown ✅
   - Tried placing order with 0 guests → error shown ✅
   - All validation working correctly ✅

---

## Summary of Changes

### Files Modified (3)
1. `types.ts` - Added `availableTables` to AppSettings
2. `components/CartModal.tsx` - Order type selection + dine-in fields
3. `App.tsx` - Updated handlePlaceOrder signature
4. `components/admin/KitchenDisplaySystem.tsx` - Table badges

### Files Not Modified (Backend Already Supported)
1. `firebase/api-multitenant.ts` - Already had `orderType`, `tableNumber`, `guestCount` parameters

---

## Testing Results

### Functional Testing ✅

**Test 1: Order Type Selection**
- ✅ "Takeaway" selected by default
- ✅ Clicking "Dine-In" shows table/guest fields
- ✅ Clicking "Takeaway" hides table/guest fields
- ✅ Visual feedback (button colors) works correctly

**Test 2: Table Selection**
- ✅ Dropdown shows tables 1-10 (default)
- ✅ "Select table..." placeholder shown initially
- ✅ Can select any table number
- ✅ Selected table saved correctly

**Test 3: Guest Count**
- ✅ Default value is 2
- ✅ Can enter any number 1-20
- ✅ Cannot enter 0 or negative numbers
- ✅ Value saved correctly

**Test 4: Validation**
- ✅ Takeaway orders don't require table/guests
- ✅ Dine-in without table shows error
- ✅ Dine-in with guest count < 1 shows error
- ✅ All validation messages clear and helpful

**Test 5: KDS Display**
- ✅ Dine-in orders show prominent blue badge
- ✅ Table number displays correctly
- ✅ Guest count displays when present
- ✅ Takeaway orders show green badge
- ✅ Badges integrate well with existing UI
- ✅ No layout issues on different screen sizes

**Test 6: Data Persistence**
- ✅ Order document in Firestore contains orderType
- ✅ tableNumber field present for dine-in orders
- ✅ guestCount field present for dine-in orders
- ✅ Takeaway orders don't have table/guest fields

---

## Known Limitations

1. **Table Configuration:**
   - Tables 1-10 are hardcoded default
   - `availableTables` field exists in AppSettings but no admin UI yet
   - Cannot define custom table numbers or names
   - Future: Admin settings page for table configuration

2. **Product Availability:**
   - Backend supports `availableFor` field on products
   - No admin UI to configure per-product availability
   - All products currently available for both order types
   - Future: ProductManager UI to set dine-in/takeaway only items

3. **Table Availability:**
   - No real-time table status checking
   - Multiple orders can select same table
   - No "table occupied" indicator
   - Future: Phase 3 Table Status View

4. **Order Type Switching:**
   - Cannot change order type after placement
   - Would require admin edit functionality
   - Future enhancement

---

## Future Enhancements

### Phase 3 Features (Planned)

1. **Admin Table Configuration:**
   - Settings UI to define available tables
   - Support for non-sequential table numbers (e.g., 101, 102, 201, 202)
   - Table names (e.g., "Patio 1", "Window 3")
   - Table capacity limits

2. **Table Status Tracking:**
   - Real-time occupied/available/reserved status
   - Prevent double-booking same table
   - Table turnover estimates
   - Visual floor plan

3. **Product Availability Admin UI:**
   - Checkboxes in ProductManager: ☐ Dine-In ☐ Takeaway
   - Menu filtering by order type
   - Different pricing by order type

4. **Delivery Order Type:**
   - Add "Delivery" as third option
   - Capture delivery address
   - Delivery fee calculation
   - Integration with delivery platforms

---

## Performance Impact

**Negligible Impact:**
- No performance degradation observed
- CartModal renders quickly with new fields
- KDS badges render instantly
- No additional database queries needed

**Benefits:**
- Better kitchen workflow organization
- Improved staff efficiency
- Foundation for Phase 3 table management
- Clear visual prioritization

---

## Documentation

**Specification:**
- `agent-os/specs/2025-10-25-dine-in-order-types/spec.md`

**Related Features:**
- Phase 3: Table Management Module (upcoming)
- Phase 3: Reservation System (upcoming)

---

**Implementation Complete:** October 25, 2025
**Total Effort:** ~1.5 hours
**Status:** ✅ Fully functional and tested
