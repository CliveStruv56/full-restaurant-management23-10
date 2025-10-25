/**
 * Add TenantId to Existing User
 *
 * This script updates the currently logged-in user with a tenantId.
 * Run this while logged in to fix migration issues.
 */

import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const TENANT_ID = 'demo-tenant';

async function addTenantIdToUser() {
  console.log('🔧 Adding tenantId to user...\n');

  return new Promise((resolve, reject) => {
    // Wait for auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Unsubscribe immediately

      if (!user) {
        console.error('❌ No user is currently logged in');
        console.log('\nPlease log in first, then run this script.');
        reject(new Error('No user logged in'));
        return;
      }

      try {
        console.log(`Found logged-in user: ${user.email} (${user.uid})`);

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error('❌ User document not found in Firestore');
          reject(new Error('User document not found'));
          return;
        }

        const userData = userSnap.data();
        console.log('\nCurrent user data:', userData);

        if (userData.tenantId) {
          console.log(`\n✅ User already has tenantId: ${userData.tenantId}`);
          console.log('No update needed!');
          resolve(true);
          return;
        }

        // Update user with tenantId
        console.log(`\nUpdating user with tenantId: ${TENANT_ID}...`);
        await updateDoc(userRef, {
          tenantId: TENANT_ID
        });

        console.log(`\n✅ Successfully added tenantId to user!`);
        console.log('\nPlease refresh your browser to reload the app with the new tenantId.');
        resolve(true);
      } catch (error) {
        console.error('\n❌ Update failed:', error);
        reject(error);
      }
    });
  });
}

// Run the update
addTenantIdToUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
