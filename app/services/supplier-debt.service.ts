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

  async getDebtDetail(
    supplierId: number,
    branchId?: string,
  ): Promise<any[]> {
    const response = await apiJava.get(`${PREFIX}/supplier-debts/${supplierId}/detail`, {
      params: {
        branchId: !branchId || branchId === "all" ? null : branchId,
      },
    });
    return response.data;
  },

  async payDebt(
    receiptId: number,
    amount: number,
    method: string,
    refCode?: string,
    note?: string,
  ): Promise<any> {
    const response = await apiJava.post(`/inventory/receipts/${receiptId}/payments`, {
      amount,
      paymentMethod: method,
      referenceCode: refCode || null,
      note: note || null,
    });
    return response.data;
  },
};

export type { SupplierDebtData, SupplierDebtFilters };
