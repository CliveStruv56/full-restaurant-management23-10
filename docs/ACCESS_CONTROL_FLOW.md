# Access Control Flow

This document describes the complete access control flow for all user roles in the multi-tenant restaurant management system.

## Overview

The system uses a combination of:
- **Frontend routing** ([App.tsx](../App.tsx)) - UI-level access control
- **Firestore Security Rules** ([firestore.rules](../firestore.rules)) - Database-level access control
- **Tenant Context** ([TenantContext.tsx](../contexts/TenantContext.tsx)) - Tenant isolation based on subdomain
- **Auth Context** ([AuthContext.tsx](../contexts/AuthContext.tsx)) - User authentication and role management

---

## User Roles

### 1. Super Admin (`super-admin`)

**Access Level**: Platform-wide access to all tenants and system administration.

**Routing Behavior**:
- **Default**: Auto-redirected to Super Admin Portal (`superadmin.localhost:3000`)
  - See [App.tsx:414-435](../App.tsx#L414-L435)
- **Exception**: Can explicitly view a specific tenant by:
  1. Clicking "View Site" in Super Admin Portal
  2. Sets `sessionStorage.setItem('superAdminViewingTenant', 'true')`
  3. Bypass the auto-redirect to view that tenant's admin panel

**UI Access**:
- Super Admin Portal: Full tenant management (create, approve, view, edit, delete tenants)
- Any tenant's admin panel (when explicitly viewing)
- Any tenant's customer view (when explicitly viewing)

**Database Access** (Firestore Rules):
- ✅ Read all user profiles ([firestore.rules:113](../firestore.rules#L113))
- ✅ Update any user profile ([firestore.rules:127](../firestore.rules#L127))
- ✅ Create tenants with any status ([firestore.rules:177](../firestore.rules#L177))
- ✅ Update any tenant ([firestore.rules:180](../firestore.rules#L180))
- ✅ Delete any tenant ([firestore.rules:183](../firestore.rules#L183))
- ✅ Read all tenant data ([firestore.rules:222](../firestore.rules#L222))
- ✅ Write all tenant data ([firestore.rules:326](../firestore.rules#L326))
- ✅ Full access to `superAdminData` collection ([firestore.rules:195](../firestore.rules#L195))

**Verification**:
```typescript
// firestore.rules:97-101
function isSuperAdmin() {
  return isAuthenticated() &&
         getUserData().keys().hasAny(['role']) &&
         getUserData().role == 'super-admin';
}
```

---

### 2. Admin (`admin`)

**Access Level**: Full access to their assigned tenant(s) only.

**Routing Behavior**:
- **Default**: Shown admin panel for current tenant
  - See [App.tsx:599](../App.tsx#L599)
- **Tenant Isolation**: Can only access tenants where they have admin role in `tenantMemberships`

**UI Access**:
- Tenant admin panel (products, categories, orders, settings, staff, etc.)
- Kitchen view toggle
- Customer view preview (via "Preview Customer Menu")

**Database Access** (Firestore Rules):
- ✅ Read own user profile ([firestore.rules:113](../firestore.rules#L113))
- ✅ Update own profile (except tenantMemberships) ([firestore.rules:124-126](../firestore.rules#L124-L126))
- ✅ Read invitations for their tenant ([firestore.rules:143-146](../firestore.rules#L143-L146))
- ✅ Read/write tenant settings ([firestore.rules:230](../firestore.rules#L230))
- ✅ Read/write products ([firestore.rules:238-239](../firestore.rules#L238-L239))
- ✅ Read/write categories ([firestore.rules:247-248](../firestore.rules#L247-L248))
- ✅ Read/update/delete orders ([firestore.rules:266-270](../firestore.rules#L266-L270))
- ✅ Read/write tables ([firestore.rules:278-279](../firestore.rules#L278-L279))
- ✅ Read/update/delete reservations ([firestore.rules:300-308](../firestore.rules#L300-L308))
- ❌ Cannot access other tenants' data

**Verification**:
```typescript
// firestore.rules:76-81
function isTenantAdmin(tenantId) {
  return isAuthenticated() && (
    hasRole(tenantId, ['admin']) ||
    (belongsToTenant(tenantId) && isAdmin()) // Legacy fallback
  );
}
```

---

### 3. Staff (`staff`)

**Access Level**: Limited access to operational features of their assigned tenant(s).

**Routing Behavior**:
- **Default**: Shown Kitchen Display System
  - See [App.tsx:597-598](../App.tsx#L597-L598)
- **Tenant Isolation**: Can only access tenants where they have staff role in `tenantMemberships`

**UI Access**:
- Kitchen Display System (view and update order statuses)
- NO access to admin panel
- NO access to settings, user management, or reports

**Database Access** (Firestore Rules):
- ✅ Read own user profile ([firestore.rules:113](../firestore.rules#L113))
- ✅ Update own profile (except tenantMemberships) ([firestore.rules:124-126](../firestore.rules#L124-L126))
- ✅ Read/write products ([firestore.rules:238-239](../firestore.rules#L238-L239))
- ✅ Read/write categories ([firestore.rules:247-248](../firestore.rules#L247-L248))
- ✅ Read/update orders ([firestore.rules:266-267](../firestore.rules#L266-L267))
- ✅ Read/write tables ([firestore.rules:278-279](../firestore.rules#L278-L279))
- ❌ Cannot modify settings
- ❌ Cannot manage users or invitations
- ❌ Cannot delete orders
- ❌ Cannot access other tenants' data

**Verification**:
```typescript
// firestore.rules:86-91
function isAdminOrStaff(tenantId) {
  return isAuthenticated() && (
    hasRole(tenantId, ['admin', 'staff']) ||
    (belongsToTenant(tenantId) && isStaffOrAdmin()) // Legacy fallback
  );
}
```

---

### 4. Customer (`customer`)

**Access Level**: Can place orders and view their own order history in their subscribed tenant(s).

**Routing Behavior**:
- **Default**: Shown customer app (menu, cart, checkout)
  - See [App.tsx:604](../App.tsx#L604)
- **Tenant Isolation**: Can only access tenants where they have customer role in `tenantMemberships`

**UI Access**:
- Landing page (dine-in/takeaway selection)
- Menu browsing
- Shopping cart
- Checkout (order placement)
- Order history (own orders only)

**Database Access** (Firestore Rules):
- ✅ Read own user profile ([firestore.rules:113](../firestore.rules#L113))
- ✅ Update own profile (except tenantMemberships) ([firestore.rules:124-126](../firestore.rules#L124-L126))
- ✅ Read products (view-only)
- ✅ Read categories (view-only)
- ✅ Create orders for their tenant ([firestore.rules:260-263](../firestore.rules#L260-L263))
- ✅ Read own orders ([firestore.rules:255-256](../firestore.rules#L255-L256))
- ❌ Cannot update or delete orders
- ❌ Cannot access admin features
- ❌ Cannot access other tenants' data (unless they have memberships)

**Special Case - Guest Checkout**:
- Anonymous users can create orders ([firestore.rules:263](../firestore.rules#L263))
- Authenticated with `firebase.auth.token.sign_in_provider == 'anonymous'`
- Limited to order creation only

---

## Tenant Isolation Mechanism

### Subdomain-Based Tenant Loading

The [TenantContext](../contexts/TenantContext.tsx) loads tenant data based on the current subdomain:

**Development Environment**:
- `demo-tenant.localhost:3000` → Tenant ID: `demo-tenant`
- `some-good.localhost:3000` → Tenant ID: `some-good`
- `localhost:3000` → Tenant ID: `demo-tenant` (default)
- `superadmin.localhost:3000` → No tenant (Super Admin Portal)

**Production Environment**:
- `demo-tenant.orderflow.app` → Tenant ID: `demo-tenant`
- `some-good.orderflow.app` → Tenant ID: `some-good`
- `admin.orderflow.app` → No tenant (Super Admin Portal)

**Implementation**: See [TenantContext.tsx:53-98](../contexts/TenantContext.tsx#L53-L98)

### Multi-Tenant User Structure

Users can have memberships in multiple tenants:

```typescript
{
  uid: "user123",
  email: "user@example.com",
  tenantMemberships: {
    "demo-tenant": {
      role: "admin",
      joinedAt: "2025-01-01T00:00:00Z",
      isActive: true
    },
    "some-good": {
      role: "staff",
      joinedAt: "2025-01-15T00:00:00Z",
      isActive: true
    }
  },
  currentTenantId: "demo-tenant"  // Active tenant
}
```

---

## Access Control Verification Checklist

### ✅ Super Admin
- [x] Auto-redirected to Super Admin Portal (`superadmin.localhost:3000`)
- [x] Can explicitly view any tenant via "View Site" button
- [x] sessionStorage bypass prevents auto-redirect when viewing tenants
- [x] Full database access to all tenants (Firestore rules)

### ✅ Admin
- [x] Can ONLY access tenants where they have admin role in `tenantMemberships`
- [x] Cannot access other tenants' admin panels
- [x] Full CRUD access to their tenant's data (Firestore rules)
- [x] Can manage products, orders, settings, users for their tenant

### ✅ Staff
- [x] Can ONLY access tenants where they have staff role in `tenantMemberships`
- [x] Shown Kitchen Display System by default
- [x] Cannot access admin panel or settings
- [x] Limited write access (orders, products) (Firestore rules)

### ✅ Customer
- [x] Can ONLY access tenants where they have customer role in `tenantMemberships`
- [x] Shown customer app (menu, cart, checkout)
- [x] Can place orders and view own order history
- [x] Cannot access admin features or other customers' data (Firestore rules)

---

## Flow Diagrams

### User Login Flow

```
User logs in → AuthContext loads user profile
                ↓
        Checks user.role and user.tenantMemberships
                ↓
        ┌───────┴────────────────────────────────┐
        ↓                                        ↓
    role == 'super-admin'                  role in ['admin', 'staff', 'customer']
        ↓                                        ↓
    Auto-redirect to                    TenantContext loads tenant from subdomain
    superadmin.localhost:3000                   ↓
        ↓                               Verify user has membership in this tenant
    (unless sessionStorage                      ↓
     flag is set for viewing)           ┌───────┴────────┐
                                        ↓                ↓
                                    role == 'admin'  role == 'staff'
                                        ↓                ↓
                                    AdminPanel      KitchenDisplaySystem
                                        ↓                ↓
                                    role == 'customer'
                                        ↓
                                    CustomerApp
```

### Tenant Access Control Flow

```
User accesses some-good.localhost:3000
        ↓
TenantContext.getTenantIdFromRequest()
        ↓
Extract tenant ID: "some-good"
        ↓
Load tenant from Firestore: tenantMetadata/some-good
        ↓
AuthContext checks: user.tenantMemberships["some-good"]
        ↓
    ┌───┴────┐
    ↓        ↓
  Exists   Doesn't exist
    ↓        ↓
  Allow    Deny (show error or redirect)
```

---

## Security Considerations

1. **Frontend routing is NOT security** - It only controls UI visibility
2. **Firestore rules are the real security boundary** - All data access must pass Firestore security rules
3. **Tenant isolation is enforced at database level** - Rules verify `belongsToTenant(tenantId)` for all reads/writes
4. **Multi-tenant users** - Users can switch between tenants if they have multiple memberships
5. **Super admin bypass** - Super admins can view any tenant but must explicitly set the bypass flag

---

## Related Files

- [App.tsx](../App.tsx) - Main routing logic
- [TenantContext.tsx](../contexts/TenantContext.tsx) - Tenant loading and isolation
- [AuthContext.tsx](../contexts/AuthContext.tsx) - User authentication and role management
- [firestore.rules](../firestore.rules) - Database security rules
- [SuperAdminPanel.tsx](../components/admin/SuperAdminPanel.tsx) - Super admin interface
- [AdminPanel.tsx](../components/admin/AdminPanel.tsx) - Tenant admin interface

---

## Testing Access Control

### Test Super Admin Flow
1. Set user role to `super-admin` in Firestore
2. Log in at `demo-tenant.localhost:3000`
3. **Expected**: Auto-redirected to `superadmin.localhost:3000`
4. Click "View Site" on "Some Good" tenant
5. **Expected**: Opens `some-good.localhost:3000` in new tab showing admin panel

### Test Admin Flow
1. Set user role to `admin` for `some-good` tenant only
2. Log in at `some-good.localhost:3000`
3. **Expected**: Shows admin panel for "Some Good" tenant
4. Try accessing `demo-tenant.localhost:3000`
5. **Expected**: Error or denied access (no membership in demo-tenant)

### Test Staff Flow
1. Set user role to `staff` for `demo-tenant` tenant
2. Log in at `demo-tenant.localhost:3000`
3. **Expected**: Shows Kitchen Display System
4. Try accessing admin panel
5. **Expected**: No access to admin features

### Test Customer Flow
1. Set user role to `customer` for `demo-tenant` tenant
2. Log in at `demo-tenant.localhost:3000`
3. **Expected**: Shows customer app (menu, cart)
4. Try accessing admin panel
5. **Expected**: No access to admin features
