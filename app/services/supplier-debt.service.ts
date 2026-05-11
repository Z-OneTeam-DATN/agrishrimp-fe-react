import { apiJava } from "@/lib/axios";
import type {
  SupplierDebtData,
  SupplierDebtFilters,
} from "@/app/services/financial-report.types";

const PREFIX = "/financial";

export const SupplierDebtService = {
  async getReport(
    filters: SupplierDebtFilters = {},
  ): Promise<SupplierDebtData[]> {
    const response = await apiJava.get(`${PREFIX}/supplier-debts`, {
      params: {
        search: filters.search || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        branchId:
          !filters.branchId || filters.branchId === "all"
            ? null
            : filters.branchId,
        staffId:
          !filters.staffId || filters.staffId === "all"
            ? null
            : filters.staffId,
        debtFilter: filters.debtFilter || "not_zero",
      },
    });
    return response.data;
  },
};

export type { SupplierDebtData, SupplierDebtFilters };
