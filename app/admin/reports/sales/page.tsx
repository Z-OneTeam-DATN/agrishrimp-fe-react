"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  revenue_employee: "Báo cáo doanh thu theo nhân viên",
  delivery_detail: "Báo cáo giao hàng chi tiết",
  returns_by_order: "Trả hàng theo đơn hàng",
  returns_by_product: "Trả hàng theo sản phẩm",
  payment_time: "Báo cáo thanh toán theo thời gian",
  payment_employee: "Báo cáo thanh toán theo nhân viên",
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
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(true);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [startDate, setStartDate] = useState(toIso(defaultStart));
  const [endDate, setEndDate] = useState(toIso(today));
  const [summary, setSummary] = useState<SalesReportSummary | null>(null);
  const [detail, setDetail] = useState<SalesReportDetail | null>(null);
  const [activeDetailType, setActiveDetailType] = useState<keyof typeof DETAIL_OPTIONS>("revenue_time");
  const [revenueReportType, setRevenueReportType] = useState<"revenue_time" | "revenue_employee">("revenue_time");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await branchService.getAll();
        setBranches(Array.isArray(branchRes) ? branchRes : branchRes?.data || branchRes?.content || []);
      } catch (error) {
        console.error("Không thể tải danh sách chi nhánh", error);
        toast.error("Không thể tải danh sách chi nhánh");
      }
    };

    fetchBranches();
  }, []);

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
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`bao_cao_doanh_thu_${detail.type}_${startDate}_${endDate}.pdf`);
    toast.success("Đã xuất PDF báo cáo");
  };

  const openDetail = (type: keyof typeof DETAIL_OPTIONS) => {
    setActiveDetailType(type);
    if (type === "revenue_time" || type === "revenue_employee") {
      setRevenueReportType(type);
    }
  };

  const deliveryMax = Math.max(1, ...(summary?.delivery.breakdown.map((item) => item.count) || [1]));
  const overviewCards = [
    {
      label: "Doanh thu",
      value: loading ? "..." : formatNumber(summary?.revenue.totalRevenue || 0),
      hint: `${summary?.revenue.totalOrders || 0} đơn hoàn tất`,
      icon: TrendingUp,
      tone: "from-blue-600/12 to-cyan-500/10 text-blue-700",
    },
    {
      label: "Đã giao",
      value: loading ? "..." : String(summary?.delivery.totalShipments || 0),
      hint: `${summary?.delivery.breakdown.length || 0} trạng thái theo dõi`,
      icon: Package,
      tone: "from-emerald-600/12 to-teal-500/10 text-emerald-700",
    },
    {
      label: "Đã thu",
      value: loading ? "..." : formatNumber(summary?.payment.paidAmount || 0),
      hint: `${summary?.payment.paidOrders || 0} đơn đã thanh toán`,
      icon: CreditCard,
      tone: "from-violet-600/12 to-fuchsia-500/10 text-violet-700",
    },
    {
      label: "Giá trị TB / đơn",
      value: loading ? "..." : formatNumber(summary?.orders.averageOrderValue || 0),
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
    <div className="min-h-screen space-y-6 bg-[#f0f2f5] p-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">Báo cáo / kinh doanh</p>
          <h1 className="text-[28px] font-black uppercase text-[#1f1f1f]">Báo cáo doanh thu</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Theo dõi doanh thu, giao hàng, trả hàng, thanh toán và chi tiết đơn bán theo dữ liệu thực tế.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-[36px] rounded-[4px] border border-[#dcdcdc] text-[13px] font-medium">
              <HelpCircle size={16} className="mr-2 text-slate-500" />
              Trợ giúp
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[620px] rounded-none">
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

      <div className="rounded-[4px] border border-[#dcdcdc] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-[1.1fr_1fr_1fr_auto_auto]">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chi nhánh</p>
            <div className="flex items-center gap-0 rounded-[4px] border border-[#dcdcdc] bg-white">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="h-[38px] w-full rounded-none border-none bg-transparent text-[12px] shadow-none">
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Từ ngày</p>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-[38px] rounded-none border-[#dcdcdc] bg-white text-[13px] shadow-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Đến ngày</p>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-[38px] rounded-none border-[#dcdcdc] bg-white text-[13px] shadow-none"
            />
          </div>

          <Button className="h-[38px] rounded-none bg-blue-600 px-4 text-white hover:bg-blue-700" onClick={loadSummary} disabled={loading}>
            <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
            Tải báo cáo
          </Button>

          <Button variant="outline" className="h-[38px] rounded-none border-[#dcdcdc] bg-white px-4" onClick={() => openDetail(activeDetailType)}>
            Xem chi tiết
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-[4px] border border-[#dcdcdc] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-blue-50 text-blue-600">
                  <Icon size={18} />
                </div>
                <Badge variant="secondary" className="rounded-none border-none bg-blue-50 text-blue-600">
                  {card.label}
                </Badge>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-800">{card.value}</p>
              <p className="mt-2 text-[12px] text-slate-500">{card.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.95fr)]">
        <div className="flex min-h-[460px] flex-col overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between p-6">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-700">
                Doanh thu cửa hàng
              </h2>
              <p className="text-[12px] font-medium text-slate-400">
                {summary?.branchName || "Đang tải..."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-black tracking-tighter text-blue-600">
                {loading ? "..." : formatNumber(summary?.revenue.totalRevenue || 0)}
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
            <span className="text-[11px] text-emerald-600">
              Lợi nhuận: {formatNumber(summary?.revenue.totalProfit || 0)}
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
            <Select value={revenueReportType} onValueChange={(value) => setRevenueReportType(value as "revenue_time" | "revenue_employee")}>
              <SelectTrigger className="h-[38px] rounded-none border-[#dcdcdc] bg-white text-[13px] shadow-none">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="revenue_time">Báo cáo doanh thu theo thời gian</SelectItem>
                <SelectItem value="revenue_employee">Báo cáo doanh thu theo nhân viên</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-[38px] w-full rounded-none bg-blue-600 text-white hover:bg-blue-700" onClick={() => openDetail(revenueReportType)}>
              Xem chi tiết báo cáo này
            </Button>
          </div>
        </div>

        <div className="flex min-h-[460px] flex-col overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between p-6">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-700">
                Thông tin giao hàng
              </h2>
              <p className="text-[12px] font-medium text-slate-400">
                Tổng số đơn cần theo dõi trong kỳ
              </p>
            </div>
            <div className="text-[28px] font-black tracking-tighter text-blue-600">
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

          <div className="flex-1 space-y-3 px-6">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Đang tải thống kê giao hàng...</div>
            ) : (
              summary?.delivery.breakdown.map((item) => (
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
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 p-5">
            <Select value="delivery_detail" onValueChange={() => openDetail("delivery_detail")}>
              <SelectTrigger className="h-[38px] rounded-none border-[#dcdcdc] bg-white text-[13px] shadow-none">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="delivery_detail">Báo cáo giao hàng chi tiết</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-[38px] w-full rounded-none bg-blue-600 text-white hover:bg-blue-700" onClick={() => openDetail("delivery_detail")}>
              Xem tiến độ giao hàng
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="flex min-h-[280px] flex-col rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-700">Trả hàng</h2>
              <p className="text-[11px] text-slate-400">Theo đơn và theo sản phẩm</p>
            </div>
            <div className="text-[24px] font-black tracking-tighter text-blue-600">
              {loading ? "..." : summary?.returns.totalReturnedOrders || 0}
            </div>
          </div>
          <div className="px-6 pt-3 text-[12px] text-rose-600">
            Giá trị trả: {formatNumber(summary?.returns.totalReturnedAmount || 0)}
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Trả hàng theo đơn hàng" icon={RotateCcw} type="returns_by_order" />
            <ReportLink label="Trả hàng theo sản phẩm" icon={Package} type="returns_by_product" />
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-700">Thanh toán</h2>
              <p className="text-[11px] text-slate-400">Theo thời gian, nhân viên, phương thức, chi nhánh</p>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-black tracking-tighter text-blue-600">
                {loading ? "..." : formatNumber(summary?.payment.paidAmount || 0)}
              </div>
              <p className="text-[11px] text-slate-400">
                {summary?.payment.paidOrders || 0} đã thu / {summary?.payment.unpaidOrders || 0} chưa thu
              </p>
            </div>
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Báo cáo thanh toán theo thời gian" icon={Calendar} type="payment_time" />
            <ReportLink label="Báo cáo thanh toán theo nhân viên" icon={Users} type="payment_employee" />
            <ReportLink label="Báo cáo theo phương thức thanh toán" icon={CreditCard} type="payment_method" />
            <ReportLink label="Báo cáo thanh toán theo chi nhánh" icon={TrendingUp} type="payment_branch" />
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-100 p-6">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-700">Đơn hàng</h2>
              <p className="text-[11px] text-slate-400">Thống kê tổng hợp và chi tiết bán hàng</p>
            </div>
            <div className="text-right">
              <div className="text-[24px] font-black tracking-tighter text-blue-600">
                {loading ? "..." : summary?.orders.totalOrders || 0}
              </div>
              <p className="text-[11px] text-slate-400">
                {formatNumber(summary?.orders.averageOrderValue || 0)} / đơn
              </p>
            </div>
          </div>
          <div className="px-6 pt-3 text-[12px] text-emerald-600">
            Sản phẩm bán ra: {summary?.orders.totalProductsSold || 0}
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Báo cáo thống kê theo đơn hàng" icon={ShoppingCart} type="order_stats" />
            <ReportLink label="Báo cáo thống kê theo sản phẩm" icon={Package} type="order_product" />
            <ReportLink label="Báo cáo doanh thu chi tiết" icon={FileText} type="order_detail" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-[15px] font-black uppercase tracking-wider text-slate-700">
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
                className="h-[38px] rounded-none border-[#dcdcdc] pl-10 shadow-none"
              />
            </div>
            <Button variant="outline" className="h-[38px] rounded-none border-[#dcdcdc]" onClick={exportExcel} disabled={!detail}>
              <Download size={14} className="mr-2" />
              Excel
            </Button>
            <Button variant="outline" className="h-[38px] rounded-none border-[#dcdcdc]" onClick={exportPdf} disabled={!detail}>
              <FileText size={14} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="px-6 py-3 text-[12px] text-slate-500">
          {detailLoading ? "Đang tải dữ liệu..." : `Hiển thị ${filteredRows.length} / ${detail?.totalRows || 0} dòng`}
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa]">
                {detail?.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
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
                filteredRows.map((row, index) => (
                  <TableRow key={`${detail?.type || "detail"}-${index}`} className="hover:bg-blue-50/20">
                    {detail?.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "text-[12px] text-slate-700",
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
      </div>
    </div>
  );
}
