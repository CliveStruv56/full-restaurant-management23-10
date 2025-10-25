# Dine-In Order Types - Specification

**Feature:** Dine-In Order Types with Table Management
**Date:** October 25, 2025
**Status:** ✅ COMPLETED
**Effort:** Small (2-3 days)

## Overview

Extend the order placement system to support both takeaway and dine-in order types. For dine-in orders, capture table number and guest count to help kitchen staff prioritize and organize service. KDS displays table information prominently for dine-in orders.

## Business Value

**Problem:** Restaurant needs to distinguish between takeaway and dine-in orders for kitchen workflow and service optimization.

**Solution:** Order type selection in cart flow, with conditional table/guest inputs for dine-in, and prominent KDS display.

**Impact:**
- Clear distinction between order types
- Better kitchen workflow organization
- Improved table service tracking
- Foundation for future table management features

## Architecture

### Components

1. **Order Type Selection** ([components/CartModal.tsx](components/CartModal.tsx:228-265))
   - Toggle buttons for "Takeaway" vs "Dine-In"
   - Default: Takeaway
   - Visual feedback with color-coded buttons

2. **Dine-In Fields** ([components/CartModal.tsx](components/CartModal.tsx:267-311))
   - Table number dropdown (conditional on dine-in selection)
   - Guest count input (number input, min 1, max 20)
   - Validation before order placement

3. **KDS Table Display** ([components/admin/KitchenDisplaySystem.tsx](components/admin/KitchenDisplaySystem.tsx:127-156))
   - Prominent blue badge for dine-in orders showing table number
   - Guest count display
   - Green badge for takeaway orders
   - Visual distinction at a glance

4. **Backend Support** ([firebase/api-multitenant.ts](firebase/api-multitenant.ts:135-214))
   - Already supported `orderType`, `tableNumber`, `guestCount` parameters
   - No backend changes needed

## Implementation Details

### Order Flow

```
1. Customer adds items to cart
2. Opens cart modal
3. Selects order type:
   - Takeaway → proceeds to time selection
   - Dine-In → shows table + guest fields
4. For Dine-In:
   - Selects table number from dropdown
   - Enters guest count
   - Validation enforced
5. Selects collection time
6. Places order
7. Order created with type metadata
```

### Data Model

**Order Interface** (already existed in [types.ts](types.ts:102-121)):
```typescript
export interface Order {
  // ... existing fields
  orderType: 'takeaway' | 'dine-in' | 'delivery';
  tableNumber?: number; // Optional, for dine-in orders
  guestCount?: number; // Optional, for dine-in orders
}
```

**AppSettings Interface** ([types.ts](types.ts:156)):
```typescript
export interface AppSettings {
  // ... existing fields
  availableTables?: number[]; // NEW: Configurable table numbers
}
```

### KDS Display Logic

