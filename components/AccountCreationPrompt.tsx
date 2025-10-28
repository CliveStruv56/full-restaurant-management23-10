import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { styles } from '../styles';
import { useAuth } from '../contexts/AuthContext';

interface AccountCreationPromptProps {
    guestEmail?: string;
    guestPhone?: string;
    onComplete: () => void;
    onSkip: () => void;
}

export const AccountCreationPrompt: React.FC<AccountCreationPromptProps> = ({
    guestEmail,
    guestPhone,
    onComplete,
    onSkip
}) => {
    const { upgradeAnonymousAccount } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [email, setEmail] = useState(guestEmail || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        if (!email.trim()) {
            toast.error('Please enter your email');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return false;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return false;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }

        return true;
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        const loadingToast = toast.loading('Creating your account...');

        try {
            await upgradeAnonymousAccount(email, password);
            toast.success('Account created successfully! Welcome!', { id: loadingToast });
            onComplete();
        } catch (error: any) {
            console.error('Account creation error:', error);

            let errorMessage = 'Failed to create account. Please try again.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            }

            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showForm) {
        return (
            <div style={styles.modalOverlay}>
                <div style={{...styles.adminModalContent, maxWidth: '500px'}}>
                    <header style={styles.adminModalHeader}>
                        <h3 style={styles.adminModalTitle}>Create Your Account</h3>
                        <button
                            style={styles.closeButton}
                            onClick={() => setShowForm(false)}
                            disabled={isSubmitting}
                        >
                            &times;
                        </button>
                    </header>
                    <form onSubmit={handleCreateAccount} style={{padding: '24px'}}>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="email">Email Address</label>
                            <input
                                style={styles.adminFormInput}
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="password">Password</label>
                            <input
                                style={styles.adminFormInput}
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                disabled={isSubmitting}
                                minLength={6}
                            />
                        </div>
                        <div style={styles.adminFormGroup}>
                            <label style={styles.adminLabel} htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                style={styles.adminFormInput}
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                required
                                disabled={isSubmitting}
                                minLength={6}
                            />
                        </div>
                        <div style={styles.adminFormActions}>
                            <button
                                type="button"
                                style={styles.adminButtonSecondary}
                                onClick={() => setShowForm(false)}
                                disabled={isSubmitting}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                style={styles.adminButtonPrimary}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.modalOverlay}>
            <div style={{...styles.adminModalContent, maxWidth: '520px'}}>
                <header style={styles.adminModalHeader}>
                    <h3 style={{...styles.adminModalTitle, fontSize: '22px'}}>
                        Want to track your order and earn rewards?
                    </h3>
                </header>
                <div style={{padding: '24px'}}>
                    <p style={{fontSize: '15px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5'}}>
                        Create a free account to unlock these benefits:
                    </p>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: '0 0 24px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            color: '#374151'
                        }}>
                            <span style={{
                                fontSize: '20px',
                                color: '#10b981',
                                fontWeight: 'bold'
                            }}>✓</span>
                            View order history
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            color: '#374151'
                        }}>
                            <span style={{
                                fontSize: '20px',
                                color: '#10b981',
                                fontWeight: 'bold'
                            }}>✓</span>
                            Earn loyalty points with every order
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            color: '#374151'
                        }}>
                            <span style={{
                                fontSize: '20px',
                                color: '#10b981',
                                fontWeight: 'bold'
                            }}>✓</span>
                            Faster checkout next time
                        </li>
                        <li style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            color: '#374151'
                        }}>
                            <span style={{
                                fontSize: '20px',
                                color: '#10b981',
                                fontWeight: 'bold'
                            }}>✓</span>
                            Manage reservations
                        </li>
                    </ul>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <button
                            style={{
                                ...styles.adminButtonPrimary,
                                width: '100%',
                                padding: '14px',
                                fontSize: '16px',
                                fontWeight: 600
                            }}
                            onClick={() => setShowForm(true)}
                        >
                            Create Free Account
                        </button>
                        <button
                            style={{
                                ...styles.adminButtonSecondary,
                                width: '100%',
                                padding: '14px',
                                fontSize: '15px'
                            }}
                            onClick={onSkip}
                        >
                            Maybe Later
                        </button>
                    </div>
                    <p style={{
                        fontSize: '13px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        marginTop: '16px',
                        marginBottom: 0
                    }}>
                        Already have an account?{' '}
                        <a
                            href="/auth"
                            style={{
                                color: '#3b82f6',
                                textDecoration: 'none',
                                fontWeight: 500
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                onSkip();
                                // Navigate to sign in - would need navigation context
                                window.location.hash = '#auth';
                            }}
                        >
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};
