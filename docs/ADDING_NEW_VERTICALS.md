# Adding New Verticals to the Platform

This guide explains how to add support for a new business vertical (e.g., auto-shop, salon, hotel, retail) to the multi-vertical platform.

## Overview

The platform uses a **vertical abstraction system** that allows a single codebase to support multiple business types. Each vertical has:

- **Custom terminology** (e.g., "dish" for restaurants vs "service" for auto-shops)
- **Vertical-specific features** (e.g., table management for restaurants vs appointment scheduling for salons)
- **Custom workflows** (e.g., seat → order → serve for restaurants)
- **Sample data templates** for tenant initialization
- **Database compatibility layer** for gradual migration

## Step-by-Step Guide

### 1. Define Vertical Configuration

Create a configuration file in `src/config/verticals/`.

**Example: `src/config/verticals/auto-shop.config.ts`**

```typescript
import { VerticalConfig } from '../../types/vertical.types';

export const autoShopConfig: VerticalConfig = {
  id: 'auto-shop',
  name: 'Auto Shop & Mechanic',
  description: 'Auto repair shops, mechanics, tire shops, car washes',
  icon: 'wrench',

  // Define vertical-specific terminology
  terminology: {
    item: 'service',
    itemPlural: 'services',
    itemGroup: 'category',
    itemGroupPlural: 'categories',
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

  // Define which features are available for this vertical
  features: {
    hasInventory: true,
    inventoryTracking: 'advanced',  // Track parts and supplies
    hasScheduling: true,
    schedulingType: 'appointments',
    hasInspections: true,           // Required for auto shops
    inspectionWorkflow: true,
    requiresDeposit: false,
    allowsTipping: false,
    hasLoyaltyProgram: true,
    loyaltyType: 'visits',
    hasTableManagement: false,
    hasKitchenDisplay: false,
    hasDelivery: false,
    requiresRelationalData: true,   // Track vehicle history
  },

  // Define the typical workflow steps
  workflows: [
    {
      id: 'intake',
      name: 'Vehicle Intake',
      icon: 'clipboard-check',
      requiredFields: ['vehicleInfo', 'customerConcerns']
    },
    {
      id: 'inspect',
      name: 'Inspection',
      icon: 'search'
    },
    {
      id: 'quote',
      name: 'Create Quote',
      icon: 'file-text',
      requiredFields: ['laborHours', 'parts']
    },
    {
      id: 'approve',
      name: 'Customer Approval',
      icon: 'check-circle'
    },
    {
      id: 'repair',
      name: 'Perform Repair',
      icon: 'wrench'
    },
    {
      id: 'checkout',
      name: 'Checkout',
      icon: 'credit-card',
      requiredFields: ['paymentMethod']
    },
  ],

  // Default settings for new auto-shop tenants
  defaultSettings: {
    currency: 'USD',
    taxRate: 0.08,
    laborRatePerHour: 120,
    enableAppointments: true,
    appointmentDuration: 60, // minutes
    operatingHours: {
      monday: { open: '08:00', close: '18:00', isClosed: false },
      tuesday: { open: '08:00', close: '18:00', isClosed: false },
      wednesday: { open: '08:00', close: '18:00', isClosed: false },
      thursday: { open: '08:00', close: '18:00', isClosed: false },
      friday: { open: '08:00', close: '18:00', isClosed: false },
      saturday: { open: '09:00', close: '15:00', isClosed: false },
      sunday: { open: null, close: null, isClosed: true },
    },
  },

  // Map to legacy/current collection names
  collections: {
    items: 'services',          // Services are like products
    itemGroups: 'categories',
    transactions: 'workOrders', // Work orders are like orders
    locations: 'bays',          // Bays are like tables
  },
};
```

### 2. Register Vertical in Registry

Update `src/config/verticals/index.ts`:

```typescript
import { autoShopConfig } from './auto-shop.config';

const verticalRegistry: Record<VerticalType, VerticalConfig> = {
  restaurant: restaurantConfig,
  'auto-shop': autoShopConfig,  // Add your new vertical
  salon: salonConfig,
  hotel: hotelConfig,
  retail: retailConfig,
};
```

### 3. Create Tenant Template

Add sample data in `src/services/VerticalTemplateService.ts`:

```typescript
export const autoShopTemplate: VerticalTemplate = {
  verticalType: 'auto-shop',

  sampleCategories: [
    {
      name: 'Oil Changes',
      description: 'Oil change and fluid services',
      icon: '🛢️',
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Brakes',
      description: 'Brake inspection and repair',
      icon: '🛑',
      sortOrder: 2,
      isActive: true,
    },
    // ... more categories
  ],

  sampleItems: [
    {
      name: 'Full Synthetic Oil Change',
      description: 'Includes oil filter replacement',
      category: 'Oil Changes',
      price: 79.99,
      cost: 25.00,
      laborHours: 0.5,
      isAvailable: true,
      tags: ['maintenance', 'popular'],
    },
    // ... more services
  ],

  sampleLocations: [
    { name: 'Bay 1', zone: 'Service Area', capacity: 1, isActive: true },
    { name: 'Bay 2', zone: 'Service Area', capacity: 1, isActive: true },
    { name: 'Lift 1', zone: 'Heavy Duty', capacity: 1, isActive: true },
  ],

  defaultSettings: autoShopConfig.defaultSettings,
};

// Register template
const templateRegistry: Record<VerticalType, VerticalTemplate | null> = {
  restaurant: restaurantTemplate,
  'auto-shop': autoShopTemplate,  // Add your template
  // ...
};
```

