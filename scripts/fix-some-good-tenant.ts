import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALe8znJtnhiRUe6CrPAMRWq04lS2gGduY",
  authDomain: "coffee-shop-mvp-4ff60.firebaseapp.com",
  projectId: "coffee-shop-mvp-4ff60",
  storageBucket: "coffee-shop-mvp-4ff60.firebasestorage.app",
  messagingSenderId: "801630582937",
  appId: "1:801630582937:web:91aff3c65f23abd4c26008"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixTenant() {
  try {
    console.log('Step 1: Reading incorrectly created tenant...\n');

    // Read the wrong tenant
    const wrongTenantRef = doc(db, 'tenantMetadata', 'AFTD7U1zQap0dZQEynGn');
    const wrongTenantSnap = await getDoc(wrongTenantRef);

    if (!wrongTenantSnap.exists()) {
      console.log('❌ Tenant AFTD7U1zQap0dZQEynGn not found');
      process.exit(1);
    }

    const tenantData = wrongTenantSnap.data();
    console.log('✅ Found tenant data:', JSON.stringify(tenantData, null, 2));

    console.log('\nStep 2: Creating tenant with correct ID (some-good)...\n');

    // Create tenant with correct ID
    const correctTenantRef = doc(db, 'tenantMetadata', 'some-good');
    await setDoc(correctTenantRef, tenantData);
    console.log('✅ Created tenant at tenantMetadata/some-good');

    console.log('\nStep 3: Deleting incorrectly created tenant...\n');

    // Delete the wrong tenant
    await deleteDoc(wrongTenantRef);
    console.log('✅ Deleted tenant AFTD7U1zQap0dZQEynGn');

    console.log('\n✅ SUCCESS! Tenant "some-good" is now correctly configured');
    console.log('You can now access it at: http://some-good.localhost:3000');
  } catch (error: any) {
    console.error('❌ Error fixing tenant:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }

  process.exit(0);
}

fixTenant();
