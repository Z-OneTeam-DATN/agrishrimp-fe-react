import { apiJava } from "@/lib/axios";
import type {
  CustomerDebtData,
  CustomerDebtFilters,
} from "@/app/services/financial-report.types";

const PREFIX = "/financial";

export const CustomerDebtService = {
  async getReport(
    filters: CustomerDebtFilters = {},
  ): Promise<CustomerDebtData[]> {
    const response = await apiJava.get(`${PREFIX}/customer-debts`, {
      params: {
        search: filters.search || null,
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

export type { CustomerDebtData, CustomerDebtFilters };
