import { apiJava } from "@/lib/axios";

export interface StockSummaryData {
  variantId: number;
  sku: string;
  productName: string;
  categoryName: string | null;
  branchQuantity: number;
  branchValue: number;
  branchAvgCost: number;
  branchWeightPercent: number;
  systemQuantity: number;
  systemValue: number;
}

export interface InventoryLedgerEntryData {
  id: number;
  createdAt: string;
  productName: string;
  sku: string;
  type: string;
  quantityChange: number;
  balanceBefore: number;
  balanceAfter: number;
  branchName: string;
  createdByName: string;
  reason: string | null;
}

export interface InventoryIOSummaryData {
  variantId: number;
  sku: string;
  productName: string;
  openingQuantity: number;
  openingValue: number;
  importedQuantity: number;
  importedValue: number;
  exportedQuantity: number;
  exportedValue: number;
  closingQuantity: number;
  closingValue: number;
}

export const InventoryReportService = {
  async getStockSummary(branchId?: string | number | null): Promise<StockSummaryData[]> {
    const response = await apiJava.get("/inventory-reports/stock-summary", {
      params: { branchId: !branchId || branchId === "all" ? null : branchId },
    });
    return response.data;
  },

  async getLedger(filters: {
    branchId?: string | number | null;
    startDate?: string;
    endDate?: string;
    direction?: "all" | "import" | "export" | "transfer" | "loss";
  }): Promise<InventoryLedgerEntryData[]> {
    const response = await apiJava.get("/inventory-reports/ledger", {
      params: {
        branchId: !filters.branchId || filters.branchId === "all" ? null : filters.branchId,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        direction: filters.direction || "all",
      },
    });
    return response.data;
  },

  async getIOSummary(filters: {
    branchId: string | number | null;
    startDate: string;
    endDate: string;
  }): Promise<InventoryIOSummaryData[]> {
    const response = await apiJava.get("/inventory-reports/io-summary", {
      params: {
        ...filters,
        branchId: !filters.branchId || filters.branchId === "all" ? null : filters.branchId,
      },
    });
    return response.data;
  },

  async getCheckNotes(branchId?: string | number | null): Promise<any[]> {
    const response = await apiJava.get("/inventory-reports/check", {
      params: { branchId: !branchId || branchId === "all" ? null : branchId },
    });
    return response.data;
  },
};

