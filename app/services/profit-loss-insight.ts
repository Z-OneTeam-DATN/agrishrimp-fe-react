import { apiJava } from "@/lib/axios";

const PREFIX = "/financial";

export type ProfitLossInsightStatus = "SAFE" | "WARNING";
export type ProfitLossContributionFactor =
  | "REVENUE"
  | "COGS"
  | "SHIPPING"
  | "DISCOUNT"
  | "RETURNS";

export interface ProfitLossContributionBreakdownItem {
  factor: ProfitLossContributionFactor;
  currentValue: number;
  previousValue: number;
  changeAmount: number;
  note: string;
}

export interface ProfitLossInsightResult {
  cogsRatio: number;
  cogsRatioStatus: ProfitLossInsightStatus;
  returnRatio: number;
  returnRatioStatus: ProfitLossInsightStatus;
  netProfitChangePercent: string;
  warnings: string[];
  contributionBreakdown: ProfitLossContributionBreakdownItem[];
}

export interface ProfitLossInsightFilters {
  branchId?: string | number;
  startDate: string;
  endDate: string;
}

export interface ProfitLossAiExplanation {
  success: boolean;
  summary: string;
  keyDrivers: string;
  recommendation: string;
}

export const ProfitLossInsightService = {
  async getInsightAnalysis(
    filters: ProfitLossInsightFilters,
  ): Promise<ProfitLossInsightResult> {
    const response = await apiJava.get(`${PREFIX}/profit-loss/insight-analysis`, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId:
          filters.branchId === "all" || filters.branchId === "ALL"
            ? null
            : filters.branchId,
      },
    });

    return response.data;
  },

  async getAiExplanation(
    insightResult: ProfitLossInsightResult,
    branchName: string,
    startDate: string,
    endDate: string,
  ): Promise<ProfitLossAiExplanation> {
    const response = await fetch("/api/profit-loss-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        insightResult,
        branchName,
        startDate,
        endDate,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Khong the phan tich lai lo bang AI");
    }

    return data;
  },
};
