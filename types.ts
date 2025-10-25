import type { Dispatch, SetStateAction } from 'react';

// --- AUTH & USER TYPES ---

export type UserRole = 'customer' | 'staff' | 'admin';

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
}

export interface CartItem extends Omit<Product, 'price'> {
  cartItemId: string; // Unique ID for product + options combo
  quantity: number;
  selectedOptions: ProductOption[];
  price: number; // Final price (base + options)
}

export interface Order {
  id: string;
  userId: string;
  customerName: string; // Customer display name for kitchen/admin display
  tenantId: string; // NEW - tenant isolation
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
}

export interface Reservation {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: number;
  dateTime: string; // ISO 8601
  duration: number; // minutes
  tableIds: string[]; // assigned tables
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  depositPaid?: boolean;
  depositAmount?: number;
  specialRequests?: string;
  createdAt: string;
  notes?: string; // admin notes
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
