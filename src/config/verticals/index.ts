import { VerticalType, VerticalConfig, VerticalRegistryEntry } from '../../types/vertical.types';
import { restaurantConfig } from './restaurant.config';
import { baseConfig, genericTerminology } from './base.config';

/**
 * Vertical Registry
 *
 * Central registry of all supported business verticals.
 * Add new verticals here to make them available platform-wide.
 */

// Registry of all vertical configurations
const verticalRegistry: Record<VerticalType, VerticalConfig> = {
  restaurant: restaurantConfig,

  // Placeholder configurations for future verticals
  // These will be fully implemented as needed
  'auto-shop': {
    id: 'auto-shop',
    name: 'Auto Shop',
    description: 'Automotive repair and maintenance services',
    icon: 'car',
    terminology: {
      item: 'service',
      itemPlural: 'services',
      itemGroup: 'service type',
      itemGroupPlural: 'service types',
      transaction: 'work order',
      transactionPlural: 'work orders',
      location: 'bay',
      locationPlural: 'bays',
      staff: 'technician',
      staffPlural: 'technicians',
      customer: 'customer',
      customerPlural: 'customers',
      actionPrimary: 'schedule',
      actionSecondary: 'inspect',
    },
    features: {
      ...baseConfig.features!,
      hasInventory: true,
      hasScheduling: true,
      hasInspections: true,
    },
    workflows: [],
    defaultSettings: baseConfig.defaultSettings,
    collections: baseConfig.collections,
  },

  salon: {
    id: 'salon',
    name: 'Salon & Spa',
    description: 'Hair salons, spas, and beauty services',
    icon: 'scissors',
    terminology: {
      item: 'treatment',
      itemPlural: 'treatments',
      itemGroup: 'category',
      itemGroupPlural: 'categories',
      transaction: 'appointment',
      transactionPlural: 'appointments',
      location: 'chair',
      locationPlural: 'chairs',
      staff: 'stylist',
      staffPlural: 'stylists',
      customer: 'client',
      customerPlural: 'clients',
      actionPrimary: 'book',
      actionSecondary: 'schedule',
    },
    features: {
      ...baseConfig.features!,
      hasInventory: true,
      hasScheduling: true,
      requiresDeposit: true,
      hasLoyaltyProgram: true,
    },
    workflows: [],
    defaultSettings: baseConfig.defaultSettings,
    collections: baseConfig.collections,
  },

  hotel: {
    id: 'hotel',
    name: 'Hotel & Lodging',
    description: 'Hotels, motels, and short-term rentals',
    icon: 'hotel',
    terminology: {
      item: 'room',
      itemPlural: 'rooms',
      itemGroup: 'room type',
      itemGroupPlural: 'room types',
      transaction: 'booking',
      transactionPlural: 'bookings',
      location: 'room',
      locationPlural: 'rooms',
      staff: 'concierge',
      staffPlural: 'staff',
      customer: 'guest',
      customerPlural: 'guests',
      actionPrimary: 'book',
      actionSecondary: 'reserve',
    },
    features: {
      ...baseConfig.features!,
      hasScheduling: true,
      requiresDeposit: true,
    },
    workflows: [],
    defaultSettings: baseConfig.defaultSettings,
    collections: baseConfig.collections,
  },

  retail: {
    id: 'retail',
    name: 'Retail Store',
    description: 'Retail shops and product sales',
    icon: 'shopping-bag',
    terminology: {
      item: 'product',
      itemPlural: 'products',
      itemGroup: 'category',
      itemGroupPlural: 'categories',
      transaction: 'sale',
      transactionPlural: 'sales',
      location: 'checkout',
      locationPlural: 'checkouts',
      staff: 'associate',
      staffPlural: 'associates',
      customer: 'customer',
      customerPlural: 'customers',
      actionPrimary: 'purchase',
      actionSecondary: 'browse',
    },
    features: {
      ...baseConfig.features!,
      hasInventory: true,
      hasLoyaltyProgram: true,
    },
    workflows: [],
    defaultSettings: baseConfig.defaultSettings,
    collections: baseConfig.collections,
  },
};

/**
 * Get vertical configuration by type
 * Returns restaurant config if type is invalid
 */
export function getVerticalConfig(verticalType: VerticalType | undefined | null): VerticalConfig {
  if (!verticalType || !(verticalType in verticalRegistry)) {
    console.warn(`Unknown vertical type: ${verticalType}, falling back to restaurant`);
    return restaurantConfig;
  }
  return verticalRegistry[verticalType];
}

/**
 * Get all available vertical types
 */
export function getAvailableVerticals(): VerticalType[] {
  return Object.keys(verticalRegistry) as VerticalType[];
}

/**
 * Get all vertical configurations
 */
export function getAllVerticalConfigs(): Record<VerticalType, VerticalConfig> {
  return verticalRegistry;
}

/**
 * Check if a vertical type is supported
 */
export function isVerticalSupported(verticalType: string): verticalType is VerticalType {
  return verticalType in verticalRegistry;
}

/**
 * Get vertical display name
 */
export function getVerticalDisplayName(verticalType: VerticalType | undefined | null): string {
  const config = getVerticalConfig(verticalType);
  return config.name;
}

/**
 * Get vertical icon
 */
export function getVerticalIcon(verticalType: VerticalType | undefined | null): string {
  const config = getVerticalConfig(verticalType);
  return config.icon;
}

// Export the default config for convenience
export { restaurantConfig };
export const defaultVerticalType: VerticalType = 'restaurant';
