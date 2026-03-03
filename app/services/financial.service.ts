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
    getSupplierDebts: async (search?: string): Promise<SupplierDebtData[]> => {
        const response = await apiJava.get(`${FinancialService.PREFIX}/supplier-debts`, {
            params: {
                search: search || null
            },
        });
        return response.data;
    },
};