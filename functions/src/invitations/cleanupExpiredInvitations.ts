/**
 * Cloud Function: Cleanup Expired Invitations
 *
 * Scheduled function that runs daily to mark expired invitations
 * Runs at 2 AM UTC to clean up invitations that have passed their expiration date
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Main scheduled function (runs daily at 2 AM UTC)
 */
export const cleanupExpiredInvitationsScheduled = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2:00 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    functions.logger.info('Starting expired invitations cleanup job');

    const db = admin.firestore();
    const now = new Date();

    try {
      // Query invitations that are pending and past expiration
      const expiredInvitationsQuery = await db
        .collection('invitations')
        .where('status', '==', 'pending')
        .where('expiresAt', '<', now.toISOString())
        .get();

      functions.logger.info(`Found ${expiredInvitationsQuery.size} expired invitations`);

      if (expiredInvitationsQuery.empty) {
        functions.logger.info('No expired invitations to clean up');
        return;
      }

      // Update invitations in batches (Firestore batch limit is 500)
      const batchSize = 500;
      let batch = db.batch();
      let batchCount = 0;
      let totalUpdated = 0;

      for (const invitationDoc of expiredInvitationsQuery.docs) {
        batch.update(invitationDoc.ref, {
          status: 'expired',
        });

        batchCount++;
        totalUpdated++;

        // Commit batch when reaching limit
        if (batchCount >= batchSize) {
          await batch.commit();
          functions.logger.info(`Committed batch of ${batchCount} updates`);

          // Start new batch
          batch = db.batch();
          batchCount = 0;
        }
      }

      // Commit remaining updates
      if (batchCount > 0) {
        await batch.commit();
        functions.logger.info(`Committed final batch of ${batchCount} updates`);
      }

      functions.logger.info('Expired invitations cleanup complete', {
        totalExpired: totalUpdated,
      });

    } catch (error: any) {
      functions.logger.error('Error in expired invitations cleanup job', {
        error: error.message,
        stack: error.stack,
      });

      // Don't throw - we want the job to complete even if there are errors
    }
  });
