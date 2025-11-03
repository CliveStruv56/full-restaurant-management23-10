/**
 * Multi-Vertical Platform Type Definitions
 *
 * This file defines the core type system for supporting multiple business verticals
 * (restaurants, auto shops, salons, etc.) within the same platform architecture.
 */

/**
 * Supported business vertical types
 */
export type VerticalType = 'restaurant' | 'auto-shop' | 'salon' | 'hotel' | 'retail';

/**
 * Workflow step definition for vertical-specific processes
 */
export interface WorkflowStep {
  id: string;
  name: string;
  icon: string;
  description?: string;
  requiredFields?: string[];
}

/**
 * Terminology mapping for vertical-specific labels
 * Allows the same UI components to display different terms based on business type
 *
 * Example:
 * - Restaurant: item = "dish", transaction = "order", location = "table"
 * - Auto Shop: item = "service", transaction = "work order", location = "bay"
 * - Salon: item = "treatment", transaction = "appointment", location = "chair"
 */
export interface VerticalTerminology {
  // Core entities
  item: string;           // What the business sells/provides
  itemPlural: string;     // Plural form
  itemGroup: string;      // Category/grouping of items
  itemGroupPlural: string;

  // Transactions
  transaction: string;    // Primary business transaction
  transactionPlural: string;

  // Location/Space
  location: string;       // Physical location where service happens
  locationPlural: string;

  // People
  staff: string;          // Staff member who provides service
  staffPlural: string;
  customer: string;       // Person receiving service
  customerPlural: string;

  // Actions
  actionPrimary: string;  // Main action verb (e.g., "order", "book", "schedule")
  actionSecondary: string; // Secondary action (e.g., "reserve", "check-in")
}

/**
 * Feature flags for vertical-specific capabilities
 */
export interface VerticalFeatures {
  // Inventory management
  hasInventory: boolean;
  inventoryTracking?: 'simple' | 'advanced';

  // Scheduling & Appointments
  hasScheduling: boolean;
  schedulingType?: 'appointments' | 'reservations' | 'both';

  // Inspections & Assessments
  hasInspections: boolean;
  inspectionWorkflow?: boolean;

  // Financial
  requiresDeposit: boolean;
  depositPercentage?: number;
  allowsTipping: boolean;

  // Customer engagement
  hasLoyaltyProgram: boolean;
  loyaltyType?: 'points' | 'visits' | 'spend';

  // Operations
  hasTableManagement: boolean;
  hasKitchenDisplay: boolean;
  hasDelivery: boolean;

  // Data complexity
  requiresRelationalData: boolean; // For future PostgreSQL support
}

/**
 * Main vertical configuration
 * Defines all characteristics and behavior for a specific business vertical
 */
export interface VerticalConfig {
  // Identity
  id: VerticalType;
  name: string;
  description: string;
  icon: string;

  // Terminology for this vertical
  terminology: VerticalTerminology;

  // Feature set
  features: VerticalFeatures;

  // Workflow steps specific to this vertical
  workflows: WorkflowStep[];

  // Default settings for new tenants
  defaultSettings?: {
    orderTypes?: string[];
    paymentMethods?: string[];
    operatingHours?: any;
  };

  // Collection name mappings (for database compatibility layer)
  collections?: {
    items?: string;      // Default: 'items'
    itemGroups?: string; // Default: 'itemGroups'
    transactions?: string; // Default: 'transactions'
    locations?: string;  // Default: 'locations'
  };
}

/**
 * Vertical template for initializing new tenants
 * Contains default data and configuration for a specific vertical
 */
export interface VerticalTemplate {
  verticalType: VerticalType;

  // Default item groups (categories) to create
  defaultItemGroups: Array<{
    name: string;
    description?: string;
    sortOrder: number;
    icon?: string;
  }>;

  // Default items to create (optional, for demo purposes)
  defaultItems?: Array<{
    name: string;
    description: string;
    price: number;
    categoryName: string;
    image?: string;
  }>;

  // Default settings
  defaultSettings: {
    businessHours?: {
      monday?: { open: string; close: string; };
      tuesday?: { open: string; close: string; };
      wednesday?: { open: string; close: string; };
      thursday?: { open: string; close: string; };
      friday?: { open: string; close: string; };
      saturday?: { open: string; close: string; };
      sunday?: { open: string; close: string; };
    };
    orderTypes?: string[];
    paymentMethods?: string[];
    currency?: string;
    taxRate?: number;
  };

  // Feature flags for this vertical
  enabledFeatures: string[];

  // Database schema requirements
  requiresPostgreSQL?: boolean;
  postgresSchema?: any; // For future use
}

/**
 * Vertical registry entry
 * Used to register and discover available verticals
 */
export interface VerticalRegistryEntry {
  config: VerticalConfig;
  template: VerticalTemplate;
  landingPagePath?: string; // Optional custom landing page
  signupPath?: string; // Optional custom signup path
  pricingTiers?: Array<{
    name: string;
    price: number;
    features: string[];
  }>;
}

/**
 * Context value for VerticalContext
 */
export interface VerticalContextValue {
  config: VerticalConfig;
  terminology: VerticalTerminology;
  features: VerticalFeatures;
  isVertical: (type: VerticalType) => boolean;
  hasFeature: (feature: keyof VerticalFeatures) => boolean;
}
