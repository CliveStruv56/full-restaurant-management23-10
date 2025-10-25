import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Invitation } from '../../types';
import { styles } from '../../styles';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { streamInvitations, createInvitation, getInvitationRateLimit, cancelInvitation } from '../../firebase/invitations';

interface InvitationManagerProps {}

export const InvitationManager: React.FC<InvitationManagerProps> = () => {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const tenantId = tenant?.id;

    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'staff' | 'customer'>('staff');

    // Rate limit state
    const [rateLimit, setRateLimit] = useState({
        canInvite: true,
        invitationsSent: 0,
        maxInvitations: 10,
        resetsAt: undefined as Date | undefined,
    });

    // Fetch invitations
    useEffect(() => {
        if (!tenantId) return;

        const unsubscribe = streamInvitations(tenantId, (invitationsData) => {
            setInvitations(invitationsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tenantId]);

    // Fetch rate limit info
    useEffect(() => {
        if (!tenantId) return;

        const fetchRateLimit = async () => {
            const rateLimitData = await getInvitationRateLimit(tenantId);
            setRateLimit(rateLimitData);
        };

        fetchRateLimit();

        // Refresh rate limit every 30 seconds
        const interval = setInterval(fetchRateLimit, 30000);
        return () => clearInterval(interval);
    }, [tenantId]);

    const handleOpenModal = () => {
        setEmail('');
        setRole('staff');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEmail('');
        setRole('staff');
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !role) {
            toast.error('Please fill in all fields');
            return;
        }

        if (!validateEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!tenantId) {
            toast.error('Unable to send invitation: Tenant not loaded');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Sending invitation...');

        try {
            const result = await createInvitation(email, role);

            if (result.success) {
                toast.success(`Invitation sent to ${email}!`, { id: loadingToast });
                handleCloseModal();

                // Refresh rate limit
                const rateLimitData = await getInvitationRateLimit(tenantId);
                setRateLimit(rateLimitData);
            } else {
                // Handle specific errors
                if (result.error?.includes('Rate limit')) {
                    const match = result.error.match(/try again at (.+)\./);
                    const resetTime = match ? match[1] : 'later';
                    toast.error(`Rate limit exceeded. You can send 10 invitations per hour. Try again at ${resetTime}.`, {
                        id: loadingToast,
                        duration: 5000,
                    });
                } else {
                    toast.error(result.error || 'Failed to send invitation', { id: loadingToast });
                }
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error('Failed to send invitation', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: Invitation['status']) => {
        const badgeStyles: Record<Invitation['status'], React.CSSProperties> = {
            pending: {
                backgroundColor: '#ffc107',
                color: '#000',
            },
            accepted: {
                backgroundColor: '#28a745',
                color: '#fff',
            },
            expired: {
                backgroundColor: '#6c757d',
                color: '#fff',
            },
            error: {
                backgroundColor: '#dc3545',
                color: '#fff',
            },
        };

        return (
            <span
                style={{
                    ...badgeStyles[status],
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.85em',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                }}
            >
                {status}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatResetTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCancelInvitation = async (invitation: Invitation) => {
        if (!confirm(`Are you sure you want to cancel the invitation for ${invitation.email}?`)) {
            return;
        }

        const loadingToast = toast.loading('Cancelling invitation...');

        try {
            const result = await cancelInvitation(invitation.id);

            if (result.success) {
                toast.success('Invitation cancelled successfully', { id: loadingToast });
            } else {
                toast.error(result.error || 'Failed to cancel invitation', { id: loadingToast });
            }
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            toast.error('Failed to cancel invitation', { id: loadingToast });
        }
    };

    if (loading) {
        return <div style={styles.adminContentPlaceholder}>Loading invitations...</div>;
    }

    return (
        <>
            <div style={styles.adminSubHeader}>
                <h2 style={styles.adminHeader}>Manage Team Invitations</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Rate limit indicator */}
                    <div
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            backgroundColor: rateLimit.canInvite ? '#e9ecef' : '#fff3cd',
                            fontSize: '0.9em',
                            fontWeight: 600,
                            color: '#495057',
                        }}
                    >
                        {rateLimit.invitationsSent}/{rateLimit.maxInvitations} invitations sent this hour
                        {!rateLimit.canInvite && rateLimit.resetsAt && (
                            <span style={{ display: 'block', fontSize: '0.85em', marginTop: '4px' }}>
                                Resets at {formatResetTime(rateLimit.resetsAt)}
                            </span>
                        )}
                    </div>
                    <button
                        style={{
                            ...styles.adminButtonPrimary,
                            opacity: rateLimit.canInvite ? 1 : 0.5,
                            cursor: rateLimit.canInvite ? 'pointer' : 'not-allowed',
                        }}
                        onClick={handleOpenModal}
                        disabled={!rateLimit.canInvite}
                    >
                        + Invite User
                    </button>
                </div>
            </div>

            <div style={styles.adminTableContainer}>
                {invitations.length > 0 ? (
                    <table style={styles.adminTable}>
                        <thead>
                            <tr>
                                <th style={styles.adminTh}>Email</th>
                                <th style={styles.adminTh}>Role</th>
                                <th style={styles.adminTh}>Status</th>
                                <th style={styles.adminTh}>Invited By</th>
                                <th style={styles.adminTh}>Date Sent</th>
                                <th style={styles.adminTh}>Accepted Date</th>
                                <th style={styles.adminTh}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invitations.map((invitation) => (
                                <tr key={invitation.id}>
                                    <td style={styles.adminTd}>{invitation.email}</td>
                                    <td style={styles.adminTd}>
                                        <span style={{ textTransform: 'capitalize' }}>{invitation.role}</span>
                                    </td>
                                    <td style={styles.adminTd}>{getStatusBadge(invitation.status)}</td>
                                    <td style={styles.adminTd}>
                                        {invitation.invitedByName}
                                        {invitation.invitedBy === user?.uid && ' (You)'}
                                    </td>
                                    <td style={styles.adminTd}>{formatDate(invitation.createdAt)}</td>
                                    <td style={styles.adminTd}>
                                        {invitation.acceptedAt ? formatDate(invitation.acceptedAt) : '-'}
                                    </td>
                                    <td style={styles.adminTd}>
                                        {invitation.status === 'pending' || invitation.status === 'error' ? (
                                            <button
                                                onClick={() => handleCancelInvitation(invitation)}
                                                style={{
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85em',
                                                    fontWeight: 600,
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                            >
                                                Cancel
                                            </button>
                                        ) : (
                                            <span style={{ color: '#6c757d', fontSize: '0.9em' }}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--light-text-color)' }}>
                        <p style={{ fontSize: '1.1em', marginBottom: '10px' }}>No invitations yet</p>
                        <p style={{ fontSize: '0.9em', color: '#6c757d' }}>
                            Click "Invite User" to invite team members to join your restaurant
                        </p>
                    </div>
                )}
            </div>

            {/* Invitation Modal */}
            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                    onClick={handleCloseModal}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '30px',
                            maxWidth: '500px',
                            width: '90%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5em', color: '#343a40' }}>Invite User</h3>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5em',
                                    cursor: 'pointer',
                                    color: '#6c757d',
                                    padding: 0,
                                    width: '30px',
                                    height: '30px',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ ...styles.adminLabel, display: 'block', marginBottom: '8px' }}>
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    style={{
                                        ...styles.adminFormInput,
                                        width: '100%',
                                    }}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ ...styles.adminLabel, display: 'block', marginBottom: '8px' }}>
                                    Role *
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as any)}
                                    style={{
                                        ...styles.adminFormInput,
                                        width: '100%',
                                    }}
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                    <option value="customer">Customer</option>
                                </select>
                                <p style={{ fontSize: '0.85em', color: '#6c757d', marginTop: '8px', marginBottom: 0 }}>
                                    {role === 'admin' && 'Full access to admin panel and settings'}
                                    {role === 'staff' && 'Access to kitchen display and order management'}
                                    {role === 'customer' && 'Customer account with order history'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    style={styles.adminButtonSecondary}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        ...styles.adminButtonPrimary,
                                        opacity: isSubmitting ? 0.7 : 1,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
