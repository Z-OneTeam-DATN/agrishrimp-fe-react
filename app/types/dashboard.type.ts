export interface MetricChange {
  current: number;
  previous: number;
  changeAmount: number;
  changePercent: number;
  comparable: boolean;
  newBaseline: boolean;
  negativeBaseline: boolean;
  direction: "UP" | "DOWN" | "FLAT";
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChangePercent: number;
  revenueIsNew: boolean;
  ordersChangePercent: number;
  ordersIsNew: boolean;
  customersChangePercent: number;
  customersIsNew: boolean;
  revenueChange?: MetricChange;
  ordersChange?: MetricChange;
  customersChange?: MetricChange;
}

export interface CustomerInsights {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  todayVisitors: number;
  todayPageViews: number;
}

export interface DailyResults {
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueChangePercent: number;
  revenueIsNew: boolean;
  todayProfit: number;
  yesterdayProfit: number;
  profitChangePercent: number;
  profitIsNew: boolean;
  todayOrders: number;
  yesterdayOrders: number;
  orderChangePercent: number;
  orderIsNew: boolean;
  revenueChange?: MetricChange;
  profitChange?: MetricChange;
  orderChange?: MetricChange;
  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  deliveredChange?: MetricChange;
  returnedChange?: MetricChange;
  cancelledChange?: MetricChange;
}

export interface MonthlyResults {
  yearMonth: string;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueChangePercent: number;
  revenueIsNew: boolean;
  currentMonthProfit: number;
  previousMonthProfit: number;
  profitChangePercent: number;
  profitIsNew: boolean;
  currentMonthOrders: number;
  previousMonthOrders: number;
  orderChangePercent: number;
  orderIsNew: boolean;
  revenueChange?: MetricChange;
  profitChange?: MetricChange;
  orderChange?: MetricChange;

  deliveredOrders: number;
  returnedOrders: number;
  cancelledOrders: number;
  deliveredChange?: MetricChange;
  returnedChange?: MetricChange;
  cancelledChange?: MetricChange;
}

export interface RecentActivity {
  id: string;
  type: "ORDER" | "CUSTOMER" | "INVENTORY";
  title: string;
  timestamp: string;
  status: string;
  user: string;
}

export interface InventoryInfo {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  valueChangePercent: number;
  valueIsNew: boolean;
  valueChange?: MetricChange;
}

export interface BusinessTrendPoint {
  period: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

export interface BusinessTrend {

  granularity: "DAY" | "MONTH";
  rangeLabel: string;
  points: BusinessTrendPoint[];
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  imageUrl: string;
}

export interface CategoryDistribution {
  categoryId: number;
  categoryName: string;
  totalRevenue: number;
  totalQuantity: number;
  percentage: number;
}

export interface SalesPerformanceData {
  date: string;
  revenue: number;
  profit: number;
  orderCount: number;
}

export interface SalesPerformanceResponse {
  data: SalesPerformanceData[];
}

export interface PendingOrdersSummary {
  pendingApproval: number;
  pendingPayment: number;
  pendingPacking: number;
  pendingPickup: number;
  shipping: number;
  cancelPending: number;
}

export interface PendingOrder {
  id: string;
  orderCode: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

