/**
 * Fix User TenantId - Admin Script
 *
 * This script uses Firebase Admin SDK to update existing users with tenantId.
 * Admin SDK bypasses security rules.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const USER_EMAIL = 'clive.struver@gmail.com';
const TENANT_ID = 'demo-tenant';

async function fixUserTenantId() {
  console.log('🔧 Fixing user tenantId...\n');

  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(USER_EMAIL);
    console.log(`Found user: ${userRecord.email} (${userRecord.uid})`);

    // Update Firestore document
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('❌ User document not found in Firestore');
      process.exit(1);
    }

    console.log('\nCurrent user data:', userDoc.data());

    // Update with tenantId
    await userRef.update({
      tenantId: TENANT_ID
    });

    console.log(`\n✅ Successfully updated user with tenantId: ${TENANT_ID}`);
    console.log('\nYou can now log in and use the app!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fix failed:', error);
    console.error('\nMake sure firebase-admin-key.json exists in the project root.');
    process.exit(1);
  }
}

// Run fix
fixUserTenantId();
