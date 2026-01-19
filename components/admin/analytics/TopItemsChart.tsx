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
import { TopItem, formatAnalyticsCurrency } from '../../../lib/analytics';
import { AppSettings } from '../../../types';

interface TopItemsChartProps {
  data: TopItem[];
  currency: AppSettings['currency'];
}

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

export const TopItemsChart: React.FC<TopItemsChartProps> = ({ data, currency }) => {
  // Take top 8 items for display
  const chartData = data.slice(0, 8).map((item) => ({
    ...item,
    shortName: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
  }));

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
          <p style={{ margin: 0, fontWeight: 600, marginBottom: '4px' }}>{item.name}</p>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Quantity Sold: {item.quantity}
          </p>
          <p style={{ margin: 0, color: '#3b82f6' }}>
            Revenue: {formatAnalyticsCurrency(item.revenue, currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div style={containerStyle}>
        <h3 style={titleStyle}>Top Selling Items</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#9ca3af' }}>
          No data available
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>Top Selling Items</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => formatAnalyticsCurrency(value, currency)}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
