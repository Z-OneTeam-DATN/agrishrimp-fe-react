import { apiJava } from "@/lib/axios";

export interface ProfitLossData {
  grossRevenue: number;
  returnedGoods: number;
  vat: number;
  shippingFeeCollected: number;
  shippingFeeReturned: number;
  discount: number;
  discountReturned: number;
  netProductRevenue: number;
  netRevenue: number;
  cogs: number;
  pointPayment: number;
  shippingFeePaid: number;
  grossProfit: number;
  otherIncome: number;
  customerReturnFee: number;
  otherExpenses: number;
  netProfit: number;
}

export interface SupplierDebtData {
  id: number;
  supplierCode: string;
  supplierName: string;
  phone: string;
  totalDebt: number;
}

export interface SupplierDebtFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string | number;
  staffId?: string | number;
  debtFilter?: "all" | "not_zero" | "zero";
}

export interface SupplierPaymentData {
  id: number;
  receiptId: number;
  receiptCode: string;
  supplierId?: number;
  supplierName: string;
  branchId?: number;
  branchName: string;
  amount: number;
  remainingDebtAfter: number;
  paymentMethod: string;
  referenceCode?: string;
  note?: string;
  paymentDate: string;
  createdAt: string;
  createdByName: string;
}

export interface CashbookEntryData {
  id: string;
  date: string;
  branchId?: number;
  direction: "IN" | "OUT";
  source: "SUPPLIER_PAYMENT";
  code: string;
  title: string;
  description: string;
  branchName: string;
  partnerName: string;
  creatorName: string;
  paymentMethod: string;
  amount: number;
  debtAmount: number;
  paymentAmount: number;
}

export interface CashbookSummaryData {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

export interface CashbookReportData {
  summary: CashbookSummaryData;
  entries: CashbookEntryData[];
}

export const FinancialService = {
  PREFIX: "/financial",

  getProfitLoss: async (
    startDate: string,
    endDate: string,
    branchId: string | number
  ): Promise<ProfitLossData> => {
    const response = await apiJava.get(`${FinancialService.PREFIX}/profit-loss`, {
      params: {
        startDate,
        endDate,
        branchId: branchId === "all" ? null : branchId,
      },
    });
    return response.data;
  },

  getSupplierDebts: async (
    filters: SupplierDebtFilters = {}
  ): Promise<SupplierDebtData[]> => {
    const response = await apiJava.get(`${FinancialService.PREFIX}/supplier-debts`, {
      params: {
        search: filters.search || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        branchId:
          !filters.branchId || filters.branchId === "all"
            ? null
            : filters.branchId,
        staffId:
          !filters.staffId || filters.staffId === "all" ? null : filters.staffId,
        debtFilter: filters.debtFilter || "not_zero",
      },
    });
    return response.data;
  },

  getCashbook: async (
    filters: Omit<SupplierDebtFilters, "search" | "staffId" | "debtFilter"> = {}
  ): Promise<CashbookReportData> => {
    const response = await apiJava.get(`${FinancialService.PREFIX}/cashbook`, {
      params: {
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        branchId:
          !filters.branchId || filters.branchId === "all"
            ? null
            : filters.branchId,
      },
    });
    return response.data;
  },

  getSupplierPayments: async (
    filters: Omit<SupplierDebtFilters, "search" | "staffId" | "debtFilter"> = {}
  ): Promise<SupplierPaymentData[]> => {
    const response = await apiJava.get(
      `${FinancialService.PREFIX}/supplier-payments`,
      {
        params: {
          startDate: filters.startDate || null,
          endDate: filters.endDate || null,
          branchId:
            !filters.branchId || filters.branchId === "all"
              ? null
              : filters.branchId,
        },
      }
    );
    return response.data;
  },
};
