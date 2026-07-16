export interface SupplierDebtInsightBreakdownItem {
  factor: "TOTAL_DEBT" | "AGE_DISTRIBUTION" | "TREND";
  value: number;
  note: string;
}

export interface SupplierDebtRankingItem {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
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

const FALLBACK_MESSAGE =
  "Phan phan tich cong no AI chua duoc khoi phuc day du tren nhanh hien tai.";

export const SupplierDebtInsightService = {
  async getInsightAnalysis(
    _filters: SupplierDebtInsightFilters,
  ): Promise<SupplierDebtInsightResult> {
    return {
      insufficientData: true,
      warnings: [FALLBACK_MESSAGE],
    };
  },

  async getAiExplanation(
    _insightResult: SupplierDebtInsightResult,
    _branchName: string,
  ): Promise<SupplierDebtAiExplanation> {
    return {
      success: true,
      summary: FALLBACK_MESSAGE,
      recommendation:
        "Tam thoi theo doi bang cong no hien co va uu tien khoi phuc backend insight neu can phan tich sau.",
    };
  },
};
