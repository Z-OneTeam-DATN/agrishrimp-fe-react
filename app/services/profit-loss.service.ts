import { apiJava } from "@/lib/axios";
import type { ProfitLossData } from "@/app/services/financial-report.types";

const PREFIX = "/financial";

export const ProfitLossService = {
  async getReport(
    startDate: string,
    endDate: string,
    branchId: string | number,
  ): Promise<ProfitLossData> {
    const response = await apiJava.get(`${PREFIX}/profit-loss`, {
      params: {
        startDate,
        endDate,
        branchId: branchId === "all" ? null : branchId,
      },
    });
    return response.data;
  },
};

export type { ProfitLossData };
