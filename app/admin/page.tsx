"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { dashboardService } from "@/app/services/dashboard.service";
import { branchService } from "@/app/services/branchService";
import { orderService } from "@/app/services/order.service";
import {
  CategoryDistribution,
  CustomerInsights,
  DailyResults,
  DashboardStats,
  InventoryInfo,
  MonthlyResults,
  PendingOrdersSummary,
  SalesPerformanceData,
  TopProduct,
} from "@/app/types/dashboard.type";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import WarehouseWorkflowCards from "@/components/admin/WarehouseWorkflowCards";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { normalizeRoleSlug } from "@/lib/roles";

const AdminDashboardCharts = dynamic(
  () => import("@/components/admin/AdminDashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <Panel title="Doanh thu theo ngày">
          <div className="h-[300px] rounded-[4px] bg-slate-50" />
        </Panel>
        <Panel title="Cơ cấu doanh thu nhóm hàng">
          <div className="h-[300px] rounded-[4px] bg-slate-50" />
        </Panel>
      </div>
    ),
  },
);

const AdminDashboardOrderChart = dynamic(
  () => import("@/components/admin/AdminDashboardOrderChart"),
  {
    ssr: false,
    loading: () => <div className="h-[220px] rounded-[4px] bg-slate-50" />,
  },
);

type BranchOption = {
  id: number;
  name: string;
};

type OrderRisk = {
  totalMissingQuantity?: number;
};

const currency = (value?: number | null) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const compactCurrency = (value?: number | null) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} triệu`;
  }
  return currency(amount);
};

const numberText = (value?: number | null) =>
  Number(value || 0).toLocaleString("vi-VN");

// "2026-08" (giá trị của <input type="month">) -> "8/2026"
const formatMonthLabel = (value: string) => {
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${Number(month)}/${year}`;
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentMonthValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

const getDefaultDateRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: toIsoDate(start),
    end: toIsoDate(today),
  };
};

