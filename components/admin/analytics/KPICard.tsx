import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#6b7280',
  fontWeight: 500,
  margin: 0,
};

const valueStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#111827',
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#9ca3af',
  margin: 0,
};

const trendStyle = (isPositive: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: isPositive ? '#059669' : '#dc2626',
  backgroundColor: isPositive ? '#d1fae5' : '#fee2e2',
  padding: '2px 8px',
  borderRadius: '12px',
});

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
}) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={titleStyle}>{title}</p>
        {icon && <div style={{ color: '#9ca3af' }}>{icon}</div>}
      </div>
      <p style={valueStyle}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {trend && (
          <span style={trendStyle(trend.isPositive)}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
    </div>
  );
};
