/**
 * Usage Banner Component
 *
 * Phase 1C: Plan Enforcement
 * Persistent banner shown when usage >= 80% of plan limits.
 */

import React from 'react';
import { usePlanLimits, UsageStatus } from '../../src/hooks/usePlanLimits';

const UsageBar: React.FC<{ status: UsageStatus; label: string }> = ({ status, label }) => {
  if (status.isUnlimited || !status.isWarning) return null;

  const barColor = status.isAtLimit ? '#dc2626' : '#d97706';
  const bgColor = status.isAtLimit ? '#fef2f2' : '#fffbeb';
  const textColor = status.isAtLimit ? '#991b1b' : '#92400e';

  return (
    <div style={{
      padding: '10px 16px',
      backgroundColor: bgColor,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flex: 1,
      minWidth: '200px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: textColor }}>{label}</span>
          <span style={{ fontSize: '0.75rem', color: textColor }}>
            {status.current}/{status.limit}
          </span>
        </div>
        <div style={{
          height: '6px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(status.percentage * 100, 100)}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '3px',
          }} />
        </div>
      </div>
    </div>
  );
};

export const UsageBanner: React.FC<{ onNavigateToBilling: () => void }> = ({ onNavigateToBilling }) => {
  const { orders, staff, canUpgrade } = usePlanLimits();

  const showOrders = !orders.isUnlimited && orders.isWarning;
  const showStaff = !staff.isUnlimited && staff.isWarning;

  if (!showOrders && !showStaff) return null;

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      {showOrders && <UsageBar status={orders} label="Orders this month" />}
      {showStaff && <UsageBar status={staff} label="Staff accounts" />}
      {canUpgrade && (
        <button
          onClick={onNavigateToBilling}
          style={{
            padding: '8px 16px',
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
      )}
    </div>
  );
};
