import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Cloud Function: validateInvitationToken
 *
 * Validates an invitation token and returns invitation details if valid.
 * This runs server-side to bypass Firestore security rules.
 *
 * @param token - The invitation token from the signup URL
 * @returns Object with validation status and invitation details
 */
export const validateInvitationToken = functions.https.onCall(async (data, context) => {
    const { token } = data;

    if (!token) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Token is required'
        );
    }

    try {
        const db = admin.firestore();

        // Query for invitation with matching token
        const invitationsRef = db.collection('invitations');
        const q = invitationsRef.where('token', '==', token);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return {
                valid: false,
                error: 'Invalid or expired invitation token'
            };
        }

        const invitationDoc = snapshot.docs[0];
        const invitation = invitationDoc.data();

        // Check if invitation is still pending
        if (invitation.status !== 'pending') {
            return {
                valid: false,
                error: invitation.status === 'accepted'
                    ? 'This invitation has already been used'
                    : 'This invitation is no longer valid'
            };
        }

        // Check if invitation has expired (30 days)
        const expirationMs = 30 * 24 * 60 * 60 * 1000; // 30 days

        // Handle createdAt - could be Timestamp, Date, or number
        let createdAtMs: number;
        if (invitation.createdAt && typeof invitation.createdAt.toMillis === 'function') {
            // Firestore Timestamp
            createdAtMs = invitation.createdAt.toMillis();
        } else if (invitation.createdAt && typeof invitation.createdAt.toDate === 'function') {
            // Firebase Timestamp with toDate
            createdAtMs = invitation.createdAt.toDate().getTime();
        } else if (invitation.createdAt instanceof Date) {
            // JavaScript Date
            createdAtMs = invitation.createdAt.getTime();
        } else if (typeof invitation.createdAt === 'number') {
            // Already a timestamp
            createdAtMs = invitation.createdAt;
        } else {
            // Fallback - treat as current time (won't expire)
            createdAtMs = Date.now();
        }

        const invitationAge = Date.now() - createdAtMs;

        if (invitationAge > expirationMs) {
            return {
                valid: false,
                error: 'This invitation has expired'
            };
        }

        // Return valid invitation details (without sensitive data)
        return {
            valid: true,
            invitation: {
                id: invitationDoc.id,
                email: invitation.email,
                role: invitation.role,
                tenantId: invitation.tenantId,
                invitedBy: invitation.invitedBy,
                createdAt: createdAtMs
            }
        };

    } catch (error: any) {
        functions.logger.error('Error validating invitation token:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to validate invitation token'
        );
    }
});
