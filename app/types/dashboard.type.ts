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
