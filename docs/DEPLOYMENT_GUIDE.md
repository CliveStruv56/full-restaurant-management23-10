# Deployment Guide: Multi-Tenant Migration

**Status:** Ready for Deployment
**Date:** October 23, 2025

---

## Prerequisites

Before deploying, ensure you have:
- ✅ Firebase CLI installed (`firebase --version`)
- ✅ Authenticated with Firebase (`firebase login`)
- ✅ Project selected (`firebase use coffee-shop-mvp-4ff60`)

---

## Step-by-Step Deployment

### Step 1: Build Cloud Functions

```bash
cd functions
npm run build
cd ..
```

**Expected Output:**
```
Successfully compiled TypeScript to JavaScript
lib/index.js created
```

**Troubleshooting:**
- If you get Node version warnings, it's OK to proceed
- If build fails, check `functions/tsconfig.json`

---

### Step 2: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔ Deploy complete!
Firestore Rules deployed successfully
```

**What This Does:**
- Uploads [firestore.rules](../firestore.rules) to Firebase
- Enforces tenant isolation at database level
- Blocks cross-tenant data access

**Verification:**
- Go to Firebase Console → Firestore → Rules
- You should see the new rules with tenant isolation logic

---

### Step 3: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

**Expected Output:**
```
✔ functions[inviteUser(us-central1)]: Successful create operation.
✔ functions[acceptInvitation(us-central1)]: Successful create operation.
Deploy complete!
```

**What This Does:**
- Deploys `inviteUser` function (admin invites users)
- Deploys `acceptInvitation` function (user sets password)

**Verification:**
- Go to Firebase Console → Functions
- You should see 2 functions listed
- Click on each to view logs

---

### Step 4: Run Data Migration

⚠️ **IMPORTANT: Backup your data first!**

```bash
# Optional: Create a backup (recommended)
firebase firestore:export gs://coffee-shop-mvp-4ff60.appspot.com/backups/$(date +%Y%m%d)

# Run migration script
npx ts-node scripts/migrate-to-multitenant.ts
```

**Expected Output:**
```
⚠️  WARNING: This will migrate your database to multi-tenant structure!
Press Ctrl+C to cancel, or wait 5 seconds to continue...

🔄 Starting migration to multi-tenant architecture...

📝 Step 1: Creating demo tenant metadata...
   ✓ Created tenant: Demo Coffee Shop

📦 Step 2: Migrating products...
   ✓ Migrated X products to /tenants/demo-tenant/products

📂 Step 3: Migrating categories...
   ✓ Migrated X categories to /tenants/demo-tenant/categories

📋 Step 4: Migrating orders...
   ✓ Migrated X orders to /tenants/demo-tenant/orders

⚙️  Step 5: Migrating settings...
   ✓ Migrated X settings documents to /tenants/demo-tenant/settings

👥 Step 6: Updating user documents...
   ✓ Updated X users with tenantId: demo-tenant

✅ Migration completed successfully!
```

**What This Does:**
- Creates `/tenantMetadata/demo-tenant`
- Moves all products, categories, orders to `/tenants/demo-tenant/`
- Adds `tenantId: "demo-tenant"` to all user documents
- Does NOT delete old data (for safety)

**Verification:**
- Go to Firebase Console → Firestore
- Check that `/tenantMetadata/demo-tenant` exists
- Check that `/tenants/demo-tenant/products` has your products
- Check that `/users/{userId}` has `tenantId` field

---

### Step 5: Update Application Code

**Option A: Gradual Migration (Recommended)**

Keep the old API for now, test with new API in parallel:

```typescript
// In components, import the new API
import * as NewAPI from '../firebase/api-multitenant';
import { useTenant } from '../contexts/TenantContext';

// Use tenant-scoped functions
const { tenant } = useTenant();
NewAPI.streamProducts(tenant.id, setProducts);
```

**Option B: Full Switchover**

Rename files:
```bash
# Backup old API
mv firebase/api.ts firebase/api-old.ts

# Use new API as default
mv firebase/api-multitenant.ts firebase/api.ts
```

Then update ALL component imports to pass `tenantId`.

**For this guide, we'll use Option A (gradual migration).**

---

### Step 6: Wrap App with TenantProvider

Update [main.tsx](../main.tsx) or [App.tsx](../App.tsx):

```typescript
import { TenantProvider } from './contexts/TenantContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TenantProvider>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </TenantProvider>
  </React.StrictMode>
);
```

**Important Order:**
1. TenantProvider (outermost)
2. AuthProvider
3. ToastProvider
4. App

---

### Step 7: Test Locally

```bash
npm run dev
```

**Expected Behavior:**
1. App loads at `http://localhost:5173`
2. TenantContext detects `localhost` → uses `demo-tenant`
3. Shows loading spinner while fetching tenant
4. If tenant exists: App loads normally
5. If tenant doesn't exist: Shows "Tenant Not Found" error

