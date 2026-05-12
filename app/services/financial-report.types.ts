export interface ProfitLossData {
  grossRevenue: number;
  returnedGoods: number;
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
