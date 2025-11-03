import { VerticalConfig } from '../../types/vertical.types';

/**
 * Base Vertical Configuration
 *
 * Provides default values and fallbacks for all verticals.
 * Individual vertical configs can override these defaults.
 */
export const baseConfig: Partial<VerticalConfig> = {
  features: {
    // Conservative defaults - most verticals don't have these
    hasInventory: false,
    hasScheduling: false,
    hasInspections: false,
    requiresDeposit: false,
    allowsTipping: false,
    hasLoyaltyProgram: false,
    hasTableManagement: false,
    hasKitchenDisplay: false,
    hasDelivery: false,
    requiresRelationalData: false,
  },

  workflows: [],

  defaultSettings: {
    orderTypes: ['in-person'],
    paymentMethods: ['card', 'cash'],
  },

  collections: {
    items: 'items',
    itemGroups: 'itemGroups',
    transactions: 'transactions',
    locations: 'locations',
  },
};

/**
 * Generic terminology fallback
 * Used when no specific vertical is configured
 */
export const genericTerminology = {
  item: 'item',
  itemPlural: 'items',
  itemGroup: 'group',
  itemGroupPlural: 'groups',
  transaction: 'transaction',
  transactionPlural: 'transactions',
  location: 'location',
  locationPlural: 'locations',
  staff: 'staff member',
  staffPlural: 'staff',
  customer: 'customer',
  customerPlural: 'customers',
  actionPrimary: 'process',
  actionSecondary: 'schedule',
};
