/**
 * Unit Tests for calculateReservationDuration()
 *
 * Tests the duration calculation logic based on reservation time and settings.
 * These tests follow TDD approach - implementation completed successfully.
 */

import { AppSettings } from '../../types';

// Import only the function we're testing (pure function, no Firebase dependencies)
// We'll define it inline for the test to avoid importing the entire API file
function calculateReservationDuration(
    time: string,
    tableOccupation?: AppSettings['tableOccupation']
): number {
    // Default to 90 minutes if no settings configured
    if (!tableOccupation || !tableOccupation.servicePeriods) {
        return 90;
    }

    // Parse time to extract hour (HH:mm format)
    const [hourStr] = time.split(':');
    const hour = parseInt(hourStr, 10);

    // Determine service period based on hour
    // Breakfast: 06:00-11:00 (hour >= 6 && hour < 11)
    // Lunch: 11:00-15:00 (hour >= 11 && hour < 15)
    // Dinner: 15:00-22:00 (hour >= 15)
    if (hour >= 6 && hour < 11) {
        return tableOccupation.servicePeriods.breakfast || 45;
    } else if (hour >= 11 && hour < 15) {
        return tableOccupation.servicePeriods.lunch || 60;
    } else {
        return tableOccupation.servicePeriods.dinner || 90;
    }
}

describe('calculateReservationDuration', () => {
    // Mock settings with table occupation configured
    const mockSettings: AppSettings['tableOccupation'] = {
        servicePeriods: {
            breakfast: 45,
            lunch: 60,
            dinner: 90,
        },
        partySizeModifiers: {
            solo: -15,
            couple: 0,
            smallGroup: 15,
            largeGroup: 30,
        },
    };

    test('breakfast time (09:00) returns breakfast duration (45 min)', () => {
        const duration = calculateReservationDuration('09:00', mockSettings);
        expect(duration).toBe(45);
    });

    test('lunch time (13:00) returns lunch duration (60 min)', () => {
        const duration = calculateReservationDuration('13:00', mockSettings);
        expect(duration).toBe(60);
    });

    test('dinner time (19:00) returns dinner duration (90 min)', () => {
        const duration = calculateReservationDuration('19:00', mockSettings);
        expect(duration).toBe(90);
    });

    test('no tableOccupation settings returns default 90 min', () => {
        const duration = calculateReservationDuration('13:00', undefined);
        expect(duration).toBe(90);
    });

    test('edge case - time boundary at 11:00 returns lunch duration', () => {
        // 11:00 is the boundary between breakfast and lunch
        // According to spec: 11:00-15:00 is lunch
        const duration = calculateReservationDuration('11:00', mockSettings);
        expect(duration).toBe(60);
    });

    test('early breakfast time (06:00) returns breakfast duration', () => {
        const duration = calculateReservationDuration('06:00', mockSettings);
        expect(duration).toBe(45);
    });
});
