import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { VerticalType } from '../../types';
import { getVerticalConfig } from '../config/verticals';

/**
 * VerticalTemplateService
 *
 * Initializes new tenants with vertical-specific templates and default data.
 *
 * Each vertical gets:
 * - Sample items/products/services
 * - Default categories/groups
 * - Sample workflow templates
 * - Default settings and configuration
 */

export interface TenantInitializationOptions {
  tenantId: string;
  verticalType: VerticalType;
  skipSampleData?: boolean; // If true, only create structure, no sample data
}

export interface VerticalTemplate {
  verticalType: VerticalType;
  sampleItems?: any[];
  sampleCategories?: any[];
  sampleLocations?: any[];
  defaultSettings?: any;
  workflowTemplates?: any[];
}

/**
 * Restaurant Vertical Template
 */
export const restaurantTemplate: VerticalTemplate = {
  verticalType: 'restaurant',

  sampleCategories: [
    {
      name: 'Beverages',
      description: 'Hot and cold drinks',
      icon: '☕',
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Appetizers',
      description: 'Starters and small plates',
      icon: '🥗',
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Main Courses',
      description: 'Entrees and main dishes',
      icon: '🍽️',
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Desserts',
      description: 'Sweet treats',
      icon: '🍰',
      sortOrder: 4,
      isActive: true,
    },
  ],

  sampleItems: [
    {
      name: 'Espresso',
      description: 'Rich, bold coffee shot',
      category: 'Beverages',
      price: 3.50,
      cost: 0.50,
      isAvailable: true,
      preparationTime: 2,
      tags: ['coffee', 'hot'],
    },
    {
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      category: 'Beverages',
      price: 4.50,
      cost: 0.75,
      isAvailable: true,
      preparationTime: 3,
      tags: ['coffee', 'hot', 'popular'],
    },
    {
      name: 'Caesar Salad',
      description: 'Crisp romaine, parmesan, croutons, Caesar dressing',
      category: 'Appetizers',
      price: 8.95,
      cost: 2.50,
      isAvailable: true,
      preparationTime: 5,
      tags: ['salad', 'vegetarian'],
    },
  ],

  sampleLocations: [
    { name: 'Table 1', zone: 'Main Dining', capacity: 2, isActive: true },
    { name: 'Table 2', zone: 'Main Dining', capacity: 4, isActive: true },
    { name: 'Table 3', zone: 'Main Dining', capacity: 4, isActive: true },
    { name: 'Table 4', zone: 'Patio', capacity: 2, isActive: true },
    { name: 'Bar 1', zone: 'Bar', capacity: 1, isActive: true },
    { name: 'Bar 2', zone: 'Bar', capacity: 1, isActive: true },
  ],

  defaultSettings: {
    currency: 'USD',
    taxRate: 0.0825,
    tipSuggestions: [15, 18, 20, 25],
    defaultTip: 18,
    enableTipping: true,
    enableTableService: true,
    enableReservations: true,
    enableDelivery: false,
    operatingHours: {
      monday: { open: '08:00', close: '20:00', isClosed: false },
      tuesday: { open: '08:00', close: '20:00', isClosed: false },
      wednesday: { open: '08:00', close: '20:00', isClosed: false },
      thursday: { open: '08:00', close: '20:00', isClosed: false },
      friday: { open: '08:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '22:00', isClosed: false },
      sunday: { open: '09:00', close: '18:00', isClosed: false },
    },
  },
};

/**
 * Template Registry
 */
const templateRegistry: Record<VerticalType, VerticalTemplate | null> = {
  restaurant: restaurantTemplate,
  'auto-shop': null, // TODO: Implement in future phase
  salon: null,       // TODO: Implement in future phase
  hotel: null,       // TODO: Implement in future phase
  retail: null,      // TODO: Implement in future phase
};

/**
 * VerticalTemplateService
 */
export class VerticalTemplateService {
  /**
   * Initialize a new tenant with vertical-specific template
   */
  static async initializeTenant(options: TenantInitializationOptions): Promise<void> {
    const { tenantId, verticalType, skipSampleData = false } = options;

    console.log(`🎨 Initializing tenant ${tenantId} with ${verticalType} template...`);

    const template = templateRegistry[verticalType];
    const verticalConfig = getVerticalConfig(verticalType);

    if (!template) {
      console.warn(`No template found for vertical: ${verticalType}. Skipping initialization.`);
      return;
    }

    const batch = writeBatch(db);

    try {
      // 1. Create tenant settings document
      if (template.defaultSettings) {
        const settingsRef = doc(db, `tenants/${tenantId}/settings/general`);
        batch.set(settingsRef, {
          ...template.defaultSettings,
          verticalType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (!skipSampleData) {
        // 2. Create sample categories/groups
        if (template.sampleCategories && template.sampleCategories.length > 0) {
          const categoryCollection = verticalConfig.collections?.itemGroups || 'categories';

          template.sampleCategories.forEach((category, index) => {
            const categoryRef = doc(collection(db, `tenants/${tenantId}/${categoryCollection}`));
            batch.set(categoryRef, {
              ...category,
              _isSampleData: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        }

        // 3. Create sample items/products/services
        if (template.sampleItems && template.sampleItems.length > 0) {
          const itemCollection = verticalConfig.collections?.items || 'items';

          template.sampleItems.forEach((item, index) => {
            const itemRef = doc(collection(db, `tenants/${tenantId}/${itemCollection}`));
            batch.set(itemRef, {
              ...item,
              _isSampleData: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        }

        // 4. Create sample locations (tables, bays, stations, etc.)
        if (template.sampleLocations && template.sampleLocations.length > 0) {
          const locationCollection = verticalConfig.collections?.locations || 'locations';

          template.sampleLocations.forEach((location, index) => {
            const locationRef = doc(collection(db, `tenants/${tenantId}/${locationCollection}`));
            batch.set(locationRef, {
              ...location,
              _isSampleData: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
        }
      }

      // Commit all changes in a single batch
      await batch.commit();

      console.log(`✅ Successfully initialized ${tenantId} with ${verticalType} template`);
    } catch (error) {
      console.error(`❌ Error initializing tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get available template for a vertical
   */
  static getTemplate(verticalType: VerticalType): VerticalTemplate | null {
    return templateRegistry[verticalType];
  }

  /**
   * Check if a vertical has a template available
   */
  static hasTemplate(verticalType: VerticalType): boolean {
    return templateRegistry[verticalType] !== null;
  }

  /**
   * Clear all sample data from a tenant
   * Useful for tenants who want to start fresh after exploring
   */
  static async clearSampleData(tenantId: string, verticalType: VerticalType): Promise<void> {
    console.log(`🧹 Clearing sample data for tenant ${tenantId}...`);

    const verticalConfig = getVerticalConfig(verticalType);
    const collections = [
      verticalConfig.collections?.items || 'items',
      verticalConfig.collections?.itemGroups || 'categories',
      verticalConfig.collections?.locations || 'locations',
    ];

    // Note: In production, this should use a cloud function with pagination
    // to handle large datasets. This is a simplified version.
    console.warn('⚠️ clearSampleData should be implemented as a cloud function for production use');

    // For now, we'll just log what would be done
    console.log(`Would clear sample data from collections: ${collections.join(', ')}`);
  }
}
