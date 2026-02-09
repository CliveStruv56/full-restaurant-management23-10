/**
 * Server-side Billing Configuration for Cloud Functions
 *
 * Phase 1B: Billing Management
 * Cloud Functions can't import from src/config/ (different tsconfig/build).
 * This is a minimal server-side copy of plan limits and constants.
 */

export type BillingPlan = 'starter' | 'growth' | 'professional' | 'enterprise';

export const TRIAL_DURATION_DAYS = 14;

export interface PlanLimits {
  ordersPerMonth: number;  // 0 = unlimited
  staffAccounts: number;   // 0 = unlimited
}

export interface PlanModules {
  tableManagement: boolean;
  kds: boolean;
  delivery: boolean;
  reservations: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  starter: { ordersPerMonth: 50, staffAccounts: 2 },
  growth: { ordersPerMonth: 500, staffAccounts: 10 },
  professional: { ordersPerMonth: 0, staffAccounts: 0 },
  enterprise: { ordersPerMonth: 0, staffAccounts: 0 },
};

export const PLAN_MODULES: Record<BillingPlan, PlanModules> = {
  starter: {
    tableManagement: false,
    kds: false,
    delivery: false,
    reservations: false,
    customBranding: false,
    apiAccess: false,
  },
  growth: {
    tableManagement: true,
    kds: true,
    delivery: true,
    reservations: true,
    customBranding: false,
    apiAccess: false,
  },
  professional: {
    tableManagement: true,
    kds: true,
    delivery: true,
    reservations: true,
    customBranding: true,
    apiAccess: true,
  },
  enterprise: {
    tableManagement: true,
    kds: true,
    delivery: true,
    reservations: true,
    customBranding: true,
    apiAccess: true,
  },
};

/**
 * Get enabled module list for a plan (used when updating tenantMetadata).
 */
export function getEnabledModulesForPlan(plan: BillingPlan): Record<string, boolean> {
  const modules = PLAN_MODULES[plan];
  return {
    base: true,
    tableManagement: modules.tableManagement,
    management: modules.kds,
    delivery: modules.delivery,
  };
}
