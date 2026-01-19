import { describe, test, expect } from '@jest/globals';
/**
 * Floor Plan Settings Tests
 * Tests for AppSettings extension with floorPlanEnabled and floorPlanCanvas
 */

import type { AppSettings } from '../types';

// Helper to create base settings
const createBaseSettings = (overrides?: Partial<AppSettings>): AppSettings => ({
  weekSchedule: {
    monday: { openingHour: 9, closingHour: 17, isOpen: true },
    tuesday: { openingHour: 9, closingHour: 17, isOpen: true },
    wednesday: { openingHour: 9, closingHour: 17, isOpen: true },
    thursday: { openingHour: 9, closingHour: 17, isOpen: true },
    friday: { openingHour: 9, closingHour: 17, isOpen: true },
    saturday: { openingHour: 10, closingHour: 16, isOpen: true },
    sunday: { openingHour: 10, closingHour: 16, isOpen: false },
  },
  slotDuration: 15,
  storeOpen: true,
  maxDaysInAdvance: 7,
  maxOrdersPerSlot: 5,
  minLeadTimeMinutes: 30,
  openingBufferMinutes: 30,
  closingBufferMinutes: 60,
  currency: 'GBP',
  loyaltyEnabled: true,
  pointsPerDollar: 10,
  pointsToReward: 100,
  ...overrides,
});

describe('AppSettings - Floor Plan Extension', () => {
  test('floorPlanEnabled boolean toggle behavior', () => {
    const settingsWithEnabled = createBaseSettings({ floorPlanEnabled: true });
    const settingsWithDisabled = createBaseSettings({ floorPlanEnabled: false });

    expect(settingsWithEnabled.floorPlanEnabled).toBe(true);
    expect(settingsWithDisabled.floorPlanEnabled).toBe(false);
  });

  test('floorPlanCanvas dimensions validation (min/max bounds)', () => {
    const settingsWithSmallCanvas = createBaseSettings({
      floorPlanEnabled: true,
      floorPlanCanvas: { width: 600, height: 400 },
    });

    const settingsWithMediumCanvas = createBaseSettings({
      floorPlanEnabled: true,
      floorPlanCanvas: { width: 800, height: 600 },
    });

    const settingsWithLargeCanvas = createBaseSettings({
      floorPlanEnabled: true,
      floorPlanCanvas: { width: 1200, height: 800 },
    });

    // Small canvas
    expect(settingsWithSmallCanvas.floorPlanCanvas?.width).toBe(600);
    expect(settingsWithSmallCanvas.floorPlanCanvas?.height).toBe(400);
    expect(settingsWithSmallCanvas.floorPlanCanvas!.width).toBeGreaterThanOrEqual(400);
    expect(settingsWithSmallCanvas.floorPlanCanvas!.height).toBeGreaterThanOrEqual(300);

    // Medium canvas (default)
    expect(settingsWithMediumCanvas.floorPlanCanvas?.width).toBe(800);
    expect(settingsWithMediumCanvas.floorPlanCanvas?.height).toBe(600);

    // Large canvas
    expect(settingsWithLargeCanvas.floorPlanCanvas?.width).toBe(1200);
    expect(settingsWithLargeCanvas.floorPlanCanvas?.height).toBe(800);
    expect(settingsWithLargeCanvas.floorPlanCanvas!.width).toBeLessThanOrEqual(2000);
    expect(settingsWithLargeCanvas.floorPlanCanvas!.height).toBeLessThanOrEqual(2000);
  });

  test('backward compatibility when fields are undefined', () => {
    const legacySettings = createBaseSettings();
    // No floorPlanEnabled or floorPlanCanvas fields set

    // Fields should be undefined (not present)
    expect(legacySettings.floorPlanEnabled).toBeUndefined();
    expect(legacySettings.floorPlanCanvas).toBeUndefined();

    // Default behavior: treat undefined as false
    const isFloorPlanEnabled = legacySettings.floorPlanEnabled ?? false;
    expect(isFloorPlanEnabled).toBe(false);

    // Default canvas dimensions
    const canvasWidth = legacySettings.floorPlanCanvas?.width ?? 800;
    const canvasHeight = legacySettings.floorPlanCanvas?.height ?? 600;
    expect(canvasWidth).toBe(800);
    expect(canvasHeight).toBe(600);
  });

  test('floor plan enabled with undefined canvas uses defaults', () => {
    const settingsWithEnabledNoCanvas = createBaseSettings({
      floorPlanEnabled: true,
      // floorPlanCanvas is undefined, should use defaults
    });

    expect(settingsWithEnabledNoCanvas.floorPlanEnabled).toBe(true);
    expect(settingsWithEnabledNoCanvas.floorPlanCanvas).toBeUndefined();

    // Application should use defaults when canvas is undefined
    const defaultCanvasWidth = settingsWithEnabledNoCanvas.floorPlanCanvas?.width ?? 800;
    const defaultCanvasHeight = settingsWithEnabledNoCanvas.floorPlanCanvas?.height ?? 600;
    expect(defaultCanvasWidth).toBe(800);
    expect(defaultCanvasHeight).toBe(600);
  });
});
