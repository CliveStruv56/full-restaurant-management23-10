/**
 * Billing Configuration
 *
 * Phase 1A: Stripe Foundation
 * Plan definitions, feature matrices, and billing helpers.
 *
 * Stripe Price IDs must be set after creating Products in Stripe Dashboard.
 * Replace the placeholder values below with real IDs from your Stripe account.
 */

// ============================================================================
// TYPES
// ============================================================================

export type BillingPlan = 'starter' | 'growth' | 'professional' | 'enterprise';

export interface PlanPricing {
  monthly: number;  // Price in pence per month
  annual: number;   // Price in pence per month (when paid annually)
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
}

export interface PlanLimits {
  ordersPerMonth: number;  // 0 = unlimited
  staffAccounts: number;   // 0 = unlimited
}

export interface PlanFeatures {
  tableManagement: boolean;
  kds: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  reservations: boolean;
  analytics: boolean;
  landingPage: boolean;
  qrCodes: boolean;
  delivery: boolean;
}

export interface PlanDefinition {
  id: BillingPlan;
  name: string;
  description: string;
  pricing: PlanPricing;
  limits: PlanLimits;
  features: PlanFeatures;
  isCustom?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRIAL_DURATION_DAYS = 14;
export const USAGE_WARNING_THRESHOLD = 0.8;
export const USAGE_LIMIT_THRESHOLD = 1.0;

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

/**
 * Replace Stripe Price IDs with real values from your Stripe Dashboard.
 * Create Products: "VBP Growth" and "VBP Professional" with monthly + annual prices.
 */
export const BILLING_PLANS: Record<BillingPlan, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Free forever for small businesses',
    pricing: {
      monthly: 0,
      annual: 0,
      stripePriceIdMonthly: '',
      stripePriceIdAnnual: '',
    },
    limits: {
      ordersPerMonth: 50,
      staffAccounts: 2,
    },
    features: {
      tableManagement: false,
      kds: false,
      customBranding: false,
      apiAccess: false,
      reservations: false,
      analytics: true,
      landingPage: true,
      qrCodes: true,
      delivery: false,
    },
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses',
    pricing: {
      monthly: 4900,   // £49/mo
      annual: 4158,    // £41.58/mo billed annually (£499/yr)
      stripePriceIdMonthly: 'price_1SzJtQEnRK6RTEY32XPckOl6',
      stripePriceIdAnnual: 'price_1SzJuLEnRK6RTEY3pf29FTR1',
    },
    limits: {
      ordersPerMonth: 500,
      staffAccounts: 10,
    },
    features: {
      tableManagement: true,
      kds: true,
      customBranding: false,
      apiAccess: false,
      reservations: true,
      analytics: true,
      landingPage: true,
      qrCodes: true,
      delivery: true,
    },
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For established businesses',
    pricing: {
      monthly: 14900,  // £149/mo
      annual: 11658,   // £116.58/mo billed annually (£1,399/yr)
      stripePriceIdMonthly: 'price_1SzJzlEnRK6RTEY3E3Xka3S5',
      stripePriceIdAnnual: 'price_1SzK0DEnRK6RTEY30ybE7pay',
    },
    limits: {
      ordersPerMonth: 0,  // Unlimited
      staffAccounts: 0,   // Unlimited
    },
    features: {
      tableManagement: true,
      kds: true,
      customBranding: true,
      apiAccess: true,
      reservations: true,
      analytics: true,
      landingPage: true,
      qrCodes: true,
      delivery: true,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom pricing for large organisations',
    pricing: {
      monthly: 0,
      annual: 0,
      stripePriceIdMonthly: '',
      stripePriceIdAnnual: '',
    },
    limits: {
      ordersPerMonth: 0,  // Unlimited
      staffAccounts: 0,   // Unlimited
    },
    features: {
      tableManagement: true,
      kds: true,
      customBranding: true,
      apiAccess: true,
      reservations: true,
      analytics: true,
      landingPage: true,
      qrCodes: true,
      delivery: true,
    },
    isCustom: true,
  },
};

// Trial grants Growth-level features
export const TRIAL_PLAN_ID: BillingPlan = 'growth';

// ============================================================================
// HELPERS
// ============================================================================

export function getPlanDefinition(plan: BillingPlan): PlanDefinition {
  return BILLING_PLANS[plan];
}

export function planHasFeature(plan: BillingPlan, feature: keyof PlanFeatures): boolean {
  return BILLING_PLANS[plan].features[feature];
}

/**
 * Get the Stripe Price ID for a plan + interval combination.
 */
export function getStripePriceId(plan: BillingPlan, interval: 'monthly' | 'annual'): string {
  const def = BILLING_PLANS[plan];
  return interval === 'annual' ? def.pricing.stripePriceIdAnnual : def.pricing.stripePriceIdMonthly;
}

/**
 * Plans available for self-service upgrade (excludes enterprise).
 */
export function getUpgradeablePlans(): PlanDefinition[] {
  return [BILLING_PLANS.growth, BILLING_PLANS.professional];
}
