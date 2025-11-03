import type { Dispatch, SetStateAction } from 'react';

// --- AUTH & USER TYPES ---

export type UserRole = 'customer' | 'staff' | 'admin' | 'super-admin';

// NEW: Multi-tenant membership for a single tenant
export interface TenantMembership {
  role: UserRole;
  joinedAt: string; // ISO 8601 timestamp
  invitedBy?: string; // User ID of admin who invited them
  isActive: boolean; // Can be deactivated without deletion
}

// UPDATED: User interface with multi-tenant support
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string; // Optional phone number
  createdAt: string; // ISO 8601 timestamp

  // NEW: Multi-tenant memberships (replaces single tenantId)
  tenantMemberships: {
    [tenantId: string]: TenantMembership;
  };

  // NEW: Last selected tenant for UX convenience
  currentTenantId?: string;

  // Legacy fields (kept for backward compatibility during migration)
  tenantId?: string; // DEPRECATED - use tenantMemberships instead
  role?: UserRole; // DEPRECATED - use tenantMemberships[tenantId].role instead

  loyaltyPoints: number; // TODO: Will be per-tenant in future

  // Legacy invitation fields (kept for backward compatibility)
  invitedBy?: string;
  invitedAt?: string;
  invitationAccepted?: boolean;
}

// NEW: Invitation interface
export interface Invitation {
  id: string; // Auto-generated Firestore document ID
  tenantId: string; // Tenant this invitation is for
  email: string; // Invitee email address (lowercase)
  role: UserRole; // Role to assign
  token: string; // Unique 64-character hex token
  status: 'pending' | 'accepted' | 'expired' | 'error';
  invitedBy: string; // User ID of admin who sent invitation
  invitedByName: string; // Display name of inviting admin
  invitedByEmail: string; // Email of inviting admin (for contact)
  createdAt: string; // ISO 8601 timestamp
  expiresAt: string; // ISO 8601 timestamp (72 hours after createdAt)
  acceptedAt?: string; // ISO 8601 timestamp
  acceptedByUserId?: string; // Firebase Auth UID of accepted user
  reminderSentAt?: string; // ISO 8601 timestamp
  emailSentAt?: string; // ISO 8601 timestamp
  error?: string; // Error message if email failed
}


// --- DATA TYPES ---

export interface ProductOption {
    name: string;
    price: number; // Additive price
}

export interface SizeOption {
    name: 'Small' | 'Medium' | 'Large';
    price: number; // Replaces base price (not additive)
    volume: string; // e.g., "8oz / 236ml"
}

export interface Category {
    id: string;
    name: string;
    options: ProductOption[];
    hasSizes?: boolean; // Whether this category uses cup sizes
    sizeOptions?: SizeOption[]; // Available sizes for this category
}

export interface Product {
  id: string; // Changed from number to string for Firestore compatibility
  name: string;
  categoryId: string;
  price: number;
  description: string;
  imageUrl: string;
  availableOptionNames?: string[];
  availableFor?: 'dine-in' | 'takeaway' | 'both'; // NEW: Order type availability (default: 'both')
}

export interface CartItem extends Omit<Product, 'price'> {
  cartItemId: string; // Unique ID for product + options combo
  quantity: number;
  selectedOptions: ProductOption[];
  price: number; // Final price (base + options)
}

export interface Order {
  id: string;
  userId: string; // Can be anonymous user ID for guests
  customerName: string; // Customer display name for kitchen/admin display
  tenantId: string; // NEW - tenant isolation

  // NEW: Guest contact info (for non-authenticated users)
  guestEmail?: string;
  guestPhone?: string;
  isGuestOrder?: boolean; // True if placed without account

  items: CartItem[];
  total: number;
  status: 'Placed' | 'Preparing' | 'Ready for Collection' | 'Completed';
  orderType: 'takeaway' | 'dine-in' | 'delivery'; // NEW
  tableNumber?: number; // NEW - for dine-in orders
  guestCount?: number; // NEW - for dine-in orders
  collectionTime: string; // ISO 8601 Date String
  orderTime: string;
  rewardApplied?: {
      itemName: string;
      discountAmount: number;
  };
  paymentStatus?: 'pending' | 'paid' | 'refunded'; // NEW
  paymentMethod?: string; // 'stripe', 'square', 'cash'
}

export interface DailySpecial {
    drink: Product;
    pastry: Product;
    description: string;
}

