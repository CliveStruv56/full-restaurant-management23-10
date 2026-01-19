import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { OrderTypeBreakdown, formatAnalyticsCurrency } from '../../../lib/analytics';
import { AppSettings } from '../../../types';

interface OrderTypeChartProps {
  data: OrderTypeBreakdown[];
  currency: AppSettings['currency'];
}

const COLORS = {
  takeaway: '#3b82f6',
  'dine-in': '#10b981',
  delivery: '#f59e0b',
};

const LABELS = {
  takeaway: 'Takeaway',
  'dine-in': 'Dine-in',
  delivery: 'Delivery',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  height: '100%',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '16px',
};

export const OrderTypeChart: React.FC<OrderTypeChartProps> = ({ data, currency }) => {
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...item,
      name: LABELS[item.type],
      color: COLORS[item.type],
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>{data.name}</p>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Orders: {data.count} ({data.percentage}%)
          </p>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Revenue: {formatAnalyticsCurrency(data.revenue, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (chartData.length === 0) {
    return (
      <div style={containerStyle}>
        <h3 style={titleStyle}>Order Types</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9ca3af' }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Order Types</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: '#374151', fontSize: '0.875rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
