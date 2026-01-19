/**
 * Stripe Provider Component
 *
 * Phase 4A: Wraps payment components with Stripe Elements context.
 * Uses tenant's publishable key from settings.
 */

import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useTenant } from '../../contexts/TenantContext';

interface StripeProviderProps {
  children: React.ReactNode;
  publishableKey?: string; // Optional override
}

// Cache Stripe instances by publishable key
const stripeCache: { [key: string]: Promise<Stripe | null> } = {};

/**
 * Get or create a Stripe instance for the given publishable key
 */
const getStripeInstance = (publishableKey: string): Promise<Stripe | null> => {
  if (!stripeCache[publishableKey]) {
    stripeCache[publishableKey] = loadStripe(publishableKey);
  }
  return stripeCache[publishableKey];
};

/**
 * StripeProvider Component
 *
 * Loads Stripe with tenant-specific publishable key and provides
 * Elements context to child components.
 */
export const StripeProvider: React.FC<StripeProviderProps> = ({
  children,
  publishableKey: propKey,
}) => {
  const { tenant } = useTenant();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get publishable key from props, tenant settings, or environment
  const publishableKey = propKey ||
    tenant?.paymentGateway?.config?.publishableKey ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!publishableKey) {
      setError('Stripe is not configured. Please contact the administrator.');
      setLoading(false);
      return;
    }

    // Validate key format (starts with pk_)
    if (!publishableKey.startsWith('pk_')) {
      setError('Invalid Stripe configuration.');
      setLoading(false);
      return;
    }

    try {
      const promise = getStripeInstance(publishableKey);
      setStripePromise(promise);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to initialize payment system.');
      setLoading(false);
    }
  }, [publishableKey]);

  // Show loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
          Loading payment system...
        </span>
      </div>
    );
  }

  // Show error state
  if (error || !stripePromise) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#991b1b',
        fontSize: '14px',
      }}>
        {error || 'Payment system unavailable'}
      </div>
    );
  }

  // Stripe Elements appearance customization
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#4a4e69',
      colorBackground: '#ffffff',
      colorText: '#22223b',
      colorDanger: '#e63946',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Input': {
        border: '1px solid #dedede',
        boxShadow: 'none',
        padding: '12px',
      },
      '.Input:focus': {
        borderColor: '#4a4e69',
        boxShadow: '0 0 0 2px rgba(74, 78, 105, 0.1)',
      },
      '.Label': {
        fontWeight: '600',
        marginBottom: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={{ appearance }}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
