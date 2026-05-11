import { apiJava } from "@/lib/axios";
import type {
  CashbookEntryData,
  CashbookReportData,
} from "@/app/services/financial-report.types";

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
});

export const CashbookService = {
  async getReport(filters: CashbookFilters = {}): Promise<CashbookReport> {
    const response = await apiJava.get("/financial/cashbook", {
      params: {
        branchId:
          !filters.branchId || filters.branchId === "all"
            ? null
            : filters.branchId,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      },
    });
    const report = response.data;

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
      { key: string; income: number; expense: number; net: number }
    >();

    entries.forEach((entry) => {
      const key = mode === "day" ? entry.date : entry.date.slice(0, 7);
      const current = map.get(key) || {
        key,
        income: 0,
        expense: 0,
        net: 0,
      };
      if (entry.direction === "IN") current.income += entry.amount;
      else current.expense += entry.amount;
      current.net = current.income - current.expense;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  },
};