### 4. Update Type Definitions

Ensure your vertical type is included in `src/types/vertical.types.ts`:

```typescript
export type VerticalType =
  | 'restaurant'
  | 'auto-shop'  // Already included
  | 'salon'
  | 'hotel'
  | 'retail';
```

### 5. Update UI Components (Optional)

For vertical-specific UI components, use the `useVertical()` hook:

```typescript
import { useVertical, useTerminology } from '@/contexts/VerticalContext';

function ServiceManager() {
  const terminology = useTerminology();
  const { features, isVertical } = useVertical();

  return (
    <div>
      <h2>Manage {terminology.itemPlural}</h2>

      {/* Conditional rendering based on features */}
      {features.hasInspections && (
        <InspectionModule />
      )}

      {/* Conditional rendering based on vertical */}
      {isVertical('auto-shop') && (
        <VehicleHistoryModule />
      )}
    </div>
  );
}
```

### 6. Test Your Vertical

1. **Create a test tenant:**
   - Go to Super Admin portal
   - Create a new tenant
   - Select your new vertical type

2. **Verify terminology:**
   - Check that UI labels use correct terminology
   - Confirm sample data is created

3. **Test workflows:**
   - Ensure vertical-specific workflows work
   - Test feature flags

4. **Database compatibility:**
   - Verify data writes to correct collections
   - Check CollectionMapper handles your vertical

## Key Concepts

### Terminology System

The terminology system allows dynamic UI labels:

```typescript
// Restaurant tenant sees:
"Manage Dishes"
"Add Dish"

// Auto-shop tenant sees:
"Manage Services"
"Add Service"
```

### Feature Flags

Features control which modules are available:

```typescript
{
  hasInventory: true,        // Show inventory management
  hasScheduling: true,       // Show appointment booking
  hasInspections: true,      // Show inspection workflow
  hasTableManagement: false, // Hide table management
}
```

### Database Compatibility

The CollectionMapper ensures backward compatibility:

- **READ**: Always from legacy collection (e.g., 'services')
- **WRITE**: Dual-write to both legacy and standardized collections
- **Benefit**: Zero-downtime migration

```typescript
const mapper = createCollectionMapper(tenantId, 'auto-shop');

// Reads from 'services' collection
const services = await mapper.getDocuments('items');

// Writes to both 'services' and 'items' collections
await mapper.addDocument('items', serviceData);
```

## Checklist

- [ ] Create vertical config file (`src/config/verticals/[vertical].config.ts`)
- [ ] Define terminology for your vertical
- [ ] Configure features and capabilities
- [ ] Define workflow steps
- [ ] Set default settings
- [ ] Map collection names
- [ ] Register in vertical registry
- [ ] Create tenant template with sample data
- [ ] Update template registry
- [ ] Test tenant creation
- [ ] Verify UI terminology
- [ ] Test workflows
- [ ] Verify database compatibility

## Examples

### Complete Vertical Examples

1. **Restaurant** (fully implemented): `src/config/verticals/restaurant.config.ts`
2. **Auto-shop** (placeholder): `src/config/verticals/index.ts`
3. **Salon** (placeholder): `src/config/verticals/index.ts`

### Using Vertical Context in Components

```typescript
// Get all vertical configuration
const { config, terminology, features, isVertical, hasFeature } = useVertical();

// Get just terminology
const terminology = useTerminology();

// Get just features
const features = useVerticalFeatures();

// Check vertical type
if (isVertical('auto-shop')) {
  // Auto-shop specific logic
}

// Check feature availability
if (hasFeature('hasInspections')) {
  // Show inspection module
}
```

## Best Practices

1. **Start with configuration**: Define terminology and features before writing code
2. **Use terminology consistently**: Never hardcode business-specific terms
3. **Feature flags over conditionals**: Use features object instead of vertical checks
4. **Progressive enhancement**: Build core features first, add vertical-specific features later
5. **Test with multiple verticals**: Ensure changes work across all verticals
6. **Document vertical decisions**: Explain why features are enabled/disabled

## Troubleshooting

### Terminology not updating
- Ensure VerticalProvider wraps your component tree
- Check that vertical type is set on tenant
- Verify useTerminology() is called inside component

### Sample data not created
- Check template is registered in templateRegistry
- Verify tenant initialization calls VerticalTemplateService
- Confirm collection names in vertical config

### Database writes failing
- Ensure CollectionMapper is used for all database operations
- Check collection mapping in vertical config
- Verify tenant has verticalType field

## Additional Resources

- [VerticalContext API](/src/contexts/VerticalContext.tsx)
- [CollectionMapper API](/src/services/CollectionMapper.ts)
- [VerticalTemplateService API](/src/services/VerticalTemplateService.ts)
- [Vertical Types Reference](/src/types/vertical.types.ts)

## Support

For questions or issues:
1. Check existing vertical configurations as examples
2. Review VerticalContext implementation
3. Test with restaurant vertical (reference implementation)
4. Consult team documentation or ask for help
