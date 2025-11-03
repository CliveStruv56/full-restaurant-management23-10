import { VerticalConfig } from '../../types/vertical.types';

/**
 * Restaurant Vertical Configuration
 *
 * Defines the complete configuration for the restaurant business vertical.
 * This is the default/original vertical for the platform.
 */
export const restaurantConfig: VerticalConfig = {
  id: 'restaurant',
  name: 'Restaurant & Cafe',
  description: 'Full-service restaurants, cafes, quick-service establishments, and food service businesses',
  icon: 'utensils', // lucide-react icon name

  terminology: {
    // Core entities
    item: 'dish',
    itemPlural: 'dishes',
    itemGroup: 'category',
    itemGroupPlural: 'categories',

    // Transactions
    transaction: 'order',
    transactionPlural: 'orders',

    // Location/Space
    location: 'table',
    locationPlural: 'tables',

    // People
    staff: 'server',
    staffPlural: 'servers',
    customer: 'guest',
    customerPlural: 'guests',

    // Actions
    actionPrimary: 'order',
    actionSecondary: 'reserve',
  },

  features: {
    // Inventory
    hasInventory: true,
    inventoryTracking: 'simple',

    // Scheduling
    hasScheduling: true,
    schedulingType: 'reservations',

    // Inspections
    hasInspections: false,

    // Financial
    requiresDeposit: false,
    allowsTipping: true,

    // Customer engagement
    hasLoyaltyProgram: true,
    loyaltyType: 'points',

    // Operations
    hasTableManagement: true,
    hasKitchenDisplay: true,
    hasDelivery: true,

    // Data complexity
    requiresRelationalData: false, // Firestore is sufficient
  },

  workflows: [
    {
      id: 'seat',
      name: 'Seat Guests',
      icon: 'users',
      description: 'Assign table to guests',
    },
    {
      id: 'order',
      name: 'Take Order',
      icon: 'clipboard-list',
      description: 'Record customer order',
      requiredFields: ['items', 'orderType'],
    },
    {
      id: 'prepare',
      name: 'Prepare Food',
      icon: 'chef-hat',
      description: 'Kitchen prepares order',
    },
    {
      id: 'serve',
      name: 'Serve',
      icon: 'utensils',
      description: 'Deliver food to table',
    },
    {
      id: 'checkout',
      name: 'Checkout',
      icon: 'credit-card',
      description: 'Process payment',
      requiredFields: ['paymentMethod'],
    },
  ],

  defaultSettings: {
    orderTypes: ['dine-in', 'takeaway', 'delivery'],
    paymentMethods: ['card', 'cash', 'mobile'],
    operatingHours: {
      monday: { open: '09:00', close: '22:00' },
      tuesday: { open: '09:00', close: '22:00' },
      wednesday: { open: '09:00', close: '22:00' },
      thursday: { open: '09:00', close: '22:00' },
      friday: { open: '09:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
  },

  collections: {
    items: 'products', // Backward compatibility: use 'products' for restaurants
    itemGroups: 'categories',
    transactions: 'orders',
    locations: 'tables',
  },
};
