"use client";

import React, { useEffect, useState } from "react";
import { Download, HelpCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatNumber } from "@/lib/utils";
import {
  ProfitLossService,
  type ProfitLossData,
} from "@/app/services/profit-loss.service";
import { ProfitLossInsightService, type ProfitLossInsightResult } from "@/app/services/profit-loss-insight";
import { branchService } from "@/app/services/branchService";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/stores/useAuthStore";

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getPrevPeriod = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);

  return {
    prevStart: toIsoDate(prevStart),
    prevEnd: toIsoDate(prevEnd),
  };
};

const formatDateVN = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

export default function ProfitLossReportPage() {
  const { user, warehouseId } = useAuthStore();
  const canSelectAllBranches = !user?.branch?.id && !warehouseId;
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(
    toIsoDate(firstDayOfMonth)
  );
  const [endDate, setEndDate] = useState(toIsoDate(today));
  const [branchId, setBranchId] = useState(
    canSelectAllBranches ? "all" : ownBranchId || "all"
  );
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState<ProfitLossData | null>(null);
  const [prevData, setPrevData] = useState<ProfitLossData | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  // AI states
  const [insightResult, setInsightResult] = useState<ProfitLossInsightResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [analyzingInsight, setAnalyzingInsight] = useState(false);

  const fetchInsightData = async () => {
    if (!startDate || !endDate) return;
    setLoadingInsight(true);
    setAiAnalysis(null); // Clear previous AI analysis when filters change
    try {
      const data = await ProfitLossInsightService.getInsightAnalysis({
        branchId,
        startDate,
        endDate,
      });
      setInsightResult(data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu định lượng P&L AI:", error);
      setInsightResult(null);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!insightResult) {
      toast.error("Không có dữ liệu định lượng để phân tích AI!");
      return;
    }
    setAnalyzingInsight(true);
    try {
      const activeBranch = branches.find((b) => String(b.id) === branchId);
      const branchName = activeBranch ? activeBranch.name : "Toàn bộ hệ thống";
      const explanation = await ProfitLossInsightService.getAiExplanation(
        insightResult,
        branchName,
        startDate,
        endDate
      );
      setAiAnalysis(explanation);
    } catch (error) {
      console.error("Lỗi gọi Gemini AI:", error);
      toast.error("Không thể hoàn thành phân tích lãi lỗ AI");
    } finally {
      setAnalyzingInsight(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      void fetchInsightData();
    }
  }, [startDate, endDate, branchId]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchService.getAll();
        const list = Array.isArray(res)
          ? res
          : res?.data || res?.content || [];
        if (!canSelectAllBranches && ownBranchId) {
          setBranches(
            list.filter((b: { id: number }) => String(b.id) === ownBranchId)
          );
        } else {
          setBranches(list);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách chi nhánh", error);
      }
    };
    fetchBranches();
  }, [canSelectAllBranches, ownBranchId]);

  useEffect(() => {
    if (!canSelectAllBranches && ownBranchId) {
      setBranchId(ownBranchId);
    }
  }, [canSelectAllBranches, ownBranchId]);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const { prevStart, prevEnd } = getPrevPeriod(startDate, endDate);
        const [currRes, prevRes] = await Promise.all([
          ProfitLossService.getReport(startDate, endDate, branchId),
          ProfitLossService.getReport(prevStart, prevEnd, branchId),
        ]);

        setCurrentData(currRes);
        setPrevData(prevRes);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu báo cáo:", error);
        toast.error("Không thể tải dữ liệu báo cáo!");
      } finally {
        setLoading(false);
      }
    };

    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate, branchId]);

  const processData = (d: ProfitLossData | null) => {
    if (!d) {
      return {
        grossRevenue: 0,
        returnedGoods: 0,
        shippingFeeCollected: 0,
        shippingFeeReturned: 0,
        discount: 0,
        discountReturned: 0,
        netProductRevenue: 0,
        netRevenue: 0,
        cogs: 0,
        pointPayment: 0,
        shippingFeePaid: 0,
        cost: 0,
        grossProfit: 0,
        otherIncome: 0,
        customerReturnFee: 0,
        otherExpenses: 0,
        totalInc: 0,
        netProfit: 0,
      };
    }

    const cost = d.cogs + d.pointPayment + d.shippingFeePaid;
    const totalInc = d.otherIncome + d.customerReturnFee;

    return {
      grossRevenue: d.grossRevenue,
      returnedGoods: d.returnedGoods,
      shippingFeeCollected: d.shippingFeeCollected,
      shippingFeeReturned: d.shippingFeeReturned,
      discount: d.discount,
      discountReturned: d.discountReturned,
      netProductRevenue: d.netProductRevenue,
      netRevenue: d.netRevenue,
      cogs: d.cogs,
      pointPayment: d.pointPayment,
      shippingFeePaid: d.shippingFeePaid,
      cost,
      grossProfit: d.grossProfit,
      otherIncome: d.otherIncome,
      customerReturnFee: d.customerReturnFee,
      otherExpenses: d.otherExpenses,
      totalInc,
      netProfit: d.netProfit,
    };
  };

  const calcPercent = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const percent = ((curr - prev) / prev) * 100;
    return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`;
  };

  const curr = processData(currentData);
  const prev = processData(prevData);

  const reportRows = [
    {
      id: "I",
      label: "I. Doanh thu thuần",
      prev: prev.netRevenue,
      current: curr.netRevenue,
      change: calcPercent(curr.netRevenue, prev.netRevenue),
      isBold: true,
    },
    {
      id: "1",
      label: "1. Tiền hàng thuần (1a - 1b)",
      prev: prev.netProductRevenue,
      current: curr.netProductRevenue,
      change: calcPercent(curr.netProductRevenue, prev.netProductRevenue),
      padding: "pl-8",
    },
    {
      id: "1a",
      label: "a. Doanh thu gốc tiền hàng",
      prev: prev.grossRevenue,
      current: curr.grossRevenue,
      change: calcPercent(curr.grossRevenue, prev.grossRevenue),
      padding: "pl-12",
      isItalic: true,
    },
    {
      id: "1b",
      label: "b. Hàng bán bị trả lại",
      prev: prev.returnedGoods,
      current: curr.returnedGoods,
      change: calcPercent(curr.returnedGoods, prev.returnedGoods),
      padding: "pl-12",
      isItalic: true,
    },
    {
      id: "3",
      label: "2. Phí giao hàng thu của khách",
      prev: prev.shippingFeeCollected,
      current: curr.shippingFeeCollected,
      change: calcPercent(
        curr.shippingFeeCollected,
        prev.shippingFeeCollected
      ),
      padding: "pl-8",
    },
    {
      id: "3b",
      label: "2b. Phí ship hoàn do trả hàng",
      prev: prev.shippingFeeReturned,
      current: curr.shippingFeeReturned,
      change: calcPercent(curr.shippingFeeReturned, prev.shippingFeeReturned),
      padding: "pl-12",
      isItalic: true,
    },
    {
      id: "4",
      label: "3. Chiết khấu bán hàng",
      prev: prev.discount,
      current: curr.discount,
      change: calcPercent(curr.discount, prev.discount),
      padding: "pl-8",
    },
    {
      id: "4b",
      label: "3b. Chiết khấu của đơn trả hàng được hoàn lại",
      prev: prev.discountReturned,
      current: curr.discountReturned,
      change: calcPercent(curr.discountReturned, prev.discountReturned),
      padding: "pl-12",
      isItalic: true,
    },
    {
      id: "II",
      label: "II. Giá vốn và chi phí bán hàng",
      prev: prev.cost,
      current: curr.cost,
      change: calcPercent(curr.cost, prev.cost),
      isBold: true,
    },
    {
      id: "II-1",
      label: "1. Giá vốn hàng hóa",
      prev: prev.cogs,
      current: curr.cogs,
      change: calcPercent(curr.cogs, prev.cogs),
      padding: "pl-8",
    },
    {
      id: "II-2",
      label: "2. Thanh toán bằng điểm",
      prev: prev.pointPayment,
      current: curr.pointPayment,
      change: calcPercent(curr.pointPayment, prev.pointPayment),
      padding: "pl-8",
    },
    {
      id: "II-3",
      label: "3. Phí giao hàng trả đối tác",
      prev: prev.shippingFeePaid,
      current: curr.shippingFeePaid,
      change: calcPercent(curr.shippingFeePaid, prev.shippingFeePaid),
      padding: "pl-8",
    },
    {
      id: "GROSS",
      label: "Lợi nhuận gộp (I - II)",
      prev: prev.grossProfit,
      current: curr.grossProfit,
      change: calcPercent(curr.grossProfit, prev.grossProfit),
      isBold: true,
    },
    {
      id: "III",
      label: "III. Thu nhập khác",
      prev: prev.totalInc,
      current: curr.totalInc,
      change: calcPercent(curr.totalInc, prev.totalInc),
      isBold: true,
    },
    {
      id: "III-1",
      label: "1. Phiếu thu khác",
      prev: prev.otherIncome,
      current: curr.otherIncome,
      change: calcPercent(curr.otherIncome, prev.otherIncome),
      padding: "pl-8",
    },
    {
      id: "III-2",
      label: "2. Phí khách trả hàng",
      prev: prev.customerReturnFee,
      current: curr.customerReturnFee,
      change: calcPercent(curr.customerReturnFee, prev.customerReturnFee),
      padding: "pl-8",
    },
    {
      id: "IV",
      label: "IV. Chi phí khác",
      prev: prev.otherExpenses,
      current: curr.otherExpenses,
      change: calcPercent(curr.otherExpenses, prev.otherExpenses),
      isBold: true,
    },
    {
      id: "RESULT",
      label: "Lợi nhuận ròng (I + III - II - IV)",
      prev: prev.netProfit,
      current: curr.netProfit,
      change: calcPercent(curr.netProfit, prev.netProfit),
      isBold: true,
      isResult: true,
    },
  ];

  const handleExportExcel = () => {
    if (!currentData) {
      toast.error("Không có dữ liệu để xuất!");
      return;
    }

    const excelData = reportRows.map((row) => ({
      "Chỉ tiêu báo cáo": row.label,
      "Kỳ trước (VNĐ)": row.prev,
      "Kỳ hiện tại (VNĐ)": row.current,
      "% Thay đổi": row.change,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao Cao Lai Lo");
    XLSX.writeFile(workbook, `Bao_Cao_Lai_Lo_${startDate}_den_${endDate}.xlsx`);
    toast.success("Xuất file Excel thành công!");
  };

  const { prevStart, prevEnd } = getPrevPeriod(startDate, endDate);

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 px-1">
        <div className="mb-4">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Lãi lỗ
          </h1>
        </div>

        <div className="flex flex-col gap-3 border-b-0 bg-transparent px-0 pt-0 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase text-slate-400">
                Từ ngày
              </span>
              <SharedDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Chọn ngày"
                variant="compact"
                buttonClassName="h-[38px] w-full min-w-[180px] text-[13px] font-medium shadow-none lg:w-[190px]"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase text-slate-400">
                Đến ngày
              </span>
              <SharedDatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Chọn ngày"
                variant="compact"
                buttonClassName="h-[38px] w-full min-w-[180px] text-[13px] font-medium shadow-none lg:w-[190px]"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-medium uppercase text-slate-400">
                Chi nhánh
              </span>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger
                  className="h-[38px] w-full min-w-[220px] text-[13px] font-medium shadow-none focus:ring-0 lg:w-[260px]"
                  disabled={!canSelectAllBranches}
                >
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {canSelectAllBranches && <SelectItem value="all">Tất cả chi nhánh</SelectItem>}
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExplainOpen(true)}
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              Trợ giúp
            </Button>
            <Button
              onClick={handleExportExcel}
              className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất file
            </Button>
          </div>
        </div>

        {/* AI Profit & Loss Insight Panel */}
        <div className="mt-4 rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-700">
                Trợ lý Phân tích Lãi Lỗ AI
              </h3>
            </div>
            {insightResult && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-[12px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600 animate-none"
                onClick={handleAiAnalysis}
                disabled={analyzingInsight}
              >
                <RefreshCw size={12} className={cn("mr-1.5", analyzingInsight && "animate-spin")} />
                {analyzingInsight ? "Đang phân tích..." : "Phân tích AI"}
              </Button>
            )}
          </div>

          {loadingInsight ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Đang tính toán các chỉ số định lượng...</p>
            </div>
          ) : insightResult ? (
            <div className="space-y-4">
              
              {/* 1. Warnings and Status Badges */}
              {insightResult.warnings && insightResult.warnings.length > 0 && (
                <div className="rounded-[6px] border border-amber-100 bg-amber-50/50 p-3.5 space-y-1.5">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cảnh báo rủi ro</p>
                  <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                    {insightResult.warnings.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 2. Key Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Biên giá vốn */}
                <div className="rounded-[6px] p-3.5 border bg-slate-50/80 border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ giá vốn/doanh thu thuần</p>
                    <p className="text-xl font-black text-slate-800 mt-1">
                      {insightResult.cogsRatio.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-2.5">
                    <Badge className={cn(
                      "border-none text-[9px] font-semibold px-2 py-0.5 shadow-none",
                      insightResult.cogsRatioStatus === "WARNING"
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-50"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                    )}>
                      {insightResult.cogsRatioStatus === "WARNING" ? "Cảnh báo vượt ngưỡng" : "Mức an toàn"}
                    </Badge>
                  </div>
                </div>

                {/* Tỷ lệ hoàn hàng */}
                <div className="rounded-[6px] p-3.5 border bg-slate-50/80 border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ hoàn trả hàng</p>
                    <p className="text-xl font-black text-slate-800 mt-1">
                      {insightResult.returnRatio.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-2.5">
                    <Badge className={cn(
                      "border-none text-[9px] font-semibold px-2 py-0.5 shadow-none",
                      insightResult.returnRatioStatus === "WARNING"
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-50"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                    )}>
                      {insightResult.returnRatioStatus === "WARNING" ? "Tỷ lệ trả hàng cao" : "Mức bình thường"}
                    </Badge>
                  </div>
                </div>

                {/* Biến động lợi nhuận */}
                <div className="rounded-[6px] p-3.5 border bg-slate-50/80 border-slate-100 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Biến động lợi nhuận ròng</p>
                    {insightResult.netProfitChangePercent === "NO_PREVIOUS_DATA" ? (
                      <p className="text-sm font-semibold text-slate-500 mt-2">Chưa có dữ liệu kỳ trước</p>
                    ) : (
                      <p className="text-xl font-black text-slate-800 mt-1">
                        {Number(insightResult.netProfitChangePercent) > 0 ? "+" : ""}{insightResult.netProfitChangePercent}%
                      </p>
                    )}
                  </div>
                  <div className="mt-2.5">
                    {insightResult.netProfitChangePercent === "NO_PREVIOUS_DATA" ? (
                      <span className="text-[10px] text-slate-400">Kỳ đầu tiên/Từ đầu đến nay</span>
                    ) : (
                      <Badge className={cn(
                        "border-none text-[9px] font-semibold px-2 py-0.5 shadow-none",
                        Number(insightResult.netProfitChangePercent) > 0
                          ? "bg-blue-50 text-blue-600 hover:bg-blue-50"
                          : Number(insightResult.netProfitChangePercent) < 0
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-50"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-50"
                      )}>
                        {Number(insightResult.netProfitChangePercent) > 0
                          ? "Tăng trưởng"
                          : Number(insightResult.netProfitChangePercent) < 0
                          ? "Suy giảm"
                          : "Không biến động"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Contribution Breakdown Table */}
              <div className="border border-slate-100 rounded-[6px] overflow-hidden text-xs">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 font-bold text-slate-600 uppercase tracking-wide text-[10px]">
                  Phân rã biến động các chỉ tiêu đóng góp
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {insightResult.contributionBreakdown?.map((item: any, idx: number) => (
                    <div key={idx} className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {item.factor === "REVENUE" && "Doanh thu gốc tiền hàng"}
                            {item.factor === "COGS" && "Giá vốn hàng bán"}
                            {item.factor === "SHIPPING" && "Phí ship thu khách ròng"}
                            {item.factor === "DISCOUNT" && "Chiết khấu giảm giá ròng"}
                            {item.factor === "RETURNS" && "Hàng bán bị trả lại"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{item.note}</p>
                      </div>
                      <div className="flex items-center gap-6 whitespace-nowrap text-right text-xs">
                        <div>
                          <span className="text-slate-400 block text-[9px] font-medium uppercase">Kỳ này</span>
                          <span className="font-bold text-slate-700">{formatNumber(item.currentValue)} ₫</span>
                        </div>
                        {item.previousValue !== null && item.previousValue !== undefined && (
                          <>
                            <div>
                              <span className="text-slate-400 block text-[9px] font-medium uppercase">Kỳ trước</span>
                              <span className="text-slate-500">{formatNumber(item.previousValue)} ₫</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] font-medium uppercase">Biến động</span>
                              <span className={cn(
                                "font-semibold",
                                item.changeAmount > 0 
                                  ? (item.factor === "COGS" || item.factor === "RETURNS" ? "text-rose-500" : "text-blue-500") 
                                  : item.changeAmount < 0 
                                  ? (item.factor === "COGS" || item.factor === "RETURNS" ? "text-blue-500" : "text-rose-500")
                                  : "text-slate-500"
                              )}>
                                {item.changeAmount > 0 ? "+" : ""}{formatNumber(item.changeAmount)} ₫
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. AI Explanation Text */}
              {analyzingInsight ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-slate-50/50 rounded-[6px] border border-dashed border-slate-200">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-500 font-medium">Trí tuệ nhân tạo đang sinh văn bản giải thích nguyên nhân...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-50/60 rounded-[6px] border border-slate-100 p-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tóm tắt & Nguyên nhân biến động</p>
                    <p className="text-[13px] leading-relaxed text-slate-700 font-semibold">{aiAnalysis.summary}</p>
                    <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line border-t border-slate-100 pt-2 mt-2">{aiAnalysis.keyDrivers}</p>
                  </div>
                  <div className="bg-blue-50/30 rounded-[6px] border border-blue-100/50 p-4 space-y-2 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Hành động khuyến nghị</p>
                      <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line mt-2">{aiAnalysis.recommendation}</p>
                    </div>
                    <div className="text-[10px] text-slate-400 italic mt-4 border-t border-slate-100 pt-2">
                      * Khuyến nghị mang tính tham khảo từ AI. Vui lòng đối chiếu với tình hình thực tế trước khi quyết định.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/60 rounded-[6px] border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-xs text-slate-500 font-medium">Bấm nút "Phân tích AI" ở góc trên để nhận bản phân tích nguyên nhân biến động chi tiết từ Gemini AI.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50/60 rounded-[6px] border border-dashed border-slate-200 p-4 text-center text-xs text-slate-450">
              Không thể tải dữ liệu phân tích định lượng Lãi lỗ.
            </div>
          )}
        </div>

        <div className="mt-4 relative overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70">
              <Loader2 className="mb-2 animate-spin text-blue-600" size={32} />
              <span className="text-[12px] font-medium text-slate-500">
                Đang tổng hợp số liệu...
              </span>
            </div>
          )}

          {reportRows.length > 0 ? (
            <Table className="min-w-[980px] border-collapse">
              <TableHeader>
                <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                  <TableHead className="w-[40%] p-3 pl-6 text-[12px] font-semibold text-[#1f1f1f]">
                  Chỉ tiêu báo cáo
                  </TableHead>
                  <TableHead className="w-[20%] p-3 text-center text-[12px] font-semibold text-[#1f1f1f]">
                    <div className="space-y-0.5">
                      <p>Kỳ trước</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {formatDateVN(prevStart)} - {formatDateVN(prevEnd)}
                      </p>
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%] p-3 text-center text-[12px] font-semibold text-[#1f1f1f]">
                    <div className="space-y-0.5">
                      <p>Kỳ hiện tại</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {formatDateVN(startDate)} - {formatDateVN(endDate)}
                      </p>
                    </div>
                  </TableHead>
                  <TableHead className="w-[20%] p-3 text-center text-[12px] font-semibold text-[#1f1f1f]">
                  % thay đổi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "h-[56px] border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]",
                      row.isBold && "bg-slate-50/60",
                      row.isResult && "bg-blue-50/40 hover:bg-blue-50/50"
                    )}
                  >
                    <TableCell
                      className={cn(
                        "border-r border-[#f3f3f3] py-2 text-[13px]",
                        row.padding || "pl-6",
                        row.isBold ? "font-semibold text-slate-800" : "text-slate-600",
                        row.isItalic && "italic",
                        row.isResult && "font-semibold text-blue-700"
                      )}
                    >
                      {row.label}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "border-r border-[#f3f3f3] p-2 text-center text-[13px]",
                        row.isBold ? "font-semibold text-slate-800" : "text-slate-600"
                      )}
                    >
                      {formatNumber(row.prev)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "border-r border-[#f3f3f3] p-2 text-center text-[13px]",
                        row.isBold ? "font-semibold text-slate-800" : "text-slate-600",
                        row.isResult && "font-semibold text-blue-700"
                      )}
                    >
                      {formatNumber(row.current)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "p-2 text-center text-[13px] font-semibold",
                        row.change === "0%"
                          ? "text-slate-400"
                          : row.change.includes("-")
                            ? "text-rose-500"
                            : "text-blue-600"
                      )}
                    >
                      {row.change}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white py-20 text-slate-400">
              <AlertTriangle className="mb-2 opacity-20" size={40} />
              <p className="text-xs font-medium uppercase">Chưa có dữ liệu báo cáo</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isExplainOpen} onOpenChange={setIsExplainOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase text-slate-900">
              Trợ giúp báo cáo lãi lỗ
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Báo cáo này dùng đúng công thức backend cho mọi thẻ số liệu, bảng
              và file xuất.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-bold text-slate-800">
                Doanh thu gốc tiền hàng:
              </span>{" "}
              lấy từ tiền hàng trước ship và discount của đơn hoặc phần đơn đã
              được ghi nhận ở mốc{" "}
              <span className="font-semibold">RECEIVED/COMPLETED</span>.
            </p>
            <p>
              <span className="font-bold text-slate-800">
                Doanh thu thuần:
              </span>{" "}
              = tiền hàng thuần + ship thu khách - ship hoàn do trả hàng -
              chiết khấu + chiết khấu hoàn lại. Frontend chỉ hiển thị số backend
              đã chuẩn hóa, không cộng trừ lần hai.
            </p>
            <p>
              <span className="font-bold text-slate-800">Giá vốn:</span> lấy từ
              giao dịch xuất kho bán hàng đã ghi nhận doanh thu, gồm cả mã đơn gốc
              và mã phần đơn. Nếu chưa có bút toán nhập trả tương ứng thì báo cáo
              chưa tự đảo giá vốn cho hàng trả.
            </p>
            <p>
              <span className="font-bold text-slate-800">Các mục khác:</span>{" "}
              Thanh toán điểm, phí ship trả đối tác, thu nhập khác và chi phí
              khác chỉ phản ánh nguồn dữ liệu thật đang có trong hệ thống; nếu
              chưa có nguồn riêng thì đang bằng 0.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

