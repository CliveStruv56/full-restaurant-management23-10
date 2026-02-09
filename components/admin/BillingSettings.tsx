/**
 * Billing Settings Page
 *
 * Phase 1B: Billing Management
 * Admin panel page for plan management, usage overview, and upgrade controls.
 */

import React, { useState } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useTenant } from '../../contexts/TenantContext';
import { createCheckoutSession, createPortalSession } from '../../firebase/billing';
import { BILLING_PLANS, BillingPlan, getUpgradeablePlans } from '../../src/config/billing';
import toast from 'react-hot-toast';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const TrialBanner: React.FC<{ daysRemaining: number; expired: boolean }> = ({
  daysRemaining,
  expired,
}) => {
  if (expired) {
    return (
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        marginBottom: '20px',
      }}>
        <p style={{ margin: 0, color: '#991b1b', fontWeight: 600, fontSize: '0.95rem' }}>
          Your free trial has expired
        </p>
        <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: '0.85rem' }}>
          You&apos;re now on the Starter plan. Upgrade to unlock more features.
        </p>
      </div>
    );
  }

  const urgencyColor = daysRemaining <= 3 ? '#dc2626' : daysRemaining <= 7 ? '#d97706' : '#2563eb';

  return (
    <div style={{
      padding: '16px 20px',
      backgroundColor: daysRemaining <= 3 ? '#fef2f2' : daysRemaining <= 7 ? '#fffbeb' : '#eff6ff',
      border: `1px solid ${daysRemaining <= 3 ? '#fecaca' : daysRemaining <= 7 ? '#fde68a' : '#bfdbfe'}`,
      borderRadius: '12px',
      marginBottom: '20px',
    }}>
      <p style={{ margin: 0, color: urgencyColor, fontWeight: 600, fontSize: '0.95rem' }}>
        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your free trial
      </p>
      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
        You have access to Growth-level features during your trial. Upgrade to keep them.
      </p>
    </div>
  );
};

