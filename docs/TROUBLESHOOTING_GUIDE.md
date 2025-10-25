# Troubleshooting Guide - Multi-Tenant Restaurant Management System

**Last Updated:** October 24, 2025
**Version:** 1.0

This guide documents all known issues encountered during the multi-tenant migration and their solutions.

---

## Table of Contents

1. [Common Issues](#common-issues)
2. [Order Placement Errors](#order-placement-errors)
3. [Data Not Loading](#data-not-loading)
4. [Permission Errors](#permission-errors)
5. [Image Upload Issues](#image-upload-issues)
6. [Development Environment](#development-environment)

---

## Common Issues

### Issue: "tenantId is undefined"

**Symptoms:**
- Console shows: `CustomerApp tenantId: undefined`
- Orders fail to place
- Admin data doesn't load
- Components can't save changes

**Root Cause:**
The `TenantContext` provides a `tenant` object, not `tenantId` directly. Components were trying to destructure `tenantId` which doesn't exist:

```typescript
// ❌ WRONG
const { tenantId } = useTenant(); // tenantId will be undefined!

// ✅ CORRECT
const { tenant } = useTenant();
const tenantId = tenant?.id;
```

**Solution:**
Update all component usage to:

```typescript
import { useTenant } from '../../contexts/TenantContext';

const MyComponent = () => {
    const { tenant } = useTenant();
    const tenantId = tenant?.id;

    // Always add null check before using tenantId
    useEffect(() => {
        if (!tenantId) return;

        // Use tenantId here
        streamProducts(tenantId, setProducts);
    }, [tenantId]);
};
```

**Files That Were Fixed:**
- `App.tsx` (lines 23-24, 224-225)
- `components/admin/AdminPanel.tsx` (lines 43-44)
- `components/admin/ProductManager.tsx` (lines 18-19)
- `components/admin/SettingsManager.tsx` (lines 41-42)
- `components/admin/CategoryManager.tsx` (lines 14-15)
- `components/admin/OrderManager.tsx` (lines 25-26)
- `components/admin/KitchenDisplaySystem.tsx` (lines 218-219)

---

## Order Placement Errors

### Issue: "User does not belong to this tenant!"

**Symptoms:**
```
Error: User does not belong to this tenant!
  at placeOrder (api-multitenant.ts:164)
```

**Root Cause:**
Legacy users created before the multi-tenant migration don't have a `tenantId` field in their user document. The `placeOrder` function was checking:
```typescript
if (userData.tenantId !== tenantId) {
    throw new Error("User does not belong to this tenant!");
}
```

When `userData.tenantId` is `undefined`, this check fails.

**Solution:**
Modified `placeOrder` to use fallback logic and auto-migrate legacy users:

```typescript
// firebase/api-multitenant.ts lines 162-172

const userData = userDoc.data();
const settings = settingsDoc.data() as AppSettings;

// Verify user belongs to this tenant (with fallback for legacy users)
const userTenantId = userData.tenantId || 'demo-tenant';
if (userTenantId !== tenantId) {
    throw new Error(`User belongs to tenant '${userTenantId}' but trying to place order in '${tenantId}'`);
}

// Auto-update user document with tenantId if missing (for legacy users)
if (!userData.tenantId) {
    console.log('Auto-updating user document with tenantId:', tenantId);
    await updateDoc(userDocRef, { tenantId });
}
```

**How to Verify Fix:**
1. Place an order as a legacy user
2. Check console for: "Auto-updating user document with tenantId: demo-tenant"
3. Check Firestore - user document should now have `tenantId` field
4. Subsequent orders should work without the auto-update

---

### Issue: updateCart parameter mismatch

**Symptoms:**
- Cart updates fail silently
- Console might show type errors

**Root Cause:**
The `updateCart` function signature is:
```typescript
updateCart(userId: string, cart: CartItem[]): Promise<void>
```

But it was being called with:
```typescript
updateCart(tenantId, user.uid, cart); // ❌ WRONG - 3 parameters!
```

**Solution:**
```typescript
// ✅ CORRECT - 2 parameters
updateCart(user.uid, cart);
```

**Note:** The `updateCart` function doesn't need `tenantId` because it updates the user's global cart, not a tenant-specific collection.

---

## Data Not Loading

### Issue: Admin panel shows "Loading admin data..." indefinitely

**Symptoms:**
- Admin panel stuck on loading spinner
- Console shows permission errors
- Products/categories/settings don't load

**Potential Causes:**

#### 1. useEffect not checking for tenantId

**Problem:**
```typescript
useEffect(() => {
    // ❌ Calling API without checking if tenantId exists
    const unsubProducts = streamProducts(tenantId, setProducts);
    // ...
}, [tenantId]);
```

**Solution:**
```typescript
useEffect(() => {
    if (!tenantId) return; // ✅ Add null check

    const unsubProducts = streamProducts(tenantId, setProducts);
    const unsubCategories = streamCategories(tenantId, setCategories);
    // ...

    return () => {
        unsubProducts();
        unsubCategories();
        // ...
    };
}, [tenantId]);
```

#### 2. Firestore security rules too restrictive

**Check console for:**
```
FirebaseError: Missing or insufficient permissions
```

**Temporary Fix (Development Only):**
Make rules permissive to verify it's a rules issue:

```javascript
// firestore.rules
match /tenants/{tenantId} {
  allow read, write: if request.auth != null; // Permissive for testing

  match /{document=**} {
    allow read, write: if request.auth != null;
  }
}
```

**Deploy:**
```bash
firebase deploy --only firestore:rules
```

**⚠️ WARNING:** Don't use permissive rules in production!

#### 3. Component using old API instead of api-multitenant

**Check imports:**
```typescript
// ❌ OLD - Don't use this
import { streamProducts, streamCategories } from '../../firebase/api';

// ✅ NEW - Use this
import { streamProducts, streamCategories } from '../../firebase/api-multitenant';
```

---

## Permission Errors

### Issue: Firestore security rules circular dependency

**Symptoms:**
```
Error: security rules have circular dependencies
```

**Root Cause:**
Security rules had helper functions that tried to read user documents, but those read operations also required security rule checks, creating a circular dependency:

```javascript
// ❌ CIRCULAR DEPENDENCY
function getUserTenant() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId;
}

match /users/{userId} {
  allow read: if getUserTenant() == 'demo-tenant'; // Calls getUserTenant which tries to read users!
}
```

**Solution:**
Simplify user read rules to avoid circular dependencies:

```javascript
// ✅ SIMPLE RULE
match /users/{userId} {
  allow read: if isAuthenticated() && request.auth.uid == userId;
  allow write: if isAuthenticated() && request.auth.uid == userId;
}
```

---

## Image Upload Issues

### Issue: Images return 404 errors

**Symptoms:**
- Product images show broken image icon
- Console shows: `GET https://firebasestorage.googleapis.com/... 404 (Not Found)`

**Root Cause:**
Firebase Storage security rules were not configured.

**Solution:**
1. Create `storage.rules` file:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

2. Update `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

3. Deploy:

```bash
firebase deploy --only storage
```

---

## Development Environment

### Issue: "Port 3000 is in use"

**Symptoms:**
```
Port 3000 is in use, trying another one...
VITE v6.4.1  ready in 91 ms
➜  Local:   http://localhost:3001/
```

**Cause:**
Another process is using port 3000 (likely another `npm run dev` instance).

**Solutions:**

1. **Kill the other process:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

2. **Or just use the alternate port:**
Vite automatically uses 3001 if 3000 is busy. This is fine for development.

3. **Configure specific port:**
Update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 3000,
    strictPort: true, // Fail if port is in use
  }
});
```

---

### Issue: Firebase emulator connection refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Cause:**
Firebase emulators not running.

**Solution:**
```bash
firebase emulators:start
```

**Note:** For this project, we're using production Firebase, not emulators. This error might indicate misconfig.

---

### Issue: Environment variables not loading

**Symptoms:**
- Firebase config errors
- API keys undefined
- Console shows `undefined` for `import.meta.env.VITE_*`

**Cause:**
`.env` file not in project root or variables not prefixed with `VITE_`.

**Solution:**

1. Verify `.env` exists in project root
2. Ensure all variables start with `VITE_`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GEMINI_API_KEY=your-gemini-key
```

3. Restart dev server:
```bash
# Ctrl+C to stop
npm run dev
```

---

## Quick Diagnostic Checklist

When something doesn't work, check these in order:

### 1. Browser Console
- [ ] Any red error messages?
- [ ] "Loading tenant: demo-tenant" logged?
- [ ] "✅ Tenant loaded: Demo Coffee Shop" logged?
- [ ] Any "tenantId: undefined" logs?
- [ ] Any Firebase permission errors?

### 2. Network Tab
- [ ] Firestore requests succeeding (200 status)?
- [ ] Storage requests succeeding for images?
- [ ] Any 403 (permission) errors?
- [ ] Any 404 (not found) errors?

### 3. Firestore Console
- [ ] `/tenantMetadata/demo-tenant` document exists?
- [ ] `/tenants/demo-tenant/products` has data?
- [ ] `/tenants/demo-tenant/categories` has data?
- [ ] `/tenants/demo-tenant/settings/settings` exists?
- [ ] User documents have `tenantId` field?

### 4. Firebase Console
- [ ] Security rules deployed successfully?
- [ ] Storage rules deployed?
- [ ] Project ID matches `.env` file?
- [ ] Authentication enabled?

### 5. Code
- [ ] Using `api-multitenant` imports (not `api`)?
- [ ] Using `const { tenant } = useTenant(); const tenantId = tenant?.id;`?
- [ ] Null checks before using `tenantId`?
- [ ] `TenantProvider` wrapping app in `main.tsx`?

---

## Getting Help

### Common Error Messages Reference

| Error Message | Location | Quick Fix |
|---------------|----------|-----------|
| `tenantId is undefined` | Console | Use `tenant?.id` instead of destructuring |
| `Missing or insufficient permissions` | Console | Check Firestore rules, deploy with `firebase deploy --only firestore:rules` |
| `User does not belong to this tenant` | Order placement | Fixed in api-multitenant.ts with fallback logic |
| `Cannot read properties of undefined (reading 'id')` | Components | Add null check: `if (!tenantId) return;` |
| `FirebaseError: No document to update` | Firestore | Document doesn't exist, check collection path |
| `404 (Not Found)` for images | Network tab | Deploy storage rules: `firebase deploy --only storage` |

### Debug Mode

To enable detailed logging:

```typescript
// App.tsx or any component
useEffect(() => {
    console.log('DEBUG:', {
        tenant,
        tenantId,
        user,
        products,
        categories,
        settings
    });
}, [tenant, tenantId, user, products, categories, settings]);
```

### Clean Start

If everything is broken:

```bash
# 1. Stop all running processes
# Ctrl+C in all terminals

# 2. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 3. Clear build cache
rm -rf dist .vite

# 4. Restart dev server
npm run dev

# 5. Hard refresh browser
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## Reporting New Issues

When reporting a new issue, include:

1. **Error message:** Full text from console
2. **Steps to reproduce:** What did you do?
3. **Expected vs actual:** What should happen vs what happened?
4. **Browser console logs:** Screenshot or copy/paste
5. **Network tab:** Any failed requests?
6. **Firestore data:** Screenshot of relevant collections
7. **Code snippet:** The component/function causing the issue

---

**End of Troubleshooting Guide**

For architectural questions, see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
For current status, see [PROJECT_STATUS.md](./PROJECT_STATUS.md)
