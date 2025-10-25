/**
 * User Migration Script: Single-Tenant to Multi-Tenant
 *
 * This script migrates existing user documents from the old single-tenant structure
 * to the new multi-tenant structure with tenantMemberships.
 *
 * USAGE:
 *   npm run migrate-users
 *
 * WHAT IT DOES:
 * 1. Reads all user documents from /users collection
 * 2. For each user with old structure (tenantId + role):
 *    - Creates tenantMemberships object
 *    - Preserves existing tenantId and role as legacy fields
 *    - Sets currentTenantId to their existing tenant
 *    - Adds createdAt timestamp if missing
 * 3. Updates documents in batches (500 at a time for efficiency)
 * 4. Logs progress and errors
 *
 * SAFETY:
 * - Non-destructive: keeps legacy fields for backward compatibility
 * - Dry run mode available (set DRY_RUN=true)
 * - Batch commits to handle large datasets
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// Initialize Firebase Admin SDK
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Configuration
const BATCH_SIZE = 500;
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to 'true' to preview changes without committing

interface LegacyUser {
  uid?: string;
  email: string;
  displayName?: string;
  tenantId?: string;
  role?: 'customer' | 'staff' | 'admin';
  loyaltyPoints?: number;
  invitedBy?: string;
  invitedAt?: string;
  invitationAccepted?: boolean;
  createdAt?: string;
  [key: string]: any;
}

interface TenantMembership {
  role: 'customer' | 'staff' | 'admin';
  joinedAt: string;
  invitedBy?: string;
  isActive: boolean;
}

/**
 * Prompt user for confirmation
 */
async function confirmMigration(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      'This will migrate ALL users to multi-tenant structure. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Transform legacy user to multi-tenant structure
 */
function transformUser(userId: string, userData: LegacyUser): any {
  const now = new Date().toISOString();

  // If user already has tenantMemberships, skip transformation
  if (userData.tenantMemberships) {
    console.log(`  User ${userId} already has multi-tenant structure, skipping...`);
    return null;
  }

  // If user doesn't have tenantId or role, they need manual review
  if (!userData.tenantId || !userData.role) {
    console.warn(`  ⚠️  User ${userId} missing tenantId or role, skipping...`);
    return null;
  }

  // Create tenantMemberships object
  const tenantMemberships: { [tenantId: string]: TenantMembership } = {};
  tenantMemberships[userData.tenantId] = {
    role: userData.role,
    joinedAt: userData.invitedAt || userData.createdAt || now,
    invitedBy: userData.invitedBy,
    isActive: true,
  };

  // Build updated user document
  const updatedUser: any = {
    ...userData, // Keep all existing fields
    tenantMemberships,
    currentTenantId: userData.tenantId,
    createdAt: userData.createdAt || now,
  };

  return updatedUser;
}

/**
 * Main migration function
 */
async function migrateUsers() {
  console.log('========================================');
  console.log('User Migration: Single-Tenant to Multi-Tenant');
  console.log('========================================');
  console.log();

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE: No changes will be committed');
    console.log();
  }

  // Get all users
  console.log('📖 Reading all users from Firestore...');
  const usersSnapshot = await db.collection('users').get();
  console.log(`   Found ${usersSnapshot.size} users`);
  console.log();

  // Confirm before proceeding
  if (!DRY_RUN) {
    const confirmed = await confirmMigration();
    if (!confirmed) {
      console.log('Migration cancelled by user.');
      process.exit(0);
    }
    console.log();
  }

  // Process users in batches
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const users: { id: string; data: LegacyUser }[] = [];
  usersSnapshot.forEach((doc) => {
    users.push({ id: doc.id, data: doc.data() as LegacyUser });
  });

  // Process in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batchUsers = users.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let batchUpdateCount = 0;

    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

    for (const user of batchUsers) {
      totalProcessed++;

      try {
        const transformedUser = transformUser(user.id, user.data);

        if (transformedUser === null) {
          totalSkipped++;
          continue;
        }

        // Add update to batch
        const userRef = db.collection('users').doc(user.id);
        batch.set(userRef, transformedUser, { merge: true });
        batchUpdateCount++;

        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would update user ${user.id}:`, {
            email: user.data.email,
            oldTenant: user.data.tenantId,
            oldRole: user.data.role,
            newMemberships: transformedUser.tenantMemberships,
          });
        }
      } catch (error) {
        console.error(`  ❌ Error processing user ${user.id}:`, error);
        totalErrors++;
      }
    }

    // Commit batch
    if (!DRY_RUN && batchUpdateCount > 0) {
      try {
        await batch.commit();
        totalUpdated += batchUpdateCount;
        console.log(`  ✅ Updated ${batchUpdateCount} users in this batch`);
      } catch (error) {
        console.error(`  ❌ Error committing batch:`, error);
        totalErrors += batchUpdateCount;
      }
    } else if (DRY_RUN) {
      totalUpdated += batchUpdateCount;
    }

    console.log();
  }

  // Summary
  console.log('========================================');
  console.log('Migration Complete');
  console.log('========================================');
  console.log(`Total users processed: ${totalProcessed}`);
  console.log(`Total users updated: ${totalUpdated}`);
  console.log(`Total users skipped: ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log();

  if (DRY_RUN) {
    console.log('🔍 This was a DRY RUN. No changes were committed to the database.');
    console.log('   To perform the actual migration, run: DRY_RUN=false npm run migrate-users');
  } else {
    console.log('✅ Migration completed successfully!');
  }

  process.exit(0);
}

// Run migration
migrateUsers().catch((error) => {
  console.error('Fatal error during migration:', error);
  process.exit(1);
});
