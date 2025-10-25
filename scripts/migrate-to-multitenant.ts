/**
 * Data Migration Script: Single-Tenant → Multi-Tenant
 *
 * This script migrates existing single-tenant data to the new multi-tenant structure.
 *
 * IMPORTANT: Run this ONCE on production data.
 * 1. Test on staging environment first
 * 2. Backup production database before running
 * 3. Run during low-traffic period
 *
 * Usage:
 *   npm run migrate:multitenant
 */

import { db } from '../firebase/config.ts';
import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';
import { Tenant } from '../types.ts';

const DEMO_TENANT_ID = 'demo-tenant';

export const migrateToMultiTenant = async () => {
  console.log('🔄 Starting migration to multi-tenant architecture...\n');

  const startTime = Date.now();

  try {
    // Step 1: Create demo tenant metadata
    console.log('📝 Step 1: Creating demo tenant metadata...');
    await createDemoTenant();

    // Step 2: Migrate products
    console.log('\n📦 Step 2: Migrating products...');
    await migrateCollection('products', DEMO_TENANT_ID);

    // Step 3: Migrate categories
    console.log('\n📂 Step 3: Migrating categories...');
    await migrateCollection('categories', DEMO_TENANT_ID);

    // Step 4: Migrate orders
    console.log('\n📋 Step 4: Migrating orders...');
    await migrateOrders(DEMO_TENANT_ID);

    // Step 5: Migrate settings
    console.log('\n⚙️  Step 5: Migrating settings...');
    await migrateSettings(DEMO_TENANT_ID);

    // Step 6: Update users
    console.log('\n👥 Step 6: Updating user documents...');
    await updateUsers(DEMO_TENANT_ID);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Migration completed successfully in ${duration}s!`);
    console.log('\n📊 Summary:');
    console.log(`   - Tenant ID: ${DEMO_TENANT_ID}`);
    console.log(`   - All data migrated to: /tenants/${DEMO_TENANT_ID}/`);
    console.log(`   - All users updated with tenantId`);
    console.log('\n⚠️  Next Steps:');
    console.log('   1. Deploy new Firestore security rules');
    console.log('   2. Update all API calls to use tenant context');
    console.log('   3. Test thoroughly before production deployment');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nPlease check the error above and retry.');
    console.error('If data was partially migrated, you may need to restore from backup.');
    process.exit(1);
  }
};

/**
 * Create demo tenant metadata
 */
async function createDemoTenant() {
  const tenantMetadata: Tenant = {
    id: DEMO_TENANT_ID,
    businessName: 'Demo Coffee Shop',
    businessType: 'cafe',
    subdomain: 'demo-tenant',
    enabledModules: {
      base: true,
      tableManagement: false,
      management: false,
      delivery: false,
    },
    subscription: {
      plan: 'trial',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      modules: ['base'],
    },
    paymentGateway: {
      provider: 'none',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'tenantMetadata', DEMO_TENANT_ID), tenantMetadata);
  console.log(`   ✓ Created tenant: ${tenantMetadata.businessName}`);
}

/**
 * Migrate a collection to tenant-scoped path
 */
async function migrateCollection(collectionName: string, tenantId: string) {
  const sourceCollection = collection(db, collectionName);
  const snapshot = await getDocs(sourceCollection);

  if (snapshot.empty) {
    console.log(`   ⚠️  No documents found in /${collectionName}`);
    return;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((docSnapshot) => {
    const newRef = doc(db, `tenants/${tenantId}/${collectionName}`, docSnapshot.id);
    batch.set(newRef, docSnapshot.data());
    count++;
  });

  await batch.commit();
  console.log(`   ✓ Migrated ${count} documents to /tenants/${tenantId}/${collectionName}`);
}

/**
 * Migrate orders with additional fields
 */
async function migrateOrders(tenantId: string) {
  const ordersCollection = collection(db, 'orders');
  const snapshot = await getDocs(ordersCollection);

  if (snapshot.empty) {
    console.log(`   ⚠️  No orders found`);
    return;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((docSnapshot) => {
    const orderData = docSnapshot.data();
    const newRef = doc(db, `tenants/${tenantId}/orders`, docSnapshot.id);

    // Add new fields for multi-tenant support
    batch.set(newRef, {
      ...orderData,
      tenantId,
      orderType: 'takeaway', // Default for existing orders
      // tableNumber and guestCount will be undefined (optional fields)
    });
    count++;
  });

  await batch.commit();
  console.log(`   ✓ Migrated ${count} orders to /tenants/${tenantId}/orders`);
  console.log(`   ℹ️  All existing orders marked as 'takeaway'`);
}

/**
 * Migrate settings
 */
async function migrateSettings(tenantId: string) {
  const appCollection = collection(db, 'app');
  const snapshot = await getDocs(appCollection);

  if (snapshot.empty) {
    console.log(`   ⚠️  No settings found in /app`);
    return;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((docSnapshot) => {
    const newRef = doc(db, `tenants/${tenantId}/settings`, docSnapshot.id);
    batch.set(newRef, docSnapshot.data());
    count++;
  });

  await batch.commit();
  console.log(`   ✓ Migrated ${count} settings documents to /tenants/${tenantId}/settings`);
}

/**
 * Update users with tenantId
 */
async function updateUsers(tenantId: string) {
  const usersCollection = collection(db, 'users');
  const snapshot = await getDocs(usersCollection);

  if (snapshot.empty) {
    console.log(`   ⚠️  No users found`);
    return;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((docSnapshot) => {
    const userRef = doc(db, 'users', docSnapshot.id);
    batch.update(userRef, { tenantId });
    count++;
  });

  await batch.commit();
  console.log(`   ✓ Updated ${count} users with tenantId: ${tenantId}`);
}

/**
 * Backup function (optional - for safety)
 */
export async function backupData() {
  console.log('💾 Creating backup...');

  const collections = ['products', 'categories', 'orders', 'app', 'users'];
  const backup: Record<string, any[]> = {};

  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));
    backup[collectionName] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  const backupData = JSON.stringify(backup, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;

  // In a real scenario, save to file or cloud storage
  console.log(`Backup data prepared (${backupData.length} characters)`);
  console.log(`Suggested filename: ${filename}`);
  console.log('\n⚠️  Save this backup before proceeding with migration!');

  return backupData;
}

// Run migration if executed directly
// Check if this is the main module (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  console.log('⚠️  WARNING: This will migrate your database to multi-tenant structure!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  setTimeout(async () => {
    await migrateToMultiTenant();
    process.exit(0);
  }, 5000);
}
