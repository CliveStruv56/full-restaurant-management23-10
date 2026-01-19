/**
 * Analytics Utility Functions
 *
 * Phase 4B: Data aggregation functions for the analytics dashboard.
 * Processes order data into metrics, charts, and insights.
 */

import { Order, SalesMetrics, AppSettings } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface HourlyData {
  hour: number;
  label: string;
  orders: number;
  revenue: number;
}

export interface TopItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface OrderTypeBreakdown {
  type: 'takeaway' | 'dine-in' | 'delivery';
  count: number;
  revenue: number;
  percentage: number;
}

// ============================================================================
// DATE RANGE HELPERS
// ============================================================================

/**
 * Get predefined date ranges for filtering
 */
export function getDateRangeOptions(): DateRange[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return [
    {
      label: 'Today',
      start: today,
      end: now,
    },
    {
      label: 'Yesterday',
      start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      end: new Date(today.getTime() - 1),
    },
    {
      label: 'Last 7 Days',
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
    },
    {
      label: 'Last 30 Days',
      start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
    },
    {
      label: 'This Month',
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
    },
    {
      label: 'Last Month',
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0),
    },
  ];
}

/**
 * Check if a date is within a date range
 */
export function inDateRange(dateStr: string, range: DateRange): boolean {
  const date = new Date(dateStr);
  return date >= range.start && date <= range.end;
}

// ============================================================================
// CORE ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Filter orders by date range and completed status
 */
export function filterOrders(orders: Order[], dateRange: DateRange): Order[] {
  return orders.filter(
    (order) =>
      order.status === 'Completed' && inDateRange(order.orderTime, dateRange)
  );
}

/**
 * Calculate sales metrics from orders
 */
export function calculateSalesMetrics(
  orders: Order[],
  dateRange: DateRange
): SalesMetrics {
  const filtered = filterOrders(orders, dateRange);

  // Calculate total revenue
  const totalRevenue = filtered.reduce((sum, order) => sum + order.total, 0);

  // Calculate total orders
  const totalOrders = filtered.length;

  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate top selling items
  const topSellingItems = aggregateTopItems(filtered);

  // Calculate revenue by day
  const revenueByDay = groupRevenueByDay(filtered);

  // Calculate revenue by hour
  const revenueByHour = groupRevenueByHour(filtered);

  // Calculate order type breakdown
  const orderTypeBreakdown = calculateOrderTypeBreakdown(filtered);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    topSellingItems,
    revenueByDay,
    revenueByHour,
    orderTypeBreakdown,
  };
}

/**
 * Aggregate items to find top sellers
 */
export function aggregateTopItems(orders: Order[], limit: number = 10): TopItem[] {
  const itemMap = new Map<string, { quantity: number; revenue: number }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = itemMap.get(item.name) || { quantity: 0, revenue: 0 };
      itemMap.set(item.name, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.price * item.quantity,
      });
    });
  });

  return Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/**
 * Group revenue by day for line charts
 */
export function groupRevenueByDay(orders: Order[]): DailyRevenue[] {
  const dayMap = new Map<string, { revenue: number; orders: number }>();

  orders.forEach((order) => {
    const date = new Date(order.orderTime);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const existing = dayMap.get(dateKey) || { revenue: 0, orders: 0 };
    dayMap.set(dateKey, {
      revenue: existing.revenue + order.total,
      orders: existing.orders + 1,
    });
  });

  return Array.from(dayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Group orders by hour for peak hours analysis
 */
export function groupRevenueByHour(orders: Order[]): HourlyData[] {
  const hourMap = new Map<number, { orders: number; revenue: number }>();

  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, { orders: 0, revenue: 0 });
  }

  orders.forEach((order) => {
    const hour = new Date(order.orderTime).getHours();
    const existing = hourMap.get(hour)!;
    hourMap.set(hour, {
      orders: existing.orders + 1,
      revenue: existing.revenue + order.total,
    });
  });

  return Array.from(hourMap.entries()).map(([hour, data]) => ({
    hour,
    label: formatHourLabel(hour),
    ...data,
  }));
}

/**
 * Calculate order type breakdown (takeaway vs dine-in vs delivery)
 */
export function calculateOrderTypeBreakdown(orders: Order[]): OrderTypeBreakdown[] {
  const typeMap = new Map<string, { count: number; revenue: number }>();

  orders.forEach((order) => {
    const type = order.orderType || 'takeaway';
    const existing = typeMap.get(type) || { count: 0, revenue: 0 };
    typeMap.set(type, {
      count: existing.count + 1,
      revenue: existing.revenue + order.total,
    });
  });

  const total = orders.length || 1;

  return ['takeaway', 'dine-in', 'delivery'].map((type) => {
    const data = typeMap.get(type) || { count: 0, revenue: 0 };
    return {
      type: type as 'takeaway' | 'dine-in' | 'delivery',
      count: data.count,
      revenue: data.revenue,
      percentage: Math.round((data.count / total) * 100),
    };
  });
}

// ============================================================================
// CUSTOMER METRICS
// ============================================================================

/**
 * Calculate customer-related metrics
 */
export function calculateCustomerMetrics(orders: Order[]): {
  totalCustomers: number;
  uniqueCustomers: number;
  repeatCustomerRate: number;
  averagePartySize: number;
} {
  // Count unique customers
  const customerOrderCounts = new Map<string, number>();
  let totalPartySize = 0;
  let dineInOrders = 0;

  orders.forEach((order) => {
    const customerId = order.userId;
    customerOrderCounts.set(
      customerId,
      (customerOrderCounts.get(customerId) || 0) + 1
    );

    if (order.orderType === 'dine-in' && order.guestCount) {
      totalPartySize += order.guestCount;
      dineInOrders++;
    }
  });

  const uniqueCustomers = customerOrderCounts.size;
  const repeatCustomers = Array.from(customerOrderCounts.values()).filter(
    (count) => count > 1
  ).length;

  return {
    totalCustomers: orders.reduce((sum, o) => sum + (o.guestCount || 1), 0),
    uniqueCustomers,
    repeatCustomerRate:
      uniqueCustomers > 0
        ? Math.round((repeatCustomers / uniqueCustomers) * 100)
        : 0,
    averagePartySize:
      dineInOrders > 0 ? Math.round((totalPartySize / dineInOrders) * 10) / 10 : 0,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format hour number to display label
 */
function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Format currency for display
 */
export function formatAnalyticsCurrency(
  amount: number,
  currency: AppSettings['currency'] = 'GBP'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatAnalyticsDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get comparison period for date range
 */
export function getComparisonDateRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  return {
    label: 'Previous Period',
    start: new Date(range.start.getTime() - duration),
    end: new Date(range.end.getTime() - duration),
  };
}
