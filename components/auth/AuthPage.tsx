import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { styles } from '../../styles';

const AuthForm = ({ isLogin, onSubmit }: { isLogin: boolean, onSubmit: (e: React.FormEvent, ...args: any[]) => void }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        if (isLogin) {
            onSubmit(e, email, password);
        } else {
            onSubmit(e, displayName, email, password, confirmPassword);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {!isLogin && (
                <div style={styles.adminFormGroup}>
                     <label style={styles.adminLabel} htmlFor="displayName">Your Name</label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g., Jane Doe"
                        style={styles.adminInput}
                        required
                    />
                </div>
            )}
            <div style={styles.adminFormGroup}>
                 <label style={styles.adminLabel} htmlFor="email">Email Address</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., customer@test.com"
                    style={styles.adminInput}
                    required
                />
            </div>
             <div style={styles.adminFormGroup}>
                 <label style={styles.adminLabel} htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={styles.adminInput}
                    required
                />
            </div>
            {!isLogin && (
                 <div style={styles.adminFormGroup}>
                     <label style={styles.adminLabel} htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={styles.adminInput}
                        required
                    />
                </div>
            )}
            <p style={{fontSize: '0.8em', color: 'var(--light-text-color)', textAlign: 'left', margin: '-5px 0 15px 0'}}>
                To test roles, you can sign up with emails like <strong>staff@test.com</strong> or <strong>admin@test.com</strong> and then promote them in your Firebase console.
            </p>
            <button type="submit" style={styles.adminButton}>
                {isLogin ? 'Login' : 'Sign Up'}
            </button>
        </form>
    );
};

export const AuthPage = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState('');
    const { login, signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent, ...args: string[]) => {
        e.preventDefault();
        setError('');
        try {
            if (isLoginView) {
                const [email, password] = args;
                await login(email, password);
            } else {
                const [displayName, email, password, confirmPassword] = args;
                if (password !== confirmPassword) {
                    setError("Passwords do not match.");
                    return;
                }
                await signup(displayName, email, password);
            }
        } catch (err: any) {
            // Map Firebase error codes to user-friendly messages
            let message = 'An error occurred. Please try again.';
            switch(err.code) {
                case 'auth/invalid-email':
                    message = 'Please enter a valid email address.';
                    break;
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    message = 'No account found with this email or password. Please try again or sign up.';
                    break;
                case 'auth/wrong-password':
                    message = 'Incorrect credentials. Please try again.';
                    break;
                case 'auth/email-already-in-use':
                    message = 'An account with this email already exists. Please log in.';
                    break;
                 case 'auth/weak-password':
                    message = 'The password must be at least 6 characters long.';
                    break;
            }
            setError(message);
        }
    };

    const tabButtonStyle = {
        padding: '10px 15px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '1.1em',
        color: 'var(--light-text-color)',
        borderBottom: '2px solid transparent',
    };

    const activeTabButtonStyle = {
        ...tabButtonStyle,
        color: 'var(--primary-color)',
        borderBottom: '2px solid var(--primary-color)',
        fontWeight: 'bold',
    };

    return (
        <div style={styles.adminLoginContainer}>
            <div style={{...styles.adminLoginBox, width: '400px'}}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button onClick={() => setIsLoginView(true)} style={isLoginView ? activeTabButtonStyle : tabButtonStyle}>Login</button>
                    <button onClick={() => setIsLoginView(false)} style={!isLoginView ? activeTabButtonStyle : tabButtonStyle}>Sign Up</button>
                </div>
                
                <h1 style={styles.adminLoginTitle}>
                    {isLoginView ? 'Welcome Back!' : 'Create Your Account'}
                </h1>
                
                <AuthForm isLogin={isLoginView} onSubmit={handleSubmit} />
                
                {error && <p style={styles.adminError}>{error}</p>}
            </div>
        </div>
    );
};