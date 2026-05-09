import {
  CashbookEntryData,
  CashbookReportData,
  FinancialService,
} from "@/app/services/financial.service";

export type CashbookDirection = "IN" | "OUT";
export type CashbookSource = "SUPPLIER_PAYMENT";

export interface CashbookEntry extends Omit<CashbookEntryData, "branchId"> {
  branchId?: string;
}

export interface CashbookSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

export interface CashbookReport {
  summary: CashbookSummary;
  entries: CashbookEntry[];
}

export interface CashbookFilters {
  branchId?: string | number | null;
  startDate?: string;
  endDate?: string;
}

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

const normalizeDate = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const normalizeEntry = (entry: CashbookEntryData): CashbookEntry => ({
  ...entry,
  date: normalizeDate(entry.date),
  branchId: entry.branchId != null ? String(entry.branchId) : undefined,
  amount: toNumber(entry.amount),
  debtAmount: toNumber(entry.debtAmount),
  paymentAmount: toNumber(entry.paymentAmount),
});

export const CashbookService = {
  async getReport(filters: CashbookFilters = {}): Promise<CashbookReport> {
    const report = await FinancialService.getCashbook({
      branchId: filters.branchId ?? undefined,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    const normalized: CashbookReportData = report || { summary: { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 }, entries: [] };

    return {
      summary: {
        openingBalance: toNumber(normalized.summary?.openingBalance),
        totalIncome: toNumber(normalized.summary?.totalIncome),
        totalExpense: toNumber(normalized.summary?.totalExpense),
        closingBalance: toNumber(normalized.summary?.closingBalance),
      },
      entries: Array.isArray(normalized.entries)
        ? normalized.entries.map(normalizeEntry)
        : [],
    };
  },

  groupByPeriod(entries: CashbookEntry[], mode: "day" | "month") {
    const map = new Map<
      string,
      { key: string; income: number; expense: number; net: number; count: number }
    >();

    entries.forEach((entry) => {
      const key = mode === "day" ? entry.date : entry.date.slice(0, 7);
      const current = map.get(key) || {
        key,
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      };
      if (entry.direction === "IN") current.income += entry.amount;
      else current.expense += entry.amount;
      current.net = current.income - current.expense;
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  },
};
