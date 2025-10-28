import React from 'react';
import { Reservation } from '../types';
import { styles } from '../styles';

interface ReservationConfirmationProps {
    reservation: Reservation;
    onBackToHome: () => void;
    onOrderNow?: () => void;
}

export const ReservationConfirmation: React.FC<ReservationConfirmationProps> = ({
    reservation,
    onBackToHome,
    onOrderNow
}) => {
    // Format date for display (e.g., "October 27, 2025")
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time for display (e.g., "7:00 PM")
    const formatTime = (timeString: string): string => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div style={confirmationContainerStyle}>
            <div style={confirmationCardStyle}>
                {/* Success Icon */}
                <div style={iconContainerStyle}>
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#28a745"
                        strokeWidth="2"
                        style={{ marginBottom: '20px' }}
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9 12l2 2 4-4"></path>
                    </svg>
                </div>

                {/* Heading */}
                <h1 style={headingStyle}>Reservation Confirmed!</h1>
                <p style={subheadingStyle}>
                    We look forward to serving you. Please arrive on time.
                </p>

                {/* Reservation Details */}
                <div style={detailsContainerStyle}>
                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Date:</span>
                        <span style={valueStyle}>{formatDate(reservation.date)}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Time:</span>
                        <span style={valueStyle}>{formatTime(reservation.time)}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Party Size:</span>
                        <span style={valueStyle}>Party of {reservation.partySize}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Name:</span>
                        <span style={valueStyle}>{reservation.contactName}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Phone:</span>
                        <span style={valueStyle}>{reservation.contactPhone}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={labelStyle}>Email:</span>
                        <span style={valueStyle}>{reservation.contactEmail}</span>
                    </div>

                    {reservation.tablePreference && (
                        <div style={detailRowStyle}>
                            <span style={labelStyle}>Table Preference:</span>
                            <span style={valueStyle}>Table {reservation.tablePreference}</span>
                        </div>
                    )}

                    {reservation.specialRequests && (
                        <div style={{ ...detailRowStyle, flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={labelStyle}>Special Requests:</span>
                            <span style={{ ...valueStyle, marginTop: '8px' }}>
                                {reservation.specialRequests}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={buttonContainerStyle}>
                    <button
                        onClick={onBackToHome}
                        style={primaryButtonStyle}
                    >
                        Back to Home
                    </button>

                    {onOrderNow && (
                        <button
                            onClick={onOrderNow}
                            style={secondaryButtonStyle}
                        >
                            Order for Delivery/Pickup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Styles
const confirmationContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#f5f5f5',
};

const confirmationCardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
};

const iconContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
};

const headingStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: '12px',
};

const subheadingStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#636e72',
    marginBottom: '32px',
};

const detailsContainerStyle: React.CSSProperties = {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    textAlign: 'left',
};

const detailRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    padding: '8px 0',
    borderBottom: '1px solid #e9ecef',
};

const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#636e72',
};

const valueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '500',
    color: '#2d3436',
};

const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
};

const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#3498db',
    border: '2px solid #3498db',
    borderRadius: '12px',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
};
