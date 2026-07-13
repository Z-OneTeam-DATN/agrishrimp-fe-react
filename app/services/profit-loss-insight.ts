import { apiJava } from "@/lib/axios";

export interface ContributionBreakdownItem {
  factor: "REVENUE" | "COGS" | "SHIPPING" | "DISCOUNT" | "RETURNS";
  currentValue: number;
  previousValue: number | null;
  changeAmount: number | null;
  note: string;
}

export interface ProfitLossInsightResult {
  netProfitChangePercent: number | "NO_PREVIOUS_DATA";
  contributionBreakdown: ContributionBreakdownItem[];
  cogsRatio: number;
  cogsRatioStatus: "NORMAL" | "WARNING";
  returnRatio: number;
  returnRatioStatus: "NORMAL" | "WARNING";
  isNetProfitNegative: boolean;
  excludedZeroFields: string[];
  warnings: string[];
}

export interface ProfitLossAiAnalysis {
  success: boolean;
  summary: string;
  keyDrivers: string;
  recommendation: string;
}

export const ProfitLossInsightService = {
  getInsightAnalysis: async (params: {
    branchId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ProfitLossInsightResult> => {
    const query = new URLSearchParams();
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.branchId && params.branchId !== "all") {
      query.append("branchId", params.branchId);
    }

    const response = await apiJava.get<ProfitLossInsightResult>(
      `/financial/profit-loss/insight-analysis?${query.toString()}`
    );
    return response.data;
  },

  getAiExplanation: async (
    insightResult: ProfitLossInsightResult,
    branchName: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProfitLossAiAnalysis> => {
    const res = await fetch("/api/profit-loss-insight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ insightResult, branchName, startDate, endDate }),
    });

    if (!res.ok) {
      throw new Error("Không thể gọi API phân tích AI");
    }

    return res.json();
  },
};
