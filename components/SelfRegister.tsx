import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

export const SelfRegister: React.FC = () => {
    const { signup } = useAuth();
    const { tenant } = useTenant();

    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!email || !displayName || !password) {
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

        if (!tenant?.id) {
            toast.error('Unable to register: Tenant not loaded');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading('Creating your account...');

        try {
            // Signup with tenant ID (auto-assigns customer role)
            await signup(displayName, email, password, tenant.id);

            toast.success('Account created successfully! Welcome!', { id: loadingToast });

            // Auto-login happens in AuthContext
            // User will be redirected to customer view
        } catch (error: any) {
            console.error('Error creating account:', error);

            let errorMessage = 'Failed to create account';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Please log in instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use at least 8 characters.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, { id: loadingToast });
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
                        Create Your Account
                    </h1>
                    <p style={{ color: '#6c757d', fontSize: '1em', lineHeight: '1.5' }}>
                        Join <strong>{tenant?.businessName || 'our restaurant'}</strong> and start ordering
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontWeight: 600,
                                color: '#343a40',
                            }}
                        >
                            Email Address *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
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
                        <p style={{ fontSize: '0.85em', color: '#6c757d', marginTop: '6px', marginBottom: 0 }}>
                            We'll use this to send you order updates
                        </p>
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
                            marginBottom: '20px',
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    {/* Link to Login */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#6c757d', fontSize: '0.95em' }}>
                            Already have an account?{' '}
                            <a
                                href="/"
                                style={{
                                    color: '#2a9d8f',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Sign in
                            </a>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
