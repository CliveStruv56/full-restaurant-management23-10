import React, { useState, useEffect, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCartIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { colors, shadows, spacing, transitions, borderRadius } from '../theme';

export const Header = ({
    cartCount,
    onCartClick,
    onTitleClick,
    tableNumber
}: {
    cartCount: number;
    onCartClick: () => void;
    onTitleClick?: () => void;
    tableNumber?: number;
}) => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const headerStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${spacing[3]} ${spacing[5]}`,
        backgroundColor: colors.background.secondary,
        boxShadow: scrolled ? shadows.md : shadows.sm,
        zIndex: 100,
        height: '60px',
        boxSizing: 'border-box',
        transition: transitions.all,
        backdropFilter: 'blur(8px)',
        background: scrolled
            ? 'rgba(255, 255, 255, 0.95)'
            : colors.background.secondary,
    };

    const titleContainerStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
    };

    const titleStyle: CSSProperties = {
        margin: 0,
        fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
        color: colors.primary[600],
        fontWeight: 700,
        letterSpacing: '-0.02em',
        cursor: onTitleClick ? 'pointer' : 'default',
        userSelect: 'none',
    };

    const tableBadgeStyle: CSSProperties = {
        backgroundColor: '#3498db',
        color: 'white',
        padding: '6px 12px',
        borderRadius: borderRadius.lg,
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        boxShadow: shadows.sm,
    };

    const userInfoStyle: CSSProperties = {
        textAlign: 'right',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
    };

    const userNameStyle: CSSProperties = {
        fontSize: '0.85rem',
        color: colors.text.secondary,
        fontWeight: 500,
    };

    const cartIconContainerStyle: CSSProperties = {
        position: 'relative',
        cursor: 'pointer',
        padding: spacing[2],
        borderRadius: borderRadius.full,
        transition: transitions.colors,
        backgroundColor: 'transparent',
    };

    const cartIconContainerHoverStyle: CSSProperties = {
        backgroundColor: colors.gray[100],
    };

    const cartBadgeStyle: CSSProperties = {
        position: 'absolute',
        top: '0',
        right: '0',
        backgroundColor: colors.accent[500],
        color: colors.text.inverse,
        borderRadius: borderRadius.full,
        minWidth: '22px',
        height: '22px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        padding: '0 6px',
        boxShadow: shadows.md,
        border: `2px solid ${colors.background.secondary}`,
    };

    const [isCartHovered, setIsCartHovered] = useState(false);

    return (
        <header style={headerStyle}>
            <div style={titleContainerStyle}>
                <motion.h1
                    style={titleStyle}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={onTitleClick}
                    whileTap={onTitleClick ? { scale: 0.98 } : {}}
                    role={onTitleClick ? 'button' : undefined}
                    aria-label={onTitleClick ? 'Go to menu' : undefined}
                >
                    {tenant?.businessName || 'Restaurant Management System'}
                </motion.h1>

                {/* Table Number Badge */}
                {tableNumber && (
                    <motion.div
                        style={tableBadgeStyle}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        aria-label={`Table ${tableNumber}`}
                    >
                        <span style={{ fontSize: '1rem' }}>🪑</span>
                        <span>Table {tableNumber}</span>
                    </motion.div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                {user && (
                    <motion.div
                        style={userInfoStyle}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <span style={userNameStyle}>Hi, {user.displayName}!</span>
                    </motion.div>
                )}
                <motion.div
                    style={{
                        ...cartIconContainerStyle,
                        ...(isCartHovered ? cartIconContainerHoverStyle : {}),
                    }}
                    onClick={onCartClick}
                    onHoverStart={() => setIsCartHovered(true)}
                    onHoverEnd={() => setIsCartHovered(false)}
                    whileTap={{ scale: 0.9 }}
                    role="button"
                    aria-label={`View cart with ${cartCount} items`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <ShoppingCartIcon />
                    <AnimatePresence>
                        {cartCount > 0 && (
                            <motion.span
                                style={cartBadgeStyle}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                key={cartCount}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                                {cartCount > 99 ? '99+' : cartCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </header>
    );
};
