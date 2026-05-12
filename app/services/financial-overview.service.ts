import {
  ProfitLossService,
  type ProfitLossData,
} from "@/app/services/profit-loss.service";
import {
  SupplierDebtService,
  type SupplierDebtData,
} from "@/app/services/supplier-debt.service";

export interface FinancialOverviewFilters {
  startDate: string;
  endDate: string;
  branchId: string | number;
}

export interface FinancialOverviewData {
  profitLoss: ProfitLossData;
  supplierDebts: SupplierDebtData[];
}

export const FinancialOverviewService = {
  async getReport(
    filters: FinancialOverviewFilters,
  ): Promise<FinancialOverviewData> {
    const [profitLoss, supplierDebts] = await Promise.all([
      ProfitLossService.getReport(
        filters.startDate,
        filters.endDate,
        filters.branchId,
      ),
      SupplierDebtService.getReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
        debtFilter: "not_zero",
      }),
    ]);

    return {
      profitLoss,
      supplierDebts: Array.isArray(supplierDebts) ? supplierDebts : [],
    };
  },
};
