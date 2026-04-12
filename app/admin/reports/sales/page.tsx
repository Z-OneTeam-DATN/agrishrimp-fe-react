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
  order_detail: "Báo cáo bán hàng chi tiết",
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
      console.error("Không thể tải báo cáo bán hàng", error);
      toast.error("Không thể tải báo cáo bán hàng");
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao cao ban hang");
    XLSX.writeFile(workbook, `bao_cao_ban_hang_${detail.type}_${startDate}_${endDate}.xlsx`);
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
    doc.save(`bao_cao_ban_hang_${detail.type}_${startDate}_${endDate}.pdf`);
    toast.success("Đã xuất PDF báo cáo");
  };

  const openDetail = (type: keyof typeof DETAIL_OPTIONS) => {
    setActiveDetailType(type);
    if (type === "revenue_time" || type === "revenue_employee") {
      setRevenueReportType(type);
    }
  };

  const deliveryMax = Math.max(1, ...(summary?.delivery.breakdown.map((item) => item.count) || [1]));

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
        "flex w-full items-center justify-between py-2 text-left transition-colors hover:bg-slate-50",
        activeDetailType === type && "bg-blue-50/60",
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className={cn("text-slate-400", activeDetailType === type && "text-blue-600")} />
        <span className={cn("text-[13px] text-slate-600", activeDetailType === type && "font-semibold text-blue-700")}>
          {label}
        </span>
      </div>
      {activeDetailType === type && (
        <Badge className="rounded-none bg-blue-600 text-white">Đang xem</Badge>
      )}
    </button>
  );

  return (
    <div className="min-h-screen space-y-6 bg-[#f0f2f5] p-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black uppercase tracking-tight text-slate-800">
            Báo cáo bán hàng
          </h1>
          <p className="text-[12px] text-slate-500">
            Theo dõi doanh thu, giao hàng, trả hàng, thanh toán và chi tiết đơn bán.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-0 border border-slate-300 bg-white">
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="h-9 w-[200px] rounded-none border-none text-[12px] shadow-none">
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

          <div className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-1">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-7 border-none p-0 text-[12px] shadow-none" />
            <span className="text-slate-400">-</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-7 border-none p-0 text-[12px] shadow-none" />
          </div>

          <Button variant="outline" className="h-9 rounded-none bg-white" onClick={loadSummary} disabled={loading}>
            <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} />
            Làm mới
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-9 rounded-none bg-white">
                <HelpCircle size={16} className="mr-2" />
                Trợ giúp
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px]">
              <DialogHeader>
                <DialogTitle>Hướng dẫn trang Báo cáo bán hàng</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-slate-600">
                <p>Phần trên cùng hiển thị xu hướng doanh thu và tiến độ giao hàng theo khoảng ngày bạn chọn.</p>
                <p>Các nhóm Trả hàng, Thanh toán và Đơn hàng bên dưới đều có nút để đổi sang bảng chi tiết thật ở phần cuối trang.</p>
                <p>Nút Excel và PDF sẽ xuất đúng bảng chi tiết đang mở, không dùng dữ liệu mẫu.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex h-[430px] flex-col rounded-none border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between p-5">
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

          <div className="mb-4 flex items-center justify-between px-5">
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

          <div className="min-h-[220px] flex-1 px-5">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Đang tải biểu đồ...</div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          <div className="space-y-3 border-t border-slate-50 bg-[#fcfcfc] p-5">
            <Select value={revenueReportType} onValueChange={(value) => setRevenueReportType(value as "revenue_time" | "revenue_employee")}>
              <SelectTrigger className="h-9 rounded-none border-slate-200 bg-white text-[13px]">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="revenue_time">Báo cáo doanh thu theo thời gian</SelectItem>
                <SelectItem value="revenue_employee">Báo cáo doanh thu theo nhân viên</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-9 w-full rounded-none" onClick={() => openDetail(revenueReportType)}>
              Xem chi tiết báo cáo này
            </Button>
          </div>
        </div>

        <div className="flex h-[430px] flex-col rounded-none border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between p-5">
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

          <div className="mb-4 px-5">
            <button
              type="button"
              onClick={() => openDetail("delivery_detail")}
              className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
            >
              Theo tình trạng <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1 space-y-3 px-5">
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

          <div className="space-y-3 border-t border-slate-50 bg-[#fcfcfc] p-5">
            <Select value="delivery_detail" onValueChange={() => openDetail("delivery_detail")}>
              <SelectTrigger className="h-9 rounded-none border-slate-200 bg-white text-[13px]">
                <SelectValue placeholder="Chọn loại báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="delivery_detail">Báo cáo giao hàng chi tiết</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-9 w-full rounded-none" onClick={() => openDetail("delivery_detail")}>
              Xem tiến độ giao hàng
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex min-h-[250px] flex-col rounded-none border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-50 p-5">
            <div>
              <h2 className="text-[14px] font-black uppercase tracking-wider text-slate-700">Trả hàng</h2>
              <p className="text-[11px] text-slate-400">Theo đơn và theo sản phẩm</p>
            </div>
            <div className="text-[24px] font-black tracking-tighter text-blue-600">
              {loading ? "..." : summary?.returns.totalReturnedOrders || 0}
            </div>
          </div>
          <div className="px-5 pt-3 text-[12px] text-rose-600">
            Giá trị trả: {formatNumber(summary?.returns.totalReturnedAmount || 0)}
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Trả hàng theo đơn hàng" icon={RotateCcw} type="returns_by_order" />
            <ReportLink label="Trả hàng theo sản phẩm" icon={Package} type="returns_by_product" />
          </div>
        </div>

        <div className="flex min-h-[250px] flex-col rounded-none border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-50 p-5">
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

        <div className="flex min-h-[250px] flex-col rounded-none border border-[#dcdcdc] bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-50 p-5">
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
          <div className="px-5 pt-3 text-[12px] text-emerald-600">
            Sản phẩm bán ra: {summary?.orders.totalProductsSold || 0}
          </div>
          <div className="space-y-1 p-5">
            <ReportLink label="Báo cáo thống kê theo đơn hàng" icon={ShoppingCart} type="order_stats" />
            <ReportLink label="Báo cáo thống kê theo sản phẩm" icon={Package} type="order_product" />
            <ReportLink label="Báo cáo bán hàng chi tiết" icon={FileText} type="order_detail" />
          </div>
        </div>
      </div>

      <div className="rounded-none border border-[#dcdcdc] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
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
                className="h-9 rounded-none border-slate-200 pl-10 shadow-none"
              />
            </div>
            <Button variant="outline" className="h-9 rounded-none" onClick={exportExcel} disabled={!detail}>
              <Download size={14} className="mr-2" />
              Excel
            </Button>
            <Button variant="outline" className="h-9 rounded-none" onClick={exportPdf} disabled={!detail}>
              <FileText size={14} className="mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="px-5 py-3 text-[12px] text-slate-500">
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
