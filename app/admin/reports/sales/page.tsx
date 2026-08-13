"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Download,
  FileText,
  HelpCircle,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  CreditCard,
  Users,
  ShoppingCart,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminDateRangeFilters } from "@/components/admin/shared/AdminDateRangeFilters";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { DonutChart } from "@/components/admin/DonutChart";
import { ChartLegend } from "@/components/admin/DashboardPanel";
import { VIZ_CATEGORICAL, numberText } from "@/components/admin/dashboard-viz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";
import { branchService } from "@/app/services/branchService";
import {
  SalesReportDetail,
  SalesReportService,
  SalesReportSummary,
} from "@/app/services/sales-report.service";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerVietnameseFont, VIETNAMESE_PDF_FONT } from "@/lib/pdf-vietnamese-font";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type BranchOption = { id: number; name: string };

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(defaultStart.getDate() - 6);

const toIso = (date: Date) => date.toISOString().slice(0, 10);

const DETAIL_OPTIONS = {
  revenue_time: "Báo cáo doanh thu theo thời gian",
  delivery_detail: "Báo cáo giao hàng chi tiết",
  returns_by_order: "Trả hàng theo đơn hàng",
  returns_by_product: "Trả hàng theo sản phẩm",
  payment_time: "Báo cáo thanh toán theo thời gian",
  payment_method: "Báo cáo theo phương thức thanh toán",
  payment_branch: "Báo cáo thanh toán theo chi nhánh",
  order_stats: "Báo cáo thống kê theo đơn hàng",
  order_product: "Báo cáo thống kê theo sản phẩm",
  order_detail: "Báo cáo doanh thu chi tiết",
} as const;

const formatDate = (value: unknown) => {
  if (!value) return "N/A";
  if (typeof value === "string" && value.includes("T")) {
    return new Date(value).toLocaleString("vi-VN");
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return String(value);
};

const formatMoney = (value: number) => `${formatNumber(value)} VND`;

const formatCellValue = (value: unknown, key: string) => {
  if (value == null || value === "") return "N/A";
  if (typeof value === "number" && (key.toLowerCase().includes("amount") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("profit") || key.toLowerCase().includes("value"))) {
    return formatNumber(value);
  }
  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("createdat")) {
    return formatDate(value);
  }
  return String(value);
};

