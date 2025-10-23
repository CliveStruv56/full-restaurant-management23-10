import React from 'react';
import { TimeSlot } from '../types';
import { styles } from '../styles';

interface DateSlotsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dateLabel: string;
    slots: TimeSlot[];
    selectedTime: string;
    onSelectTime: (time: string) => void;
}

export const DateSlotsModal: React.FC<DateSlotsModalProps> = ({
    isOpen,
    onClose,
    dateLabel,
    slots,
    selectedTime,
    onSelectTime
}) => {
    if (!isOpen) return null;

    const handleTimeSelect = (timeValue: string) => {
        onSelectTime(timeValue);
        onClose();
    };

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={{ ...styles.optionsModalContent, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <header style={styles.modalHeader}>
                    <h2 style={styles.modalTitle}>Select a time for {dateLabel}</h2>
                    <button style={styles.closeButton} onClick={onClose} aria-label="Close time selection">&times;</button>
                </header>
                <div style={styles.modalBody}>
                    <div style={styles.timeSlotGrid}>
                        {slots.map(slot => (
                            <button
                                key={slot.value}
                                style={selectedTime === slot.value ? { ...styles.timeSlotButton, ...styles.timeSlotButtonActive } : styles.timeSlotButton}
                                onClick={() => handleTimeSelect(slot.value)}
                            >
                                {slot.time}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
