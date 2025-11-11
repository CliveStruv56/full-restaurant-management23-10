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

async function checkUserRole() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('❌ No user is currently logged in');
        console.log('Please log in at http://some-good.localhost:3000 first');
        process.exit(1);
      }

      console.log('✅ Logged in user:', user.email);
      console.log('User ID:', user.uid);

      try {
        // Get user document from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.log('❌ User document does not exist in Firestore');
          process.exit(1);
        }

        const userData = userDoc.data();
        console.log('\n📄 User Document Data:');
        console.log(JSON.stringify(userData, null, 2));

        console.log('\n🔍 Checking super-admin requirements:');

        // Check if role field exists
        if ('role' in userData) {
          console.log('✅ role field exists:', userData.role);
          if (userData.role === 'super-admin') {
            console.log('✅ User IS a super-admin');
          } else {
            console.log('❌ User role is NOT super-admin:', userData.role);
            console.log('\n💡 Fix: Update user document to have role: "super-admin"');
          }
        } else {
          console.log('❌ role field does NOT exist');
          console.log('\n💡 Fix: Add role: "super-admin" to user document');
        }

        // Check tenantMemberships
        if ('tenantMemberships' in userData) {
          console.log('\n📋 Tenant Memberships:');
          for (const [tenantId, membership] of Object.entries(userData.tenantMemberships)) {
            console.log(`  - ${tenantId}:`, membership);
          }
        } else {
          console.log('\n⚠️  No tenantMemberships field');
        }

        process.exit(0);
      } catch (error: any) {
        console.error('❌ Error fetching user document:', error.message);
        process.exit(1);
      }
    });
  });
}

checkUserRole();
