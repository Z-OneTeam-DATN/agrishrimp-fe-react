"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  HelpCircle,
  Download,
  Search,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatNumber } from "@/lib/utils";
import { branchService } from "@/app/services/branchService";
import { CashbookEntry, CashbookService } from "@/app/services/cashbook.service";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type BranchOption = { id: number; name: string; branchCode?: string };
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

export default function CashbookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [startDate, setStartDate] = useState(toIso(defaultStart));
  const [endDate, setEndDate] = useState(toIso(today));
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryTypeFilter>("all");
  const [chartMode, setChartMode] = useState<ChartMode>("day");
  const [entries, setEntries] = useState<CashbookEntry[]>([]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const branchRes = await branchService.getAll();

        setBranches(Array.isArray(branchRes) ? branchRes : (branchRes?.data || branchRes?.content || []));
      } catch (error) {
        console.error("Không tải được dữ liệu sổ quỹ", error);
        toast.error("Không thể tải dữ liệu sổ quỹ");
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, []);

  useEffect(() => {
    const fetchCashbook = async () => {
      try {
        setLoading(true);
        const cashbookRes = await CashbookService.getEntries({ branchId: selectedBranchId });
        setEntries(cashbookRes);
      } catch (error) {
        console.error("Không tải được dữ liệu sổ quỹ", error);
        toast.error("Không thể tải dữ liệu sổ quỹ");
      } finally {
        setLoading(false);
      }
    };

    fetchCashbook();
  }, [selectedBranchId, startDate, endDate]);

  const filteredEntries = useMemo(() => {
    const rangedEntries = entries.filter((entry) => {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });

    return rangedEntries.filter((entry) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword = !keyword || [entry.code, entry.title, entry.description, entry.branchName, entry.creatorName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesType = typeFilter === "all" || entry.direction === typeFilter;
      return matchesKeyword && matchesType;
    });
  }, [entries, startDate, endDate, searchTerm, typeFilter]);

  const summary = useMemo(() => CashbookService.buildSummary(entries, startDate, endDate), [entries, startDate, endDate]);

  const chartData = useMemo(() => {
    const grouped = CashbookService.groupByPeriod(filteredEntries, chartMode);
    return grouped.map((item) => ({
      period: chartMode === "day" ? formatDateVN(item.key) : item.key.replace("-", "/"),
      income: item.income,
      expense: item.expense,
      net: item.net,
    }));
  }, [filteredEntries, chartMode]);

  const branchLabel = selectedBranchId === "all"
    ? "Tất cả chi nhánh"
    : branches.find((b) => b.id.toString() === selectedBranchId)?.name || "Chi nhánh";

  const ledgerRows = filteredEntries.slice(0, 120);

  const exportExcel = () => {
    const data = filteredEntries.map((entry) => ({
      "Ngày": formatDateVN(entry.date),
      "Mã phiếu": entry.code,
      "Loại": entry.direction === "IN" ? "THU" : "CHI",
      "Nguồn": entry.title,
      "Diễn giải": entry.description,
      "Chi nhánh": entry.branchName,
      "Người tạo": entry.creatorName,
      "Số tiền": entry.amount,
      "Công nợ": entry.debtAmount,
      "Trạng thái": entry.status,
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
      head: [["Ngay", "Ma phieu", "Loai", "Nguon", "Dien giai", "So tien", "Cong no"]],
      body: filteredEntries.map((entry) => [
        formatDateVN(entry.date),
        entry.code,
        entry.direction === "IN" ? "THU" : "CHI",
        entry.title,
        entry.description,
        formatNumber(entry.amount),
        formatNumber(entry.debtAmount),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`So_quy_${startDate}_den_${endDate}.pdf`);
    toast.success("Đã xuất PDF sổ quỹ");
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const cashbookRes = await CashbookService.getEntries({ branchId: selectedBranchId });
      setEntries(cashbookRes);
    } finally {
      setLoading(false);
    }
  };

  const visibleChart = chartData;

  return (
    <div className="space-y-0 pb-10 bg-[#f0f2f5] min-h-screen">
      <div className="px-6 py-3 flex items-center gap-6 bg-white border-b border-slate-200 shadow-sm flex-wrap">
        <div className="flex items-center gap-3 border-r pr-6 border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/financial")}
            className="h-8 w-8 text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 rounded-none"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[19px] font-black text-slate-800 tracking-tight whitespace-nowrap uppercase">Sổ quỹ</h1>
            <p className="text-[11px] text-slate-500 font-medium">Theo dõi thu chi và số dư quỹ theo kỳ báo cáo</p>
          </div>
        </div>

        <div className="flex items-center gap-0 border border-slate-300 bg-white">
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="h-8 w-[190px] text-[12px] border-none rounded-none shadow-none focus:ring-0 font-medium">
              <SelectValue placeholder="Tất cả chi nhánh" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 border border-slate-300 bg-white px-3 h-8">
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-7 w-[140px] border-none shadow-none text-[12px] p-0" />
          <span className="text-[12px] text-slate-400 font-medium">-</span>
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-7 w-[140px] border-none shadow-none text-[12px] p-0" />
          <ChevronDown size={14} className="ml-1 text-slate-400" />
        </div>

        <div className="ms-auto flex items-center gap-3 flex-wrap">
          <Button variant="outline" className="h-8 rounded-none border-slate-200 text-slate-500 font-medium text-[12px] hover:bg-slate-50" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} /> Làm mới
          </Button>
          <Button variant="outline" className="h-8 rounded-none border-slate-200 text-slate-500 font-medium text-[12px] hover:bg-slate-50" onClick={exportExcel}>
            <Download size={14} className="mr-2" /> Excel
          </Button>
          <Button variant="outline" className="h-8 rounded-none border-slate-200 text-slate-500 font-medium text-[12px] hover:bg-slate-50" onClick={exportPdf}>
            <FileText size={14} className="mr-2" /> PDF
          </Button>
          <Button variant="ghost" className="h-8 rounded-none text-slate-500 text-[12px] font-medium">
            <HelpCircle size={14} className="mr-2" /> Giải thích
          </Button>
        </div>
      </div>

      <div className="px-6 py-6 bg-white border-b border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center group cursor-pointer p-4 border border-slate-100 rounded-[4px] bg-slate-50/30">
            <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-blue-600 transition-colors">Số dư đầu kỳ</p>
            <p className="text-[18px] font-bold text-slate-800">{formatNumber(summary.openingBalance)}</p>
          </div>
          <div className="text-center group cursor-pointer p-4 border border-emerald-100 rounded-[4px] bg-emerald-50/30">
            <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-emerald-600 transition-colors uppercase">Tổng thu</p>
            <p className="text-[18px] font-bold text-emerald-600">{formatNumber(summary.totalIncome)}</p>
          </div>
          <div className="text-center group cursor-pointer p-4 border border-rose-100 rounded-[4px] bg-rose-50/30">
            <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-rose-600 transition-colors uppercase">Tổng chi</p>
            <p className="text-[18px] font-bold text-rose-600">{formatNumber(summary.totalExpense)}</p>
          </div>
          <div className="text-center group cursor-pointer p-4 border border-blue-100 rounded-[4px] bg-blue-50/30">
            <p className="text-[12px] text-slate-500 font-medium mb-1 group-hover:text-blue-600 transition-colors uppercase">Tồn cuối kỳ</p>
            <p className="text-[18px] font-black text-blue-600">{formatNumber(summary.closingBalance)}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="bg-white border border-[#dcdcdc] rounded-none shadow-sm p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Biểu đồ sổ quỹ</p>
              <h2 className="text-[17px] font-bold text-slate-800">Thu - chi theo {chartMode === "day" ? "ngày" : "tháng"}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={chartMode === "day" ? "default" : "outline"} className="rounded-none h-8" onClick={() => setChartMode("day")}>Theo ngày</Button>
              <Button variant={chartMode === "month" ? "default" : "outline"} className="rounded-none h-8" onClick={() => setChartMode("month")}>Theo tháng</Button>
            </div>
          </div>

          <div className="h-[320px] w-full">
            {visibleChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-slate-400 font-medium">
                Chưa có dữ liệu để vẽ biểu đồ trong khoảng thời gian đã chọn
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visibleChart} barCategoryGap={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Bar dataKey="income" fill="#10b981" name="Tổng thu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Tổng chi" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="bg-white border border-[#dcdcdc] rounded-none shadow-sm p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-[#fcfcfc]">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Danh sách giao dịch</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm mã phiếu, diễn giải, chi nhánh..." className="h-[36px] pl-10 text-[13px] border-slate-200 rounded-none shadow-none focus:border-blue-500" />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EntryTypeFilter)}>
                <SelectTrigger className="h-[36px] w-[160px] rounded-none border-slate-200 text-[12px] shadow-none">
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="IN">Phiếu thu</SelectItem>
                  <SelectItem value="OUT">Phiếu chi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa]">
                  <TableHead className="w-[120px]">Ngày</TableHead>
                  <TableHead className="w-[130px]">Mã phiếu</TableHead>
                  <TableHead className="w-[90px]">Loại</TableHead>
                  <TableHead className="min-w-[260px]">Diễn giải</TableHead>
                  <TableHead className="w-[160px]">Chi nhánh</TableHead>
                  <TableHead className="w-[170px]">Người tạo</TableHead>
                  <TableHead className="w-[130px] text-right">Số tiền</TableHead>
                  <TableHead className="w-[130px] text-right">Công nợ</TableHead>
                  <TableHead className="w-[130px] text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerRows.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-blue-50/20">
                    <TableCell className="text-[12px] font-medium text-slate-600 whitespace-nowrap">{formatDateVN(entry.date)}</TableCell>
                    <TableCell className="font-black text-[12px] text-slate-800 uppercase whitespace-nowrap">{entry.code}</TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-none border-none text-[10px] font-black", entry.direction === "IN" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>{entry.direction === "IN" ? "THU" : "CHI"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-[13px] text-slate-800">{entry.title}</span>
                        <span className="text-[11px] text-slate-500">{entry.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-600">{entry.branchName || branchLabel}</TableCell>
                    <TableCell className="text-[12px] text-slate-600">{entry.creatorName || "Hệ thống"}</TableCell>
                    <TableCell className={cn("text-right font-black whitespace-nowrap", entry.direction === "IN" ? "text-emerald-600" : "text-rose-600")}>{formatNumber(entry.amount)}</TableCell>
                    <TableCell className="text-right text-slate-600 whitespace-nowrap">{formatNumber(entry.debtAmount)}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-[10px] font-black px-2 py-0.5 rounded border uppercase", entry.status === "COMPLETED" || entry.status === "IMPORTED" ? "text-emerald-600 bg-emerald-50 border-emerald-100" : entry.status === "PENDING" || entry.status === "PO" ? "text-amber-600 bg-amber-50 border-amber-100" : "text-slate-500 bg-slate-50 border-slate-100")}>{entry.status || "N/A"}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-[#fcfcfc] flex-wrap gap-2">
            <div className="flex items-center gap-6 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>Hiển thị {ledgerRows.length} / {filteredEntries.length} giao dịch</span>
              <span className="text-emerald-600">Thu: {formatNumber(summary.totalIncome)}</span>
              <span className="text-rose-600">Chi: {formatNumber(summary.totalExpense)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 rounded-none border-slate-200 text-[11px]" onClick={exportExcel}><Download size={14} className="mr-1.5" /> Excel</Button>
              <Button variant="outline" size="sm" className="h-7 rounded-none border-slate-200 text-[11px]" onClick={exportPdf}><FileText size={14} className="mr-1.5" /> PDF</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