export interface DaySetting {
    openingHour: number;
    closingHour: number;
    isOpen: boolean;
}

export interface AppSettings {
    weekSchedule: {
        monday: DaySetting;
        tuesday: DaySetting;
        wednesday: DaySetting;
        thursday: DaySetting;
        friday: DaySetting;
        saturday: DaySetting;
        sunday: DaySetting;
    };
    slotDuration: number;
    storeOpen: boolean; // Master switch
    maxDaysInAdvance: number;
    maxOrdersPerSlot: number;
    minLeadTimeMinutes: number;
    openingBufferMinutes: number;
    closingBufferMinutes: number;
    currency: 'USD' | 'GBP' | 'EUR';
    loyaltyEnabled: boolean;
    pointsPerDollar: number;
    pointsToReward: number;
    availableTables?: number[]; // NEW: Available table numbers for dine-in orders

    // NEW: Landing page branding
    landingPage?: {
        logoUrl?: string; // Firebase Storage URL
        heroImageUrl?: string; // Firebase Storage URL
        primaryColor?: string; // Hex color (e.g., "#3498db")
        tagline?: string; // Max 200 chars
        address?: string;
        phone?: string;
        email?: string;
    };

    // NEW: Table occupation times (foundation for Phase 4)
    tableOccupation?: {
        servicePeriods: {
            breakfast: number; // minutes (default: 45)
            lunch: number; // minutes (default: 60)
            dinner: number; // minutes (default: 90)
        };
        partySizeModifiers: {
            solo: number; // minutes offset (default: -15)
            couple: number; // minutes offset (default: 0)
            smallGroup: number; // minutes offset (default: +15)
            largeGroup: number; // minutes offset (default: +30)
        };
    };

    // NEW: Visual Floor Plan Builder Module (Phase 5)
    // Enable/disable the visual floor plan feature
    floorPlanEnabled?: boolean; // Default: false (disabled for backward compatibility)

    // Canvas dimensions for floor plan (in grid units)
    // Default: { width: 800, height: 600 } when undefined
    floorPlanCanvas?: {
        width: number;  // Canvas width in grid units (recommended: 600-1200)
        height: number; // Canvas height in grid units (recommended: 400-800)
    };
}

export interface TimeSlot {
    value: string; // ISO string
    time: string; // e.g., "10:15"
    group: string; // e.g., "Today"
}


// --- ADMIN TYPES ---
export interface AdminPanelProps {
    activePage: string;
    setActivePage: Dispatch<SetStateAction<string>>;
}

export interface ProductFormProps {
    product: Product | null;
    categories: Category[];
    onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
    onClose: () => void;
}

// --- MULTI-TENANT TYPES ---

// NEW: Rate limiting structure for invitations
export interface InvitationRateLimit {
  lastResetAt: string; // ISO 8601 timestamp
  invitationsSentThisHour: number; // Current count
}

// NEW: Invitation statistics
export interface InvitationStats {
  totalInvitationsSent: number;
  totalInvitationsAccepted: number;
}

// NEW: Tenant status tracking for super admin management
export interface TenantStatus {
  status: 'pending-approval' | 'trial' | 'active' | 'suspended' | 'cancelled';
  approvedBy?: string; // Super admin UID who approved tenant
  approvedAt?: string; // ISO 8601 timestamp
  statusChangedAt: string; // ISO 8601 timestamp
  statusChangedBy: string; // UID of user who changed status (super admin)
  statusReason?: string; // Optional reason for status change (e.g., "Trial expired", "Payment failed")
}

// NEW: Tenant usage metrics for health monitoring
export interface TenantUsageMetrics {
  totalOrders: number;
  totalUsers: number; // Count of users with active membership
  totalStaff: number; // Count of staff + admin users
  lastOrderAt?: string; // ISO 8601 timestamp of most recent order
  lastActivityAt: string; // ISO 8601 timestamp of any activity (login, order, etc.)
  monthlyRevenue?: number; // Calculated MRR based on enabled modules
}

// UPDATED: Tenant interface with invitation fields
export interface Tenant {
  id: string;
  businessName: string;
  businessType: 'cafe' | 'restaurant' | 'pub' | 'quick-service';
  subdomain: string;
  customDomain?: string;
  enabledModules: {
    base: boolean;
    tableManagement: boolean;
    management: boolean;
    delivery: boolean;
  };
  subscription: {
    plan: 'trial' | 'active' | 'cancelled';
    trialEndsAt?: string;
    modules: string[];
  };
  paymentGateway: {
    provider: 'stripe' | 'square' | 'custom' | 'none';
    config?: any;
  };
  branding?: {
    primaryColor?: string;
    logo?: string;
    favicon?: string;
  };

