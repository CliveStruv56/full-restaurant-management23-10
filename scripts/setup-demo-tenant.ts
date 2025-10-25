/**
 * Simple Setup Script: Create Demo Tenant
 *
 * This creates the demo tenant metadata for a fresh installation.
 * Run this if you're starting fresh and don't need to migrate data.
 */

import { db } from '../firebase/config.ts';
import { doc, setDoc } from 'firebase/firestore';
import { Tenant } from '../types.ts';

const DEMO_TENANT_ID = 'demo-tenant';

async function setupDemoTenant() {
  console.log('🔧 Setting up demo tenant...\n');

  try {
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
    console.log(`✅ Created demo tenant: ${tenantMetadata.businessName}`);
    console.log(`   - Tenant ID: ${DEMO_TENANT_ID}`);
    console.log(`   - Subdomain: demo-tenant`);
    console.log(`   - Trial ends: ${new Date(tenantMetadata.subscription.trialEndsAt!).toLocaleDateString()}`);
    console.log('\n✅ Setup complete! You can now use the multi-tenant system.');
    console.log('\n📝 Next steps:');
    console.log('   1. Wrap your App with TenantProvider');
    console.log('   2. Update components to use the multi-tenant API');
    console.log('   3. Test the application');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\nMake sure your Firestore security rules allow this operation.');
    process.exit(1);
  }
}

// Run setup
setupDemoTenant();