export default function SalesReportPage() {
  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const { user, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();

  const canSelectAllBranches = hasPermission(P.REPORT_REVENUE_VIEW_ALL_BRANCHES);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    canSelectAllBranches ? "all" : ownBranchId || "all"
  );
  const [startDate, setStartDate] = useState(toIso(defaultStart));
  const [endDate, setEndDate] = useState(toIso(today));
  const [summary, setSummary] = useState<SalesReportSummary | null>(null);
  const [detail, setDetail] = useState<SalesReportDetail | null>(null);
  const [activeDetailType, setActiveDetailType] = useState<keyof typeof DETAIL_OPTIONS>("revenue_time");
  const [revenueReportType, setRevenueReportType] = useState<"revenue_time">("revenue_time");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailPage, setDetailPage] = useState(1);
  const DETAIL_PAGE_SIZE = 20;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await branchService.getAll();
        const list = Array.isArray(branchRes) ? branchRes : branchRes?.data || branchRes?.content || [];
        if (!canSelectAllBranches && ownBranchId) {
          setBranches(list.filter((item: BranchOption) => item.id.toString() === ownBranchId));
        } else {
          setBranches(list);
        }
      } catch (error) {
        console.error("Không thể tải danh sách chi nhánh", error);
        toast.error("Không thể tải danh sách chi nhánh");
      }
    };

    fetchBranches();
  }, [canSelectAllBranches, ownBranchId]);

  useEffect(() => {
    if (!canSelectAllBranches && ownBranchId) {
      setSelectedBranchId(ownBranchId);
    }
  }, [canSelectAllBranches, ownBranchId]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SalesReportService.getSummary(startDate, endDate, selectedBranchId);
      setSummary(data);
    } catch (error) {
      console.error("Không thể tải báo cáo doanh thu", error);
      toast.error("Không thể tải báo cáo doanh thu");
    } finally {
      setLoading(false);
    }
  }, [endDate, selectedBranchId, startDate]);

  const loadDetail = useCallback(async (type: keyof typeof DETAIL_OPTIONS) => {
    setDetailLoading(true);
    try {
      const data = await SalesReportService.getDetail(type, startDate, endDate, selectedBranchId);
      setDetail(data);
    } catch (error) {
      console.error("Không thể tải chi tiết báo cáo", error);
      toast.error("Không thể tải chi tiết báo cáo");
    } finally {
      setDetailLoading(false);
    }
  }, [endDate, selectedBranchId, startDate]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadDetail(activeDetailType);
  }, [activeDetailType, loadDetail]);

  const filteredRows = useMemo(() => {
    if (!detail?.rows) return [];
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return detail.rows;
    return detail.rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(keyword),
      ),
    );
  }, [detail, searchTerm]);

  useEffect(() => {
    setDetailPage(1);
  }, [activeDetailType, searchTerm]);

  const pagedRows = useMemo(
    () => filteredRows.slice((detailPage - 1) * DETAIL_PAGE_SIZE, detailPage * DETAIL_PAGE_SIZE),
    [filteredRows, detailPage],
  );

  const chartData = useMemo(() => ({
    labels: summary?.revenue.trend.map((item) => formatDate(item.date)) || [],
    datasets: [
      {
        label: "Doanh thu",
        data: summary?.revenue.trend.map((item) => item.revenue) || [],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
      {
        label: "Lợi nhuận",
        data: summary?.revenue.trend.map((item) => item.profit) || [],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 3,
      },
    ],
  }), [summary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle" as const,
          boxWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset?.label || ""}: ${formatMoney(context.parsed?.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number | string) => formatNumber(Number(value)),
        },
      },
    },
  };

  const exportExcel = () => {
    if (!detail) return;
    const data = filteredRows.map((row) =>
      detail.columns.reduce<Record<string, unknown>>((acc, column) => {
        acc[column.label] = formatCellValue(row[column.key], column.key);
        return acc;
      }, {}),
    );
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao cao doanh thu");
    XLSX.writeFile(workbook, `bao_cao_doanh_thu_${detail.type}_${startDate}_${endDate}.xlsx`);
    toast.success("Đã xuất Excel báo cáo");
  };

  const exportPdf = () => {
    if (!detail) return;
    const doc = new jsPDF({ orientation: "landscape" });
    registerVietnameseFont(doc);
    doc.setFontSize(14);
    doc.text(detail.label, 14, 14);
    doc.setFontSize(10);
    doc.text(`Kỳ báo cáo: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [detail.columns.map((column) => column.label)],
      body: filteredRows.map((row) =>
        detail.columns.map((column) => String(formatCellValue(row[column.key], column.key))),
      ),
      styles: { fontSize: 8, font: VIETNAMESE_PDF_FONT },
      headStyles: { fillColor: [37, 99, 235], font: VIETNAMESE_PDF_FONT, fontStyle: "bold" },
    });
    doc.save(`bao_cao_doanh_thu_${detail.type}_${startDate}_${endDate}.pdf`);
    toast.success("Đã xuất PDF báo cáo");
  };

  const openDetail = useCallback((type: keyof typeof DETAIL_OPTIONS) => {
    setActiveDetailType(type);
    if (type === "revenue_time") {
      setRevenueReportType(type);
    }
  }, []);

  const scrollToDetailSection = useCallback(() => {
    window.requestAnimationFrame(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleViewDetail = useCallback(async (type: keyof typeof DETAIL_OPTIONS = activeDetailType) => {
    const isSameType = type === activeDetailType;

    if (!isSameType) {
      openDetail(type);
      scrollToDetailSection();
      return;
    }

    await loadDetail(type);
    scrollToDetailSection();
  }, [activeDetailType, loadDetail, openDetail, scrollToDetailSection]);

  const deliveryMax = Math.max(1, ...(summary?.delivery.breakdown.map((item) => item.count) || [1]));
  const deliverySegments = (summary?.delivery.breakdown || [])
    .filter((item) => item.count > 0)
    .map((item, index) => ({
      key: item.label,
      value: item.count,
      color: VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length],
      label: `${item.label}: ${numberText(item.count)} đơn`,
    }));
  const overviewCards = [
    {
      label: "Doanh thu",
      value: loading ? "..." : formatMoney(summary?.revenue.totalRevenue || 0),
      hint: `${summary?.revenue.totalOrders || 0} đơn hoàn tất`,
      icon: TrendingUp,
      tone: "from-blue-600/12 to-cyan-500/10 text-blue-700",
    },
    {
      label: "Đã giao",
      value: loading ? "..." : String(summary?.delivery.totalShipments || 0),
      hint: `${summary?.delivery.breakdown.length || 0} trạng thái theo dõi`,
      icon: Package,
      tone: "from-blue-600/12 to-blue-500/10 text-blue-700",
    },
    {
      label: "Đã thu",
      value: loading ? "..." : formatMoney(summary?.payment.paidAmount || 0),
      hint: `${summary?.payment.paidOrders || 0} đơn đã thanh toán`,
      icon: CreditCard,
      tone: "from-violet-600/12 to-fuchsia-500/10 text-violet-700",
    },
    {
      label: "Giá trị TB / đơn",
      value: loading ? "..." : formatMoney(summary?.orders.averageOrderValue || 0),
      hint: `${summary?.orders.totalProductsSold || 0} sản phẩm đã bán`,
      icon: ShoppingCart,
      tone: "from-amber-500/15 to-orange-500/10 text-amber-700",
    },
  ] as const;

  const ReportLink = ({
    label,
    icon: Icon,
    type,
  }: {
    label: string;
    icon: LucideIcon;
    type: keyof typeof DETAIL_OPTIONS;
  }) => (
    <button
      type="button"
      onClick={() => openDetail(type)}
      className={cn(
        "flex w-full items-center justify-between border border-transparent px-3 py-3 text-left transition-all hover:bg-slate-50",
        activeDetailType === type && "border-blue-100 bg-blue-50/60",
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className={cn("text-slate-400", activeDetailType === type && "text-blue-600")} />
        <span className={cn("text-[13px] text-slate-600", activeDetailType === type && "font-semibold text-blue-700")}>
          {label}
        </span>
      </div>
      {activeDetailType === type && (
        <Badge className="rounded-none bg-blue-600 px-2 text-white">Đang xem</Badge>
      )}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Báo cáo doanh thu
            </h1>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              >
                <HelpCircle size={16} className="mr-2" />
                Trợ giúp
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[620px] border border-slate-200 bg-white shadow-xl">
            <DialogHeader>
              <DialogTitle>Hướng dẫn trang Báo cáo doanh thu</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Phần trên cùng hiển thị xu hướng doanh thu và tiến độ giao hàng theo khoảng ngày bạn chọn.</p>
              <p>Các nhóm Trả hàng, Thanh toán và Đơn hàng bên dưới đều có nút để đổi sang bảng chi tiết thật ở phần cuối trang.</p>
              <p>Nút Excel và PDF sẽ xuất đúng bảng chi tiết đang mở, không dùng dữ liệu mẫu.</p>
            </div>
          </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-end">
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Chi nhánh</p>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="h-[38px] w-full min-w-[240px] rounded-md border-slate-200 bg-white text-[13px] shadow-none focus:ring-0 lg:w-[280px]" disabled={!canSelectAllBranches}>
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {canSelectAllBranches && <SelectItem value="all">Tất cả chi nhánh</SelectItem>}
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          <AdminDateRangeFilters idPrefix="sales-report" fromDate={startDate} toDate={endDate} onFromDateChange={setStartDate} onToDateChange={setEndDate} />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="h-[38px] border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-600 shadow-none hover:bg-blue-50 hover:text-blue-600"
              onClick={loadSummary}
              disabled={loading}
            >
              <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
              Tải báo cáo
            </Button>

            <Button
              className="h-[38px] bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700"
              onClick={() => void handleViewDetail()}
            >
              Xem chi tiết
            </Button>
          </div>
        </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          return (
            <div key={card.label} className="flex min-h-[152px] flex-col justify-between rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                <Badge variant="secondary" className="border-none bg-slate-100 text-slate-600">
                  {card.label}
                </Badge>
              </div>
              <div className="mt-5 space-y-2">
                <p className="text-[22px] font-semibold leading-tight tracking-tight text-slate-900">{card.value}</p>
                <p className="text-[12px] text-slate-500">{card.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.95fr)]">
        <div className="flex min-h-[460px] flex-col overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between p-6">
            <div>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-slate-700">
                Doanh thu cửa hàng
              </h2>
              <p className="text-[12px] font-medium text-slate-400">
                {summary?.branchName || "Đang tải..."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-semibold tracking-tight text-blue-600">
                {loading ? "..." : formatMoney(summary?.revenue.totalRevenue || 0)}
              </div>
              <p className="text-[11px] text-slate-400">
                {loading ? "..." : `${summary?.revenue.totalOrders || 0} đơn thành công`}
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between px-6">
            <button
              type="button"
              onClick={() => openDetail(revenueReportType)}
              className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
            >
              {DETAIL_OPTIONS[revenueReportType]} <ChevronDown size={14} />
            </button>
            <span className="text-[11px] text-blue-600">
              Lợi nhuận: {formatMoney(summary?.revenue.totalProfit || 0)}
            </span>
          </div>

          <div className="h-[250px] flex-1 px-6">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Đang tải biểu đồ...</div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-5">
            <Button className="h-[38px] w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => void handleViewDetail("revenue_time")}>
              Xem chi tiết báo cáo doanh thu theo thời gian
            </Button>
          </div>
        </div>

        <div className="flex min-h-[460px] flex-col overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between p-6">
            <div>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-slate-700">
                Thông tin giao hàng
              </h2>
              <p className="text-[12px] font-medium text-slate-400">
                Tổng số đơn cần theo dõi trong kỳ
              </p>
            </div>
            <div className="text-[28px] font-semibold tracking-tight text-blue-600">
              {loading ? "..." : summary?.delivery.totalShipments || 0}
            </div>
          </div>

          <div className="mb-4 px-6">
            <button
              type="button"
              onClick={() => openDetail("delivery_detail")}
              className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
            >
              Theo tình trạng <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1 space-y-4 px-6">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Đang tải thống kê giao hàng...</div>
            ) : (
              <>
                {deliverySegments.length > 0 && (
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <DonutChart
                      size={160}
                      thickness={20}
                      centerLabel={numberText(summary?.delivery.totalShipments || 0)}
                      centerSub="đơn"
                      segments={deliverySegments}
                    />
                    <ChartLegend
                      items={deliverySegments.map((segment) => ({
                        color: segment.color,
                        label: segment.key,
                        note: numberText(segment.value),
                      }))}
                      className="justify-center"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  {summary?.delivery.breakdown.map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-bold text-slate-800">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.max(8, (item.count / deliveryMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-5">
            <Button className="h-[38px] w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => void handleViewDetail("delivery_detail")}>
              Xem tiến độ giao hàng
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex min-h-[280px] flex-col rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-slate-700">Trả hàng</h2>
              <p className="text-[11px] text-slate-400">Theo đơn và theo sản phẩm</p>
            </div>
            <div className="text-[24px] font-semibold tracking-tight text-blue-600">
              {loading ? "..." : summary?.returns.totalReturnedOrders || 0}
            </div>
          </div>
          <div className="px-6 pt-3 text-[12px] text-rose-600">
            Giá trị trả: {formatMoney(summary?.returns.totalReturnedAmount || 0)}
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Trả hàng theo đơn hàng" icon={RotateCcw} type="returns_by_order" />
            <ReportLink label="Trả hàng theo sản phẩm" icon={Package} type="returns_by_product" />
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-slate-700">Thanh toán</h2>
              <p className="text-[11px] text-slate-400">Theo thời gian, nhân viên, phương thức, chi nhánh</p>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-semibold tracking-tight text-blue-600">
                {loading ? "..." : formatMoney(summary?.payment.paidAmount || 0)}
              </div>
              <p className="text-[11px] text-slate-400">
                {summary?.payment.paidOrders || 0} đã thu / {summary?.payment.unpaidOrders || 0} chưa thu
              </p>
            </div>
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Báo cáo thanh toán theo thời gian" icon={Calendar} type="payment_time" />
            <ReportLink label="Báo cáo theo phương thức thanh toán" icon={CreditCard} type="payment_method" />
            <ReportLink label="Báo cáo thanh toán theo chi nhánh" icon={TrendingUp} type="payment_branch" />
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[14px] font-semibold uppercase tracking-wider text-slate-700">Đơn hàng</h2>
              <p className="text-[11px] text-slate-400">Thống kê tổng hợp và chi tiết bán hàng</p>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-semibold tracking-tight text-blue-600">
                {loading ? "..." : summary?.orders.totalOrders || 0}
              </div>
              <p className="text-[11px] text-slate-400">
                {formatMoney(summary?.orders.averageOrderValue || 0)} / đơn
              </p>
            </div>
          </div>
          <div className="px-6 pt-3 text-[12px] text-blue-600">
            Sản phẩm bán ra: {summary?.orders.totalProductsSold || 0}
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Báo cáo thống kê theo đơn hàng" icon={ShoppingCart} type="order_stats" />
            <ReportLink label="Báo cáo thống kê theo sản phẩm" icon={Package} type="order_product" />
            <ReportLink label="Báo cáo doanh thu chi tiết" icon={FileText} type="order_detail" />
          </div>
        </div>
      </div>

      <div ref={detailSectionRef} className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-[15px] font-semibold uppercase tracking-wider text-slate-700">
              {detail?.label || DETAIL_OPTIONS[activeDetailType]}
            </h3>
            <p className="text-[12px] text-slate-500">
              {detail?.description || "Đang tải mô tả báo cáo..."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm trong bảng chi tiết..."
                className="h-[38px] rounded-md border-slate-200 pl-10 shadow-none focus-visible:ring-blue-500/20"
              />
            </div>
            <Button variant="outline" className="h-[38px] border-slate-200 bg-white text-[13px] font-medium shadow-none" onClick={exportExcel} disabled={!detail}>
              <Download size={14} className="mr-2" />
              Excel
            </Button>
            <Button variant="outline" className="h-[38px] border-slate-200 bg-white text-[13px] font-medium shadow-none" onClick={exportPdf} disabled={!detail}>
              <FileText size={14} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
        <div className="overflow-x-auto rounded-[4px] border border-slate-100">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                {detail?.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "p-3 text-[12px] font-semibold text-[#1f1f1f]",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailLoading ? (
                <TableRow>
                  <TableCell colSpan={detail?.columns.length || 1} className="h-32 text-center text-slate-400">
                    Đang tải bảng chi tiết...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={detail?.columns.length || 1} className="h-32 text-center text-slate-400">
                    Không có dữ liệu phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row, index) => (
                  <TableRow key={`${detail?.type || "detail"}-${index}`} className="border-b border-[#eee] transition-colors hover:bg-[#f0f8ff]">
                    {detail?.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "p-3 text-[12px] text-slate-700",
                          column.align === "right" && "text-right font-semibold",
                        )}
                      >
                        {formatCellValue(row[column.key], column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={detailPage}
          totalItems={filteredRows.length}
          pageSize={DETAIL_PAGE_SIZE}
          onPageChange={setDetailPage}
        />
        </div>
      </div>
      </div>
    </div>
  );
}

