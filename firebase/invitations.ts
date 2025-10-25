/**
 * Firebase API - Invitations
 *
 * Client-side API functions for the User Invitation System
 */

import { db, functions } from './config';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Invitation } from '../types';

// ============================================================================
// REAL-TIME DATA STREAMING
// ============================================================================

/**
 * Stream invitations for a specific tenant
 * Real-time listener for invitation list in admin panel
 */
export const streamInvitations = (
    tenantId: string,
    callback: (invitations: Invitation[]) => void
) => {
    const invitationsCollection = collection(db, 'invitations');
    const q = query(invitationsCollection, where('tenantId', '==', tenantId));

    return onSnapshot(q, (snapshot) => {
        const invitations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Invitation));

        // Sort by creation date (newest first)
        invitations.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        callback(invitations);
    }, (error) => {
        console.error('Error streaming invitations:', error);
        callback([]);
    });
};

// ============================================================================
// CLOUD FUNCTIONS WRAPPERS
// ============================================================================

/**
 * Create a new invitation
 * Calls the createInvitation Cloud Function
 */
export const createInvitation = async (
    email: string,
    role: 'admin' | 'staff' | 'customer'
): Promise<{ success: boolean; invitationId?: string; error?: string }> => {
    try {
        const createInvitationFn = httpsCallable(functions, 'createInvitation');
        const result = await createInvitationFn({ email, role });
        const data = result.data as any;

        if (data.success) {
            return {
                success: true,
                invitationId: data.invitationId,
            };
        } else {
            return {
                success: false,
                error: data.error || 'Unknown error occurred',
            };
        }
    } catch (error: any) {
        console.error('Error creating invitation:', error);

        // Parse Firebase error messages
        let errorMessage = 'Failed to create invitation';

        if (error.code === 'unauthenticated') {
            errorMessage = 'You must be logged in to send invitations';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'You do not have permission to send invitations';
        } else if (error.code === 'resource-exhausted') {
            errorMessage = error.message || 'Rate limit exceeded';
        } else if (error.code === 'already-exists') {
            errorMessage = 'An active invitation already exists for this email';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
};

/**
 * Accept an invitation and create user account
 * Calls the acceptInvitation Cloud Function
 */
export const acceptInvitation = async (
    token: string,
    displayName: string,
    password: string,
    phoneNumber?: string
): Promise<{ success: boolean; customToken?: string; userId?: string; error?: string }> => {
    try {
        const acceptInvitationFn = httpsCallable(functions, 'acceptInvitation');
        const result = await acceptInvitationFn({
            token,
            displayName,
            password,
            phoneNumber,
        });

        const data = result.data as any;

        if (data.success) {
            return {
                success: true,
                customToken: data.customToken,
                userId: data.userId,
            };
        } else {
            return {
                success: false,
                error: data.error || 'Failed to accept invitation',
            };
        }
    } catch (error: any) {
        console.error('Error accepting invitation:', error);

        let errorMessage = 'Failed to accept invitation';

        if (error.code === 'not-found') {
            errorMessage = 'Invalid or expired invitation';
        } else if (error.code === 'failed-precondition') {
            errorMessage = 'This invitation has already been used or has expired';
        } else if (error.code === 'already-exists') {
            errorMessage = 'An account with this email already exists. Please log in instead.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
};

/**
 * Validate an invitation token
 * Check if token is valid before showing signup form
 */
export const validateInvitationToken = async (
    token: string
): Promise<{
    valid: boolean;
    invitation?: Partial<Invitation>;
    error?: string
}> => {
    try {
        // Call Cloud Function to validate token (bypasses security rules)
        const validateInvitationTokenFn = httpsCallable(functions, 'validateInvitationToken');
        const result = await validateInvitationTokenFn({ token });
        const data = result.data as any;

        if (data.valid) {
            // Convert createdAt timestamp to Date if present
            if (data.invitation?.createdAt) {
                data.invitation.createdAt = new Date(data.invitation.createdAt);
            }

            return {
                valid: true,
                invitation: data.invitation,
            };
        } else {
            return {
                valid: false,
                error: data.error || 'Invalid invitation',
            };
        }
    } catch (error: any) {
        console.error('Error validating invitation token:', error);

        let errorMessage = 'Failed to validate invitation';

        if (error.code === 'invalid-argument') {
            errorMessage = 'Invalid invitation token';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            valid: false,
            error: errorMessage,
        };
    }
};

/**
 * Cancel an invitation
 * Calls the cancelInvitation Cloud Function
 */
export const cancelInvitation = async (
    invitationId: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const cancelInvitationFn = httpsCallable(functions, 'cancelInvitation');
        const result = await cancelInvitationFn({ invitationId });
        const data = result.data as any;

        if (data.success) {
            return { success: true };
        } else {
            return {
                success: false,
                error: data.error || 'Failed to cancel invitation',
            };
        }
    } catch (error: any) {
        console.error('Error cancelling invitation:', error);

        let errorMessage = 'Failed to cancel invitation';

        if (error.code === 'not-found') {
            errorMessage = 'Invitation not found';
        } else if (error.code === 'permission-denied') {
            errorMessage = 'You do not have permission to cancel this invitation';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
};

/**
 * Get rate limit info for current tenant
 * Used to show rate limit indicator in UI
 */
export const getInvitationRateLimit = async (
    tenantId: string
): Promise<{
    canInvite: boolean;
    invitationsSent: number;
    maxInvitations: number;
    resetsAt?: Date;
}> => {
    try {
        const tenantMetadataDoc = await getDoc(doc(db, 'tenantMetadata', tenantId));

        if (!tenantMetadataDoc.exists()) {
            return {
                canInvite: true,
                invitationsSent: 0,
                maxInvitations: 10,
            };
        }

        const data = tenantMetadataDoc.data();
        const rateLimit = data.invitationRateLimit;

        if (!rateLimit) {
            return {
                canInvite: true,
                invitationsSent: 0,
                maxInvitations: 10,
            };
        }

        const lastResetAt = new Date(rateLimit.lastResetAt);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastResetAt.getTime()) / (1000 * 60 * 60);

        // Check if hour has passed (reset)
        if (hoursSinceReset >= 1) {
            return {
                canInvite: true,
                invitationsSent: 0,
                maxInvitations: 10,
            };
        }

        const invitationsSent = rateLimit.invitationsSentThisHour || 0;
        const canInvite = invitationsSent < 10;

        // Calculate reset time
        const resetsAt = new Date(lastResetAt.getTime() + (60 * 60 * 1000));

        return {
            canInvite,
            invitationsSent,
            maxInvitations: 10,
            resetsAt,
        };
    } catch (error) {
        console.error('Error getting rate limit:', error);
        return {
            canInvite: true,
            invitationsSent: 0,
            maxInvitations: 10,
        };
    }
};
