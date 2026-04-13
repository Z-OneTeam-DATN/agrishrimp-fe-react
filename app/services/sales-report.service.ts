import { apiJava } from "@/lib/axios";

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  profit: number;
  orderCount: number;
}

export interface SalesBreakdownItem {
  key: string;
  label: string;
  count: number;
}

export interface SalesReportSummary {
  startDate: string;
  endDate: string;
  branchId?: number | null;
  branchName: string;
  revenue: {
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    trend: SalesTrendPoint[];
  };
  delivery: {
    totalShipments: number;
    breakdown: SalesBreakdownItem[];
  };
  returns: {
    totalReturnedOrders: number;
    totalReturnedAmount: number;
  };
  payment: {
    paidAmount: number;
    paidOrders: number;
    unpaidOrders: number;
  };
  orders: {
    totalOrders: number;
    totalProductsSold: number;
    averageOrderValue: number;
  };
}

export interface SalesReportColumn {
  key: string;
  label: string;
  align?: string;
}

export interface SalesReportDetail {
  type: string;
  label: string;
  description: string;
  columns: SalesReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  totalRows: number;
}

export const SalesReportService = {
  PREFIX: "/admin/reports/sales",

  async getSummary(startDate: string, endDate: string, branchId?: string | number) {
    const response = await apiJava.get<SalesReportSummary>(`${SalesReportService.PREFIX}/summary`, {
      params: {
        startDate,
        endDate,
        branchId: !branchId || branchId === "all" ? null : branchId,
      },
    });
    return response.data;
  },

  async getDetail(
    type: string,
    startDate: string,
    endDate: string,
    branchId?: string | number,
  ) {
    const response = await apiJava.get<SalesReportDetail>(`${SalesReportService.PREFIX}/detail`, {
      params: {
        type,
        startDate,
        endDate,
        branchId: !branchId || branchId === "all" ? null : branchId,
      },
    });
    return response.data;
  },
};
