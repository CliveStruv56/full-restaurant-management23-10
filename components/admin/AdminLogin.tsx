import React, { useState } from 'react';
import { styles } from '../../styles';

const ADMIN_PASSWORD = 'password123'; // Hardcoded for this example

export const AdminLogin = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setError('');
            onLoginSuccess();
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    return (
        <div style={styles.adminLoginContainer}>
            <div style={styles.adminLoginBox}>
                <h1 style={styles.adminLoginTitle}>Admin Login</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        style={styles.adminInput}
                        aria-label="Admin Password"
                    />
                    <button type="submit" style={styles.adminButton}>Login</button>
                </form>
                {error && <p style={styles.adminError}>{error}</p>}
            </div>
        </div>
    );
};