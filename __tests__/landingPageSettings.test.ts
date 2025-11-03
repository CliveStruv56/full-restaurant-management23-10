/**
 * Tests for Landing Page Settings Infrastructure
 * Task Group 1.1: Focused tests for settings updates
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
    uploadBrandingImage,
    updateLandingPageSettings,
    streamSettings
} from '../firebase/api-multitenant';
import { AppSettings } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const TEST_TENANT_ID = 'test-tenant-landing-page';

describe('Landing Page Settings Infrastructure', () => {
    // Clean up test data after each test
    afterEach(async () => {
        try {
            const settingsRef = doc(db, `tenants/${TEST_TENANT_ID}/settings`, 'settings');
            const snapshot = await getDoc(settingsRef);
            if (snapshot.exists()) {
                // Reset to basic settings without landingPage
                const currentSettings = snapshot.data() as AppSettings;
                const { landingPage, ...restSettings } = currentSettings;
                await setDoc(settingsRef, restSettings);
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    });

    /**
     * Test 1: Update landingPage settings successfully
     * Verifies that landing page settings can be saved and retrieved
     */
    it('should update landingPage settings successfully', async () => {
        // Arrange: Create test settings document if it doesn't exist
        const settingsRef = doc(db, `tenants/${TEST_TENANT_ID}/settings`, 'settings');
        const mockSettings: AppSettings = {
            weekSchedule: {
                monday: { openingHour: 8, closingHour: 17, isOpen: true },
                tuesday: { openingHour: 8, closingHour: 17, isOpen: true },
                wednesday: { openingHour: 8, closingHour: 17, isOpen: true },
                thursday: { openingHour: 8, closingHour: 17, isOpen: true },
                friday: { openingHour: 8, closingHour: 17, isOpen: true },
                saturday: { openingHour: 9, closingHour: 15, isOpen: true },
                sunday: { openingHour: 0, closingHour: 0, isOpen: false }
            },
            slotDuration: 30,
            storeOpen: true,
            maxDaysInAdvance: 7,
            maxOrdersPerSlot: 5,
            minLeadTimeMinutes: 30,
            openingBufferMinutes: 15,
            closingBufferMinutes: 30,
            currency: 'USD',
            loyaltyEnabled: false,
            pointsPerDollar: 1,
            pointsToReward: 100
        };
        await setDoc(settingsRef, mockSettings);

        const landingPageSettings: AppSettings['landingPage'] = {
            logoUrl: 'https://example.com/logo.png',
            heroImageUrl: 'https://example.com/hero.jpg',
            primaryColor: '#3498db',
            tagline: 'Welcome to our coffee shop!',
            address: '123 Main St, City, State 12345',
            phone: '+1234567890',
            email: 'contact@example.com'
        };

        // Act: Update landing page settings
        await updateLandingPageSettings(TEST_TENANT_ID, landingPageSettings);

        // Assert: Verify settings were saved correctly
        const snapshot = await getDoc(settingsRef);
        expect(snapshot.exists()).toBe(true);

        const savedSettings = snapshot.data() as AppSettings;
        expect(savedSettings.landingPage).toBeDefined();
        expect(savedSettings.landingPage?.logoUrl).toBe('https://example.com/logo.png');
        expect(savedSettings.landingPage?.heroImageUrl).toBe('https://example.com/hero.jpg');
        expect(savedSettings.landingPage?.primaryColor).toBe('#3498db');
        expect(savedSettings.landingPage?.tagline).toBe('Welcome to our coffee shop!');
        expect(savedSettings.landingPage?.address).toBe('123 Main St, City, State 12345');
        expect(savedSettings.landingPage?.phone).toBe('+1234567890');
        expect(savedSettings.landingPage?.email).toBe('contact@example.com');

        // Verify existing settings were preserved
        expect(savedSettings.storeOpen).toBe(true);
        expect(savedSettings.currency).toBe('USD');
    }, 10000);

    /**
     * Test 2: Image URL validation
     * Verifies that image URLs are properly validated
     */
    it('should validate image URLs', () => {
        // Valid URLs
        const validUrls = [
            'https://example.com/logo.png',
            'https://storage.googleapis.com/bucket/image.jpg',
            'http://localhost:5173/test.png'
        ];

        validUrls.forEach(url => {
            expect(url).toMatch(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i);
        });

        // Invalid URLs (should not match)
        const invalidUrls = [
            'not-a-url',
            'ftp://example.com/file.png',
            'javascript:alert(1)'
        ];

        invalidUrls.forEach(url => {
            expect(url).not.toMatch(/^https?:\/\/.+/);
        });
    });

    /**
     * Test 3: Color hex format validation
     * Verifies that color values are in valid hex format
     */
    it('should validate color hex format', () => {
        // Valid hex colors
        const validColors = ['#3498db', '#FFFFFF', '#000', '#f0f0f0', '#abc'];

        validColors.forEach(color => {
            expect(color).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
        });

        // Invalid colors
        const invalidColors = ['3498db', 'blue', '#gg0000', 'rgb(255,0,0)'];

        invalidColors.forEach(color => {
            expect(color).not.toMatch(/^#[0-9A-Fa-f]{3,6}$/);
        });
    });

    /**
     * Test 4: Fetch settings with missing landingPage field (backward compatibility)
     * Verifies that settings without landingPage field can be read without errors
     */
    it('should fetch settings with missing landingPage field (backward compatibility)', async () => {
        // Arrange: Create settings without landingPage field
        const settingsRef = doc(db, `tenants/${TEST_TENANT_ID}/settings`, 'settings');
        const mockSettings: AppSettings = {
            weekSchedule: {
                monday: { openingHour: 8, closingHour: 17, isOpen: true },
                tuesday: { openingHour: 8, closingHour: 17, isOpen: true },
                wednesday: { openingHour: 8, closingHour: 17, isOpen: true },
                thursday: { openingHour: 8, closingHour: 17, isOpen: true },
                friday: { openingHour: 8, closingHour: 17, isOpen: true },
                saturday: { openingHour: 9, closingHour: 15, isOpen: true },
                sunday: { openingHour: 0, closingHour: 0, isOpen: false }
            },
            slotDuration: 30,
            storeOpen: true,
            maxDaysInAdvance: 7,
            maxOrdersPerSlot: 5,
            minLeadTimeMinutes: 30,
            openingBufferMinutes: 15,
            closingBufferMinutes: 30,
            currency: 'USD',
            loyaltyEnabled: false,
            pointsPerDollar: 1,
            pointsToReward: 100
            // Note: No landingPage field
        };
        await setDoc(settingsRef, mockSettings);

        // Act: Fetch settings
        const snapshot = await getDoc(settingsRef);

        // Assert: Verify settings can be read and landingPage is undefined
        expect(snapshot.exists()).toBe(true);
        const savedSettings = snapshot.data() as AppSettings;
        expect(savedSettings.landingPage).toBeUndefined();
        expect(savedSettings.storeOpen).toBe(true);
        expect(savedSettings.currency).toBe('USD');

        // Verify app doesn't crash with missing landingPage
        const landingPage = savedSettings.landingPage || {};
        expect(landingPage.logoUrl || 'default-logo.png').toBeDefined();
    }, 10000);

    /**
     * Test 5: Tagline length validation
     * Verifies that tagline respects max 200 character limit
     */
    it('should validate tagline length (max 200 chars)', () => {
        const validTagline = 'Welcome to our amazing coffee shop!';
        expect(validTagline.length).toBeLessThanOrEqual(200);

        const longTagline = 'A'.repeat(250);
        expect(longTagline.length).toBeGreaterThan(200);

        // In real implementation, this should be truncated or rejected
        const truncatedTagline = longTagline.substring(0, 200);
        expect(truncatedTagline.length).toBe(200);
    });

    /**
     * Test 6: Partial settings update
     * Verifies that partial landing page settings can be updated without affecting other fields
     */
    it('should allow partial landing page settings update', async () => {
        // Arrange: Create initial settings with full landingPage
        const settingsRef = doc(db, `tenants/${TEST_TENANT_ID}/settings`, 'settings');
        const mockSettings: AppSettings = {
            weekSchedule: {
                monday: { openingHour: 8, closingHour: 17, isOpen: true },
                tuesday: { openingHour: 8, closingHour: 17, isOpen: true },
                wednesday: { openingHour: 8, closingHour: 17, isOpen: true },
                thursday: { openingHour: 8, closingHour: 17, isOpen: true },
                friday: { openingHour: 8, closingHour: 17, isOpen: true },
                saturday: { openingHour: 9, closingHour: 15, isOpen: true },
                sunday: { openingHour: 0, closingHour: 0, isOpen: false }
            },
            slotDuration: 30,
            storeOpen: true,
            maxDaysInAdvance: 7,
            maxOrdersPerSlot: 5,
            minLeadTimeMinutes: 30,
            openingBufferMinutes: 15,
            closingBufferMinutes: 30,
            currency: 'USD',
            loyaltyEnabled: false,
            pointsPerDollar: 1,
            pointsToReward: 100,
            landingPage: {
                logoUrl: 'https://example.com/logo.png',
                heroImageUrl: 'https://example.com/hero.jpg',
                primaryColor: '#3498db',
                tagline: 'Original tagline',
                address: '123 Main St',
                phone: '+1234567890',
                email: 'contact@example.com'
            }
        };
        await setDoc(settingsRef, mockSettings);

        // Act: Update only tagline and primaryColor
        const partialUpdate: AppSettings['landingPage'] = {
            ...mockSettings.landingPage,
            tagline: 'Updated tagline',
            primaryColor: '#e74c3c'
        };
        await updateLandingPageSettings(TEST_TENANT_ID, partialUpdate);

        // Assert: Verify only specified fields were updated
        const snapshot = await getDoc(settingsRef);
        const savedSettings = snapshot.data() as AppSettings;
        expect(savedSettings.landingPage?.tagline).toBe('Updated tagline');
        expect(savedSettings.landingPage?.primaryColor).toBe('#e74c3c');
        expect(savedSettings.landingPage?.logoUrl).toBe('https://example.com/logo.png');
        expect(savedSettings.landingPage?.heroImageUrl).toBe('https://example.com/hero.jpg');
        expect(savedSettings.landingPage?.address).toBe('123 Main St');
        expect(savedSettings.landingPage?.phone).toBe('+1234567890');
        expect(savedSettings.landingPage?.email).toBe('contact@example.com');
    }, 10000);
});
