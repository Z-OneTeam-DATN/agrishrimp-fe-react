"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileText,
  HelpCircle,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatNumber } from "@/lib/utils";
import { branchService } from "@/app/services/branchService";
import {
  CashbookEntry,
  CashbookReport,
  CashbookService,
} from "@/app/services/cashbook.service";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";

type BranchOption = { id: number; name: string };
type ChartMode = "day" | "month";
type EntryTypeFilter = "all" | "IN" | "OUT";

const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(defaultStart.getDate() - 30);

const toIso = (date: Date) => date.toISOString().slice(0, 10);
const compactCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value || 0);

const formatPaymentMethod = (value?: string) => {
  switch (value) {
    case "CASH":
      return "Tiền mặt";
    case "TRANSFER":
      return "Chuyển khoản";
    case "OTHER":
      return "Khác";
    default:
      return value || "N/A";
  }
};

export default function CashbookPage() {
  const { user, warehouseId } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isAdmin ? "all" : ownBranchId || "all",
  );
  const [startDate, setStartDate] = useState(toIso(defaultStart));
  const [endDate, setEndDate] = useState(toIso(today));
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryTypeFilter>("all");
  const [chartMode, setChartMode] = useState<ChartMode>("day");
  const [entries, setEntries] = useState<CashbookEntry[]>([]);
  const [summary, setSummary] = useState<CashbookReport["summary"]>({
    openingBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    closingBalance: 0,
  });
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const branchRes = await branchService.getAll();
        const list = Array.isArray(branchRes)
          ? branchRes
          : branchRes?.data || branchRes?.content || [];
        if (!isAdmin && ownBranchId) {
          setBranches(
            list.filter(
              (item: BranchOption) => item.id.toString() === ownBranchId,
            ),
          );
        } else {
          setBranches(list);
        }
      } catch (error) {
        console.error("Không tải được dữ liệu sổ quỹ", error);
        toast.error("Không thể tải dữ liệu sổ quỹ");
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [isAdmin, ownBranchId]);

  useEffect(() => {
    if (!isAdmin && ownBranchId) {
      setSelectedBranchId(ownBranchId);
    }
  }, [isAdmin, ownBranchId]);

  const fetchCashbook = useCallback(async () => {
    try {
      setLoading(true);
      const cashbookRes = await CashbookService.getReport({
        branchId: selectedBranchId,
        startDate,
        endDate,
      });
      setEntries(cashbookRes.entries);
      setSummary(cashbookRes.summary);
    } catch (error) {
      console.error("Không tải được dữ liệu sổ quỹ", error);
      toast.error("Không thể tải dữ liệu sổ quỹ");
    } finally {
      setLoading(false);
    }
  }, [endDate, selectedBranchId, startDate]);

  useEffect(() => {
    void fetchCashbook();
  }, [fetchCashbook]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword =
        !keyword ||
        [
          entry.code,
          entry.title,
          entry.description,
          entry.branchName,
          entry.creatorName,
          entry.partnerName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesType = typeFilter === "all" || entry.direction === typeFilter;
      return matchesKeyword && matchesType;
    });
  }, [entries, searchTerm, typeFilter]);

  const filteredTotals = useMemo(
    () =>
      filteredEntries.reduce(
        (acc, entry) => {
          if (entry.direction === "IN") {
            acc.income += entry.amount;
          } else {
            acc.expense += entry.amount;
          }
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [filteredEntries],
  );

  const chartData = useMemo(() => {
    const grouped = CashbookService.groupByPeriod(filteredEntries, chartMode);
    return grouped.map((item) => ({
      period: chartMode === "day" ? formatDateVN(item.key) : item.key.replace("-", "/"),
      income: item.income,
      expense: item.expense,
      net: item.net,
    }));
  }, [filteredEntries, chartMode]);

  const branchLabel =
    selectedBranchId === "all"
      ? "Tất cả chi nhánh"
      : branches.find((b) => b.id.toString() === selectedBranchId)?.name ||
        "Chi nhánh";

  const ledgerRows = filteredEntries.slice(0, 120);

  const exportExcel = () => {
    const data = filteredEntries.map((entry) => ({
      Ngày: formatDateVN(entry.date),
      "Mã phiếu": entry.code,
      Loại: entry.direction === "IN" ? "THU" : "CHI",
      Nguồn: entry.title,
      "Diễn giải": entry.description,
      "Chi nhánh": entry.branchName,
      "Người tạo": entry.creatorName,
      "Số tiền": entry.amount,
      "Công nợ còn lại": entry.debtAmount,
      "Phương thức thanh toán": formatPaymentMethod(entry.paymentMethod),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "So quy");
    XLSX.writeFile(workbook, `So_quy_${startDate}_den_${endDate}.xlsx`);
    toast.success("Đã xuất Excel sổ quỹ");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("SO QUY AGRI SHRIMP", 14, 14);
    doc.setFontSize(10);
    doc.text(`Chi nhanh: ${branchLabel}`, 14, 20);
    doc.text(`Ky bao cao: ${formatDateVN(startDate)} - ${formatDateVN(endDate)}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [[
        "Ngay",
        "Ma phieu",
        "Loai",
        "Nguon",
        "Dien giai",
        "So tien",
        "Cong no",
        "Phuong thuc",
      ]],
      body: filteredEntries.map((entry) => [
        formatDateVN(entry.date),
        entry.code,
        entry.direction === "IN" ? "THU" : "CHI",
        entry.title,
        entry.description,
        formatNumber(entry.amount),
        formatNumber(entry.debtAmount),
        formatPaymentMethod(entry.paymentMethod),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`So_quy_${startDate}_den_${endDate}.pdf`);
    toast.success("Đã xuất PDF sổ quỹ");
  };


  const chartWindow = useMemo(() => chartData.slice(-12), [chartData]);
  const chartMax = useMemo(() => {
    if (chartWindow.length === 0) return 1;
    return Math.max(
      1,
      ...chartWindow.map((item) =>
        Math.max(Number(item.income || 0), Number(item.expense || 0)),
      ),
    );
  }, [chartWindow]);
  const netAbsMax = useMemo(() => {
    if (chartWindow.length === 0) return 1;
    return Math.max(
      1,
      ...chartWindow.map((item) => Math.abs(Number(item.net || 0))),
    );
  }, [chartWindow]);
  const totalFlowValue = useMemo(
    () => summary.totalIncome + summary.totalExpense,
    [summary.totalIncome, summary.totalExpense],
  );
  const totalFlow = useMemo(() => Math.max(1, totalFlowValue), [totalFlowValue]);
  const incomeRatio = Math.round((summary.totalIncome / totalFlow) * 100);
  const expenseRatio = 100 - incomeRatio;

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Sổ quỹ / Tiền chi
            </h1>
          </div>

          <Button
            variant="outline"
            className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
            onClick={() => setIsExplainOpen(true)}
          >
            <HelpCircle size={16} className="mr-2" />
            Trợ giúp
          </Button>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-end">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Chi nhánh
              </p>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger
                  className="h-[38px] w-full min-w-[220px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus:ring-0 lg:w-[260px]"
                  disabled={!isAdmin}
                >
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="all">Tất cả chi nhánh</SelectItem>}
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Từ ngày
              </p>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-[38px] min-w-[180px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 lg:w-[190px]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Đến ngày
              </p>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-[38px] min-w-[180px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 lg:w-[190px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={() => void fetchCashbook()}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
              Làm mới
            </Button>
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none"
              onClick={exportExcel}
            >
              <Download size={14} className="mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none"
              onClick={exportPdf}
            >
              <FileText size={14} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Số dư đầu kỳ
            </p>
            <p className="mt-2 text-[28px] font-semibold tracking-tight text-slate-800">
              {formatNumber(summary.openingBalance)}
            </p>
          </div>
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tổng thu
            </p>
            <p className="mt-2 text-[28px] font-semibold tracking-tight text-emerald-600">
              {formatNumber(summary.totalIncome)}
            </p>
          </div>
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tổng chi
            </p>
            <p className="mt-2 text-[28px] font-semibold tracking-tight text-rose-600">
              {formatNumber(summary.totalExpense)}
            </p>
          </div>
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tồn cuối kỳ
            </p>
            <p className="mt-2 text-[28px] font-semibold tracking-tight text-blue-600">
              {formatNumber(summary.closingBalance)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Biểu đồ sổ quỹ
            </p>
          </div>
          <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-800">
                Thu - chi theo {chartMode === "day" ? "ngày" : "tháng"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={chartMode === "day" ? "default" : "outline"}
                className={cn(
                  "h-[38px] px-4 text-[13px] font-medium shadow-none",
                  chartMode === "day"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                )}
                onClick={() => setChartMode("day")}
              >
                Theo ngày
              </Button>
              <Button
                variant={chartMode === "month" ? "default" : "outline"}
                className={cn(
                  "h-[38px] px-4 text-[13px] font-medium shadow-none",
                  chartMode === "month"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                )}
                onClick={() => setChartMode("month")}
              >
                Theo tháng
              </Button>
            </div>
          </div>

          <div className="w-full">
            {chartWindow.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center rounded-[10px] border border-dashed border-slate-200 bg-slate-50/60 text-[13px] font-medium text-slate-400">
                Chưa có dữ liệu để vẽ biểu đồ trong khoảng thời gian đã chọn
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
                <div className="rounded-[10px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Thu
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        Chi
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      Hiển thị {chartWindow.length} mốc gần nhất
                    </span>
                  </div>

                  <div className="grid h-[300px] grid-cols-1 grid-rows-[1fr_auto] gap-3">
                    <div className="relative overflow-hidden rounded-[8px] border border-slate-100 bg-white px-3 pt-4">
                      <div className="pointer-events-none absolute inset-x-0 top-[20%] border-t border-dashed border-slate-200" />
                      <div className="pointer-events-none absolute inset-x-0 top-[40%] border-t border-dashed border-slate-200" />
                      <div className="pointer-events-none absolute inset-x-0 top-[60%] border-t border-dashed border-slate-200" />
                      <div className="pointer-events-none absolute inset-x-0 top-[80%] border-t border-dashed border-slate-200" />
                      <div className="flex h-full items-end gap-3 overflow-x-auto pb-3">
                        {chartWindow.map((item) => {
                          const incomeHeight = Math.max(
                            item.income > 0 ? 10 : 0,
                            Math.round((Number(item.income || 0) / chartMax) * 220),
                          );
                          const expenseHeight = Math.max(
                            item.expense > 0 ? 10 : 0,
                            Math.round((Number(item.expense || 0) / chartMax) * 220),
                          );

                          return (
                            <div
                              key={item.period}
                              className="flex min-w-[56px] flex-1 flex-col items-center justify-end gap-2"
                              title={`Kỳ ${item.period} | Thu: ${formatNumber(item.income)} | Chi: ${formatNumber(item.expense)}`}
                            >
                              <div className="flex h-[220px] items-end gap-1.5">
                                <div
                                  className="w-4 rounded-t-[6px] bg-emerald-500 shadow-[0_8px_18px_rgba(16,185,129,0.18)]"
                                  style={{ height: `${incomeHeight}px` }}
                                />
                                <div
                                  className="w-4 rounded-t-[6px] bg-rose-500 shadow-[0_8px_18px_rgba(239,68,68,0.18)]"
                                  style={{ height: `${expenseHeight}px` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {chartWindow.map((item) => (
                        <div
                          key={`label-${item.period}`}
                          className="min-w-[56px] flex-1 text-center text-[10px] font-medium text-slate-500"
                        >
                          {item.period}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-[10px] border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Tỉ trọng thu chi
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          Cơ cấu dòng tiền
                        </p>
                      </div>
                      <div className="rounded-full bg-slate-100 p-2 text-slate-500">
                        <Wallet size={16} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-1">
                      <div className="relative">
                        <div
                          className="mx-auto h-[190px] w-[190px] rounded-full"
                          style={{
                            background: `conic-gradient(#10b981 0 ${incomeRatio}%, #ef4444 ${incomeRatio}% 100%)`,
                          }}
                        >
                          <div className="mx-auto mt-[34px] flex h-[122px] w-[122px] flex-col items-center justify-center rounded-full bg-white">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Lưu chuyển
                            </span>
                            <span className="mt-1 text-lg font-black text-slate-800">
                              {chartWindow.length}
                            </span>
                            <span className="text-[11px] text-slate-500">chu kỳ</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-[10px] bg-slate-50 px-4 py-3 text-center">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Tổng lưu chuyển
                          </p>
                          <p className="mt-1 text-xl font-black text-slate-800">
                            {formatNumber(totalFlowValue)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[10px] border border-emerald-100 bg-emerald-50/70 px-3 py-3">
                            <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <ArrowUpRight size={14} />
                              Thu
                            </p>
                            <p className="mt-1 text-lg font-black text-emerald-600">
                              {incomeRatio}%
                            </p>
                            <p className="text-[11px] text-emerald-700/80">
                              {formatNumber(summary.totalIncome)}
                            </p>
                          </div>
                          <div className="rounded-[10px] border border-rose-100 bg-rose-50/70 px-3 py-3">
                            <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                              <ArrowDownRight size={14} />
                              Chi
                            </p>
                            <p className="mt-1 text-lg font-black text-rose-600">
                              {expenseRatio}%
                            </p>
                            <p className="text-[11px] text-rose-700/80">
                              {formatNumber(summary.totalExpense)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Dòng tiền ròng
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          So sánh thặng dư từng kỳ
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-bold",
                          summary.closingBalance >= 0
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {summary.closingBalance >= 0 ? "Dương" : "Âm"}
                      </span>
                    </div>

                    <div className="relative h-[190px] overflow-hidden rounded-[8px] border border-slate-100 bg-white px-3 py-3">
                      <div className="absolute inset-x-3 top-1/2 border-t border-dashed border-slate-300" />
                      <div className="flex h-full items-center gap-3 overflow-x-auto">
                        {chartWindow.map((item) => {
                          const net = Number(item.net || 0);
                          const height = Math.max(
                            Math.abs(net) > 0 ? 10 : 0,
                            Math.round((Math.abs(net) / netAbsMax) * 72),
                          );

                          return (
                            <div
                              key={`net-${item.period}`}
                              className="flex min-w-[38px] flex-1 flex-col items-center justify-center"
                              title={`Ròng ${item.period}: ${formatNumber(net)}`}
                            >
                              <div className="flex h-full items-center">
                                <div className="flex h-[144px] items-center">
                                  <div
                                    className={cn(
                                      "w-5 rounded-[6px]",
                                      net >= 0 ? "self-start bg-blue-500" : "self-end bg-amber-500",
                                    )}
                                    style={{ height: `${height}px` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                      <span>Dương: xanh</span>
                      <span>Âm: cam</span>
                      <span>Biên độ max: {compactCurrency(netAbsMax)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Danh sách giao dịch
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[280px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={16}
                />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã phiếu, diễn giải, chi nhánh..."
                  className="h-[38px] rounded-md border-slate-200 pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as EntryTypeFilter)}
              >
                <SelectTrigger className="h-[38px] w-[160px] rounded-md border-slate-200 text-[13px] shadow-none">
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="IN">Phiếu thu</SelectItem>
                  <SelectItem value="OUT">Phiếu chi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[1220px]">
              <TableHeader>
                <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                  <TableHead className="w-[120px] p-3 text-[12px] font-semibold text-[#1f1f1f]">Ngày</TableHead>
                  <TableHead className="w-[130px] p-3 text-[12px] font-semibold text-[#1f1f1f]">Mã phiếu</TableHead>
                  <TableHead className="w-[90px] p-3 text-[12px] font-semibold text-[#1f1f1f]">Loại</TableHead>
                  <TableHead className="min-w-[260px] p-3 text-[12px] font-semibold text-[#1f1f1f]">Diễn giải</TableHead>
                  <TableHead className="w-[160px] p-3 text-[12px] font-semibold text-[#1f1f1f]">Chi nhánh</TableHead>
                  <TableHead className="w-[170px] p-3 text-[12px] font-semibold text-[#1f1f1f]">Người tạo</TableHead>
                  <TableHead className="w-[130px] p-3 text-right text-[12px] font-semibold text-[#1f1f1f]">Số tiền</TableHead>
                  <TableHead className="w-[130px] p-3 text-right text-[12px] font-semibold text-[#1f1f1f]">Công nợ</TableHead>
                  <TableHead className="w-[150px] p-3 text-center text-[12px] font-semibold text-[#1f1f1f]">Phương thức</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerRows.map((entry) => (
                  <TableRow key={entry.id} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                    <TableCell className="whitespace-nowrap p-3 text-[12px] font-medium text-slate-600">
                      {formatDateVN(entry.date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap p-3 text-[12px] font-semibold uppercase text-slate-800">
                      {entry.code}
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge
                        className={cn(
                          "border-none text-[10px] font-semibold",
                          entry.direction === "IN"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600",
                        )}
                      >
                        {entry.direction === "IN" ? "THU" : "CHI"}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-slate-800">
                          {entry.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {entry.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-[12px] text-slate-600">
                      {entry.branchName || branchLabel}
                    </TableCell>
                    <TableCell className="p-3 text-[12px] text-slate-600">
                      {entry.creatorName || "Hệ thống"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap p-3 text-right font-semibold",
                        entry.direction === "IN"
                          ? "text-emerald-600"
                          : "text-rose-600",
                      )}
                    >
                      {formatNumber(entry.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap p-3 text-right text-slate-600">
                      {formatNumber(entry.debtAmount)}
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {formatPaymentMethod(entry.paymentMethod)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-[#f8f9fa] px-6 py-3">
            <div className="flex items-center gap-6 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>
                Hiển thị {ledgerRows.length} / {filteredEntries.length} giao dịch
              </span>
              <span className="text-emerald-600">
                Thu hiển thị: {formatNumber(filteredTotals.income)}
              </span>
              <span className="text-rose-600">
                Chi hiển thị: {formatNumber(filteredTotals.expense)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-slate-200 bg-white text-[11px] shadow-none"
                onClick={exportExcel}
              >
                <Download size={14} className="mr-1.5" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-slate-200 bg-white text-[11px] shadow-none"
                onClick={exportPdf}
              >
                <FileText size={14} className="mr-1.5" />
                PDF
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>

      <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase">Trợ giúp sổ quỹ</DialogTitle>
            <DialogDescription>
              Sổ quỹ này chỉ ghi nhận các giao dịch thực sự ảnh hưởng tiền đã được
              ghi sổ, hiện tại là phiếu thanh toán nhà cung cấp.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-bold text-slate-800">Số dư đầu kỳ:</span>{" "}
              bằng tổng dòng tiền đã ghi nhận trước ngày bắt đầu. Hệ thống hiện
              mới có dòng chi thanh toán NCC nên số dư đầu kỳ phản ánh số đã chi
              lũy kế trước kỳ.
            </p>
            <p>
              <span className="font-bold text-slate-800">Tổng thu / tổng chi:</span>{" "}
              chỉ tính giao dịch tiền thực tế trong kỳ đang chọn. Chứng từ kho,
              phiếu dự thảo hoặc trạng thái chưa phát sinh tiền không được đưa vào
              sổ quỹ.
            </p>
            <p>
              <span className="font-bold text-slate-800">Số dư cuối kỳ:</span>{" "}
              bằng số dư đầu kỳ + tổng thu - tổng chi, dùng cùng một nguồn dữ liệu
              backend với bảng, biểu đồ và file xuất.
            </p>
            <p>
              <span className="font-bold text-slate-800">Phạm vi dữ liệu:</span>{" "}
              hiện màn này chỉ phản ánh các phiếu thanh toán nhà cung cấp đã ghi
              nhận. Phiếu nhập/xuất kho không có bút toán tiền riêng sẽ không xuất
              hiện ở đây.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
