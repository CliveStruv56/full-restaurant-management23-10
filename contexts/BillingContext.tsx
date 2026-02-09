/**
 * Billing Context
 *
 * Phase 1A: Stripe Foundation
 * Derives billing state from TenantContext — no extra Firestore queries.
 *
 * During trial (not expired): hasFeature() checks against Growth-level features.
 * After trial expired: falls back to Starter features.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useTenant } from './TenantContext';
import {
  BillingPlan,
  PlanDefinition,
  PlanFeatures,
  BILLING_PLANS,
  TRIAL_PLAN_ID,
  TRIAL_DURATION_DAYS,
  getPlanDefinition,
} from '../src/config/billing';

// ============================================================================
// TYPES
// ============================================================================

interface BillingContextValue {
  /** Current plan ID (derived from subscription data) */
  plan: BillingPlan | 'trial';
  /** Full plan definition for the effective plan */
  planDefinition: PlanDefinition;
  /** Whether the tenant is currently in a trial */
  isTrialing: boolean;
  /** Days remaining in trial (0 if not trialing or expired) */
  trialDaysRemaining: number;
  /** Whether the trial has expired */
  trialExpired: boolean;
  /** Stripe Customer ID if set */
  stripeCustomerId: string | undefined;
  /** Check if the current effective plan has a specific feature */
  hasFeature: (feature: keyof PlanFeatures) => boolean;
  /** Whether the tenant can upgrade (i.e., not on Professional/Enterprise) */
  canUpgrade: boolean;
  /** The effective billing plan used for feature checks */
  effectivePlan: BillingPlan;
}

// ============================================================================
// CONTEXT
// ============================================================================

const BillingContext = createContext<BillingContextValue | undefined>(undefined);

// ============================================================================
// HELPERS
// ============================================================================

function computeTrialDaysRemaining(trialEndsAt: string | undefined): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const remaining = Math.ceil((end - now) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

function resolveEffectivePlan(
  plan: string | undefined,
  trialExpired: boolean
): BillingPlan {
  if (!plan || plan === 'trial') {
    return trialExpired ? 'starter' : TRIAL_PLAN_ID;
  }
  if (plan in BILLING_PLANS) {
    return plan as BillingPlan;
  }
  return 'starter';
}

// ============================================================================
// PROVIDER
// ============================================================================

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useTenant();

  const value = useMemo<BillingContextValue>(() => {
    const subscription = tenant?.subscription;
    const rawPlan = subscription?.plan;
    const trialEndsAt = subscription?.trialEndsAt;
    const stripeCustomerId = subscription?.stripeCustomerId;

    const isTrialing = rawPlan === 'trial';
    const trialDaysRemaining = isTrialing ? computeTrialDaysRemaining(trialEndsAt) : 0;
    const trialExpired = isTrialing && trialDaysRemaining === 0;

    const effectivePlan = resolveEffectivePlan(rawPlan, trialExpired);
    const planDefinition = getPlanDefinition(effectivePlan);

    const canUpgrade =
      effectivePlan === 'starter' ||
      effectivePlan === 'growth' ||
      isTrialing;

    return {
      plan: isTrialing ? 'trial' : effectivePlan,
      planDefinition,
      isTrialing,
      trialDaysRemaining,
      trialExpired,
      stripeCustomerId,
      hasFeature: (feature: keyof PlanFeatures) => planDefinition.features[feature],
      canUpgrade,
      effectivePlan,
    };
  }, [tenant?.subscription]);

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Access billing state derived from tenant subscription.
 *
 * @example
 * const { isTrialing, trialDaysRemaining, hasFeature, canUpgrade } = useBilling();
 * if (!hasFeature('tableManagement')) { showUpgradePrompt(); }
 */
export const useBilling = (): BillingContextValue => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
