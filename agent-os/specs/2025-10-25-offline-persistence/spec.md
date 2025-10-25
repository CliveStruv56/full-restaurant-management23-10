# Offline Persistence - Specification

**Feature:** Offline Persistence for Restaurant Management System
**Date:** October 25, 2025
**Status:** ✅ COMPLETED
**Effort:** Medium (1 week)

## Overview

Enable the restaurant management system to function seamlessly when internet connectivity is lost. Staff can continue taking orders, viewing the menu, and accessing critical data. All changes automatically sync when connectivity returns.

## Business Value

**Problem:** Restaurant WiFi can be unreliable. Staff need to continue operations even when connection drops temporarily.

**Solution:** Firestore offline persistence with intelligent cache priming ensures critical data is always available locally.

**Impact:**
- Zero downtime during connectivity issues
- Better user experience for staff
- Increased confidence in system reliability
- No lost orders or data

## Architecture

### Components

1. **Firestore Offline Persistence** ([firebase/config.ts](firebase/config.ts:36-46))
   - `enableIndexedDbPersistence` with `synchronizeTabs: true`
   - Automatic local caching of all Firestore queries
   - Automatic sync when connection returns

2. **Intelligent Cache Priming** ([firebase/offlineCache.ts](firebase/offlineCache.ts))
   - `primeOfflineCache()` - Preloads critical data on app start
   - Caches today's orders (for KDS)
   - Caches all products (for menu)
   - Caches all categories
   - Caches settings
   - Integrated into [TenantContext](contexts/TenantContext.tsx:95)

3. **Offline Indicator UI** ([components/OfflineIndicator.tsx](components/OfflineIndicator.tsx))
   - Visual indicator when device goes offline
   - Uses browser's `navigator.onLine` API
   - Listens for `online`/`offline` events
   - Displays at bottom center of screen
   - Auto-hides when connection restored

## Implementation Details

### Cache Priming Flow

```
1. User opens app
2. TenantContext loads tenant metadata
3. TenantContext calls primeOfflineCache(tenantId)
4. offlineCache queries:
   - Today's orders (where collectionTime >= today)
   - All products
   - All categories
   - Settings
5. Firestore caches query results in IndexedDB
6. Data available offline
```

### Offline Indicator Flow

```
1. OfflineIndicator component mounts
2. Sets up online/offline event listeners
3. When offline:
   - Shows indicator with icon + message
   - Console logs: "📵 Connection lost - running in offline mode"
4. When online:
   - Hides indicator
   - Console logs: "📶 Connection restored"
   - Firestore auto-syncs pending changes
```

## Files Modified

### New Files
- [components/OfflineIndicator.tsx](components/OfflineIndicator.tsx) - UI component for connection status

### Modified Files
- [contexts/TenantContext.tsx](contexts/TenantContext.tsx) - Integrated cache priming on tenant load
- [App.tsx](App.tsx:23,384) - Added OfflineIndicator to main app

### Existing Files (Already Implemented)
- [firebase/config.ts](firebase/config.ts:36-46) - Offline persistence enabled
- [firebase/offlineCache.ts](firebase/offlineCache.ts) - Cache utilities

## Testing Instructions

### Manual Testing with Chrome DevTools

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open Chrome DevTools (F12)**

3. **Go to Network tab**

4. **Test offline mode:**
   - Click "Online" dropdown
   - Select "Offline"
   - Verify OfflineIndicator appears at bottom center
   - Check console for: "📵 Connection lost - running in offline mode"

5. **Test navigation while offline:**
   - Navigate between Menu, Orders, Account screens
   - Verify all data loads from cache
   - Add items to cart (should work)
   - Try placing order (will queue)

6. **Test online reconnection:**
   - Set DevTools back to "Online"
   - Verify OfflineIndicator disappears
   - Check console for: "📶 Connection restored"
   - Verify Firestore syncs pending changes

### Cache Priming Verification

1. **Open browser console**

2. **Look for cache priming logs:**
   ```
   🔄 Priming offline cache for tenant: demo-tenant...
   ✅ Offline cache primed successfully:
      - 15 orders (today)
      - 12 products
      - 4 categories
      - 1 settings
   ```

3. **Verify IndexedDB:**
   - Chrome DevTools > Application tab
   - Storage > IndexedDB
   - Look for `firestore/...` databases
   - Verify cached documents

## Configuration

### Firebase Config

Located in [firebase/config.ts](firebase/config.ts:36-46):

```typescript
enableIndexedDbPersistence(db, {
  synchronizeTabs: true
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('⚠️ Offline persistence failed: Multiple tabs open. Only one tab can enable persistence.');
  } else if (err.code === 'unimplemented') {
    console.warn('⚠️ Offline persistence not supported in this browser.');
  } else {
    console.error('❌ Error enabling offline persistence:', err);
  }
});
```

**Important Notes:**
- Only one browser tab can enable persistence
- Not supported in private/incognito mode
- Requires IndexedDB support

### Cache Priming Settings

Located in [firebase/offlineCache.ts](firebase/offlineCache.ts:17-60):

```typescript
// Cache today's orders (0:00 to 23:59 today)
const todayOrdersQuery = query(
  collection(db, `tenants/${tenantId}/orders`),
  where('collectionTime', '>=', today.toISOString()),
  where('collectionTime', '<', tomorrow.toISOString())
);
```

**Customization Options:**
- Adjust date range for orders (currently: today only)
- Add more collections to prime (e.g., users, tables)
- Filter by status (e.g., only active orders)

## Known Limitations

1. **Multiple Tabs:**
   - Only the first tab with app open enables offline persistence
   - Other tabs show warning in console
   - All tabs still work, but without offline support

2. **Private/Incognito Mode:**
   - IndexedDB not available
   - App works but no offline support
   - Warning shown in console

3. **Order Placement Offline:**
   - Orders created offline queue automatically
   - Sync when connection returns
   - No user feedback about queued status (future enhancement)

4. **Real-time Updates:**
   - No real-time updates while offline
   - Data stale until reconnection
   - Cache refreshes on reconnect

## Future Enhancements

1. **Queue Status Indicator:**
   - Show count of pending changes
   - Display sync progress
   - Error handling for failed syncs

2. **Selective Cache Control:**
   - Allow users to clear cache
   - Configure what data to cache
   - Cache size management

3. **Background Sync:**
   - Use Service Workers for background sync
   - Retry failed operations
   - Better offline order handling

4. **Conflict Resolution:**
   - Detect and handle data conflicts
   - User prompts for conflict resolution
   - Automatic merge strategies

## Success Metrics

- ✅ App loads without internet connection
- ✅ Cached data visible and functional
- ✅ Orders can be created offline
- ✅ UI indicates offline status
- ✅ Auto-sync on reconnection
- ✅ No data loss

## References

- [Firestore Offline Data](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
- [Online/Offline Events](https://developer.mozilla.org/en-US/docs/Web/API/Window/online_event)
