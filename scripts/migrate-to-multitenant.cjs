/**
 * Migrate Data to Multi-Tenant Structure
 *
 * This script migrates existing data from:
 *   /products -> /tenants/demo-tenant/products
 *   /categories -> /tenants/demo-tenant/categories
 *   /orders -> /tenants/demo-tenant/orders
 *   /app -> /tenants/demo-tenant/settings/settings
 *
 * Uses Firebase Admin SDK to bypass security rules.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with application default credentials
// This works when running locally if you're authenticated with Firebase CLI
admin.initializeApp({
  projectId: 'coffee-shop-mvp-4ff60'
});

const db = admin.firestore();
const TENANT_ID = 'demo-tenant';

async function migrateCollection(sourceCollection, targetPath, addTenantId = true) {
  console.log(`\n📦 Migrating ${sourceCollection} -> ${targetPath}...`);

  try {
    const sourceSnap = await db.collection(sourceCollection).get();

    if (sourceSnap.empty) {
      console.log(`  ⚠️  No documents found in ${sourceCollection}`);
      return 0;
    }

    console.log(`  Found ${sourceSnap.size} documents`);

    const batch = db.batch();
    let count = 0;

    sourceSnap.forEach(doc => {
      const data = doc.data();

      // Add tenantId to documents that need it
      if (addTenantId && sourceCollection === 'orders') {
        data.tenantId = TENANT_ID;
      }

      const targetRef = db.doc(`${targetPath}/${doc.id}`);
      batch.set(targetRef, data);
      count++;
    });

    await batch.commit();
    console.log(`  ✅ Migrated ${count} documents`);
    return count;

  } catch (error) {
    console.error(`  ❌ Migration failed for ${sourceCollection}:`, error.message);
    return 0;
  }
}

async function migrateSettings() {
  console.log(`\n⚙️  Migrating app settings -> /tenants/${TENANT_ID}/settings/settings...`);

  try {
    const appDoc = await db.collection('app').doc('settings').get();

    if (!appDoc.exists) {
      console.log(`  ⚠️  No settings document found in /app/settings`);
      return false;
    }

    const settingsData = appDoc.data();
    await db.doc(`tenants/${TENANT_ID}/settings/settings`).set(settingsData);

    console.log(`  ✅ Settings migrated successfully`);
    return true;

  } catch (error) {
    console.error(`  ❌ Settings migration failed:`, error.message);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting Multi-Tenant Data Migration');
  console.log(`   Target Tenant: ${TENANT_ID}\n`);
  console.log('=' .repeat(60));

  let totalMigrated = 0;

  // Migrate products
  totalMigrated += await migrateCollection(
    'products',
    `tenants/${TENANT_ID}/products`,
    false
  );

  // Migrate categories
  totalMigrated += await migrateCollection(
    'categories',
    `tenants/${TENANT_ID}/categories`,
    false
  );

  // Migrate orders
  totalMigrated += await migrateCollection(
    'orders',
    `tenants/${TENANT_ID}/orders`,
    true // Add tenantId field to orders
  );

  // Migrate settings
  await migrateSettings();

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Migration complete! Migrated ${totalMigrated} documents total.\n`);
  console.log('Next steps:');
  console.log('  1. Verify the data in Firebase Console under /tenants/demo-tenant/');
  console.log('  2. Refresh your app - it should now load the data!');
  console.log('  3. Optional: Clean up old collections (products, categories, orders, app) manually\n');

  process.exit(0);
}

// Run migration
runMigration().catch(error => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
