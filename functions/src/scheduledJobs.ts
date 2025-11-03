import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * Scheduled Cloud Function: Auto-Cancel No-Show Reservations
 *
 * Runs every 5 minutes to automatically cancel confirmed reservations
 * that are more than 15 minutes past their scheduled time.
 *
 * This function:
 * - Queries all confirmed reservations across all tenants
 * - Calculates time difference from scheduled time to current time
 * - Auto-cancels reservations >15 minutes past with 'no-show' status
 * - Adds admin notes with timestamp
 * - Logs execution details for monitoring
 */

interface Reservation {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format (e.g., "19:00")
  partySize: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  tablePreference?: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export const autoCancelNoShows = onSchedule(
  {
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
    memory: '256MiB',
  },
  async (event) => {
    const db = getFirestore();
    const now = new Date();

    console.log(`[AUTO-CANCEL] Job started at ${now.toISOString()}`);

    try {
      // Query all confirmed reservations across all tenants using collectionGroup
      const reservationsSnapshot = await db
        .collectionGroup('reservations')
        .where('status', '==', 'confirmed')
        .get();

      console.log(`[AUTO-CANCEL] Found ${reservationsSnapshot.size} confirmed reservations to check`);

      const updates: Promise<any>[] = [];
      let cancelledCount = 0;
      let checkedCount = 0;

      for (const doc of reservationsSnapshot.docs) {
        checkedCount++;
        const reservation = doc.data() as Reservation;

        // Parse reservation datetime from date and time fields
        // Expected formats: date="2025-10-27", time="19:00"
        const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);

        // Calculate minutes past reservation time
        const millisecondsPast = now.getTime() - reservationDateTime.getTime();
        const minutesPast = millisecondsPast / 60000;

        // Auto-cancel if more than 15 minutes past
        if (minutesPast > 15) {
          console.log(
            `[AUTO-CANCEL] Cancelling reservation ${doc.id} for ${reservation.contactName}: ` +
            `${minutesPast.toFixed(1)} minutes past scheduled time (${reservation.date} ${reservation.time})`
          );

          const adminNote = `Auto-cancelled: Customer did not arrive within 15 minutes of reservation time. ` +
            `No-show detected at ${now.toISOString()} (${Math.floor(minutesPast)} minutes past scheduled time).`;

          updates.push(
            doc.ref.update({
              status: 'no-show',
              updatedAt: FieldValue.serverTimestamp(),
              adminNotes: adminNote,
            })
          );
          cancelledCount++;
        } else {
          // Log reservations that are within grace period
          console.log(
            `[AUTO-CANCEL] Reservation ${doc.id} for ${reservation.contactName}: ` +
            `${minutesPast.toFixed(1)} minutes past - within grace period`
          );
        }
      }

      // Execute all updates in parallel
      await Promise.all(updates);

      console.log(
        `[AUTO-CANCEL] Job completed at ${new Date().toISOString()}. ` +
        `Checked ${checkedCount} reservations, cancelled ${cancelledCount} no-shows`
      );
    } catch (error) {
      console.error('[AUTO-CANCEL] Error in auto-cancel job:', error);
      throw error;
    }
  }
);
