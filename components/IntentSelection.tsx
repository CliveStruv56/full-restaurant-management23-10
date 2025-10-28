import React from 'react';

interface IntentSelectionProps {
    onSelectIntent: (intent: 'now' | 'later') => void;
}

/**
 * IntentSelection Component
 *
 * Customer-facing screen that allows customers to choose their ordering intent:
 * - "I'm Here Now" (for immediate ordering - dine-in or takeaway)
 * - "Book for Later" (for making a reservation)
 *
 * This is the first navigation screen after the landing page in the customer journey.
 * QR code entries skip this screen and go directly to the menu.
 */
export const IntentSelection: React.FC<IntentSelectionProps> = ({ onSelectIntent }) => {
    return (
        <div style={styles.container}>
            <div style={styles.contentContainer}>
                <h2 style={styles.heading}>How can we serve you today?</h2>

                <div style={styles.buttonGrid}>
                    {/* "Here Now" Button */}
                    <button
                        style={styles.intentButtonNow}
                        onClick={() => onSelectIntent('now')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 204, 113, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                    >
                        <span style={styles.intentIcon}>🕐</span>
                        <span style={styles.intentText}>I'm Here Now</span>
                        <span style={styles.intentSubtext}>Order for pickup or dine-in</span>
                    </button>

                    {/* "Book Later" Button */}
                    <button
                        style={styles.intentButtonLater}
                        onClick={() => onSelectIntent('later')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(52, 152, 219, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                    >
                        <span style={styles.intentIcon}>📅</span>
                        <span style={styles.intentText}>Book for Later</span>
                        <span style={styles.intentSubtext}>Reserve a table</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '20px',
    },
    contentContainer: {
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
    },
    heading: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#2c3e50',
        marginBottom: '40px',
        lineHeight: 1.4,
    },
    buttonGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
    },

    // "Here Now" Button (Green)
    intentButtonNow: {
        minHeight: '140px',
        backgroundColor: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        minWidth: '280px',
    },

    // "Book Later" Button (Blue)
    intentButtonLater: {
        minHeight: '140px',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '24px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        minWidth: '280px',
    },

    intentIcon: {
        fontSize: '48px',
        lineHeight: 1,
    },
    intentText: {
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: 1.2,
    },
    intentSubtext: {
        fontSize: '16px',
        fontWeight: 400,
        opacity: 0.9,
        lineHeight: 1.3,
    },
};

// Inject responsive CSS
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @media (min-width: 768px) {
            /* Tablet and Desktop: Side-by-side layout */
            .intent-selection-button-grid {
                flex-direction: row !important;
                gap: 24px !important;
            }
        }

        @media (max-width: 767px) {
            /* Mobile: Ensure proper sizing */
            .intent-selection-heading {
                font-size: 24px !important;
                margin-bottom: 32px !important;
            }
            .intent-selection-button {
                min-height: 120px !important;
            }
            .intent-selection-icon {
                font-size: 40px !important;
            }
            .intent-selection-text {
                font-size: 20px !important;
            }
            .intent-selection-subtext {
                font-size: 14px !important;
            }
        }

        @media (min-width: 1024px) {
            /* Desktop: Larger text */
            .intent-selection-heading {
                font-size: 32px !important;
            }
            .intent-selection-icon {
                font-size: 56px !important;
            }
            .intent-selection-text {
                font-size: 26px !important;
            }
        }

        /* Touch target size (WCAG accessibility) */
        @media (pointer: coarse) {
            .intent-selection-button {
                min-height: 120px !important;
                min-width: 44px !important;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}
