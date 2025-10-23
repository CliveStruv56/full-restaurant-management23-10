import type { Dispatch, SetStateAction } from 'react';

// --- AUTH & USER TYPES ---

export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  loyaltyPoints: number;
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
  items: CartItem[];
  total: number;
  status: 'Placed' | 'Preparing' | 'Ready for Collection' | 'Completed';
  collectionTime: string; // ISO 8601 Date String
  orderTime: string;
  rewardApplied?: {
      itemName: string;
      discountAmount: number;
  }
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