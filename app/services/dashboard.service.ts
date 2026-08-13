import { apiJava } from "@/lib/axios";
import {
  BusinessTrend,
  DashboardStats,
  CustomerInsights,
  DailyResults,
  MonthlyResults,
  RecentActivity,
  TopProduct,
  SalesPerformanceResponse,
  PendingOrdersSummary,
  InventoryInfo,
  CategoryDistribution,
} from "@/app/types/dashboard.type";

const DASHBOARD_BASE_URL = "/admin/dashboard";

type BusinessResultsParams = {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  startMonth?: string;
  endMonth?: string;
};

type BusinessTrendParams = {
  branchId?: string;
  granularity: "DAY" | "MONTH";
  startDate?: string;
  endDate?: string;
};

export const dashboardService = {
  getStats: async (branchId?: string): Promise<DashboardStats> => {
    const response = await apiJava.get<DashboardStats>(
      `${DASHBOARD_BASE_URL}/stats`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getCustomerInsights: async (branchId?: string): Promise<CustomerInsights> => {
    const response = await apiJava.get<CustomerInsights>(
      `${DASHBOARD_BASE_URL}/customer-insights`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getDailyResults: async (branchId?: string): Promise<DailyResults> => {
    const response = await apiJava.get<DailyResults>(
      `${DASHBOARD_BASE_URL}/daily-results`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getMonthlyResults: async (
    yearMonth?: string,
    branchId?: string,
  ): Promise<MonthlyResults> => {
    const response = await apiJava.get<MonthlyResults>(
      `${DASHBOARD_BASE_URL}/monthly-results`,
      {
        params: { yearMonth, branchId },
      },
    );
    return response.data;
  },

  getBusinessResults: async ({
    branchId,
    startDate,
    endDate,
    startMonth,
    endMonth,
  }: BusinessResultsParams): Promise<MonthlyResults> => {
    const response = await apiJava.get<MonthlyResults>(
      `${DASHBOARD_BASE_URL}/business-results`,
      {
        params: { branchId, startDate, endDate, startMonth, endMonth },
      },
    );
    return response.data;
  },

  getBusinessTrend: async ({
    branchId,
    granularity,
    startDate,
    endDate,
  }: BusinessTrendParams): Promise<BusinessTrend> => {
    const response = await apiJava.get<BusinessTrend>(
      `${DASHBOARD_BASE_URL}/business-trend`,
      {
        params: { branchId, granularity, startDate, endDate },
      },
    );
    return response.data;
  },

  getRecentActivities: async (branchId?: string): Promise<RecentActivity[]> => {
    const response = await apiJava.get<RecentActivity[]>(
      `${DASHBOARD_BASE_URL}/recent-activities`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getSalesPerformance: async (
    branchId?: string,
  ): Promise<SalesPerformanceResponse> => {
    const response = await apiJava.get<SalesPerformanceResponse>(
      `${DASHBOARD_BASE_URL}/sales-performance`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getInventoryInfo: async (branchId?: string): Promise<InventoryInfo> => {
    const response = await apiJava.get<InventoryInfo>(
      `${DASHBOARD_BASE_URL}/inventory-info`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getTopProducts: async (
    limit: number = 5,
    branchId?: string,
  ): Promise<TopProduct[]> => {
    const response = await apiJava.get<TopProduct[]>(
      `${DASHBOARD_BASE_URL}/top-products`,
      {
        params: { limit, branchId },
      },
    );
    return response.data;
  },

  getPendingOrdersSummary: async (
    branchId?: string,
  ): Promise<PendingOrdersSummary> => {
    const response = await apiJava.get<PendingOrdersSummary>(
      `${DASHBOARD_BASE_URL}/pending-orders-summary`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },

  getCategoryDistribution: async (
    branchId?: string,
  ): Promise<CategoryDistribution[]> => {
    const response = await apiJava.get<CategoryDistribution[]>(
      `${DASHBOARD_BASE_URL}/category-distribution`,
      {
        params: { branchId },
      },
    );
    return response.data;
  },
};
