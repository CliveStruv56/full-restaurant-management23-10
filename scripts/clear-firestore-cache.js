// CLEAR FIRESTORE OFFLINE CACHE AND FORCE REFRESH
// Run this script in the browser console at http://some-good.localhost:3000
// while logged in as super-admin

// Instructions:
// 1. Open http://some-good.localhost:3000
// 2. Open Developer Tools (F12)
// 3. Go to Console tab
// 4. Copy and paste this entire script
// 5. Press Enter
// 6. When complete, hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)

(async function clearFirestoreCache() {
  console.log('🧹 Clearing Firestore offline cache...\n');

  try {
    // Step 1: Clear IndexedDB (Firestore offline cache)
    console.log('Step 1: Clearing IndexedDB...');

    const databases = await indexedDB.databases();
    console.log('Found databases:', databases.map(db => db.name));

    for (const db of databases) {
      if (db.name && (
        db.name.includes('firestore') ||
        db.name.includes('firebase') ||
        db.name.includes('coffee-shop')
      )) {
        console.log(`  Deleting: ${db.name}`);
        await new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn(`  ⚠️  Delete blocked for ${db.name} - close other tabs`);
            resolve(false);
          };
        });
        console.log(`  ✅ Deleted: ${db.name}`);
      }
    }

    // Step 2: Clear localStorage
    console.log('\nStep 2: Clearing localStorage...');
    const localStorageKeys = Object.keys(localStorage);
    const firebaseKeys = localStorageKeys.filter(key =>
      key.includes('firebase') ||
      key.includes('firestore') ||
      key.includes('CachedAuthToken')
    );

    console.log('Found Firebase keys:', firebaseKeys);
    firebaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ✅ Removed: ${key}`);
    });

    // Step 3: Clear sessionStorage
    console.log('\nStep 3: Clearing sessionStorage...');
    const sessionKeys = Object.keys(sessionStorage);
    const firebaseSessionKeys = sessionKeys.filter(key =>
      key.includes('firebase') ||
      key.includes('firestore')
    );

    console.log('Found Firebase session keys:', firebaseSessionKeys);
    firebaseSessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`  ✅ Removed: ${key}`);
    });

    console.log('\n✅ Cache cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Hard refresh the page: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
    console.log('2. The app will re-initialize with fresh Firestore rules');
    console.log('3. Seeding should now work correctly');

  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    console.log('\n💡 Alternative: Try clearing browser data manually:');
    console.log('1. Chrome: Settings → Privacy → Clear browsing data');
    console.log('2. Select "Cached images and files" and "Cookies and site data"');
    console.log('3. Choose "localhost:3000" from site settings');
  }
})();
