import React, { useState, useEffect } from 'react';
import { Reservation, AppSettings } from '../types';
import ReservationForm from './ReservationForm';
import { ReservationConfirmation } from './ReservationConfirmation';
import { createReservation, streamSettings } from '../firebase/api-multitenant';
import { useTenant } from '../contexts/TenantContext';
import { useCustomerJourney } from '../contexts/CustomerJourneyContext';
import toast from 'react-hot-toast';

export const ReservationFlow: React.FC = () => {
    const { tenant } = useTenant();
    const { setIntent, resetJourney } = useCustomerJourney();
    const tenantId = tenant?.id;

    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch settings for available tables
    useEffect(() => {
        if (!tenantId) return;

        const unsubscribe = streamSettings(tenantId, (data) => {
            setSettings(data);
        });

        return () => unsubscribe();
    }, [tenantId]);

    // Handle reservation submission
    const handleSubmit = async (
        reservationData: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'status'>
    ) => {
        if (!tenantId) {
            toast.error('Unable to create reservation. Please try again.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Create reservation in Firestore
            const reservationId = await createReservation(tenantId, reservationData);

            // Build confirmed reservation object for display
            const confirmedReservation: Reservation = {
                id: reservationId,
                tenantId,
                ...reservationData,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            setConfirmedReservation(confirmedReservation);
            toast.success('Reservation confirmed!');
        } catch (error) {
            console.error('Error creating reservation:', error);
            toast.error('Failed to create reservation. Please try again.');
            throw error; // Re-throw to let ReservationForm handle it
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle cancel - go back to intent selection
    const handleCancel = () => {
        setIntent('now');
    };

    // Handle back to home - reset journey
    const handleBackToHome = () => {
        resetJourney();
    };

    // Handle order now - switch to 'now' intent
    const handleOrderNow = () => {
        resetJourney();
        setIntent('now');
    };

    // Show loading state while settings load
    if (!settings) {
        return (
            <div style={loadingContainerStyle}>
                <p>Loading...</p>
            </div>
        );
    }

    // Show confirmation screen if reservation is confirmed
    if (confirmedReservation) {
        return (
            <ReservationConfirmation
                reservation={confirmedReservation}
                onBackToHome={handleBackToHome}
                onOrderNow={handleOrderNow}
            />
        );
    }

    // Show reservation form
    return (
        <div style={containerStyle}>
            <ReservationForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                availableTables={settings.availableTables || []}
                settings={settings}
            />
        </div>
    );
};

// Styles
const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
};

const loadingContainerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
};
