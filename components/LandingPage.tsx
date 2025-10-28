import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppSettings } from '../types';

interface LandingPageProps {
    onOrderNow: (type: 'takeaway' | 'dine-in') => void;
    onMakeReservation: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOrderNow, onMakeReservation }) => {
    const { tenant } = useTenant();
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch settings from Firestore
    useEffect(() => {
        const fetchSettings = async () => {
            if (!tenant?.id) return;

            try {
                setLoading(true);
                const settingsDoc = doc(db, `tenants/${tenant.id}/settings`, 'settings');
                const settingsSnap = await getDoc(settingsDoc);

                if (settingsSnap.exists()) {
                    setSettings(settingsSnap.data() as AppSettings);
                } else {
                    // Default settings if not found
                    setSettings(null);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                setSettings(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [tenant?.id]);

    // Format operating hours from weekSchedule
    const formatOperatingHours = (): string => {
        if (!settings?.weekSchedule) return 'Hours not set';

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
        const openDays: { start: string; end: string; hours: string }[] = [];

        days.forEach(day => {
            const daySetting = settings.weekSchedule[day];
            if (daySetting.isOpen) {
                const hours = `${daySetting.openingHour}:00 - ${daySetting.closingHour}:00`;
                if (openDays.length === 0 || openDays[openDays.length - 1].hours !== hours) {
                    openDays.push({ start: day, end: day, hours });
                } else {
                    openDays[openDays.length - 1].end = day;
                }
            }
        });

        if (openDays.length === 0) return 'Closed';

        return openDays.map(({ start, end, hours }) => {
            const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1, 3);
            if (start === end) {
                return `${capitalize(start)}: ${hours}`;
            }
            return `${capitalize(start)}-${capitalize(end)}: ${hours}`;
        }).join(' • ');
    };

    // Loading skeleton
    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.skeletonHero}>
                    <div style={styles.skeletonLogo} />
                    <div style={styles.skeletonText} />
                    <div style={{ ...styles.skeletonText, width: '60%' }} />
                </div>
                <div style={styles.infoSection}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={styles.skeletonCard} />
                    ))}
                </div>
            </div>
        );
    }

    // Get landing page settings with defaults
    const landingPage = settings?.landingPage;
    const logoUrl = landingPage?.logoUrl || tenant?.branding?.logo;
    const heroImageUrl = landingPage?.heroImageUrl;
    const primaryColor = landingPage?.primaryColor || tenant?.branding?.primaryColor || '#3498db';
    const tagline = landingPage?.tagline || `Welcome to ${tenant?.businessName || 'our restaurant'}!`;
    const address = landingPage?.address;
    const phone = landingPage?.phone;
    const email = landingPage?.email;
    const businessName = tenant?.businessName || 'Our Restaurant';

    return (
        <div style={styles.container}>
            {/* Hero Section */}
            <section
                style={{
                    ...styles.heroSection,
                    backgroundColor: primaryColor,
                    backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Overlay for better text readability when hero image is present */}
                {heroImageUrl && <div style={styles.heroOverlay} />}

                <div style={styles.heroContent}>
                    {/* Logo */}
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt={`${businessName} logo`}
                            style={styles.logo}
                            loading="lazy"
                        />
                    )}

                    {/* Business Name */}
                    <h1 style={styles.heroTitle}>
                        {businessName}
                    </h1>

                    {/* Tagline */}
                    {tagline && (
                        <p style={styles.tagline}>{tagline}</p>
                    )}
                </div>
            </section>

            {/* Info Section */}
            <section style={styles.infoSection}>
                {/* Operating Hours Card */}
                <div style={styles.infoCard}>
                    <div style={styles.infoIcon}>🕐</div>
                    <h3 style={styles.infoLabel}>Hours</h3>
                    <p style={styles.infoValue}>{formatOperatingHours()}</p>
                </div>

                {/* Location Card */}
                {address && (
                    <div style={styles.infoCard}>
                        <div style={styles.infoIcon}>📍</div>
                        <h3 style={styles.infoLabel}>Location</h3>
                        <p style={styles.infoValue}>{address}</p>
                    </div>
                )}

                {/* Contact Card */}
                {(phone || email) && (
                    <div style={styles.infoCard}>
                        <div style={styles.infoIcon}>📞</div>
                        <h3 style={styles.infoLabel}>Contact</h3>
                        <div style={styles.infoValue}>
                            {phone && <div>{phone}</div>}
                            {email && <div>{email}</div>}
                        </div>
                    </div>
                )}
            </section>

            {/* Action Options */}
            <section style={styles.actionsSection}>
                <h2 style={styles.actionsTitle}>How would you like to proceed?</h2>
                <div style={styles.actionsGrid}>
                    {/* Takeaway Card */}
                    <button
                        style={styles.actionCard}
                        onClick={() => onOrderNow('takeaway')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = `0 12px 24px ${primaryColor}33`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                    >
                        <div style={{ ...styles.actionIcon, backgroundColor: `${primaryColor}15` }}>
                            <span style={{ fontSize: '36px' }}>🛍️</span>
                        </div>
                        <h3 style={{ ...styles.actionTitle, color: primaryColor }}>Order Takeaway</h3>
                        <p style={styles.actionDescription}>
                            Order now and pick up later. Perfect for on-the-go.
                        </p>
                    </button>

                    {/* Dine-In Card */}
                    <button
                        style={styles.actionCard}
                        onClick={() => onOrderNow('dine-in')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = `0 12px 24px ${primaryColor}33`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                    >
                        <div style={{ ...styles.actionIcon, backgroundColor: `${primaryColor}15` }}>
                            <span style={{ fontSize: '36px' }}>🍽️</span>
                        </div>
                        <h3 style={{ ...styles.actionTitle, color: primaryColor }}>Dine In</h3>
                        <p style={styles.actionDescription}>
                            Order for dining in. Select your table and we'll serve you.
                        </p>
                    </button>

                    {/* Reservation Card */}
                    <button
                        style={styles.actionCard}
                        onClick={onMakeReservation}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = `0 12px 24px ${primaryColor}33`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                    >
                        <div style={{ ...styles.actionIcon, backgroundColor: `${primaryColor}15` }}>
                            <span style={{ fontSize: '36px' }}>📅</span>
                        </div>
                        <h3 style={{ ...styles.actionTitle, color: primaryColor }}>Make a Reservation</h3>
                        <p style={styles.actionDescription}>
                            Reserve a table for a future date and time.
                        </p>
                    </button>
                </div>
            </section>
        </div>
    );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa',
    },

    // Hero Section
    heroSection: {
        position: 'relative',
        minHeight: '35vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        color: 'white',
        textAlign: 'center',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    heroContent: {
        position: 'relative',
        zIndex: 2,
        maxWidth: '800px',
        width: '100%',
    },
    logo: {
        maxHeight: '60px',
        maxWidth: '90%',
        objectFit: 'contain',
        marginBottom: '12px',
        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
    },
    heroTitle: {
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '12px',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    tagline: {
        fontSize: '18px',
        fontWeight: 400,
        margin: 0,
        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
        lineHeight: 1.4,
    },

    // Info Section
    infoSection: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    infoIcon: {
        fontSize: '36px',
        marginBottom: '8px',
    },
    infoLabel: {
        fontSize: '20px',
        fontWeight: 600,
        color: '#333',
        marginBottom: '8px',
    },
    infoValue: {
        fontSize: '16px',
        color: '#6c757d',
        lineHeight: 1.6,
        margin: 0,
    },

    // Actions Section
    actionsSection: {
        padding: '20px 20px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
    },
    actionsTitle: {
        fontSize: '22px',
        fontWeight: 700,
        textAlign: 'center',
        color: '#333',
        marginBottom: '24px',
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        '@media (minWidth: 768px)': {
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        },
    },
    actionCard: {
        backgroundColor: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '20px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        minHeight: '180px',
    },
    actionIcon: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '4px',
    },
    actionTitle: {
        fontSize: '18px',
        fontWeight: 700,
        margin: 0,
    },
    actionDescription: {
        fontSize: '14px',
        color: '#6c757d',
        lineHeight: 1.5,
        margin: 0,
    },

    // Loading Skeleton
    skeletonHero: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        gap: '20px',
    },
    skeletonLogo: {
        width: '200px',
        height: '80px',
        backgroundColor: '#e0e0e0',
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    skeletonText: {
        width: '80%',
        height: '40px',
        backgroundColor: '#e0e0e0',
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    skeletonCard: {
        height: '200px',
        backgroundColor: '#e0e0e0',
        borderRadius: '12px',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
};

// Inject keyframe animation for skeleton
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        @media (min-width: 768px) {
            /* Tablet breakpoint */
            .landing-page-hero-title {
                font-size: 48px !important;
            }
            .landing-page-tagline {
                font-size: 28px !important;
            }
            .landing-page-logo {
                max-height: 100px !important;
            }
            .landing-page-info-section {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            }
        }

        @media (min-width: 1024px) {
            /* Desktop breakpoint */
            .landing-page-hero-title {
                font-size: 56px !important;
            }
            .landing-page-tagline {
                font-size: 32px !important;
            }
            .landing-page-logo {
                max-height: 120px !important;
            }
            .landing-page-hero {
                min-height: auto !important;
                padding: 80px 40px !important;
            }
            .landing-page-info-section {
                grid-template-columns: repeat(3, 1fr) !important;
                padding: 60px 40px !important;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}
