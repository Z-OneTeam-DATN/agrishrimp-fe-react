"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  HelpCircle,
  BarChart3,
  Landmark,
  Users,
  Loader2,
  Clock,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FinancialOverviewService,
} from "@/app/services/financial-overview.service";
import type {
  ProfitLossData,
  SupplierDebtData,
} from "@/app/services/financial-report.types";
import { PublicBranchService } from "@/app/services/publicBranch.service";
import { formatNumber } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";

type BranchOption = { id: number; name: string };

const reportCards = [
  {
    id: "profit-loss",
    title: "Báo cáo lãi lỗ",
    description: "Theo dõi doanh thu thuần, giá vốn và lợi nhuận theo kỳ",
    icon: BarChart3,
    href: "/admin/financial/profit-loss",
    helpTitle: "Báo cáo Lãi lỗ",
    workflow: "Thu thập tất cả đơn hàng COMPLETED trong kỳ → Tính doanh thu thuần (sau discount + trả hàng) → Trừ chi phí → Ra lợi nhuận ròng",
    formula: "Lợi nhuận = Doanh thu thuần − Giá vốn (COGS) − Phí vận chuyển − Điểm thanh toán − Chi phí khác",
    meaning: "Báo cáo cốt lõi phản ánh hiệu quả kinh doanh trong kỳ. Cho phép đánh giá biên lợi nhuận và kiểm soát chi phí.",
    inScope: true,
  },
  {
    id: "cashbook",
    title: "Sổ quỹ",
    description: "Đối soát dòng tiền thực tế đã ghi nhận trong hệ thống",
    icon: Landmark,
    href: "/admin/financial/cashbook",
    helpTitle: "Sổ quỹ / Tiền chi",
    workflow: "Ghi nhận từng giao dịch thu/chi tiền thực tế → Không tính chứng từ kho chưa tạo dòng tiền → Đối soát số dư cuối kỳ",
    formula: "Số dư cuối kỳ = Số dư đầu kỳ + Tổng thu − Tổng chi",
    meaning: "Kiểm soát thanh khoản tiền mặt/chuyển khoản theo thời gian thực, phân biệt rõ ràng với kế toán dồn tích.",
    inScope: true,
  },
  {
    id: "supplier-debt",
    title: "Công nợ nhà cung cấp",
    description: "Theo dõi dư nợ chốt kỳ của từng nhà cung cấp",
    icon: Users,
    href: "/admin/financial/supplier-debt",
    helpTitle: "Công nợ NCC",
    workflow: "Tổng hợp toàn bộ phiếu nhập hàng từ mỗi NCC → Trừ các khoản đã thanh toán → Ra dư nợ chốt tại ngày kết thúc",
    formula: "Dư nợ = Tổng giá trị phiếu nhập − Tổng đã thanh toán",
    meaning: "Quản lý nghĩa vụ thanh toán với nhà cung cấp, hỗ trợ lập kế hoạch chi tiền và đàm phán công nợ.",
    inScope: true,
  },
];

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);
const formatMoney = (value?: number | null) => formatNumber(value ?? 0);

