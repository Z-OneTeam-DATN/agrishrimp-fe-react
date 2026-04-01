import { apiJava } from "@/lib/axios";
import {
  DashboardStats,
  DailyResults,
  RecentActivity,
  TopProduct,
  SalesPerformanceResponse,
  PendingOrdersSummary,
  InventoryInfo,
  CategoryDistribution,
} from "@/app/types/dashboard.type";

const DASHBOARD_BASE_URL = "/admin/dashboard";

export const dashboardService = {
  getStats: async (branchId?: string): Promise<DashboardStats> => {
    const response = await apiJava.get<DashboardStats>(`${DASHBOARD_BASE_URL}/stats`, {
      params: { branchId },
    });
    return response.data;
  },

  getDailyResults: async (branchId?: string): Promise<DailyResults> => {
    const response = await apiJava.get<DailyResults>(`${DASHBOARD_BASE_URL}/daily-results`, {
      params: { branchId },
    });
    return response.data;
  },

  getRecentActivities: async (branchId?: string): Promise<RecentActivity[]> => {
    const response = await apiJava.get<RecentActivity[]>(`${DASHBOARD_BASE_URL}/recent-activities`, {
      params: { branchId },
    });
    return response.data;
  },

  getSalesPerformance: async (branchId?: string): Promise<SalesPerformanceResponse> => {
    const response = await apiJava.get<SalesPerformanceResponse>(`${DASHBOARD_BASE_URL}/sales-performance`, {
      params: { branchId },
    });
    return response.data;
  },

  getInventoryInfo: async (branchId?: string): Promise<InventoryInfo> => {
    const response = await apiJava.get<InventoryInfo>(`${DASHBOARD_BASE_URL}/inventory-info`, {
      params: { branchId },
    });
    return response.data;
  },

  getTopProducts: async (limit: number = 5, branchId?: string): Promise<TopProduct[]> => {
    const response = await apiJava.get<TopProduct[]>(`${DASHBOARD_BASE_URL}/top-products`, {
      params: { limit, branchId },
    });
    return response.data;
  },

  getPendingOrdersSummary: async (branchId?: string): Promise<PendingOrdersSummary> => {
    const response = await apiJava.get<PendingOrdersSummary>(`${DASHBOARD_BASE_URL}/pending-orders-summary`, {
      params: { branchId },
    });
    return response.data;
  },

  getCategoryDistribution: async (branchId?: string): Promise<CategoryDistribution[]> => {
    const response = await apiJava.get<CategoryDistribution[]>(`${DASHBOARD_BASE_URL}/category-distribution`, {
      params: { branchId },
    });
    return response.data;
  },
};