**Dine-In Badge:**
- Background: Blue (#2563eb)
- Large font (1.1rem)
- Shows: "🍽️ TABLE {number} ({guests} guests)"
- Positioned prominently after customer name

**Takeaway Badge:**
- Background: Green (#10b981)
- Smaller font (0.875rem)
- Shows: "📦 TAKEAWAY"
- Less prominent than dine-in

**Priority:** Table numbers help staff identify which orders to prioritize for immediate table service.

## Files Modified

### Modified Files
- [types.ts](types.ts:156) - Added `availableTables` to AppSettings
- [components/CartModal.tsx](components/CartModal.tsx) - Added order type selection and dine-in fields
- [App.tsx](App.tsx:145-174) - Updated handlePlaceOrder signature
- [components/admin/KitchenDisplaySystem.tsx](components/admin/KitchenDisplaySystem.tsx:127-156) - Added table/order type display

### Existing Files (No Changes Needed)
- [firebase/api-multitenant.ts](firebase/api-multitenant.ts:135-214) - Backend already supported

## Configuration

### Default Table Numbers

When `settings.availableTables` is undefined, defaults to tables 1-10:
```typescript
(settings.availableTables || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
```

### Future: Admin Configuration

**Planned Enhancement:**
- Add table configuration UI in SettingsManager
- Allow admins to define available tables
- Support non-sequential table numbers (e.g., 101, 102, 201, 202)
- Save to Firestore settings

**UI Mockup:**
```
Available Tables
[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
[+] Add Table
```

## Validation Rules

### Dine-In Orders
1. **Table Number:** Required, must be selected from dropdown
2. **Guest Count:** Required, must be >= 1
3. **Collection Time:** Required (same as takeaway)

### Takeaway Orders
1. **Collection Time:** Required only
2. Table number and guest count ignored

### Error Messages
- "Please select a table number for dine-in orders."
- "Please enter the number of guests."
- "Please select a collection time."

## Testing Instructions

### Manual Testing

1. **Test Takeaway Order:**
   ```
   - Add items to cart
   - Open cart modal
   - Verify "Takeaway" is selected by default
   - Verify no table/guest fields visible
   - Select time and place order
   - Check KDS shows green "📦 TAKEAWAY" badge
   ```

2. **Test Dine-In Order:**
   ```
   - Add items to cart
   - Open cart modal
   - Click "Dine-In" button
   - Verify table number dropdown appears
   - Verify guest count input appears
   - Try placing order without selecting table → should fail
   - Select table number
   - Enter guest count
   - Select time and place order
   - Check KDS shows blue badge: "🍽️ TABLE {number} ({guests} guests)"
   ```

3. **Test Validation:**
   ```
   - Select dine-in
   - Leave table number empty → error
   - Set guest count to 0 → error
   - Set guest count to -1 → error
   - Set guest count to 1 → success
   ```

4. **Test KDS Display:**
   ```
   - Create mix of takeaway and dine-in orders
   - Open KDS
   - Verify dine-in orders show blue badge with table number prominently
   - Verify takeaway orders show small green badge
   - Verify badges don't interfere with overdue indicators
   ```

## Success Metrics

- ✅ Order type can be selected
- ✅ Dine-in shows conditional fields
- ✅ Table number and guest count captured
- ✅ Validation prevents invalid orders
- ✅ KDS shows table numbers prominently
- ✅ Takeaway orders work as before
- ✅ TypeScript compilation succeeds
- ✅ No breaking changes

## Known Limitations

1. **Table Availability:**
   - No real-time table availability checking
   - Multiple orders can select same table
   - No table status management (occupied, reserved, available)

2. **Table Configuration:**
   - Tables 1-10 are hardcoded defaults
   - Admin UI for table config not yet implemented
   - Cannot define custom table layouts or names

3. **Order Type Switching:**
   - Cannot change order type after placement
   - No validation that table is available at collection time

4. **Future Enhancement Needed:**
   - Table management UI (Phase 3)
   - Real-time table status
   - Visual floor plan
   - Reservation system integration

## Future Enhancements

1. **Admin Table Configuration:**
   - Settings UI to define available tables
   - Support for table names (e.g., "Patio 1", "Window 3")
   - Table capacity limits

2. **Table Status Tracking:**
   - Real-time occupied/available status
   - Prevent double-booking same table/time
   - Table turnover estimates

3. **Delivery Order Type:**
   - Add "Delivery" as third option
   - Capture delivery address
   - Delivery fee calculation
   - Integration with delivery platforms (Phase 6)

4. **Order History by Table:**
   - View all orders for specific table
   - Table service timeline
   - Average table duration analytics

## References

- [Order Interface](types.ts:102-121)
- [AppSettings Interface](types.ts:135-157)
- [CartModal Component](components/CartModal.tsx)
- [Kitchen Display System](components/admin/KitchenDisplaySystem.tsx)
- [Multi-tenant API](firebase/api-multitenant.ts:135-214)
