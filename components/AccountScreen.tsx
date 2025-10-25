import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { styles } from '../styles';
import { colors, shadows } from '../theme';

export const AccountScreen: React.FC = () => {
    const { user, logout } = useAuth();
    const { tenant } = useTenant();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    return (
        <div style={styles.screen}>
            <h2 style={styles.categoryTitle}>Account</h2>

            {/* User Info Card */}
            <div style={{
                backgroundColor: colors.background.secondary,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: shadows.sm,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px',
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: colors.primary[100],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: colors.primary[600],
                    }}>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, marginBottom: '4px', color: colors.text.primary }}>
                            {user?.displayName || 'Coffee Lover'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: colors.text.secondary }}>
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Account Actions */}
            <div style={{
                backgroundColor: colors.background.secondary,
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: shadows.sm,
                marginBottom: '20px',
            }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: colors.error.main,
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.error.light;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </button>
            </div>

            {/* App Info */}
            <div style={{
                textAlign: 'center',
                padding: '20px',
                color: colors.text.secondary,
                fontSize: '14px',
            }}>
                <p style={{ margin: '4px 0' }}>{tenant?.businessName || 'Restaurant Management System'}</p>
                <p style={{ margin: '4px 0', fontSize: '12px', opacity: 0.7 }}>Version 1.0</p>
            </div>
        </div>
    );
};
