import { apiJava } from "@/lib/axios";

// ─── INTERFACES ───
export interface ProfitLossData {
    revenue: number;
    returnedGoods: number;
    vat: number;
    shippingFeeCollected: number;
    discount: number;
    cogs: number; // Giá vốn
    pointPayment: number;
    shippingFeePaid: number;
    otherIncome: number;
    customerReturnFee: number;
    otherExpenses: number;
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

// ─── SERVICE ───
export const FinancialService = {
    PREFIX: "/financial",

    // 1. Lấy Báo cáo lãi lỗ
    getProfitLoss: async (
        startDate: string,
        endDate: string,
        branchId: string | number
    ): Promise<ProfitLossData> => {
        const response = await apiJava.get(`${FinancialService.PREFIX}/profit-loss`, {
            params: {
                startDate,
                endDate,
                branchId: branchId === "all" ? null : branchId
            },
        });
        return response.data;
    },

    // 2. Lấy Công nợ Nhà cung cấp
    getSupplierDebts: async (filters: SupplierDebtFilters = {}): Promise<SupplierDebtData[]> => {
        const response = await apiJava.get(`${FinancialService.PREFIX}/supplier-debts`, {
            params: {
                search: filters.search || null,
                startDate: filters.startDate || null,
                endDate: filters.endDate || null,
                branchId: !filters.branchId || filters.branchId === "all" ? null : filters.branchId,
                staffId: !filters.staffId || filters.staffId === "all" ? null : filters.staffId,
                debtFilter: filters.debtFilter || "not_zero",
            },
        });
        return response.data;
    },

    getSupplierPayments: async (filters: Omit<SupplierDebtFilters, "search" | "staffId" | "debtFilter"> = {}): Promise<SupplierPaymentData[]> => {
        const response = await apiJava.get(`${FinancialService.PREFIX}/supplier-payments`, {
            params: {
                startDate: filters.startDate || null,
                endDate: filters.endDate || null,
                branchId: !filters.branchId || filters.branchId === "all" ? null : filters.branchId,
            },
        });
        return response.data;
    },
};