const formatDateLabel = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${Number(day)}/${month}/${year}`;
};

type DashboardPeriodMode = "today" | "date" | "month";

const percentText = (value?: number | null) => {
  const amount = Number(value || 0);
  if (amount === 0) return "0%";
  return `${amount > 0 ? "+" : ""}${amount.toFixed(1)}%`;
};

// Khi hôm qua = 0, % tăng trưởng không có ý nghĩa (chia cho 0) — backend trả về isNew=true
// thay vì bịa ra "+100%", nên hiển thị nhãn "Mới" cho rõ ràng thay vì một con số gây hiểu lầm.
const trendText = (value?: number | null, isNew?: boolean) =>
  isNew ? "Mới" : percentText(value);

const getTrendColor = (value?: number | null, isNew?: boolean) => {
  if (isNew) return "text-blue-600";
  const amount = Number(value || 0);
  if (amount > 0) return "text-blue-600";
  if (amount < 0) return "text-red-600";
  return "text-slate-400";
};

const orderStatusRows = (pending?: PendingOrdersSummary) => [
  {
    label: "Chờ duyệt",
    value: pending?.pendingApproval ?? 0,
    href: "/admin/orders/pending",
  },
  {
    label: "Chờ thanh toán",
    value: pending?.pendingPayment ?? 0,
    href: "/admin/orders/awaiting-payment",
  },
  {
    label: "Chờ đóng gói",
    value: pending?.pendingPacking ?? 0,
    href: "/admin/orders/processing",
  },
  {
    label: "Chờ lấy hàng",
    value: pending?.pendingPickup ?? 0,
    href: "/admin/orders/ready-for-pickup",
  },
  {
    label: "Đang giao",
    value: pending?.shipping ?? 0,
    href: "/admin/orders/shipping",
  },
  {
    label: "Hủy giao chờ nhận",
    value: pending?.cancelPending ?? 0,
    href: "/admin/orders-all",
  },
];

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useCurrentUser();
  const { hasPermission, hasAnyPermission, isLoadingAuth, isLoadingPermissions } = usePermissions();
  const accessToken = useAuthStore((state) => state.accessToken);
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const [selectedBranchId, setSelectedBranchId] = useState<
    string | undefined
  >();
  const defaultDateRange = useMemo(() => getDefaultDateRange(), []);
  const currentMonthValue = useMemo(() => getCurrentMonthValue(), []);
  const [periodMode, setPeriodMode] = useState<DashboardPeriodMode>("today");
  const [fromDate, setFromDate] = useState(defaultDateRange.start);
  const [toDate, setToDate] = useState(defaultDateRange.end);
  const [fromMonth, setFromMonth] = useState(currentMonthValue);
  const [toMonth, setToMonth] = useState(currentMonthValue);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [warehouseRefreshToken, setWarehouseRefreshToken] = useState(0);

  const scopedBranchId = (user?.branch?.id ?? warehouseId)?.toString();
  const roleSlug = normalizeRoleSlug(user?.role);
  // Chỉ Super Admin mới được lọc/xem tất cả chi nhánh. Admin thường và tài khoản gắn
  // với 1 chi nhánh (Manager/Staff/Employee...) luôn bị khoá vào đúng chi nhánh của họ,
  // kể cả khi tài khoản đó vô tình không có branch_id trong DB.
  const isSuperAdmin = roleSlug === "SUPER_ADMIN";
  const canSelectAllBranches = isSuperAdmin;
  const canViewDashboard = hasPermission(P.DASHBOARD_VIEW);
  const canViewWarehouseWorkflows = hasAnyPermission([
    P.IMPORT_VIEW,
    P.EXPORT_VIEW,
    P.TRANSFER_VIEW,
    P.CHECK_VIEW,
  ]);
  const canRunProtectedQueries =
    !isLoadingAuth && !isLoadingPermissions && !!user && !!accessToken && canViewDashboard;

  useEffect(() => {
    // Super Admin không bị khoá theo scopedBranchId dù tài khoản của họ có gắn branch_id
    // hay không — mặc định xem "Tất cả chi nhánh" trừ khi họ tự chọn 1 chi nhánh cụ thể.
    if (!isSuperAdmin && scopedBranchId) {
      setSelectedBranchId(scopedBranchId);
    }
  }, [isSuperAdmin, scopedBranchId]);

  const { data: branches = [] } = useQuery<BranchOption[]>({
    queryKey: ["branches-list"],
    queryFn: () => branchService.getAll(),
    enabled:
      canRunProtectedQueries &&
      canSelectAllBranches &&
      hasPermission(P.BRANCH_VIEW),
  });

  const { data: customerInsights, isError: isCustomerInsightsError } =
    useQuery<CustomerInsights>({
      queryKey: ["customer-insights", selectedBranchId],
      queryFn: () => dashboardService.getCustomerInsights(selectedBranchId),
      enabled: canRunProtectedQueries && hasPermission(P.CUSTOMER_VIEW),
    });

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", selectedBranchId],
    queryFn: () => dashboardService.getStats(selectedBranchId),
    enabled: canRunProtectedQueries,
  });

  const {
    data: dailyResults,
    isLoading: isDailyLoading,
    isError: isDailyError,
  } = useQuery<DailyResults>({
    queryKey: ["daily-results", selectedBranchId],
    queryFn: () => dashboardService.getDailyResults(selectedBranchId),
    enabled: canRunProtectedQueries,
  });

  const isRangeMode = periodMode !== "today";
  const {
    data: rangeResults,
    isLoading: isRangeLoading,
    isError: isRangeError,
  } = useQuery<MonthlyResults>({
    queryKey: [
      "business-results",
      periodMode,
      fromDate,
      toDate,
      fromMonth,
      toMonth,
      selectedBranchId,
    ],
    queryFn: () =>
      dashboardService.getBusinessResults({
        branchId: selectedBranchId,
        startDate: periodMode === "date" ? fromDate : undefined,
        endDate: periodMode === "date" ? toDate : undefined,
        startMonth: periodMode === "month" ? fromMonth : undefined,
        endMonth: periodMode === "month" ? toMonth : undefined,
      }),
    enabled:
      canRunProtectedQueries &&
      ((periodMode === "date" && !!fromDate && !!toDate) ||
        (periodMode === "month" && !!fromMonth && !!toMonth)),
  });

  const { data: pendingSummary, isError: isPendingSummaryError } =
    useQuery<PendingOrdersSummary>({
      queryKey: ["pending-orders-summary", selectedBranchId],
      queryFn: () =>
        dashboardService.getPendingOrdersSummary(selectedBranchId),
      enabled: canRunProtectedQueries,
    });

  const { data: inventoryInfo, isError: isInventoryInfoError } =
    useQuery<InventoryInfo>({
      queryKey: ["inventory-info", selectedBranchId],
      queryFn: () => dashboardService.getInventoryInfo(selectedBranchId),
      enabled: canRunProtectedQueries,
    });

  const { data: topProducts = [], isError: isTopProductsError } = useQuery<
    TopProduct[]
  >({
    queryKey: ["top-products", selectedBranchId],
    queryFn: () => dashboardService.getTopProducts(5, selectedBranchId),
    enabled: canRunProtectedQueries,
  });

  const { data: salesPerformance, isError: isSalesPerformanceError } =
    useQuery({
      queryKey: ["sales-performance", selectedBranchId],
      queryFn: () => dashboardService.getSalesPerformance(selectedBranchId),
      enabled: canRunProtectedQueries,
    });

  const {
    data: categoryDistribution = [],
    isError: isCategoryDistributionError,
  } = useQuery<CategoryDistribution[]>({
    queryKey: ["category-distribution", selectedBranchId],
    queryFn: () => dashboardService.getCategoryDistribution(selectedBranchId),
    enabled: canRunProtectedQueries,
  });

  const { data: backorders = [], isError: isBackordersError } = useQuery<
    OrderRisk[]
  >({
    queryKey: ["backorder-report", selectedBranchId],
    queryFn: () => orderService.getBackorderReport(selectedBranchId),
    enabled: canRunProtectedQueries,
    refetchInterval: 60000,
  });

  const hasLoadError =
    isStatsError ||
    isDailyError ||
    isRangeError ||
    isPendingSummaryError ||
    isInventoryInfoError ||
    isTopProductsError ||
    isSalesPerformanceError ||
    isCategoryDistributionError ||
    isCustomerInsightsError ||
    isBackordersError;

  const branchLabel = canSelectAllBranches
    ? selectedBranchId
      ? branches.find((branch) => branch.id.toString() === selectedBranchId)
          ?.name || "Chi nhánh đã chọn"
      : "Tất cả chi nhánh"
    : user?.branch?.name ||
      (scopedBranchId ? `Chi nhánh #${scopedBranchId}` : "Chi nhánh của bạn");

  const backorderCount = useMemo(
    () =>
      backorders.reduce(
        (sum, item) => sum + Number(item.totalMissingQuantity || 0),
        0,
      ),
    [backorders],
  );

  const orderRows = useMemo(
    () => orderStatusRows(pendingSummary),
    [pendingSummary],
  );
  const orderChartRows = orderRows.map((item) => ({
    name: item.label,
    value: item.value,
  }));

  const orderWorkload = orderRows.reduce((sum, item) => sum + item.value, 0);
  const inventoryRisk =
    Number(inventoryInfo?.lowStockCount || 0) +
    Number(inventoryInfo?.outOfStockCount || 0);
  const urgentWork = orderWorkload + inventoryRisk + backorderCount;

  // Bộ lọc này chỉ đổi 3 thẻ chỉ số vận hành đầu trang. Các panel ưu tiên/kho vẫn giữ
  // phạm vi riêng của chúng để không làm sai ý nghĩa "hôm nay" hoặc số liệu tồn hiện tại.
  const periodLabel =
    periodMode === "date"
      ? fromDate === toDate
        ? `ngày ${formatDateLabel(fromDate)}`
        : `từ ${formatDateLabel(fromDate)} đến ${formatDateLabel(toDate)}`
      : periodMode === "month"
        ? fromMonth === toMonth
          ? `tháng ${formatMonthLabel(fromMonth)}`
          : `từ tháng ${formatMonthLabel(fromMonth)} đến ${formatMonthLabel(toMonth)}`
        : "hôm nay";
  const comparisonLabel =
    periodMode === "today"
      ? "so với hôm qua"
      : periodMode === "month" && fromMonth === toMonth
        ? "so với tháng trước"
        : "so với kỳ trước";
  const isPrimaryMetricsLoading = isRangeMode ? isRangeLoading : isDailyLoading;
  const revenueValue = isRangeMode
    ? rangeResults?.currentMonthRevenue
    : dailyResults?.todayRevenue;
  const revenuePercent = isRangeMode
    ? rangeResults?.revenueChangePercent
    : dailyResults?.revenueChangePercent;
  const revenueIsNew = isRangeMode
    ? rangeResults?.revenueIsNew
    : dailyResults?.revenueIsNew;
  const profitValue = isRangeMode
    ? rangeResults?.currentMonthProfit
    : dailyResults?.todayProfit;
  const profitPercent = isRangeMode
    ? rangeResults?.profitChangePercent
    : dailyResults?.profitChangePercent;
  const profitIsNew = isRangeMode
    ? rangeResults?.profitIsNew
    : dailyResults?.profitIsNew;
  const ordersValue = isRangeMode
    ? rangeResults?.currentMonthOrders
    : dailyResults?.todayOrders;
  const ordersPercent = isRangeMode
    ? rangeResults?.orderChangePercent
    : dailyResults?.orderChangePercent;
  const ordersIsNew = isRangeMode
    ? rangeResults?.orderIsNew
    : dailyResults?.orderIsNew;

  const salesRows = salesPerformance?.data ?? [];
  const categoryRows = categoryDistribution.slice(0, 5).map((item) => ({
    ...item,
    percentage: Number.isFinite(Number(item.percentage))
      ? Number(item.percentage)
      : 0,
    totalRevenue: Number.isFinite(Number(item.totalRevenue))
      ? Number(item.totalRevenue)
      : 0,
    totalQuantity: Number.isFinite(Number(item.totalQuantity))
      ? Number(item.totalQuantity)
      : 0,
  }));
  const categoryTotalPercent = categoryRows.reduce(
    (sum, item) => sum + Number(item.percentage || 0),
    0,
  );
  const customerTotal = Number(
    customerInsights?.totalCustomers ?? stats?.totalCustomers ?? 0,
  );
  const newCustomersThisMonth = Number(
    customerInsights?.newCustomersThisMonth ?? 0,
  );
  const activeCustomers = Number(customerInsights?.activeCustomers ?? 0);
  const averageOrderValue =
    stats?.totalOrders && stats.totalOrders > 0
      ? Number(stats.totalRevenue || 0) / Number(stats.totalOrders)
      : 0;
  const orderPerCustomer =
    customerTotal > 0
      ? (Number(stats?.totalOrders || 0) / customerTotal) * 100
      : 0;
  const revenueChartRows = salesRows.map((item: SalesPerformanceData) => {
    const parsedDate = new Date(item.date);

    return {
      date: Number.isNaN(parsedDate.getTime())
        ? "--/--"
        : parsedDate.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          }),
      revenue: Number.isFinite(Number(item.revenue)) ? Number(item.revenue) : 0,
      profit: Number.isFinite(Number(item.profit)) ? Number(item.profit) : 0,
      orders: Number.isFinite(Number(item.orderCount))
        ? Number(item.orderCount)
        : 0,
    };
  });
  const hasRevenueChartData = revenueChartRows.some(
    (item) => item.revenue > 0 || item.profit > 0 || item.orders > 0,
  );
  const hasCategoryChartData = categoryRows.some(
    (item) =>
      Number(item.percentage || 0) > 0 ||
      Number(item.totalRevenue || 0) > 0 ||
      Number(item.totalQuantity || 0) > 0,
  );
  const hasOrderChartData = orderChartRows.some(
    (item) => Number(item.value || 0) > 0,
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-results"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-results"] }),
        queryClient.invalidateQueries({ queryKey: ["business-results"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-info"] }),
        queryClient.invalidateQueries({ queryKey: ["top-products"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-performance"] }),
        queryClient.invalidateQueries({ queryKey: ["category-distribution"] }),
        queryClient.invalidateQueries({ queryKey: ["customer-insights"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-orders-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["backorder-report"] }),
      ]);
      setWarehouseRefreshToken((token) => token + 1);
      toast.success("Đã làm mới dữ liệu tổng quan");
    } catch {
      toast.error("Không thể làm mới dữ liệu");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isUserLoading || isLoadingAuth || isLoadingPermissions) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 rounded-[4px] border border-slate-200 bg-white">
        <Skeleton className="h-8 w-52 rounded-[4px]" />
        <Skeleton className="h-4 w-72 rounded-[4px]" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-[4px] border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-[16px] font-semibold text-slate-900">
          Không thể tải dữ liệu người dùng
        </h2>
        <p className="mt-2 max-w-md text-[12px] text-slate-500">
          Vui lòng kiểm tra lại phiên đăng nhập hoặc tải lại trang.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-6 h-10 rounded-[4px] bg-blue-600 px-5 text-[13px] font-semibold hover:bg-blue-700"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-2 rounded-[4px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-[16px] font-semibold text-slate-800">
            Bạn không có quyền truy cập
          </h2>
          <p className="text-[12px] text-slate-500">
            Tài khoản hiện tại chưa được cấp quyền xem tổng quan hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold uppercase text-slate-900">
            Tổng quan vận hành
          </h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Phạm vi: {branchLabel}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
            <div className="flex w-full rounded-[4px] border border-slate-200 bg-white p-1 shadow-none sm:w-auto">
              {[
                { value: "today", label: "Hôm nay" },
                { value: "date", label: "Theo ngày" },
                { value: "month", label: "Theo tháng" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  onClick={() => setPeriodMode(option.value as DashboardPeriodMode)}
                  className={`h-8 flex-1 rounded-[4px] px-3 text-[12px] font-semibold sm:flex-none ${
                    periodMode === option.value
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {periodMode === "date" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex h-10 items-center gap-2 rounded-[4px] border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 shadow-none">
                  <span className="shrink-0">Từ ngày</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || defaultDateRange.end}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="min-w-0 bg-transparent text-[13px] font-medium text-slate-800 outline-none"
                  />
                </label>
                <label className="flex h-10 items-center gap-2 rounded-[4px] border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 shadow-none">
                  <span className="shrink-0">Đến ngày</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={defaultDateRange.end}
                    onChange={(event) => setToDate(event.target.value)}
                    className="min-w-0 bg-transparent text-[13px] font-medium text-slate-800 outline-none"
                  />
                </label>
              </div>
            )}
            {periodMode === "month" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex h-10 items-center gap-2 rounded-[4px] border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 shadow-none">
                  <span className="shrink-0">Từ tháng</span>
                  <input
                    type="month"
                    value={fromMonth}
                    max={toMonth || currentMonthValue}
                    onChange={(event) => setFromMonth(event.target.value)}
                    className="min-w-0 bg-transparent text-[13px] font-medium text-slate-800 outline-none"
                  />
                </label>
                <label className="flex h-10 items-center gap-2 rounded-[4px] border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 shadow-none">
                  <span className="shrink-0">Đến tháng</span>
                  <input
                    type="month"
                    value={toMonth}
                    min={fromMonth}
                    max={currentMonthValue}
                    onChange={(event) => setToMonth(event.target.value)}
                    className="min-w-0 bg-transparent text-[13px] font-medium text-slate-800 outline-none"
                  />
                </label>
              </div>
            )}
          </div>
          {canSelectAllBranches && (
            <Select
              value={selectedBranchId || "all"}
              onValueChange={(value) =>
                setSelectedBranchId(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="h-10 w-full rounded-[4px] border-slate-200 bg-white text-[13px] shadow-none sm:w-[240px]">
                <SelectValue placeholder="Tất cả chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 rounded-[4px] border-slate-200 bg-white px-4 text-[13px] font-semibold shadow-none"
          >
            {isRefreshing ? "Đang làm mới..." : "Làm mới"}
          </Button>
        </div>
      </div>

      {hasLoadError && (
        <div className="flex flex-col gap-2 rounded-[4px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Một số dữ liệu chưa tải được. Số liệu đang hiển thị có thể chưa
            đầy đủ.
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-fit rounded-[4px] border-amber-300 bg-white px-3 text-[12px] font-semibold text-amber-800 shadow-none hover:bg-amber-100"
          >
            Thử lại
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={`Doanh thu ${periodLabel}`}
          value={compactCurrency(revenueValue)}
          subValue={trendText(revenuePercent, revenueIsNew)}
          subLabel={comparisonLabel}
          loading={isPrimaryMetricsLoading}
          trendColor={getTrendColor(revenuePercent, revenueIsNew)}
        />
        <MetricCard
          label={`Lợi nhuận ${periodLabel}`}
          value={compactCurrency(profitValue)}
          subValue={trendText(profitPercent, profitIsNew)}
          subLabel={comparisonLabel}
          loading={isPrimaryMetricsLoading}
          trendColor={getTrendColor(profitPercent, profitIsNew)}
        />
        <MetricCard
          label={`Đơn ${periodLabel}`}
          value={numberText(ordersValue)}
          subValue={trendText(ordersPercent, ordersIsNew)}
          subLabel={comparisonLabel}
          loading={isPrimaryMetricsLoading}
          trendColor={getTrendColor(ordersPercent, ordersIsNew)}
        />
        <MetricCard
          label="Việc cần xử lý"
          value={numberText(urgentWork)}
          subValue={`${orderWorkload} đơn · ${inventoryRisk + backorderCount} kho`}
          subLabel="đang cần chú ý"
          trendColor={urgentWork > 0 ? "text-amber-600" : "text-slate-400"}
        />
        <MetricCard
          compact
          label="Tổng doanh thu"
          value={compactCurrency(stats?.totalRevenue)}
          subValue={trendText(stats?.revenueChangePercent, stats?.revenueIsNew)}
          subLabel="so với hôm qua"
          loading={isStatsLoading}
          trendColor={getTrendColor(stats?.revenueChangePercent, stats?.revenueIsNew)}
        />
        <MetricCard
          compact
          label="Tổng đơn hàng"
          value={numberText(stats?.totalOrders)}
          subValue={trendText(stats?.ordersChangePercent, stats?.ordersIsNew)}
          subLabel="so với hôm qua"
          loading={isStatsLoading}
          trendColor={getTrendColor(stats?.ordersChangePercent, stats?.ordersIsNew)}
        />
        <MetricCard
          compact
          label="Khách hàng"
          value={numberText(stats?.totalCustomers)}
          subValue={trendText(stats?.customersChangePercent, stats?.customersIsNew)}
          subLabel="so với hôm qua"
          loading={isStatsLoading}
          trendColor={getTrendColor(stats?.customersChangePercent, stats?.customersIsNew)}
        />
        <MetricCard
          compact
          label="Giá trị tồn kho"
          value={compactCurrency(inventoryInfo?.totalInventoryValue)}
          subValue={trendText(inventoryInfo?.valueChangePercent, inventoryInfo?.valueIsNew)}
          subLabel="so với hôm qua"
          trendColor={getTrendColor(inventoryInfo?.valueChangePercent, inventoryInfo?.valueIsNew)}
        />
      </div>

      {canViewWarehouseWorkflows && (
        <Panel title="Phiếu kho cần xử lý">
          <WarehouseWorkflowCards refreshToken={warehouseRefreshToken} />
        </Panel>
      )}

      <Panel title="Ưu tiên hôm nay">
        <div className="grid gap-3 md:grid-cols-3">
          <PriorityCard
            label="Xử lý đơn"
            value={orderWorkload}
            description="Duyệt, thanh toán, đóng gói và giao hàng."
            href="/admin/orders-all"
          />
          <PriorityCard
            label="Bổ sung hàng"
            value={inventoryRisk + backorderCount}
            description="Mặt hàng thấp tồn, hết hàng hoặc thiếu trong đơn."
            href="/admin/products"
          />
          <PriorityCard
            label="Theo dõi tiền"
            value={Number(dailyResults?.todayRevenue || 0)}
            valueText={compactCurrency(dailyResults?.todayRevenue)}
            description="So doanh thu, lợi nhuận và dòng đơn trong ngày."
            href="/admin/financial"
          />
        </div>
      </Panel>

      <Panel title="Khách hàng và chuyển đổi">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <InsightBox
            label="Lượt truy cập hôm nay"
            value={numberText(customerInsights?.todayVisitors)}
            note={`${numberText(customerInsights?.todayPageViews)} lượt xem trang · tự đo, chưa phải GA4`}
          />
          <InsightBox
            label="Khách mới tháng này"
            value={numberText(newCustomersThisMonth)}
            note={`Trên ${numberText(customerTotal)} khách`}
          />
          <InsightBox
            label="Khách đang hoạt động"
            value={numberText(activeCustomers)}
            note="Theo trạng thái tài khoản"
          />
          <InsightBox
            label="Đơn / 100 khách"
            value={orderPerCustomer.toFixed(1)}
            note="Số đơn trung bình trên mỗi 100 khách (không phải % khách đã mua)"
          />
          <InsightBox
            label="Giá trị đơn TB"
            value={compactCurrency(averageOrderValue)}
            note="Tổng doanh thu / tổng đơn"
          />
        </div>
      </Panel>

      <AdminDashboardCharts
        revenueChartRows={revenueChartRows}
        hasRevenueChartData={hasRevenueChartData}
        categoryRows={categoryRows}
        hasCategoryChartData={hasCategoryChartData}
        categoryTotalPercent={categoryTotalPercent}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Đơn hàng đang kẹt">
          <div className="space-y-4">
            <AdminDashboardOrderChart
              orderChartRows={orderChartRows}
              hasOrderChartData={hasOrderChartData}
            />
            <div className="grid gap-2">
              {orderRows.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between rounded-[4px] border border-slate-100 px-3 py-2 text-[12px] hover:bg-slate-50"
                >
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900">
                    {numberText(item.value)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Sức khỏe tồn kho">
          <div className="grid gap-3">
            <NumberBar
              label="Còn hàng ổn định"
              value={numberText(
                Math.max(
                  0,
                  Number(inventoryInfo?.totalItems || 0) - inventoryRisk,
                ),
              )}
              percent={
                inventoryInfo?.totalItems
                  ? ((Number(inventoryInfo.totalItems) - inventoryRisk) /
                      Number(inventoryInfo.totalItems)) *
                    100
                  : 0
              }
              tone="#059669"
            />
            <NumberBar
              label="Sắp hết hàng"
              value={numberText(inventoryInfo?.lowStockCount)}
              percent={
                inventoryInfo?.totalItems
                  ? (Number(inventoryInfo.lowStockCount || 0) /
                      Number(inventoryInfo.totalItems)) *
                    100
                  : 0
              }
              tone="#d97706"
            />
            <NumberBar
              label="Hết hàng"
              value={numberText(inventoryInfo?.outOfStockCount)}
              percent={
                inventoryInfo?.totalItems
                  ? (Number(inventoryInfo.outOfStockCount || 0) /
                      Number(inventoryInfo.totalItems)) *
                    100
                  : 0
              }
              tone="#dc2626"
            />
            <NumberBar
              label="Thiếu hàng trong đơn"
              value={numberText(backorderCount)}
              percent={backorderCount > 0 ? 100 : 0}
              tone="#b45309"
            />
          </div>
        </Panel>

        <Panel title="Top sản phẩm bán chạy">
          {topProducts.length === 0 ? (
            <EmptyText text="Chưa có dữ liệu sản phẩm bán chạy." />
          ) : (
            <div className="divide-y divide-slate-100">
              {topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.productId}
                  className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3"
                >
                  <span className="text-[12px] font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {product.productName}
                    </p>
                    <p className="mt-1 text-[10.5px] text-slate-500">
                      Đã bán {numberText(product.quantitySold)}
                    </p>
                  </div>
                  <p className="text-right text-[12px] font-semibold text-slate-900">
                    {compactCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

    </div>
  );
}

function MetricCard({
  compact,
  label,
  loading,
  subLabel,
  subValue,
  trendColor = "text-slate-500",
  value,
}: {
  compact?: boolean;
  label: string;
  loading?: boolean;
  subLabel?: string;
  subValue?: string;
  trendColor?: string;
  value: string;
}) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10.5px] font-semibold text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-32 rounded-[4px]" />
      ) : (
        <p
          className={`mt-2 font-semibold text-slate-900 ${
            compact ? "text-[20px]" : "text-[24px]"
          }`}
        >
          {value}
        </p>
      )}
      {(subValue || subLabel) && (
        <p className="mt-2 text-[11px] text-slate-400">
          {subValue && (
            <span className={`font-semibold ${trendColor}`}>{subValue}</span>
          )}{" "}
          {subLabel}
        </p>
      )}
    </div>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[4px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-[12px] font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function NumberBar({
  label,
  percent,
  tone = "#64748b",
  value,
}: {
  label: string;
  percent: number;
  tone?: string;
  value: string;
}) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-[12px] text-slate-600">{label}</span>
        <span className="shrink-0 text-[12px] font-semibold text-slate-900">
          {value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full"
          style={{ width: `${safePercent}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}

function InsightBox({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-white p-4">
      <p className="text-[10.5px] font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-[18px] font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-[10.5px] leading-4 text-slate-400">{note}</p>
    </div>
  );
}

function PriorityCard({
  description,
  href,
  label,
  value,
  valueText,
}: {
  description: string;
  href: string;
  label: string;
  value: number;
  valueText?: string;
}) {
  const isWarning = value > 0 && !valueText;

  return (
    <Link
      href={href}
      className="rounded-[4px] border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold text-slate-900">{label}</p>
        {isWarning && <AlertTriangle size={15} className="text-amber-600" />}
      </div>
      <p className="mt-3 text-[22px] font-semibold text-slate-900">
        {valueText || numberText(value)}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{description}</p>
    </Link>
  );
}

function EmptyText({
  className = "min-h-[180px]",
  hint,
  icon: Icon = BarChart3,
  text,
}: {
  className?: string;
  hint?: string;
  icon?: LucideIcon;
  text: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50 px-4 text-center ${className}`}
    >
      <div className="flex max-w-[320px] flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
          <Icon size={18} />
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-slate-600">{text}</p>
          {hint && (
            <p className="text-[11px] leading-5 text-slate-400">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
