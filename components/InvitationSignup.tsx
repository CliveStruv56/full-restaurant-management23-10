import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { validateInvitationToken, acceptInvitation } from '../firebase/invitations';
import { styles } from '../styles';

interface InvitationSignupProps {
    token: string;
}

export const InvitationSignup: React.FC<InvitationSignupProps> = ({ token }) => {
    const { signupWithInvitation } = useAuth();

    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            setIsValidating(true);
            const result = await validateInvitationToken(token);

            if (result.valid && result.invitation) {
                setIsValid(true);
                setInvitation(result.invitation);
            } else {
                setIsValid(false);
                setError(result.error || 'Invalid invitation');
            }

            setIsValidating(false);
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!displayName || !password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Creating your account...');

        try {
            const result = await acceptInvitation(
                token,
                displayName,
                password,
                phoneNumber || undefined
            );

            if (result.success && result.customToken) {
                toast.success('Account created successfully!', { id: loadingToast });

                // Auto-login with custom token
                await signupWithInvitation(result.customToken);

                // Redirect to home page after successful login
                // Small delay to ensure auth state is updated
                setTimeout(() => {
                    window.location.href = '/';
                }, 500);
            } else {
                toast.error(result.error || 'Failed to create account', { id: loadingToast });
            }
        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            toast.error('Failed to create account. Please try again.', { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPasswordStrength = (pwd: string): { strength: string; color: string } => {
        if (pwd.length === 0) return { strength: '', color: '' };
        if (pwd.length < 8) return { strength: 'Too short', color: '#dc3545' };
        if (pwd.length < 12) return { strength: 'Good', color: '#ffc107' };
        return { strength: 'Strong', color: '#28a745' };
    };

    const passwordStrength = getPasswordStrength(password);

    if (isValidating) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #e9ecef',
                            borderTop: '4px solid #2a9d8f',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px',
                        }}
                    />
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <p style={{ fontSize: '1.1em', color: '#6c757d' }}>Validating invitation...</p>
                </div>
            </div>
        );
    }

    if (!isValid || error) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                }}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '40px',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: '#fee',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            margin: '0 auto 20px',
                            fontSize: '2.5em',
                        }}
                    >
                        ⚠️
                    </div>
                    <h2 style={{ color: '#343a40', marginBottom: '10px' }}>Invalid Invitation</h2>
                    <p style={{ color: '#6c757d', marginBottom: '30px' }}>
                        {error || 'This invitation link is not valid or has expired.'}
                    </p>
                    <a
                        href="/"
                        style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            backgroundColor: '#2a9d8f',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                        }}
                    >
                        Go to Homepage
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                padding: '20px',
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '40px',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#343a40', fontSize: '2em', marginBottom: '10px' }}>
                        Complete Your Account Setup
                    </h1>
                    <p style={{ color: '#6c757d', fontSize: '1em', lineHeight: '1.5' }}>
                        {invitation.invitedByName} has invited you to join{' '}
                        <strong>{invitation.businessName}</strong> as a{' '}
                        <strong style={{ textTransform: 'capitalize' }}>{invitation.role}</strong>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Email (read-only) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                                color: '#343a40',
                            }}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={invitation.email}
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ced4da',
                                fontSize: '1em',
                                backgroundColor: '#e9ecef',
                                color: '#6c757d',
                                cursor: 'not-allowed',
                            }}
                        />
                    </div>

                    {/* Display Name */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                                color: '#343a40',
                            }}
                        >
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your full name"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ced4da',
                                fontSize: '1em',
                            }}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                                color: '#343a40',
                            }}
                        >
                            Password *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ced4da',
                                fontSize: '1em',
                            }}
                            required
                            disabled={isSubmitting}
                        />
                        {password && (
                            <div style={{ marginTop: '8px', fontSize: '0.85em' }}>
                                <span style={{ color: passwordStrength.color, fontWeight: 600 }}>
                                    {passwordStrength.strength}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                                color: '#343a40',
                            }}
                        >
                            Confirm Password *
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ced4da',
                                fontSize: '1em',
                            }}
                            required
                            disabled={isSubmitting}
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#dc3545' }}>
                                Passwords do not match
                            </div>
                        )}
                    </div>

                    {/* Phone Number (optional) */}
                    <div style={{ marginBottom: '30px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                                color: '#343a40',
                            }}
                        >
                            Phone Number (Optional)
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+44 7xxx xxx xxx"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #ced4da',
                                fontSize: '1em',
                            }}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: '#2a9d8f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1em',
                            fontWeight: 600,
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Create Account & Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};
