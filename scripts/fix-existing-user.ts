/**
 * Fix Existing User: Add tenantId to existing user
 *
 * This script updates existing users who were created before multi-tenant
 * implementation to add the required tenantId field.
 */

import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const USER_EMAIL = 'clive.struver@gmail.com';
const TENANT_ID = 'demo-tenant';

async function fixExistingUser() {
  console.log('🔧 Fixing existing user...\n');

  try {
    // Note: We need the user's UID, not email, to update their document
    // Since we can't query by email with client SDK, we'll need to use Firebase Auth
    const { auth } = await import('../firebase/config');
    const { getAuth } = await import('firebase/auth');

    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      console.error('❌ No user is currently logged in');
      console.log('\nPlease run this script while logged in as the user you want to fix.');
      process.exit(1);
    }

    console.log(`Found user: ${currentUser.email} (${currentUser.uid})`);

    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ User document not found in Firestore');
      process.exit(1);
    }

    const userData = userSnap.data();
    console.log('\nCurrent user data:', userData);

    if (userData.tenantId) {
      console.log(`\n✅ User already has tenantId: ${userData.tenantId}`);
      console.log('No update needed!');
      process.exit(0);
    }

    // Update user with tenantId
    await updateDoc(userRef, {
      tenantId: TENANT_ID
    });

    console.log(`\n✅ Successfully added tenantId to user: ${TENANT_ID}`);
    console.log('\nYou can now use the app with multi-tenant support!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run fix
fixExistingUser();
