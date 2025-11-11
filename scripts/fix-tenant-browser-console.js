// Run this script in the browser console while logged in as super-admin
// at http://superadmin.localhost:3000

// Instructions:
// 1. Open http://superadmin.localhost:3000 in your browser
// 2. Log in as super-admin
// 3. Open Developer Tools (F12)
// 4. Go to Console tab
// 5. Copy and paste this entire script
// 6. Press Enter

(async function fixSomeGoodTenant() {
  try {
    console.log('Starting tenant migration...\n');

    // Get Firestore instance from global scope (should be available in the app)
    const { getFirestore, doc, getDoc, setDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const db = getFirestore();

    console.log('Step 1: Reading incorrectly created tenant (AFTD7U1zQap0dZQEynGn)...');

    const wrongTenantRef = doc(db, 'tenantMetadata', 'AFTD7U1zQap0dZQEynGn');
    const wrongTenantSnap = await getDoc(wrongTenantRef);

    if (!wrongTenantSnap.exists()) {
      console.error('❌ Tenant AFTD7U1zQap0dZQEynGn not found');
      return;
    }

    const tenantData = wrongTenantSnap.data();
    console.log('✅ Found tenant:', tenantData.businessName);
    console.log('   Subdomain:', tenantData.subdomain);

    console.log('\nStep 2: Creating tenant with correct ID (some-good)...');

    const correctTenantRef = doc(db, 'tenantMetadata', 'some-good');
    await setDoc(correctTenantRef, tenantData);
    console.log('✅ Created tenant at tenantMetadata/some-good');

    console.log('\nStep 3: Deleting incorrectly created tenant...');

    await deleteDoc(wrongTenantRef);
    console.log('✅ Deleted tenant AFTD7U1zQap0dZQEynGn');

    console.log('\n🎉 SUCCESS! Tenant "some-good" is now correctly configured');
    console.log('You can now access it at: http://some-good.localhost:3000');
    console.log('\nPlease refresh the page to see the updated tenant list.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
})();
