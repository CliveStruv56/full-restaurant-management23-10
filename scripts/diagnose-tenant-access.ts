import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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
const auth = getAuth(app);

async function diagnose() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('❌ No user logged in');
        console.log('\nPlease log in at http://superadmin.localhost:3000 first');
        process.exit(1);
      }

      console.log('✅ Logged in as:', user.email);
      console.log('User ID:', user.uid);

      try {
        // Check user document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log('❌ User document not found');
          process.exit(1);
        }

        const userData = userDoc.data();
        console.log('\n📄 User Document:');
        console.log('Role:', userData.role);
        console.log('Tenant ID (legacy):', userData.tenantId);
        console.log('Current Tenant ID:', userData.currentTenantId);

        console.log('\n📋 Tenant Memberships:');
        if (userData.tenantMemberships) {
          for (const [tenantId, membership] of Object.entries(userData.tenantMemberships)) {
            console.log(`  ✅ ${tenantId}:`, membership);
          }
        } else {
          console.log('  ❌ No tenant memberships');
        }

        // Check if some-good membership exists
        if (userData.tenantMemberships && userData.tenantMemberships['some-good']) {
          console.log('\n✅ User HAS access to some-good tenant');
          console.log('   Role:', userData.tenantMemberships['some-good'].role);
          console.log('   Active:', userData.tenantMemberships['some-good'].isActive);
        } else {
          console.log('\n❌ User does NOT have access to some-good tenant');
          console.log('\n💡 The auto-add feature may not have worked. Check:');
          console.log('   1. Was the tenant created with the latest code?');
          console.log('   2. Check console logs when creating tenant');
        }

        // Check some-good tenant metadata
        console.log('\n🏢 Checking some-good tenant metadata...');
        const tenantDocRef = doc(db, 'tenantMetadata', 'some-good');
        const tenantDoc = await getDoc(tenantDocRef);

        if (tenantDoc.exists()) {
          console.log('✅ Tenant metadata EXISTS');
          const tenantData = tenantDoc.data();
          console.log('   Business Name:', tenantData.businessName);
          console.log('   Subdomain:', tenantData.subdomain);
          console.log('   Status:', tenantData.tenantStatus?.status);
        } else {
          console.log('❌ Tenant metadata NOT FOUND');
        }

        // Check for undefined tenant issue
        console.log('\n🔍 Checking for undefined tenant bug...');
        const undefinedTenantRef = doc(db, 'tenants', 'undefined', 'settings', 'settings');
        const undefinedDoc = await getDoc(undefinedTenantRef);

        if (undefinedDoc.exists()) {
          console.log('⚠️  WARNING: tenants/undefined exists - seeding bug detected!');
          console.log('   This means tenant ID was undefined during seeding');
        } else {
          console.log('✅ No undefined tenant found');
        }

        process.exit(0);
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
    });
  });
}

diagnose();
