import { apiJava } from "@/lib/axios";

export interface SupplierRankingItem {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phone: string | null;
  totalDebt: number;
  weightedAvgDebtAge: number;
  ageStatus: "NORMAL" | "WARNING" | "CRITICAL";
  priorityScore: number;
  priorityRank: number;
}

export interface StaffDebtSummaryItem {
  staffId: number;
  staffName: string;
  totalDebtFromOrders: number;
}

export interface BreakdownItem {
  factor: "TOTAL_DEBT" | "AGE_DISTRIBUTION" | "TREND";
  value: number;
  note: string;
}

export interface SupplierDebtInsightResult {
  insufficientData: boolean;
  totalOutstandingDebt: number;
  totalDebtChangeVsPreviousPeriod: number | null;
  supplierRanking: SupplierRankingItem[];
  staffDebtSummary: StaffDebtSummaryItem[];
  breakdown: BreakdownItem[];
  warnings: string[];
}

export interface SupplierDebtAiAnalysis {
  success: boolean;
  summary: string;
  recommendation: string;
}

export const SupplierDebtInsightService = {
  getInsightAnalysis: async (params: {
    branchId: string;
    startDate?: string;
    endDate?: string;
    compareWithPreviousPeriod?: boolean;
  }): Promise<SupplierDebtInsightResult> => {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.compareWithPreviousPeriod !== undefined) {
      query.append("compareWithPreviousPeriod", String(params.compareWithPreviousPeriod));
    }

    const response = await apiJava.get<SupplierDebtInsightResult>(
      `/supplier-debt/${params.branchId}/insight-analysis?${query.toString()}`
    );
    return response.data;
  },

  getAiExplanation: async (
    insightResult: SupplierDebtInsightResult,
    branchName: string
  ): Promise<SupplierDebtAiAnalysis> => {
    const res = await fetch("/api/supplier-debt-insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ insightResult, branchName }),
    });

    if (!res.ok) {
      throw new Error("Không thể gọi API phân tích AI");
    }

    return res.json();
  },
};
