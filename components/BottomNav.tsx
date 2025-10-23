import React from 'react';
import { styles } from '../styles';
import { CoffeeIcon, ClipboardIcon, AdminIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
    active: 'menu' | 'order' | 'account';
    onNavClick: (screen: 'menu' | 'order' | 'account') => void;
}

const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);

export const BottomNav: React.FC<BottomNavProps> = ({ active, onNavClick }) => {
    const { user, userRole, logout } = useAuth();

    if (!user) return null;

    return (
        <nav style={styles.bottomNav}>
            <button style={{...styles.navButton, ...(active === 'menu' && styles.navButtonActive)}} onClick={() => onNavClick('menu')}>
                <CoffeeIcon />
                <span>Menu</span>
            </button>
            <button style={{...styles.navButton, ...(active === 'order' && styles.navButtonActive)}} onClick={() => onNavClick('order')}>
                <ClipboardIcon />
                <span>My Order</span>
            </button>
            <button style={{...styles.navButton, ...(active === 'account' && styles.navButtonActive)}} onClick={() => onNavClick('account')}>
                <UserIcon />
                <span>Account</span>
            </button>
        </nav>
    );
};
