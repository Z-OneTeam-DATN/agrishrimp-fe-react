import { InventoryApiService, InventoryExportApiService } from "@/app/services/inventory.service";

export type CashbookDirection = "IN" | "OUT";
export type CashbookSource = "RECEIPT" | "EXPORT_COMMAND" | "EXPORT_RECEIPT";

export interface CashbookEntry {
  id: string;
  date: string;
  direction: CashbookDirection;
  source: CashbookSource;
  code: string;
  title: string;
  description: string;
  branchName: string;
  partnerName: string;
  creatorName: string;
  status: string;
  amount: number;
  debtAmount: number;
  paymentAmount: number;
}

export interface CashbookSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
}

export interface CashbookFilters {
  branchId?: string | number | null;
  startDate?: string;
  endDate?: string;
}

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

const normalizeDate = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && "date" in value) return String((value as any).date).slice(0, 10);
  return String(value).slice(0, 10);
};

const inDateRange = (date: string, startDate?: string, endDate?: string) => {
  if (!date) return false;
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
};

const branchMatches = (item: any, branchId?: string | number | null) => {
  if (!branchId || branchId === "all") return true;
  const value = String(branchId);
  return String(item?.branchId ?? item?.branch?.id ?? "") === value;
};

const extractAmount = (item: any, fallback = 0) => {
  const paymentAmount = toNumber(item?.paymentAmount);
  const totalAmount = toNumber(item?.totalAmount);
  const debtAmount = toNumber(item?.debtAmount);
  return paymentAmount > 0 ? paymentAmount : totalAmount > 0 ? totalAmount - debtAmount : fallback;
};

const extractDate = (item: any) => normalizeDate(item?.createdAt || item?.entryDate || item?.checkDate || item?.date);

const mapReceipt = (item: any): CashbookEntry | null => {
  const date = extractDate(item);
  if (!date) return null;
  return {
    id: `receipt-${item.id ?? item.code ?? date}`,
    date,
    direction: "OUT",
    source: "RECEIPT",
    code: item.code || `RC-${item.id}`,
    title: item.noteType === "IMPORT" || item.noteType === "PO" ? "Phiếu nhập kho" : "Phiếu nhập kho",
    description: item.supplierName || item.displayPartnerName || item.partnerBranchName || "Nhà cung cấp / đối tác",
    branchName: item.branchName || "",
    partnerName: item.supplierName || item.displayPartnerName || item.partnerBranchName || "",
    creatorName: item.creatorName || item.createdByName || "",
    status: item.status || "",
    amount: extractAmount(item),
    debtAmount: toNumber(item.debtAmount),
    paymentAmount: toNumber(item.paymentAmount),
  };
};

const mapExport = (item: any, source: CashbookSource): CashbookEntry | null => {
  const date = extractDate(item);
  if (!date) return null;
  const hasSupplier = Boolean(item?.supplierId || item?.supplierName);
  const direction: CashbookDirection = hasSupplier ? "OUT" : "IN";
  const amount = extractAmount(item);
  return {
    id: `${source.toLowerCase()}-${item.id ?? item.code ?? date}`,
    date,
    direction,
    source,
    code: item.code || `EX-${item.id}`,
    title: hasSupplier ? "Phiếu xuất trả NCC" : item.partnerBranchId ? "Điều chuyển nội bộ" : "Phiếu xuất kho",
    description: item.supplierName || item.partnerBranchName || item.branchName || "Đối tác / chi nhánh",
    branchName: item.branchName || "",
    partnerName: item.supplierName || item.partnerBranchName || "",
    creatorName: item.creatorName || item.createdByName || "",
    status: item.status || "",
    amount,
    debtAmount: toNumber(item.debtAmount),
    paymentAmount: toNumber(item.paymentAmount),
  };
};

export const CashbookService = {
  async getEntries(filters: CashbookFilters = {}): Promise<CashbookEntry[]> {
    const [receiptsRes, exportCommandsRes, exportReceiptsRes] = await Promise.all([
      InventoryApiService.getAllReceipts(),
      InventoryExportApiService.getAllExportCommands(),
      InventoryExportApiService.getAllExportReceipts(),
    ]);

    const receipts = Array.isArray(receiptsRes) ? receiptsRes : (receiptsRes?.data || receiptsRes?.content || []);
    const exportCommands = Array.isArray(exportCommandsRes) ? exportCommandsRes : (exportCommandsRes?.data || exportCommandsRes?.content || []);
    const exportReceipts = Array.isArray(exportReceiptsRes) ? exportReceiptsRes : (exportReceiptsRes?.data || exportReceiptsRes?.content || []);

    const entries = [
      ...receipts.map(mapReceipt).filter(Boolean),
      ...exportCommands.map((item: any) => mapExport(item, "EXPORT_COMMAND")).filter(Boolean),
      ...exportReceipts.map((item: any) => mapExport(item, "EXPORT_RECEIPT")).filter(Boolean),
    ] as CashbookEntry[];

    return entries
      .filter((item) => branchMatches(item, filters.branchId))
      .filter((item) => inDateRange(item.date, filters.startDate, filters.endDate))
      .sort((a, b) => b.date.localeCompare(a.date) || a.code.localeCompare(b.code));
  },

  buildSummary(entries: CashbookEntry[], startDate?: string, endDate?: string): CashbookSummary {
    const inRange = entries.filter((item) => inDateRange(item.date, startDate, endDate));
    const beforeRange = entries.filter((item) => startDate ? item.date < startDate : false);

    const totalIncome = inRange.filter((item) => item.direction === "IN").reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = inRange.filter((item) => item.direction === "OUT").reduce((sum, item) => sum + item.amount, 0);
    const openingBalance = beforeRange.reduce((sum, item) => sum + (item.direction === "IN" ? item.amount : -item.amount), 0);
    const closingBalance = openingBalance + totalIncome - totalExpense;

    return { openingBalance, totalIncome, totalExpense, closingBalance };
  },

  groupByPeriod(entries: CashbookEntry[], mode: "day" | "month") {
    const map = new Map<string, { key: string; income: number; expense: number; net: number; count: number }>();

    entries.forEach((entry) => {
      const key = mode === "day" ? entry.date : entry.date.slice(0, 7);
      const current = map.get(key) || { key, income: 0, expense: 0, net: 0, count: 0 };
      if (entry.direction === "IN") current.income += entry.amount;
      else current.expense += entry.amount;
      current.net = current.income - current.expense;
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  },
};