**Initial State (Before Migration):**
- Tenant doesn't exist yet
- You'll see "Tenant Not Found" error
- This is expected!

**After Migration:**
- Tenant `demo-tenant` exists
- App loads with your migrated data
- All existing functionality works

---

### Step 8: Verify Tenant Isolation

**Test 1: Check Tenant Metadata**
```bash
# Open browser console at localhost:5173
# Run:
const { tenant } = useTenant();
console.log(tenant);
```

Expected output:
```json
{
  "id": "demo-tenant",
  "businessName": "Demo Coffee Shop",
  "businessType": "cafe",
  "subdomain": "demo-tenant",
  "enabledModules": {
    "base": true,
    "tableManagement": false,
    "management": false,
    "delivery": false
  },
  ...
}
```

**Test 2: Check User Tenant**
```bash
# After logging in, run:
const { user } = useAuth();
console.log(user.tenantId);
```

Expected output: `"demo-tenant"`

**Test 3: Check Security Rules**

Try to access another tenant's data (should fail):
```javascript
// In browser console
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase/config';

// Try to access non-existent tenant (should be blocked)
getDocs(collection(db, 'tenants/other-tenant/products'));
```

Expected: Permission denied error ✅

---

## Step 9: Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

**Expected Output:**
```
✔ hosting: files uploaded successfully
✔ Deploy complete!
Hosting URL: https://coffee-shop-mvp-4ff60.web.app
```

---

## Post-Deployment Verification

### Checklist

- [ ] Cloud Functions deployed
  - [ ] `inviteUser` function exists
  - [ ] `acceptInvitation` function exists
- [ ] Firestore Rules deployed
  - [ ] Tenant isolation rules active
- [ ] Data migrated successfully
  - [ ] `/tenantMetadata/demo-tenant` exists
  - [ ] Products, categories, orders in `/tenants/demo-tenant/`
  - [ ] Users have `tenantId` field
- [ ] App loads correctly
  - [ ] TenantContext loads `demo-tenant`
  - [ ] Products display
  - [ ] Orders work
  - [ ] Admin panel accessible
- [ ] Offline mode works
  - [ ] Disconnect WiFi
  - [ ] Menu still loads (cached)
  - [ ] Can create order (queued)
  - [ ] Reconnect → order syncs

---

## Rollback Plan (If Something Goes Wrong)

### Option 1: Revert Security Rules

```bash
# Copy old rules to firestore.rules
# Then deploy
firebase deploy --only firestore:rules
```

### Option 2: Restore from Backup

```bash
firebase firestore:import gs://coffee-shop-mvp-4ff60.appspot.com/backups/YYYYMMDD
```

### Option 3: Revert Code Changes

```bash
git checkout HEAD~1 -- firebase/
npm run build
firebase deploy
```

---

## Common Issues & Solutions

### Issue 1: "Tenant Not Found"

**Cause:** Migration script didn't run or failed.

**Solution:**
1. Check Firestore Console → `/tenantMetadata/demo-tenant` exists?
2. If not, run migration script again
3. Check migration script logs for errors

---

### Issue 2: "Permission Denied" Errors

**Cause:** Security rules not deployed or user missing `tenantId`.

**Solution:**
1. Check Firebase Console → Firestore → Rules (deployed?)
2. Check user document: `/users/{uid}` has `tenantId` field?
3. Re-run migration script Step 6 if needed

---

### Issue 3: Cloud Functions Not Working

**Cause:** Functions didn't deploy or have errors.

**Solution:**
1. Check Firebase Console → Functions → Logs
2. Look for error messages
3. Common issue: Missing environment variables
4. Redeploy: `firebase deploy --only functions`

---

### Issue 4: Offline Mode Not Working

**Cause:** IndexedDB persistence not enabled or browser doesn't support it.

**Solution:**
1. Check browser console for warnings
2. Try different browser (Chrome recommended)
3. Clear browser cache and reload
4. Check `firebase/config.ts` has `enableIndexedDbPersistence`

---

## Next Steps (After Deployment)

1. **Create Second Tenant** (Client 1 - Mobile Café)
   - Manually create in Firestore Console
   - Or build admin UI for tenant creation

2. **Set Up Subdomain Routing**
   - Configure DNS: `*.yourapp.com` → Firebase Hosting
   - Test: `demo-tenant.yourapp.com`

3. **Test User Invitation Flow**
   - Admin invites new user via Cloud Function
   - User receives email (once integrated)
   - User sets password and logs in

4. **Begin Week 3-4 Tasks**
   - User Management UI
   - Admin Panel updates
   - Dine-in order features

---

## Support & Documentation

- **Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Week 1 Progress:** [WEEK1_PROGRESS.md](./WEEK1_PROGRESS.md)
- **Firebase Console:** https://console.firebase.google.com/project/coffee-shop-mvp-4ff60

---

**Last Updated:** October 23, 2025, 9:00 PM
