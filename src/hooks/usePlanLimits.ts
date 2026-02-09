/**
 * usePlanLimits Hook
 *
 * Phase 1C: Plan Enforcement
 * Combines useBilling() + useTenant() to provide usage status
 * with soft-limit warnings.
 */

import { useBilling } from '../../contexts/BillingContext';
import { useTenant } from '../../contexts/TenantContext';
import { PlanFeatures, USAGE_WARNING_THRESHOLD, USAGE_LIMIT_THRESHOLD } from '../config/billing';

export interface UsageStatus {
  current: number;
  limit: number;
  percentage: number;
  isWarning: boolean;
  isAtLimit: boolean;
  isUnlimited: boolean;
}

interface PlanLimitsResult {
  orders: UsageStatus;
  staff: UsageStatus;
  hasFeature: (feature: keyof PlanFeatures) => boolean;
  planName: string;
  isTrialing: boolean;
  canUpgrade: boolean;
}

function computeUsage(current: number, limit: number): UsageStatus {
  const isUnlimited = limit === 0;
  const percentage = isUnlimited ? 0 : limit > 0 ? current / limit : 0;
  return {
    current,
    limit,
    percentage,
    isWarning: !isUnlimited && percentage >= USAGE_WARNING_THRESHOLD,
    isAtLimit: !isUnlimited && percentage >= USAGE_LIMIT_THRESHOLD,
    isUnlimited,
  };
}

export function usePlanLimits(): PlanLimitsResult {
  const { planDefinition, hasFeature, isTrialing, canUpgrade } = useBilling();
  const { tenant } = useTenant();

  const totalOrders = tenant?.usageMetrics?.totalOrders ?? 0;
  const totalStaff = tenant?.usageMetrics?.totalStaff ?? 0;

  return {
    orders: computeUsage(totalOrders, planDefinition.limits.ordersPerMonth),
    staff: computeUsage(totalStaff, planDefinition.limits.staffAccounts),
    hasFeature,
    planName: planDefinition.name,
    isTrialing,
    canUpgrade,
  };
}
