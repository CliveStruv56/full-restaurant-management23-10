import React from 'react';

interface OrderTypeSelectionProps {
    onSelectType: (type: 'dine-in' | 'takeaway') => void;
}

/**
 * OrderTypeSelection Component
 *
 * Customer-facing screen that allows customers to choose their order type:
 * - "Eat In" (dine-in service)
 * - "Take Away" (takeaway/pickup service)
 *
 * This screen is shown after a customer selects "I'm Here Now" intent.
 * QR code entries skip this screen and auto-select "Eat In".
 */
export const OrderTypeSelection: React.FC<OrderTypeSelectionProps> = ({ onSelectType }) => {
    return (
        <div style={styles.container}>
            <div style={styles.contentContainer}>
                <h2 style={styles.heading}>Will you be dining with us or taking away?</h2>

                <div style={styles.buttonGrid}>
                    {/* "Eat In" Button */}
                    <button
                        style={styles.orderTypeButtonEatIn}
                        onClick={() => onSelectType('dine-in')}
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
                        <span style={styles.orderTypeIcon}>🍽️</span>
                        <span style={styles.orderTypeText}>Eat In</span>
                        <span style={styles.orderTypeSubtext}>Dine at our restaurant</span>
                    </button>

                    {/* "Take Away" Button */}
                    <button
                        style={styles.orderTypeButtonTakeaway}
                        onClick={() => onSelectType('takeaway')}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(230, 126, 34, 0.4)';
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
                        <span style={styles.orderTypeIcon}>📦</span>
                        <span style={styles.orderTypeText}>Take Away</span>
                        <span style={styles.orderTypeSubtext}>Order for pickup</span>
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

    // "Eat In" Button (Blue)
    orderTypeButtonEatIn: {
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

    // "Take Away" Button (Orange)
    orderTypeButtonTakeaway: {
        minHeight: '140px',
        backgroundColor: '#e67e22',
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

    orderTypeIcon: {
        fontSize: '48px',
        lineHeight: 1,
    },
    orderTypeText: {
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: 1.2,
    },
    orderTypeSubtext: {
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
            .order-type-selection-button-grid {
                flex-direction: row !important;
                gap: 24px !important;
            }
        }

        @media (max-width: 767px) {
            /* Mobile: Ensure proper sizing */
            .order-type-selection-heading {
                font-size: 24px !important;
                margin-bottom: 32px !important;
            }
            .order-type-selection-button {
                min-height: 120px !important;
            }
            .order-type-selection-icon {
                font-size: 40px !important;
            }
            .order-type-selection-text {
                font-size: 20px !important;
            }
            .order-type-selection-subtext {
                font-size: 14px !important;
            }
        }

        @media (min-width: 1024px) {
            /* Desktop: Larger text */
            .order-type-selection-heading {
                font-size: 32px !important;
            }
            .order-type-selection-icon {
                font-size: 56px !important;
            }
            .order-type-selection-text {
                font-size: 26px !important;
            }
        }

        /* Touch target size (WCAG accessibility) */
        @media (pointer: coarse) {
            .order-type-selection-button {
                min-height: 120px !important;
                min-width: 44px !important;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}
