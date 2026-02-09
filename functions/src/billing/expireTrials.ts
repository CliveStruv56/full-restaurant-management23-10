/**
 * Cloud Function: Expire Trials
 *
 * Phase 1B: Billing Management
 * Scheduled function (daily 00:05 UTC) that downgrades expired trials to Starter.
 * Follows the pattern in functions/src/scheduledJobs.ts.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { getEnabledModulesForPlan } from './billingConfig';

export const expireTrials = onSchedule(
  {
    schedule: '5 0 * * *',  // Daily at 00:05 UTC
    timeZone: 'UTC',
  },
  async () => {
    const db = getFirestore();
    const now = new Date();

    functions.logger.info('Running trial expiration check', {
      timestamp: now.toISOString(),
    });

    // Query all tenants still on trial plan
    const trialsSnapshot = await db
      .collection('tenantMetadata')
      .where('subscription.plan', '==', 'trial')
      .get();

    if (trialsSnapshot.empty) {
      functions.logger.info('No active trials found');
      return;
    }

    let expiredCount = 0;
    let activeCount = 0;
    const batch = db.batch();

    for (const doc of trialsSnapshot.docs) {
      const data = doc.data();
      const trialEndsAt = data.subscription?.trialEndsAt;

      if (!trialEndsAt) {
        // No trialEndsAt set — expire immediately
        const enabledModules = getEnabledModulesForPlan('starter');
        batch.update(doc.ref, {
          'subscription.plan': 'starter',
          enabledModules,
          'tenantStatus.status': 'active',
          'tenantStatus.statusChangedAt': now.toISOString(),
          'tenantStatus.statusChangedBy': 'trial-expiry',
          'tenantStatus.statusReason': 'Trial expired — downgraded to Starter',
        });
        expiredCount++;
        continue;
      }

      const endDate = new Date(trialEndsAt);
      if (endDate < now) {
        const enabledModules = getEnabledModulesForPlan('starter');
        batch.update(doc.ref, {
          'subscription.plan': 'starter',
          enabledModules,
          'tenantStatus.status': 'active',
          'tenantStatus.statusChangedAt': now.toISOString(),
          'tenantStatus.statusChangedBy': 'trial-expiry',
          'tenantStatus.statusReason': 'Trial expired — downgraded to Starter',
        });
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    if (expiredCount > 0) {
      await batch.commit();
    }

    functions.logger.info('Trial expiration check complete', {
      total: trialsSnapshot.size,
      expired: expiredCount,
      active: activeCount,
    });
  }
);