// Custom Recharts tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[4px] border border-slate-200 bg-white px-4 py-3 shadow-md text-[12px]">
        <p className="font-semibold text-slate-700 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialReportListPage() {
  const router = useRouter();
  const { user, warehouseId } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    isAdmin ? "all" : ownBranchId || "all"
  );
  const [startDate, setStartDate] = useState(() =>
    toIsoDate(new Date(new Date().setDate(new Date().getDate() - 30)))
  );
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebtData[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedReportHelp, setSelectedReportHelp] = useState<typeof reportCards[0] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestLoadIdRef = useRef(0);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await PublicBranchService.getAll();
        const list = Array.isArray(response) ? response : [];
        if (!isAdmin && ownBranchId) {
          setBranches(
            list.filter(
              (branch: BranchOption) => branch.id.toString() === ownBranchId
            )
          );
        } else {
          setBranches(list);
        }
      } catch (error) {
        console.error("Không tải được chi nhánh", error);
      }
    };
    loadBranches();
  }, [isAdmin, ownBranchId]);

  useEffect(() => {
    if (!isAdmin && ownBranchId) {
      setSelectedBranchId(ownBranchId);
    }
  }, [isAdmin, ownBranchId]);

  const loadFinancialData = useCallback(async () => {
    const requestId = ++latestLoadIdRef.current;
    try {
      setLoading(true);
      const branchId = selectedBranchId === "all" ? "all" : selectedBranchId;
      const { profitLoss: profitLossRes, supplierDebts: supplierDebtRes } =
        await FinancialOverviewService.getReport({
          startDate,
          endDate,
          branchId,
        });
      if (requestId !== latestLoadIdRef.current) {
        return;
      }
      setProfitLoss(profitLossRes);
      setSupplierDebts(Array.isArray(supplierDebtRes) ? supplierDebtRes : []);
      setLastUpdated(new Date());
    } catch (error) {
      if (requestId !== latestLoadIdRef.current) {
        return;
      }
      console.error("Không tải được dữ liệu tài chính", error);
      setProfitLoss(null);
      setSupplierDebts([]);
    } finally {
      if (requestId === latestLoadIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedBranchId, startDate, endDate]);

  // Debounce filter changes → auto-fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadFinancialData();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadFinancialData]);

  // Auto-refresh every 60 seconds (realtime)
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      loadFinancialData();
    }, 60_000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [loadFinancialData]);

  const metrics = useMemo(() => {
    const netRevenue = Number(profitLoss?.netRevenue ?? 0);
    const cogs = Number(profitLoss?.cogs ?? 0);
    const pointPayment = Number(profitLoss?.pointPayment ?? 0);
    const shippingFeePaid = Number(profitLoss?.shippingFeePaid ?? 0);
    const otherExpenses = Number(profitLoss?.otherExpenses ?? 0);
    const netProfit = Number(profitLoss?.netProfit ?? 0);

    return {
      netRevenue,
      cogs,
      pointPayment,
      shippingFeePaid,
      otherExpenses,
      totalExpense: cogs + pointPayment + shippingFeePaid + otherExpenses,
      estimatedProfit: netProfit,
      debtCount: supplierDebts.length,
      debtTotal: supplierDebts.reduce(
        (sum, item) => sum + (item.totalDebt ?? 0),
        0
      ),
      branchLabel:
        selectedBranchId === "all"
          ? "Tất cả chi nhánh"
          : branches.find((b) => b.id.toString() === selectedBranchId)?.name ||
            "Chi nhánh đang chọn",
    };
  }, [profitLoss, supplierDebts, selectedBranchId, branches]);

  const summaryCards = [
    {
      id: "net-revenue",
      label: "Doanh thu thuần",
      value: formatMoney(metrics.netRevenue),
      badge: metrics.branchLabel,
      hint: "Theo phạm vi chi nhánh đang chọn",
      valueClassName: "text-slate-900",
      icon: TrendingUp,
      iconColor: "text-blue-500",
    },
    {
      id: "expense",
      label: "Tổng chi phí",
      value: formatMoney(metrics.totalExpense),
      badge: "Chi phí",
      hint: "Giá vốn + điểm + ship + chi phí khác",
      valueClassName: "text-rose-600",
      icon: TrendingDown,
      iconColor: "text-rose-500",
    },
    {
      id: "profit",
      label: "Lợi nhuận ròng",
      value: formatMoney(Math.round(metrics.estimatedProfit)),
      badge: metrics.estimatedProfit < 0 ? "Lỗ" : "Lãi",
      hint: "Tính theo dữ liệu chốt trong kỳ",
      valueClassName:
        metrics.estimatedProfit < 0 ? "text-amber-600" : "text-blue-600",
      icon: metrics.estimatedProfit < 0 ? TrendingDown : TrendingUp,
      iconColor: metrics.estimatedProfit < 0 ? "text-amber-500" : "text-blue-500",
    },
    {
      id: "debt",
      label: "NCC còn nợ",
      value: `${metrics.debtCount} NCC`,
      badge: "Công nợ",
      hint: `Tổng dư nợ ${formatMoney(metrics.debtTotal)}`,
      valueClassName: "text-slate-900",
      icon: Users,
      iconColor: "text-orange-500",
    },
  ];

  // Chart data
  const chartData = [
    {
      name: "Doanh thu",
      "Doanh thu thuần": metrics.netRevenue,
      "Tổng chi phí": metrics.totalExpense,
      "Lợi nhuận": metrics.estimatedProfit > 0 ? metrics.estimatedProfit : 0,
    },
  ];

  // Chart expense breakdown
  const expenseBreakdown = [
    { name: "Giá vốn", value: metrics.cogs },
    { name: "Phí ship", value: metrics.shippingFeePaid },
    { name: "Điểm TT", value: metrics.pointPayment },
    { name: "Chi phí khác", value: metrics.otherExpenses },
  ].filter(d => d.value > 0);

  const formatLastUpdated = (date: Date) =>
    date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Tổng quan tài chính
            </h1>
            {lastUpdated && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock size={11} className="text-slate-300" />
                Cập nhật lúc {formatLastUpdated(lastUpdated)} · Tự làm mới mỗi 60s
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[12px] text-slate-500 hover:text-blue-600"
            onClick={() => { setSelectedReportHelp(null); setIsHelpOpen(true); }}
          >
            <HelpCircle size={14} />
            Giải thích nghiệp vụ
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-end">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Chi nhánh
              </p>
              <Select
                value={selectedBranchId}
                onValueChange={setSelectedBranchId}
              >
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
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[38px] min-w-[180px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus-visible:ring-blue-500/20 lg:w-[190px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Loader2 size={12} className="animate-spin" />
                Đang cập nhật...
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
            <AdminDataSyncLoader />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {card.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="border-none bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                      >
                        {card.badge}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-end justify-between">
                      <p className={`text-[28px] font-semibold leading-none tracking-tight ${card.valueClassName}`}>
                        {card.value}
                      </p>
                      <card.icon size={20} className={`${card.iconColor} opacity-60`} />
                    </div>
                    <p className="text-[12px] text-slate-500">{card.hint}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts + Business cards */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
              {/* Left: Chart */}
              <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tổng quan tài chính kỳ hiện tại
                  </p>
                </div>

                <div className="px-4 pt-4 pb-2">
                  {/* Main bar chart */}
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" hide />
                      <YAxis
                        tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        iconType="square"
                        iconSize={10}
                      />
                      <Bar dataKey="Doanh thu thuần" fill="#3b82f6" radius={[3,3,0,0]} maxBarSize={80} />
                      <Bar dataKey="Tổng chi phí" fill="#f87171" radius={[3,3,0,0]} maxBarSize={80} />
                      <Bar dataKey="Lợi nhuận" fill="#10b981" radius={[3,3,0,0]} maxBarSize={80} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Expense breakdown */}
                  {expenseBreakdown.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                        Cơ cấu chi phí
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {expenseBreakdown.map((item) => (
                          <div key={item.name} className="rounded-[4px] bg-slate-50 px-3 py-2">
                            <p className="text-[10px] text-slate-500">{item.name}</p>
                            <p className="text-[12px] font-semibold text-slate-800">
                              {formatMoney(item.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Report entry points */}
              <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Điểm vào nghiệp vụ
                  </p>
                </div>

                <div className="space-y-3 px-4 pb-4 pt-4">
                  {reportCards.map((report) => (
                    <div key={report.id} className="group flex items-center gap-2">
                      <Link
                        href={report.href}
                        className="flex flex-1 items-center justify-between gap-4 rounded-[4px] border border-slate-200 bg-slate-50/60 px-4 py-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-slate-200 bg-white text-slate-600 transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                            <report.icon size={17} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[13px] font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                              {report.title}
                            </h3>
                            <p className="mt-0.5 truncate text-[11px] leading-5 text-slate-500">
                              {report.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
                      </Link>
                      {/* Info button */}
                      <button
                        onClick={() => { setSelectedReportHelp(report); setIsHelpOpen(true); }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-slate-200 bg-white text-slate-400 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        title={`Giải thích ${report.title}`}
                      >
                        <Info size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Supplier Debt */}
            <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Top 5 nhà cung cấp nợ cao nhất
                  </p>
                  <Button
                    variant="outline"
                    className="h-[30px] border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => router.push("/admin/financial/supplier-debt")}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>

              <div className="p-4">
                {supplierDebts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    {supplierDebts.slice(0, 5).map((supplier, index) => (
                      <div
                        key={supplier.id}
                        className="flex flex-col gap-2 rounded-[4px] border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                            {index + 1}
                          </div>
                          <p className="truncate text-[12px] font-semibold text-slate-900">
                            {supplier.supplierName}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {supplier.supplierCode} · {supplier.phone || "Chưa có SĐT"}
                        </p>
                        <p className="text-[14px] font-semibold text-rose-600">
                          {formatMoney(supplier.totalDebt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[4px] border border-dashed border-slate-200 bg-slate-50/40 py-10 text-center text-[12px] text-slate-500">
                    Chưa có dữ liệu công nợ để hiển thị
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Help Dialog */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl border border-slate-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="uppercase text-[15px]">
              {selectedReportHelp
                ? `Nghiệp vụ: ${selectedReportHelp.helpTitle}`
                : "Giải thích nghiệp vụ tài chính"}
            </DialogTitle>
            <DialogDescription className="text-[12px]">
              {selectedReportHelp
                ? "Workflow, công thức tính toán và ý nghĩa thực tế của nghiệp vụ này."
                : "Tổng quan về các nghiệp vụ tài chính trong hệ thống và phạm vi của chúng."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-[13px] text-slate-600 max-h-[70vh] overflow-y-auto pr-1">
            {selectedReportHelp ? (
              /* Detail view for one report */
              <div className="space-y-4">
                <div className="rounded-[4px] border border-blue-100 bg-blue-50/60 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">Workflow</p>
                  <p className="text-slate-700 leading-6">{selectedReportHelp.workflow}</p>
                </div>

                <div className="rounded-[4px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Công thức</p>
                  <code className="block rounded bg-white border border-slate-200 px-3 py-2 text-[12px] font-mono text-slate-800 leading-6">
                    {selectedReportHelp.formula}
                  </code>
                </div>

                <div className="rounded-[4px] border border-emerald-100 bg-emerald-50/60 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Ý nghĩa</p>
                  <p className="text-slate-700 leading-6">{selectedReportHelp.meaning}</p>
                </div>

                <div className="flex items-center gap-2 rounded-[4px] border border-slate-200 px-4 py-3">
                  <div className={`h-2 w-2 rounded-full ${selectedReportHelp.inScope ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <p className="text-[12px] text-slate-600">
                    {selectedReportHelp.inScope
                      ? "Nghiệp vụ này nằm trong scope DATN — đã được triển khai đầy đủ."
                      : "Nghiệp vụ này nằm ngoài scope DATN — chỉ triển khai một phần."}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[12px] text-slate-500"
                  onClick={() => setSelectedReportHelp(null)}
                >
                  ← Xem tất cả nghiệp vụ
                </Button>
              </div>
            ) : (
              /* Overview of all reports */
              <div className="space-y-3">
                {reportCards.map((report) => (
                  <div
                    key={report.id}
                    className="cursor-pointer rounded-[4px] border border-slate-200 px-4 py-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                    onClick={() => setSelectedReportHelp(report)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-slate-800">{report.helpTitle}</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Trong scope
                        </span>
                        <ArrowRight size={13} className="text-slate-300" />
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-5">{report.description}</p>
                    <p className="mt-2 text-[11px] font-mono text-slate-400 truncate">{report.formula}</p>
                  </div>
                ))}

                <div className="rounded-[4px] bg-slate-50 border border-slate-200 px-4 py-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lưu ý chung</p>
                  <ul className="space-y-1.5 text-[12px] text-slate-600 list-disc pl-4">
                    <li>Tất cả dữ liệu được lọc theo chi nhánh và khoảng ngày đang chọn.</li>
                    <li>Trang này tự cập nhật mỗi 60 giây — không cần tải thủ công.</li>
                    <li>Doanh thu thuần đã trừ các đơn hủy và trả hàng.</li>
                    <li>Dư nợ NCC chốt tại ngày kết thúc, không phải phát sinh trong kỳ.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