  // NEW: Invitation rate limiting
  invitationRateLimit?: InvitationRateLimit;

  // NEW: Invitation statistics
  stats?: InvitationStats;

  // NEW: Tenant status tracking (for super admin management)
  tenantStatus?: TenantStatus;

  // NEW: Usage metrics (for super admin health monitoring)
  usageMetrics?: TenantUsageMetrics;

  // Contact information (for super admin)
  contactEmail?: string; // Primary contact email for tenant
  contactPhone?: string; // Primary contact phone

  createdAt: string;
  updatedAt: string;
}

export interface BaseModuleSettings {
  enableDineIn: boolean;
  enableTakeaway: boolean;
  enableDelivery: boolean;
  numberOfTables: number;
  averageDineInDuration: number; // minutes
}

// --- TABLE MANAGEMENT TYPES (Phase 2) ---

export interface Table {
  id: string;
  number: number;
  capacity: number; // max guests
  shape: 'square' | 'rectangle' | 'circle';
  position: { x: number; y: number }; // grid coordinates
  mergeable: string[]; // IDs of tables that can merge with this
  status: 'available' | 'occupied' | 'reserved';
  description?: string; // Optional description (e.g., "by the window", "sea view")
}

/**
 * UPDATED: Reservation interface for Customer Flow Redesign spec
 *
 * Phase 3A: Table-Reservation Linking & Double-Booking Prevention
 * Added optional fields for table assignment and duration calculation.
 * All new fields are optional for backward compatibility with existing reservations.
 */
export interface Reservation {
  id: string; // Auto-generated Firestore ID
  tenantId: string; // Tenant isolation

  // Booking details
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm 24-hour format (e.g., "19:00")
  partySize: number; // Number of guests (1-20)

  // Contact information
  contactName: string;
  contactPhone: string; // E.164 format: +1234567890
  contactEmail: string; // Validated email

  // Optional preferences
  tablePreference?: number; // Requested table number
  specialRequests?: string; // Max 500 chars

  // Status tracking
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';

  // Timestamps
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp

  // Admin notes
  adminNotes?: string; // Internal staff notes

  // NEW FIELDS - Phase 3A: Table-Reservation Linking
  /**
   * ID of the assigned table from the tables collection.
   * Used for database lookups and availability checking.
   * Optional for backward compatibility - existing reservations without assignments remain valid.
   */
  assignedTableId?: string;

  /**
   * Table number for customer display (e.g., "Table 5").
   * Denormalized from Table.number for faster rendering in UI.
   * Optional for backward compatibility.
   */
  assignedTableNumber?: number;

  /**
   * Reservation duration in minutes, calculated from AppSettings.tableOccupation.
   * Determined by service period (breakfast: 45min, lunch: 60min, dinner: 90min).
   * Defaults to 90 minutes if tableOccupation not configured.
   * Stored at creation time - does not change if settings are updated later.
   * Optional for backward compatibility - existing reservations use 90min default.
   */
  duration?: number;
}

export interface ServicePeriod {
  id: string;
  name: string; // 'Lunch', 'Dinner'
  daysOfWeek: number[]; // [1,2,3,4,5] = Mon-Fri
  startTime: string; // '12:00'
  endTime: string; // '15:00'
  turnTime: number; // minutes per table (e.g., 90)
  slotInterval: number; // booking slots every X minutes (e.g., 30)
  maxReservationsPerSlot: number;
}

// --- ANALYTICS TYPES (Phase 3) ---

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
  }[];
  revenueByHour: {
    hour: number;
    revenue: number;
  }[];
  orderTypeBreakdown: {
    type: 'takeaway' | 'dine-in' | 'delivery';
    count: number;
    revenue: number;
  }[];
}

export interface VisitorMetrics {
  totalCustomers: number; // sum of guestCount for dine-in
  totalOrders: number;
  averagePartySize: number;
  peakHours: {
    hour: number;
    customerCount: number;
  }[];
  repeatCustomerRate: number; // % of customers who ordered 2+ times
  tableOccupancyRate?: number; // for table module users
}

// --- PAYMENT TYPES (Phase 4) ---

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  clientSecret?: string; // For Stripe
  metadata: Record<string, any>;
}
