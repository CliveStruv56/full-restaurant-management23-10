/**
 * BROWSER CONSOLE MIGRATION SCRIPT
 *
 * Copy and paste this entire script into your browser console while logged in as admin.
 * This will migrate data from old collections to tenant-scoped collections.
 *
 * Instructions:
 * 1. Open your app at localhost:3001 and log in as admin
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Wait for completion message
 */

(async function migrateData() {
  console.log('🚀 Starting browser-based migration...\n');

  // Import Firebase functions
  const { db } = await import('../firebase/config.js');
  const { collection, getDocs, doc, setDoc, writeBatch } = await import('firebase/firestore');

  const TENANT_ID = 'demo-tenant';
  let totalMigrated = 0;

  try {
    // Migrate products
    console.log('📦 Migrating products...');
    const productsSnap = await getDocs(collection(db, 'products'));

    if (!productsSnap.empty) {
      const batch = writeBatch(db);
      productsSnap.forEach(productDoc => {
        const targetRef = doc(db, `tenants/${TENANT_ID}/products`, productDoc.id);
        batch.set(targetRef, productDoc.data());
      });
      await batch.commit();
      console.log(`  ✅ Migrated ${productsSnap.size} products`);
      totalMigrated += productsSnap.size;
    }

    // Migrate categories
    console.log('📦 Migrating categories...');
    const categoriesSnap = await getDocs(collection(db, 'categories'));

    if (!categoriesSnap.empty) {
      const batch = writeBatch(db);
      categoriesSnap.forEach(categoryDoc => {
        const targetRef = doc(db, `tenants/${TENANT_ID}/categories`, categoryDoc.id);
        batch.set(targetRef, categoryDoc.data());
      });
      await batch.commit();
      console.log(`  ✅ Migrated ${categoriesSnap.size} categories`);
      totalMigrated += categoriesSnap.size;
    }

    // Migrate settings
    console.log('⚙️  Migrating settings...');
    const appDoc = await getDocs(collection(db, 'app'));

    if (!appDoc.empty) {
      const settingsDoc = appDoc.docs.find(d => d.id === 'settings');
      if (settingsDoc) {
        await setDoc(doc(db, `tenants/${TENANT_ID}/settings`, 'settings'), settingsDoc.data());
        console.log('  ✅ Settings migrated');
      }
    }

    console.log(`\n✅ Migration complete! Migrated ${totalMigrated} documents.`);
    console.log('\n🔄 Refreshing page...');

    setTimeout(() => {
      window.location.reload();
    }, 2000);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nIf you see permission errors, the security rules may be blocking writes.');
  }
})();