const UsageMeter: React.FC<{
  label: string;
  current: number;
  limit: number;
}> = ({ label, current, limit }) => {
  const isUnlimited = limit === 0;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isWarning = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  const barColor = isAtLimit ? '#dc2626' : isWarning ? '#d97706' : '#2563eb';

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          {current} / {isUnlimited ? 'Unlimited' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div style={{
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  );
};

const PlanCard: React.FC<{
  plan: BillingPlan;
  isCurrentPlan: boolean;
  billingInterval: 'monthly' | 'annual';
  onUpgrade: (plan: BillingPlan) => void;
  loading: boolean;
}> = ({ plan, isCurrentPlan, billingInterval, onUpgrade, loading }) => {
  const def = BILLING_PLANS[plan];
  const price = billingInterval === 'annual' ? def.pricing.annual : def.pricing.monthly;

  return (
    <div style={{
      padding: '20px',
      border: isCurrentPlan ? '2px solid #2563eb' : '1px solid #e5e7eb',
      borderRadius: '12px',
      backgroundColor: isCurrentPlan ? '#eff6ff' : '#ffffff',
      flex: 1,
      minWidth: '200px',
    }}>
      <h4 style={{ margin: '0 0 4px', color: '#111827', fontSize: '1.1rem' }}>
        {def.name}
      </h4>
      <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '0.8rem' }}>
        {def.description}
      </p>
      {price > 0 ? (
        <p style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          &pound;{(price / 100).toFixed(0)}
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#6b7280' }}>/mo</span>
        </p>
      ) : def.isCustom ? (
        <p style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 600, color: '#6b7280' }}>
          Contact us
        </p>
      ) : (
        <p style={{ margin: '0 0 16px', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          Free
        </p>
      )}
      <ul style={{ padding: '0 0 0 16px', margin: '0 0 16px', fontSize: '0.8rem', color: '#374151' }}>
        <li style={{ marginBottom: '4px' }}>
          {def.limits.ordersPerMonth === 0 ? 'Unlimited' : def.limits.ordersPerMonth} orders/mo
        </li>
        <li style={{ marginBottom: '4px' }}>
          {def.limits.staffAccounts === 0 ? 'Unlimited' : def.limits.staffAccounts} staff accounts
        </li>
        {def.features.tableManagement && <li style={{ marginBottom: '4px' }}>Table Management</li>}
        {def.features.kds && <li style={{ marginBottom: '4px' }}>Kitchen Display</li>}
        {def.features.customBranding && <li style={{ marginBottom: '4px' }}>Custom Branding</li>}
        {def.features.apiAccess && <li style={{ marginBottom: '4px' }}>API Access</li>}
      </ul>
      {isCurrentPlan ? (
        <button
          disabled
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#e5e7eb',
            color: '#6b7280',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'default',
          }}
        >
          Current Plan
        </button>
      ) : !def.isCustom && price > 0 ? (
        <button
          onClick={() => onUpgrade(plan)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Upgrade'}
        </button>
      ) : def.isCustom ? (
        <button
          onClick={() => window.open('mailto:hello@vbp.solutions?subject=Enterprise%20Plan', '_blank')}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Contact Sales
        </button>
      ) : null}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BillingSettings: React.FC = () => {
  const { plan, planDefinition, isTrialing, trialDaysRemaining, trialExpired, canUpgrade, effectivePlan } = useBilling();
  const { tenant } = useTenant();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const totalOrders = tenant?.usageMetrics?.totalOrders ?? 0;
  const totalStaff = tenant?.usageMetrics?.totalStaff ?? 0;

  const handleUpgrade = async (targetPlan: BillingPlan) => {
    setCheckoutLoading(true);
    try {
      const result = await createCheckoutSession(targetPlan, billingInterval);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to start checkout');
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to open billing portal');
      }
    } catch {
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>
        Billing &amp; Plan
      </h2>

      {/* Trial Banner */}
      {isTrialing && (
        <TrialBanner daysRemaining={trialDaysRemaining} expired={trialExpired} />
      )}

      {/* Current Plan */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
      }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.1rem', color: '#111827' }}>
          Current Plan: {isTrialing ? 'Free Trial' : planDefinition.name}
        </h3>
        {!isTrialing && tenant?.subscription?.billingInterval && (
          <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#6b7280' }}>
            Billing: {tenant.subscription.billingInterval === 'annual' ? 'Annual' : 'Monthly'}
          </p>
        )}
        {!isTrialing && tenant?.subscription?.currentPeriodEnd && (
          <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#6b7280' }}>
            Next billing date: {new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
        {tenant?.subscription?.cancelAtPeriodEnd && (
          <p style={{ margin: '0', fontSize: '0.85rem', color: '#dc2626', fontWeight: 500 }}>
            Cancels at end of billing period
          </p>
        )}
      </div>

      {/* Usage */}
      <div style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#111827' }}>
          Usage
        </h3>
        <UsageMeter
          label="Orders this month"
          current={totalOrders}
          limit={planDefinition.limits.ordersPerMonth}
        />
        <UsageMeter
          label="Staff accounts"
          current={totalStaff}
          limit={planDefinition.limits.staffAccounts}
        />
      </div>

      {/* Plan Comparison */}
      {canUpgrade && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>
              Upgrade Plan
            </h3>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '2px' }}>
              <button
                onClick={() => setBillingInterval('monthly')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: billingInterval === 'monthly' ? '#ffffff' : 'transparent',
                  color: billingInterval === 'monthly' ? '#111827' : '#6b7280',
                  boxShadow: billingInterval === 'monthly' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: billingInterval === 'annual' ? '#ffffff' : 'transparent',
                  color: billingInterval === 'annual' ? '#111827' : '#6b7280',
                  boxShadow: billingInterval === 'annual' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Annual (save 20%)
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {getUpgradeablePlans().map((planDef) => (
              <PlanCard
                key={planDef.id}
                plan={planDef.id}
                isCurrentPlan={effectivePlan === planDef.id && !isTrialing}
                billingInterval={billingInterval}
                onUpgrade={handleUpgrade}
                loading={checkoutLoading}
              />
            ))}
            <PlanCard
              plan="enterprise"
              isCurrentPlan={effectivePlan === 'enterprise'}
              billingInterval={billingInterval}
              onUpgrade={handleUpgrade}
              loading={checkoutLoading}
            />
          </div>
        </div>
      )}

      {/* Manage Billing Button */}
      {!isTrialing && plan !== 'starter' && (
        <button
          onClick={handleManageBilling}
          disabled={portalLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: portalLoading ? 'wait' : 'pointer',
            opacity: portalLoading ? 0.7 : 1,
            fontSize: '0.9rem',
          }}
        >
          {portalLoading ? 'Loading...' : 'Manage Billing'}
        </button>
      )}
    </div>
  );
};
