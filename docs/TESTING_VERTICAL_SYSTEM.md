# Testing the Multi-Vertical Platform System

This guide provides comprehensive testing procedures for the multi-vertical platform abstraction system.

## Table of Contents
1. [Quick Start Testing](#quick-start-testing)
2. [Manual Testing Procedures](#manual-testing-procedures)
3. [Automated Testing](#automated-testing)
4. [Database Verification](#database-verification)
5. [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Quick Start Testing

### Prerequisites
1. Firebase project configured
2. Local development environment running (`npm run dev`)
3. Super admin access configured
4. Test tenant(s) created

### 5-Minute Quick Test
```bash
# 1. Start dev server
npm run dev

# 2. Access super admin portal
# Navigate to: http://superadmin.localhost:5173

# 3. Create a test restaurant tenant
# - Click "Create New Tenant"
# - Select "Restaurant" vertical
# - Complete signup

# 4. Access tenant portal
# Navigate to: http://demo-tenant.localhost:5173
# (or your test tenant subdomain)

# 5. Verify terminology
# - Admin Panel → Manage Products
# - Should display "Manage Dishes" for restaurant
```

---

## Manual Testing Procedures

### Test 1: Vertical Selection in Signup Flow

**Objective**: Verify users can select different verticals during signup.

**Steps**:
1. Navigate to signup page: `http://localhost:5173/signup`
2. Fill in business information
3. **Test vertical dropdown**:
   - Click "Business Type" dropdown
   - Verify all 5 verticals appear:
     - Restaurant & Coffee Shop
     - Auto Shop & Mechanic
     - Salon & Spa
     - Hotel & Lodging
     - Retail & Shop
4. **Select Restaurant**:
   - Verify description updates: "Restaurants, cafes, coffee shops, food trucks..."
5. **Select Auto Shop**:
   - Verify description updates: "Auto repair shops, mechanics, tire shops..."
6. Complete signup
7. Verify tenant created with correct `verticalType` in Firestore

**Expected Results**:
- ✅ All verticals displayed in dropdown
- ✅ Descriptions update dynamically
- ✅ Tenant document has `verticalType: 'restaurant'` (or selected type)
- ✅ No console errors

**Firestore Verification**:
```
tenantMetadata/{tenantId}
  ├── businessName: "Test Restaurant"
  ├── verticalType: "restaurant"  ← Verify this field
  └── status: "pending"
```

---

### Test 2: Super Admin Vertical Management

**Objective**: Verify super admin can view and manage verticals.

**Steps**:
1. Navigate to super admin portal: `http://superadmin.localhost:5173`
2. Log in as super admin
3. **View tenant list**:
   - Verify "Vertical" column appears
   - Verify vertical icons/badges display
4. **Create new tenant**:
   - Click "Create Tenant"
   - Select different vertical types
   - Complete tenant creation for each vertical
5. **Verify tenant cards**:
   - Restaurant tenant shows: 🍽️ Restaurant
   - Auto-shop tenant shows: 🔧 Auto Shop
   - Salon tenant shows: ✂️ Salon

**Expected Results**:
- ✅ Vertical type visible in tenant list
- ✅ Different verticals create successfully
- ✅ Vertical-specific icons display
- ✅ Can approve tenants of all verticals

**Super Admin Panel Verification**:
- Tenant cards display vertical badges
- Filtering/sorting by vertical works (if implemented)
- Vertical type immutable after creation

---

### Test 3: Vertical-Specific Terminology

**Objective**: Verify UI labels change based on vertical type.

**Test 3.1: Restaurant Vertical**
1. Create restaurant tenant (or use demo-tenant)
2. Log into tenant portal: `http://demo-tenant.localhost:5173`
3. Navigate to Admin Panel → Product Management
4. **Verify terminology**:
   - Page title: "Manage Dishes" ✅
   - Add button: "Add Dish" ✅
   - Delete confirmation: "delete this dish" ✅
   - Export button: "Export Dishes" ✅
5. Navigate to other sections:
   - Categories → "Manage Categories" ✅
   - Orders → "Manage Orders" ✅
   - Tables → "Manage Tables" ✅

**Test 3.2: Auto-Shop Vertical** (Future Phase)
1. Create auto-shop tenant
2. Log into tenant portal
3. Navigate to Admin Panel
4. **Verify terminology**:
   - Page title: "Manage Services" ✅
   - Add button: "Add Service" ✅
   - Delete confirmation: "delete this service" ✅
   - Export button: "Export Services" ✅

**Expected Results**:
- ✅ Restaurant uses: dish, dishes, category, order, table
- ✅ Auto-shop uses: service, services, category, work order, bay
- ✅ Terminology updates across entire application
- ✅ No hardcoded business-specific terms visible

**Components to Check**:
- ProductManager ✅ (Already updated)
- ProductForm (Update pending)
- CategoryManager (Update pending)
- OrderList (Update pending)
- TableManagement (Update pending)

---

### Test 4: Database Compatibility Layer

**Objective**: Verify CollectionMapper dual-write strategy works correctly.

**Prerequisites**:
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Access Firestore console
# Or use Firebase CLI to query
```

**Test 4.1: Dual-Write Verification**

1. **Create a product in restaurant tenant**:
   - Navigate to Admin Panel → Products
   - Click "Add Dish"
   - Fill in: Name="Test Cappuccino", Price=4.50, Category="Beverages"
   - Click Save

2. **Verify in Firestore**:
   ```
   tenants/demo-tenant/
     ├── products/        ← Legacy collection (Restaurant)
     │   └── {docId}
     │       ├── name: "Test Cappuccino"
     │       ├── price: 4.50
     │       ├── _verticalType: "restaurant"
     │       ├── _createdAt: "2025-01-04T..."
     │       └── _updatedAt: "2025-01-04T..."
     │
     └── items/           ← Standardized collection (New)
         └── {same-docId}
             ├── name: "Test Cappuccino"
             ├── price: 4.50
             ├── _verticalType: "restaurant"
             ├── _sourceCollection: "products"
             ├── _createdAt: "2025-01-04T..."
             └── _updatedAt: "2025-01-04T..."
   ```

3. **Verify metadata**:
   - Both documents have same ID ✅
   - Both documents have `_verticalType` field ✅
   - Standardized collection has `_sourceCollection` ✅
   - Timestamps match ✅

**Test 4.2: Read from Legacy**

1. **Update CollectionMapper to log reads**:
   ```typescript
   // Temporarily add logging to CollectionMapper
   async getDocuments(resourceType) {
     const collectionRef = this.getCollectionRef(resourceType);
     console.log(`📖 Reading from: ${collectionRef.path}`);
     return await getDocs(collectionRef);
   }
   ```

2. **Refresh product list**:
   - Navigate to Admin Panel → Products
   - Check browser console
   - Verify log: `📖 Reading from: tenants/demo-tenant/products`

3. **Expected behavior**:
   - Reads ONLY from legacy collection (`products`)
   - Does NOT read from standardized collection (`items`)

**Test 4.3: Update Dual-Write**

1. **Update the test product**:
   - Edit "Test Cappuccino"
   - Change price to 5.00
   - Save

2. **Verify in Firestore**:
   ```
   tenants/demo-tenant/
     ├── products/{docId}
     │   ├── price: 5.00              ← Updated
     │   └── _updatedAt: "2025-01-04T12:30:00" ← New timestamp
     │
     └── items/{same-docId}
         ├── price: 5.00              ← Also updated
         └── _updatedAt: "2025-01-04T12:30:00" ← Same timestamp
   ```

**Test 4.4: Delete Dual-Delete**

1. **Delete the test product**:
   - Click delete on "Test Cappuccino"
   - Confirm deletion

2. **Verify in Firestore**:
   - Document removed from `products` collection ✅
   - Document removed from `items` collection ✅
   - Both documents deleted, not just archived

**Expected Results**:
- ✅ Writes create documents in BOTH collections
- ✅ Reads only query legacy collection
- ✅ Updates modify BOTH collections
- ✅ Deletes remove from BOTH collections
- ✅ Metadata fields present and accurate

---

### Test 5: Tenant Initialization with Templates

**Objective**: Verify new tenants get vertical-specific sample data.

**Test 5.1: Restaurant Template**

1. **Create new restaurant tenant via super admin**:
   - Navigate to Super Admin Portal
   - Click "Create Tenant"
   - Fill in: Business Name="Test Restaurant", Vertical="Restaurant"
   - Complete creation
   - Approve tenant

2. **Verify initialization called**:
   - Check browser console for: `🎨 Initializing tenant {id} with restaurant template...`
   - Check for success: `✅ Successfully initialized {id} with restaurant template`

3. **Log into new tenant portal**:
   - Navigate to `http://test-restaurant.localhost:5173`
   - Log in as owner

4. **Verify sample data created**:

   **Categories (Admin → Categories)**:
   - ✅ Beverages (icon: ☕)
   - ✅ Appetizers (icon: 🥗)
   - ✅ Main Courses (icon: 🍽️)
   - ✅ Desserts (icon: 🍰)

   **Products (Admin → Products)**:
   - ✅ Espresso ($3.50, category: Beverages)
   - ✅ Cappuccino ($4.50, category: Beverages)
   - ✅ Caesar Salad ($8.95, category: Appetizers)

   **Tables (Admin → Tables)**:
   - ✅ Table 1 (Main Dining, capacity: 2)
   - ✅ Table 2 (Main Dining, capacity: 4)
   - ✅ Table 3 (Main Dining, capacity: 4)
   - ✅ Table 4 (Patio, capacity: 2)
   - ✅ Bar 1 (Bar, capacity: 1)
   - ✅ Bar 2 (Bar, capacity: 1)

5. **Verify default settings**:
   - Navigate to Admin → Settings
   - ✅ Currency: USD
   - ✅ Tax Rate: 8.25%
   - ✅ Tip Suggestions: [15, 18, 20, 25]
   - ✅ Default Tip: 18%
   - ✅ Enable Tipping: ON
   - ✅ Enable Table Service: ON
   - ✅ Enable Reservations: ON

6. **Verify sample data flag**:
   - Check Firestore for any sample item
   ```
   tenants/test-restaurant/products/{docId}
     └── _isSampleData: true  ← Should be present
   ```

7. **Test clearing sample data** (Future feature):
   - Navigate to Admin → Settings → Clear Sample Data
   - Click "Clear All Sample Data"
   - Verify all items with `_isSampleData: true` are removed

**Test 5.2: Auto-Shop Template** (Future Phase)

**Current Expected Behavior**:
- Auto-shop vertical selected
- Template initialization returns: "No template found for vertical: auto-shop"
- No sample data created
- Default settings still created

**Future Expected Behavior**:
- Sample categories: Oil Changes, Brakes, Tires, Inspections
- Sample services: Full Synthetic Oil Change, Brake Pad Replacement
- Sample locations: Bay 1, Bay 2, Lift 1
- Default settings: labor rate, appointment duration, operating hours

**Expected Results**:
- ✅ Restaurant template creates comprehensive sample data
- ✅ Sample data flagged with `_isSampleData: true`
- ✅ Default settings applied correctly
- ✅ Other verticals warn about missing template (expected)
- ✅ Initialization uses batch writes (efficient)

---

### Test 6: VerticalContext Hooks

**Objective**: Verify React hooks provide correct vertical data.

**Test 6.1: useTerminology() Hook**

1. **Create test component**:
   ```typescript
   // src/components/test/TerminologyTest.tsx
   import React from 'react';
   import { useTerminology } from '../../src/contexts/VerticalContext';

   export const TerminologyTest: React.FC = () => {
     const t = useTerminology();

     return (
       <div style={{ padding: '20px', background: '#f0f0f0' }}>
         <h2>Terminology Test</h2>
         <ul>
           <li>Item: {t.item}</li>
           <li>Items: {t.itemPlural}</li>
           <li>Item Group: {t.itemGroup}</li>
           <li>Transaction: {t.transaction}</li>
           <li>Location: {t.location}</li>
           <li>Staff: {t.staff}</li>
         </ul>
       </div>
     );
   };
   ```

2. **Add to admin panel** (temporarily):
   ```typescript
   // In AdminPanel.tsx
   import { TerminologyTest } from './test/TerminologyTest';

   // Add to render
   <TerminologyTest />
   ```

3. **Test in restaurant tenant**:
   - Navigate to Admin Panel
   - **Expected output**:
     ```
     Item: dish
     Items: dishes
     Item Group: category
     Transaction: order
     Location: table
     Staff: staff member
     ```

4. **Test in auto-shop tenant** (future):
   - Navigate to Admin Panel
   - **Expected output**:
     ```
     Item: service
     Items: services
     Item Group: category
     Transaction: work order
     Location: bay
     Staff: technician
     ```

**Test 6.2: useVertical() Hook**

1. **Create test component**:
   ```typescript
   // src/components/test/VerticalTest.tsx
   import React from 'react';
   import { useVertical } from '../../src/contexts/VerticalContext';

   export const VerticalTest: React.FC = () => {
     const { config, features, isVertical, hasFeature } = useVertical();

     return (
       <div style={{ padding: '20px', background: '#f0f0f0' }}>
         <h2>Vertical Test</h2>
         <p><strong>Vertical ID:</strong> {config.id}</p>
         <p><strong>Vertical Name:</strong> {config.name}</p>
         <p><strong>Is Restaurant:</strong> {isVertical('restaurant') ? 'Yes' : 'No'}</p>
         <p><strong>Is Auto-shop:</strong> {isVertical('auto-shop') ? 'Yes' : 'No'}</p>

         <h3>Features</h3>
         <ul>
           <li>Has Inventory: {hasFeature('hasInventory') ? '✅' : '❌'}</li>
           <li>Has Table Management: {hasFeature('hasTableManagement') ? '✅' : '❌'}</li>
           <li>Has Scheduling: {hasFeature('hasScheduling') ? '✅' : '❌'}</li>
           <li>Allows Tipping: {hasFeature('allowsTipping') ? '✅' : '❌'}</li>
         </ul>
       </div>
     );
   };
   ```

2. **Test in restaurant tenant**:
   - **Expected output**:
     ```
     Vertical ID: restaurant
     Vertical Name: Restaurant & Coffee Shop
     Is Restaurant: Yes
     Is Auto-shop: No

     Features:
     - Has Inventory: ✅
     - Has Table Management: ✅
     - Has Scheduling: ❌
     - Allows Tipping: ✅
     ```

**Test 6.3: useVerticalFeatures() Hook**

1. **Test conditional rendering**:
   ```typescript
   import { useVerticalFeatures } from '../../src/contexts/VerticalContext';

   const MyComponent = () => {
     const features = useVerticalFeatures();

     return (
       <div>
         {features.hasTableManagement && <TableManagementPanel />}
         {features.hasScheduling && <AppointmentScheduler />}
         {features.hasInspections && <InspectionModule />}
       </div>
     );
   };
   ```

2. **Test in restaurant**:
   - ✅ TableManagementPanel renders
   - ❌ AppointmentScheduler does NOT render
   - ❌ InspectionModule does NOT render

3. **Test in auto-shop** (future):
   - ❌ TableManagementPanel does NOT render
   - ✅ AppointmentScheduler renders
   - ✅ InspectionModule renders

**Expected Results**:
- ✅ Hooks return correct data for vertical
- ✅ Terminology matches vertical config
- ✅ Feature flags work correctly
- ✅ isVertical() identifies vertical type
- ✅ hasFeature() checks features accurately

---

## Automated Testing

### Unit Tests Setup

**Install testing dependencies**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/ui jsdom
```

**Create test configuration**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### Test Suite 1: VerticalContext

**File**: `src/contexts/__tests__/VerticalContext.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerticalProvider, useVertical, useTerminology } from '../VerticalContext';
import { TenantProvider } from '../../../contexts/TenantContext';

// Mock TenantContext
vi.mock('../../../contexts/TenantContext', () => ({
  TenantProvider: ({ children }: any) => children,
  useTenant: () => ({
    tenant: { id: 'test-tenant', verticalType: 'restaurant' },
    loading: false,
  }),
}));

describe('VerticalContext', () => {
  it('provides restaurant terminology', () => {
    const TestComponent = () => {
      const terminology = useTerminology();
      return <div>{terminology.item}</div>;
    };

    render(
      <VerticalProvider>
        <TestComponent />
      </VerticalProvider>
    );

    expect(screen.getByText('dish')).toBeInTheDocument();
  });

  it('isVertical identifies restaurant', () => {
    const TestComponent = () => {
      const { isVertical } = useVertical();
      return <div>{isVertical('restaurant') ? 'yes' : 'no'}</div>;
    };

    render(
      <VerticalProvider>
        <TestComponent />
      </VerticalProvider>
    );

    expect(screen.getByText('yes')).toBeInTheDocument();
  });

  it('hasFeature checks table management', () => {
    const TestComponent = () => {
      const { hasFeature } = useVertical();
      return <div>{hasFeature('hasTableManagement') ? 'yes' : 'no'}</div>;
    };

    render(
      <VerticalProvider>
        <TestComponent />
      </VerticalProvider>
    );

    expect(screen.getByText('yes')).toBeInTheDocument();
  });
});
```

**Run tests**:
```bash
npm run test
```

### Test Suite 2: CollectionMapper

**File**: `src/services/__tests__/CollectionMapper.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollectionMapper, createCollectionMapper } from '../CollectionMapper';
import { collection, doc } from 'firebase/firestore';

vi.mock('../../firebase/config', () => ({
  db: {},
}));

vi.mock('firebase/firestore');

describe('CollectionMapper', () => {
  let mapper: CollectionMapper;

  beforeEach(() => {
    mapper = createCollectionMapper('test-tenant', 'restaurant');
  });

  it('returns legacy collection name for restaurant', () => {
    const collectionRef = mapper.getCollectionRef('items');
    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      'tenants/test-tenant/products'
    );
  });

  it('returns correct resource name with terminology', () => {
    expect(mapper.getResourceName('items', false)).toBe('dish');
    expect(mapper.getResourceName('items', true)).toBe('dishes');
  });

  it('handles auto-shop vertical', () => {
    const autoMapper = createCollectionMapper('test-tenant', 'auto-shop');
    expect(autoMapper.getResourceName('items', false)).toBe('service');
    expect(autoMapper.getResourceName('items', true)).toBe('services');
  });
});
```

### Test Suite 3: VerticalTemplateService

**File**: `src/services/__tests__/VerticalTemplateService.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { VerticalTemplateService, restaurantTemplate } from '../VerticalTemplateService';

describe('VerticalTemplateService', () => {
  it('has template for restaurant', () => {
    expect(VerticalTemplateService.hasTemplate('restaurant')).toBe(true);
  });

  it('does not have template for auto-shop yet', () => {
    expect(VerticalTemplateService.hasTemplate('auto-shop')).toBe(false);
  });

  it('restaurant template has sample data', () => {
    const template = VerticalTemplateService.getTemplate('restaurant');
    expect(template).toBe(restaurantTemplate);
    expect(template?.sampleCategories?.length).toBeGreaterThan(0);
    expect(template?.sampleItems?.length).toBeGreaterThan(0);
    expect(template?.sampleLocations?.length).toBeGreaterThan(0);
  });

  it('restaurant template has default settings', () => {
    const template = VerticalTemplateService.getTemplate('restaurant');
    expect(template?.defaultSettings?.currency).toBe('USD');
    expect(template?.defaultSettings?.enableTipping).toBe(true);
  });
});
```

### Run Test Suite

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run in watch mode
npm run test -- --watch

# Run specific test file
npm run test src/contexts/__tests__/VerticalContext.test.tsx
```

---

## Database Verification

### Firestore Console Checklist

**Navigate to**: Firebase Console → Firestore Database

**Check 1: tenantMetadata Collection**
```
tenantMetadata/
  ├── demo-tenant
  │   ├── businessName: "Demo Coffee Shop"
  │   ├── verticalType: "restaurant"  ← Must exist
  │   ├── status: "active"
  │   └── createdAt: "2025-01-04..."
  │
  └── test-autoshop
      ├── businessName: "Test Auto Shop"
      ├── verticalType: "auto-shop"  ← Must exist
      └── status: "active"
```

**Check 2: Tenant Collections** (Restaurant)
```
tenants/demo-tenant/
  ├── products/           ← Legacy collection
  │   ├── {docId1}
  │   │   ├── name: "Cappuccino"
  │   │   ├── _verticalType: "restaurant"
  │   │   └── _isSampleData: true
  │   └── {docId2}
  │
  ├── items/              ← Standardized collection (dual-write)
  │   ├── {docId1}        ← Same ID as products
  │   │   ├── name: "Cappuccino"
  │   │   ├── _verticalType: "restaurant"
  │   │   ├── _sourceCollection: "products"
  │   │   └── _isSampleData: true
  │   └── {docId2}
  │
  ├── categories/
  │   └── {catId}
  │       ├── name: "Beverages"
  │       └── _isSampleData: true
  │
  ├── tables/
  │   └── {tableId}
  │       ├── name: "Table 1"
  │       └── _isSampleData: true
  │
  └── settings/
      └── general
          ├── verticalType: "restaurant"
          ├── currency: "USD"
          └── taxRate: 0.0825
```

**Check 3: Data Consistency**
- All items in `products` also exist in `items` with same ID
- All documents have `_verticalType` metadata
- Sample data has `_isSampleData: true`
- Timestamps are recent and consistent

### Firebase CLI Queries

```bash
# Get all tenants and their verticals
firebase firestore:get tenantMetadata --limit 10

# Get specific tenant
firebase firestore:get tenantMetadata/demo-tenant

# Check for dual-write
# This shows if both collections exist
firebase firestore:get tenants/demo-tenant/products/{docId}
firebase firestore:get tenants/demo-tenant/items/{docId}

# Query sample data
firebase firestore:get tenants/demo-tenant/products --where _isSampleData==true
```

---

## Common Issues & Troubleshooting

### Issue 1: Terminology Not Updating

**Symptom**: UI still shows "Products" instead of "Dishes"

**Possible Causes**:
1. VerticalProvider not wrapping component tree
2. Tenant missing `verticalType` field
3. Component not using `useTerminology()` hook

**Fix**:
```typescript
// 1. Check App.tsx wraps with VerticalProvider
<TenantProvider>
  <VerticalProvider>  ← Must be inside TenantProvider
    <App />
  </VerticalProvider>
</TenantProvider>

// 2. Check tenant document in Firestore
tenantMetadata/demo-tenant
  └── verticalType: "restaurant"  ← Must exist

// 3. Update component to use hook
import { useTerminology } from '../../src/contexts/VerticalContext';

const MyComponent = () => {
  const terminology = useTerminology();
  return <h1>Manage {terminology.itemPlural}</h1>;
};
```

### Issue 2: Sample Data Not Created

**Symptom**: New tenant has no products/categories

**Possible Causes**:
1. VerticalTemplateService not called during signup
2. Template not registered for vertical
3. Firestore permissions error

**Fix**:
```typescript
// 1. Check signup flow calls template service
import { VerticalTemplateService } from '../../src/services/VerticalTemplateService';

await VerticalTemplateService.initializeTenant({
  tenantId: newTenant.id,
  verticalType: formData.verticalType,
});

// 2. Check template exists
console.log(VerticalTemplateService.hasTemplate('restaurant')); // Should be true

// 3. Check browser console for errors
// Look for Firestore permission denied errors
```

### Issue 3: Dual-Write Not Working

**Symptom**: Data only in legacy collection, not standardized

**Possible Causes**:
1. Not using CollectionMapper for writes
2. CollectionMapper not initialized with vertical type
3. Legacy and standardized names are the same

**Fix**:
```typescript
// 1. Use CollectionMapper for all writes
import { createCollectionMapper } from '../../src/services/CollectionMapper';

const mapper = createCollectionMapper(tenantId, verticalType);
await mapper.addDocument('items', productData); // Uses dual-write

// 2. Verify vertical type passed correctly
const mapper = createCollectionMapper(
  tenantId,  // Must be valid
  verticalType  // Must be valid VerticalType
);

// 3. Check if names differ
const config = getVerticalConfig(verticalType);
console.log(config.collections?.items); // Should be 'products' for restaurant
// If legacy === standardized, dual-write is skipped (expected)
```

### Issue 4: Wrong Vertical Type Displayed

**Symptom**: Restaurant tenant shows auto-shop terminology

**Possible Causes**:
1. Tenant document has wrong `verticalType`
2. VerticalContext override active
3. Cached tenant data

**Fix**:
```typescript
// 1. Update tenant document
// In Firestore Console:
tenantMetadata/demo-tenant
  └── verticalType: "restaurant"  ← Correct this

// 2. Remove any test overrides
<VerticalProvider>  ← No verticalType prop
  <App />
</VerticalProvider>

// 3. Clear cache and reload
localStorage.clear();
window.location.reload();
```

### Issue 5: Context Hook Errors

**Symptom**: "useVertical must be used within a VerticalProvider"

**Fix**:
```typescript
// Ensure component is inside provider
const App = () => (
  <TenantProvider>
    <VerticalProvider>
      <MyComponent />  ← Can use hooks here
    </VerticalProvider>
  </TenantProvider>
);

// NOT like this:
const App = () => (
  <TenantProvider>
    <MyComponent />  ← ❌ Can't use vertical hooks here
  </TenantProvider>
);
```

---

## Testing Checklist

Use this checklist to verify all vertical system functionality:

### Vertical Configuration
- [ ] All 5 verticals defined in config
- [ ] Restaurant config has all required fields
- [ ] Terminology defined for all verticals
- [ ] Features configured for all verticals
- [ ] Collection mappings defined

### Signup Flow
- [ ] Vertical dropdown appears
- [ ] All verticals selectable
- [ ] Descriptions update dynamically
- [ ] Tenant created with correct verticalType

### Super Admin Portal
- [ ] Can create tenants with different verticals
- [ ] Vertical displayed in tenant list
- [ ] Vertical badges/icons display
- [ ] Can approve tenants of all types

### Terminology System
- [ ] Restaurant shows "dish", "dishes"
- [ ] ProductManager uses terminology
- [ ] Other components use terminology (pending)
- [ ] No hardcoded business terms

### Database Layer
- [ ] Dual-write creates both collections
- [ ] Reads from legacy collection only
- [ ] Updates modify both collections
- [ ] Deletes remove from both collections
- [ ] Metadata fields present

### Tenant Initialization
- [ ] Restaurant template creates sample data
- [ ] Sample categories created
- [ ] Sample items created
- [ ] Sample locations created
- [ ] Default settings applied
- [ ] Sample data flagged correctly

### React Hooks
- [ ] useVertical() returns config
- [ ] useTerminology() returns terminology
- [ ] useVerticalFeatures() returns features
- [ ] isVertical() identifies type
- [ ] hasFeature() checks features

### Testing Infrastructure
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Test coverage > 80%
- [ ] No console errors in tests

---

## Next Steps

After completing manual and automated testing:

1. **Phase 2**: Implement remaining verticals (auto-shop, salon, hotel, retail)
2. **Phase 3**: Update all components with vertical terminology
3. **Phase 4**: Build feature flags UI for super admin
4. **Phase 5**: Complete migration from legacy to standardized collections

## Support

For issues or questions:
- Check [ADDING_NEW_VERTICALS.md](./ADDING_NEW_VERTICALS.md)
- Review VerticalContext implementation
- Test with restaurant vertical (reference implementation)
- Consult project documentation
