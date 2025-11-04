# Quick Test Guide - Vertical System

**5-minute verification of the multi-vertical platform**

## Prerequisites
```bash
npm run dev
# Server running at http://localhost:5173
```

---

## Test 1: Visual Verification (2 minutes)

### Add Test Component to Admin Panel

1. **Open**: [components/admin/AdminPanel.tsx](../components/admin/AdminPanel.tsx)

2. **Add import** (top of file):
```typescript
import { VerticalSystemTest } from '../../src/components/test/VerticalSystemTest';
```

3. **Add component** (after the header, before tabs):
```typescript
{/* Temporary: Vertical System Test - REMOVE AFTER TESTING */}
<VerticalSystemTest />
```

4. **Navigate** to Admin Panel:
   - URL: `http://localhost:5173/admin`
   - Or click "Admin" in header

5. **Verify output**:
   ```
   🧪 Vertical System Test

   ✓ Tenant ID: demo-tenant
   ✓ Vertical Type: restaurant
   ✓ Terminology: dish, dishes, category, order, table
   ✓ Is Restaurant: Yes
   ✓ Has Table Management: Enabled
   ✓ Has Inventory: Enabled
   ✓ Collection: products (legacy)
   ```

6. **Remove component** when done testing

---

## Test 2: Terminology Check (1 minute)

**Navigate**: Admin Panel → Product Management

**Verify UI labels**:
- [ ] Page title: "Manage **Dishes**" (not "Manage Products")
- [ ] Add button: "Add **Dish**" (not "Add Product")
- [ ] Delete modal: "delete this **dish**"
- [ ] Export button: "Export **Dishes**"

**Expected for Restaurant vertical**:
```
✓ "dish" / "dishes"
✓ "category" / "categories"
✓ "order" / "orders"
✓ "table" / "tables"
```

---

## Test 3: Database Dual-Write (2 minutes)

### Create Test Product

1. **Navigate**: Admin Panel → Products
2. **Click**: "Add Dish"
3. **Fill in**:
   - Name: "Test Cappuccino"
   - Price: 5.00
   - Category: Beverages
4. **Save**

### Verify in Firestore

1. **Open**: [Firebase Console](https://console.firebase.google.com) → Firestore
2. **Navigate**: `tenants/demo-tenant/products`
3. **Find**: "Test Cappuccino" document
4. **Copy**: Document ID
5. **Navigate**: `tenants/demo-tenant/items`
6. **Verify**: Same document ID exists with same data

**Checklist**:
- [ ] Document in `products` collection
- [ ] Document in `items` collection (same ID)
- [ ] Both have `_verticalType: "restaurant"`
- [ ] `items` document has `_sourceCollection: "products"`

### Clean Up
Delete "Test Cappuccino" from product list

---

## Test 4: Sample Data Check (Optional)

**For new tenants only** - Skip if using existing `demo-tenant`

### Create New Test Tenant

1. **Navigate**: Super Admin Portal (`http://superadmin.localhost:5173`)
2. **Create tenant**: "Test Restaurant 2"
3. **Select vertical**: Restaurant
4. **Complete signup**
5. **Approve tenant**

### Verify Sample Data

**Navigate**: New tenant portal → Admin Panel

**Check Categories**:
- [ ] Beverages ☕
- [ ] Appetizers 🥗
- [ ] Main Courses 🍽️
- [ ] Desserts 🍰

**Check Products**:
- [ ] Espresso ($3.50)
- [ ] Cappuccino ($4.50)
- [ ] Caesar Salad ($8.95)

**Check Tables**:
- [ ] Table 1 (Main Dining, capacity 2)
- [ ] Table 2 (Main Dining, capacity 4)
- [ ] Bar 1 (Bar, capacity 1)

---

## Test 5: Browser Console Check

**Open**: Browser DevTools (F12) → Console

**Look for**:
```
✅ Tenant loaded: Demo Coffee Shop
✅ Vertical type: restaurant
🎨 Initializing tenant... (if new tenant)
✅ Successfully initialized tenant
```

**Should NOT see**:
```
❌ No errors about VerticalContext
❌ No errors about missing verticalType
❌ No errors about CollectionMapper
```

---

## Quick Verification Checklist

Copy this to verify all systems:

```
VERTICAL SYSTEM VERIFICATION
═══════════════════════════════════════

Visual Test Component:
  [ ] Test component displays
  [ ] Shows correct tenant ID
  [ ] Shows verticalType: "restaurant"
  [ ] Shows terminology: dish, dishes
  [ ] Shows "Is Restaurant: Yes"
  [ ] Shows enabled features

Terminology in UI:
  [ ] Product page shows "Manage Dishes"
  [ ] Add button shows "Add Dish"
  [ ] Delete shows "delete this dish"
  [ ] Export shows "Export Dishes"

Database Dual-Write:
  [ ] Created product in products/
  [ ] Same product in items/
  [ ] Both have _verticalType
  [ ] items/ has _sourceCollection

Sample Data (new tenants):
  [ ] 4 categories created
  [ ] 3+ products created
  [ ] 6 tables created
  [ ] All flagged _isSampleData: true

Console Verification:
  [ ] No VerticalContext errors
  [ ] No CollectionMapper errors
  [ ] Tenant loaded successfully
  [ ] Vertical type detected

═══════════════════════════════════════
All checked? ✅ System working correctly!
```

---

## Troubleshooting

### "useVertical must be used within a VerticalProvider"
**Fix**: Check [App.tsx](../App.tsx) wraps with `<VerticalProvider>`

### Terminology not updating
**Fix**: Check tenant has `verticalType` field in Firestore

### Sample data missing
**Fix**: Check browser console for initialization errors

### Dual-write not working
**Fix**: Ensure using CollectionMapper for database operations

---

## Full Testing Guide

For comprehensive testing procedures, see:
- [TESTING_VERTICAL_SYSTEM.md](./TESTING_VERTICAL_SYSTEM.md)

For adding new verticals, see:
- [ADDING_NEW_VERTICALS.md](./ADDING_NEW_VERTICALS.md)

---

## After Testing

**Remove test component**:
1. Open [components/admin/AdminPanel.tsx](../components/admin/AdminPanel.tsx)
2. Remove `<VerticalSystemTest />` line
3. Remove import statement
4. Save file

**Optional**: Delete test component file
```bash
rm src/components/test/VerticalSystemTest.tsx
```

---

**Status**: ✅ Phase 1 Complete - Multi-Vertical Platform Abstraction
**Next**: Implement remaining verticals (auto-shop, salon, hotel, retail)
