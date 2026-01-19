import React, { useState, useMemo } from 'react';
import { Order, AppSettings } from '../../../types';
import {
  DateRange,
  getDateRangeOptions,
  calculateSalesMetrics,
  calculateCustomerMetrics,
  formatAnalyticsCurrency,
  calculatePercentageChange,
  getComparisonDateRange,
  filterOrders,
} from '../../../lib/analytics';
import { KPICard } from './KPICard';
import { DateRangeSelector } from './DateRangeSelector';
import { RevenueChart } from './RevenueChart';
import { OrderTypeChart } from './OrderTypeChart';
import { TopItemsChart } from './TopItemsChart';
import { PeakHoursChart } from './PeakHoursChart';

interface AnalyticsDashboardProps {
  orders: Order[];
  settings: AppSettings;
}

const containerStyle: React.CSSProperties = {
  padding: '0 20px 20px 20px',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#111827',
  margin: '0 0 16px 0',
};

const kpiGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '24px',
};

const chartGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '24px',
  marginBottom: '24px',
};

const twoColumnGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  marginBottom: '24px',
};

// Icons for KPI cards
const RevenueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const OrdersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const AvgValueIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
  </svg>
);

const CustomersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  orders,
  settings,
}) => {
  const dateRangeOptions = getDateRangeOptions();
  const [selectedRange, setSelectedRange] = useState<DateRange>(dateRangeOptions[2]); // Default to "Last 7 Days"

  // Calculate metrics for current period
  const metrics = useMemo(
    () => calculateSalesMetrics(orders, selectedRange),
    [orders, selectedRange]
  );

  // Calculate metrics for previous period (for comparison)
  const previousRange = useMemo(
    () => getComparisonDateRange(selectedRange),
    [selectedRange]
  );

  const previousMetrics = useMemo(
    () => calculateSalesMetrics(orders, previousRange),
    [orders, previousRange]
  );

  // Calculate customer metrics
  const filteredOrders = useMemo(
    () => filterOrders(orders, selectedRange),
    [orders, selectedRange]
  );

  const customerMetrics = useMemo(
    () => calculateCustomerMetrics(filteredOrders),
    [filteredOrders]
  );

  // Calculate trends
  const revenueTrend = calculatePercentageChange(
    metrics.totalRevenue,
    previousMetrics.totalRevenue
  );
  const ordersTrend = calculatePercentageChange(
    metrics.totalOrders,
    previousMetrics.totalOrders
  );
  const avgValueTrend = calculatePercentageChange(
    metrics.averageOrderValue,
    previousMetrics.averageOrderValue
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Analytics Dashboard</h1>
        <DateRangeSelector
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />
      </div>

      {/* KPI Cards */}
      <div style={kpiGridStyle}>
        <KPICard
          title="Total Revenue"
          value={formatAnalyticsCurrency(metrics.totalRevenue, settings.currency)}
          trend={{
            value: revenueTrend,
            isPositive: revenueTrend >= 0,
          }}
          subtitle="vs previous period"
          icon={<RevenueIcon />}
        />
        <KPICard
          title="Total Orders"
          value={metrics.totalOrders}
          trend={{
            value: ordersTrend,
            isPositive: ordersTrend >= 0,
          }}
          subtitle="vs previous period"
          icon={<OrdersIcon />}
        />
        <KPICard
          title="Average Order Value"
          value={formatAnalyticsCurrency(metrics.averageOrderValue, settings.currency)}
          trend={{
            value: avgValueTrend,
            isPositive: avgValueTrend >= 0,
          }}
          subtitle="vs previous period"
          icon={<AvgValueIcon />}
        />
        <KPICard
          title="Customers"
          value={customerMetrics.uniqueCustomers}
          subtitle={`${customerMetrics.repeatCustomerRate}% repeat rate`}
          icon={<CustomersIcon />}
        />
      </div>

      {/* Revenue Over Time Chart */}
      <div style={chartGridStyle}>
        <RevenueChart data={metrics.revenueByDay} currency={settings.currency} />
      </div>

      {/* Two Column Charts */}
      <div style={twoColumnGridStyle}>
        <OrderTypeChart data={metrics.orderTypeBreakdown} currency={settings.currency} />
        <TopItemsChart data={metrics.topSellingItems} currency={settings.currency} />
      </div>

      {/* Peak Hours Chart */}
      <div style={chartGridStyle}>
        <PeakHoursChart data={metrics.revenueByHour} currency={settings.currency} />
      </div>
    </div>
  );
};
