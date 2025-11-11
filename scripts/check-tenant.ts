import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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

async function checkTenant() {
  try {
    console.log('Checking if "some-good" tenant exists...\n');

    // Check specific tenant
    const tenantRef = doc(db, 'tenantMetadata', 'some-good');
    const tenantSnap = await getDoc(tenantRef);

    if (tenantSnap.exists()) {
      console.log('✅ Tenant "some-good" EXISTS in Firestore');
      console.log('Data:', JSON.stringify(tenantSnap.data(), null, 2));
    } else {
      console.log('❌ Tenant "some-good" DOES NOT EXIST in Firestore\n');
      console.log('Checking all existing tenants...');

      const tenantsRef = collection(db, 'tenantMetadata');
      const tenantsSnap = await getDocs(tenantsRef);

      console.log('\nExisting tenants:');
      tenantsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.businessName} (${data.subdomain})`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error checking tenant:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }

  process.exit(0);
}

checkTenant();
