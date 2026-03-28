export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

export interface DailyResults {
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueChangePercent: number; // Thêm trường này
  todayProfit: number;
  yesterdayProfit: number;
  profitChangePercent: number;  // Thêm trường này
  todayOrders: number;
  yesterdayOrders: number;
  orderChangePercent: number;   // Thêm trường này
}

export interface RecentActivity {
  id: string;
  type: 'ORDER' | 'CUSTOMER' | 'INVENTORY';
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
}

export interface TopProduct {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  imageUrl: string;
}

export interface CategoryDistribution {
  name: string;
  value: number;
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
