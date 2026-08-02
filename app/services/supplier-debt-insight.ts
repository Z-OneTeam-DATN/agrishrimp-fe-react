import { apiJava } from "@/lib/axios";

const PREFIX = "/supplier-debt";

export interface SupplierDebtInsightBreakdownItem {
  factor: "TOTAL_DEBT" | "AGE_DISTRIBUTION" | "TREND";
  value: number;
  note: string;
}

export interface SupplierDebtRankingItem {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phone?: string;
  totalDebt: number;
  weightedAvgDebtAge: number;
  ageStatus: "NORMAL" | "WARNING" | "CRITICAL";
  priorityScore: number;
  priorityRank: number;
}

export interface SupplierDebtStaffSummaryItem {
  staffId: number;
  staffName: string;
  totalDebtFromOrders: number;
}

export interface SupplierDebtInsightResult {
  insufficientData: boolean;
  totalOutstandingDebt?: number;
  totalDebtChangeVsPreviousPeriod?: number | null;
  breakdown?: SupplierDebtInsightBreakdownItem[];
  supplierRanking?: SupplierDebtRankingItem[];
  staffDebtSummary?: SupplierDebtStaffSummaryItem[];
  warnings?: string[];
}

export interface SupplierDebtAiExplanation {
  success: boolean;
  summary: string;
  recommendation: string;
}

export interface SupplierDebtInsightFilters {
  branchId?: string | number;
  startDate: string;
  endDate: string;
  compareWithPreviousPeriod?: boolean;
}

export const SupplierDebtInsightService = {
  async getInsightAnalysis(
    filters: SupplierDebtInsightFilters,
  ): Promise<SupplierDebtInsightResult> {
    const branchIdParam =
      filters.branchId === undefined ||
      filters.branchId === "all" ||
      filters.branchId === "ALL"
        ? "ALL"
        : filters.branchId;

    const response = await apiJava.get(
      `${PREFIX}/${branchIdParam}/insight-analysis`,
      {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          compareWithPreviousPeriod: filters.compareWithPreviousPeriod ?? true,
        },
      },
    );

    return response.data;
  },

  async getAiExplanation(
    insightResult: SupplierDebtInsightResult,
    branchName: string,
  ): Promise<SupplierDebtAiExplanation> {
    const response = await fetch("/api/supplier-debt-insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        insightResult,
        branchName,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Không thể phân tích công nợ bằng AI");
    }

    return data;
  },
};
