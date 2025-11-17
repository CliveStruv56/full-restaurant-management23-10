import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import {
  VerticalType,
  VerticalConfig,
  VerticalTerminology,
  VerticalFeatures,
  VerticalContextValue,
} from '../types/vertical.types';
import { getVerticalConfig } from '../config/verticals';
import { useTenant } from '../../contexts/TenantContext';

/**
 * VerticalContext
 *
 * Provides vertical-specific configuration throughout the app.
 * All components can access terminology, features, and workflows
 * specific to the current tenant's business vertical.
 */

const VerticalContext = createContext<VerticalContextValue | undefined>(undefined);

export interface VerticalProviderProps {
  children: ReactNode;
  verticalType?: VerticalType; // Optional override for testing
}

export const VerticalProvider: React.FC<VerticalProviderProps> = ({
  children,
  verticalType: verticalTypeOverride,
}) => {
  const { tenant } = useTenant();

  // Determine vertical type: override > tenant.verticalType > 'restaurant' (default)
  let verticalType = verticalTypeOverride || tenant?.verticalType || 'restaurant';

  // Validate vertical type - throw error if invalid
  const validVerticalTypes: VerticalType[] = ['restaurant', 'auto-shop', 'salon', 'hotel', 'retail'];
  if (!validVerticalTypes.includes(verticalType as VerticalType)) {
    console.error(`Invalid vertical type: ${verticalType}, falling back to 'restaurant'`);
    verticalType = 'restaurant';
  }

  // Get vertical configuration
  const config = useMemo(() => {
    try {
      return getVerticalConfig(verticalType as VerticalType);
    } catch (error) {
      console.error('Failed to load vertical configuration:', error);
      throw new Error(`Failed to load vertical configuration for type: ${verticalType}`);
    }
  }, [verticalType]);

  // Helper to check if this is a specific vertical
  const isVertical = (type: VerticalType): boolean => {
    return verticalType === type;
  };

  // Helper to check if a feature is enabled
  const hasFeature = (feature: keyof VerticalFeatures): boolean => {
    return config.features[feature] === true;
  };

  const value: VerticalContextValue = {
    config,
    terminology: config.terminology,
    features: config.features,
    isVertical,
    hasFeature,
  };

  return <VerticalContext.Provider value={value}>{children}</VerticalContext.Provider>;
};

/**
 * useVertical Hook
 *
 * Access vertical configuration in any component.
 *
 * Example usage:
 * ```tsx
 * const { terminology, hasFeature, isVertical } = useVertical();
 *
 * return (
 *   <div>
 *     <h1>Manage {terminology.itemPlural}</h1>
 *     {hasFeature('hasInventory') && <InventoryPanel />}
 *     {isVertical('restaurant') && <KitchenDisplay />}
 *   </div>
 * );
 * ```
 */
export const useVertical = (): VerticalContextValue => {
  const context = useContext(VerticalContext);
  if (!context) {
    throw new Error('useVertical must be used within a VerticalProvider');
  }
  return context;
};

/**
 * useTerminology Hook
 *
 * Shorthand hook for accessing just the terminology.
 *
 * Example usage:
 * ```tsx
 * const t = useTerminology();
 * return <h1>Add New {t.item}</h1>;
 * ```
 */
export const useTerminology = (): VerticalTerminology => {
  const { terminology } = useVertical();
  return terminology;
};

/**
 * useVerticalFeatures Hook
 *
 * Shorthand hook for accessing just the features.
 *
 * Example usage:
 * ```tsx
 * const features = useVerticalFeatures();
 * if (!features.hasInventory) return null;
 * ```
 */
export const useVerticalFeatures = (): VerticalFeatures => {
  const { features } = useVertical();
  return features;
};

/**
 * withVertical HOC
 *
 * Higher-order component to inject vertical context into class components.
 *
 * Example usage:
 * ```tsx
 * class MyComponent extends React.Component<Props & { vertical: VerticalContextValue }> {
 *   render() {
 *     const { vertical } = this.props;
 *     return <div>{vertical.terminology.item}</div>;
 *   }
 * }
 * export default withVertical(MyComponent);
 * ```
 */
export function withVertical<P extends { vertical?: VerticalContextValue }>(
  Component: React.ComponentType<P>
) {
  return function VerticalComponent(props: Omit<P, 'vertical'>) {
    const vertical = useVertical();
    return <Component {...(props as P)} vertical={vertical} />;
  };
}
