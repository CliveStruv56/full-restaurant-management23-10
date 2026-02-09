/**
 * Upgrade Prompt Component
 *
 * Phase 1C: Plan Enforcement
 * Reusable upgrade prompt in banner or modal variant.
 */

import React from 'react';
import { useBilling } from '../../contexts/BillingContext';

interface UpgradePromptProps {
  variant: 'banner' | 'modal';
  reason: string;
  suggestedPlan?: string;
  onClose?: () => void;
  onUpgrade?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  variant,
  reason,
  suggestedPlan,
  onClose,
  onUpgrade,
}) => {
  const { planDefinition } = useBilling();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default: navigate to billing page
      // In the SaaS app, this would set the admin page to 'billing'
      window.dispatchEvent(new CustomEvent('navigate-admin', { detail: 'billing' }));
    }
    onClose?.();
  };

  if (variant === 'banner') {
    return (
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', fontWeight: 500 }}>
            {reason}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
            Current plan: {planDefinition.name}
            {suggestedPlan && ` · Recommended: ${suggestedPlan}`}
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          style={{
            padding: '6px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Upgrade
        </button>
      </div>
    );
  }

  // Modal variant
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ marginBottom: '20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
            <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="2" />
            <path d="M8 12l2.5 2.5L16 9" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#111827' }}>
            Upgrade to unlock this feature
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.5 }}>
            {reason}
          </p>
        </div>
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            Current plan: <strong style={{ color: '#111827' }}>{planDefinition.name}</strong>
          </p>
          {suggestedPlan && (
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
              Recommended: <strong style={{ color: '#2563eb' }}>{suggestedPlan}</strong>
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleUpgrade}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            View Plans
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Not Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
