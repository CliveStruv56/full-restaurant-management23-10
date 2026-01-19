import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HourlyData, formatAnalyticsCurrency } from '../../../lib/analytics';
import { AppSettings } from '../../../types';

interface PeakHoursChartProps {
  data: HourlyData[];
  currency: AppSettings['currency'];
}

const containerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '16px',
};

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ data, currency }) => {
  // Filter to show only hours with activity or business hours (8 AM - 10 PM)
  const businessHours = data.filter((item) => item.hour >= 8 && item.hour <= 22);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
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
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>{item.label}</p>
          <p style={{ margin: 0, color: '#10b981' }}>
            Orders: {item.orders}
          </p>
          <p style={{ margin: 0, color: '#3b82f6' }}>
            Revenue: {formatAnalyticsCurrency(item.revenue, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Find peak hour
  const peakHour = businessHours.reduce(
    (max, item) => (item.orders > max.orders ? item : max),
    businessHours[0] || { orders: 0, label: '' }
  );

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ ...titleStyle, marginBottom: 0 }}>Orders by Hour</h3>
        {peakHour && peakHour.orders > 0 && (
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: '#dbeafe',
              color: '#1d4ed8',
              padding: '4px 10px',
              borderRadius: '12px',
              fontWeight: 500,
            }}
          >
            Peak: {peakHour.label}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={businessHours} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval={1}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="orders"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
