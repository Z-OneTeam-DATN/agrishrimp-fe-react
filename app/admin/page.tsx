"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { toast } from "sonner";
import { dashboardService } from "@/app/services/dashboard.service";
import { branchService } from "@/app/services/branchService";
import { orderService } from "@/app/services/order.service";
import { MissingItemReport } from "@/app/types/order.types";
import {
  BusinessTrend,
  CategoryDistribution,
  CustomerInsights,
  DailyResults,
  DashboardStats,
  InventoryInfo,
  MetricChange,
  MonthlyResults,
  PendingOrdersSummary,
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
import { Panel } from "@/components/admin/DashboardPanel";
import {
  TREND_BADGE_CLASS,
  type TrendDisplay,
  currency,
  decimalText,
  describeTrend,
  numberText,
  qualityRateText,
} from "@/components/admin/dashboard-viz";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { canUseBranchOrderRoutes, getOrderListPath } from "@/lib/order-routing";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { normalizeRoleSlug } from "@/lib/roles";

const AdminDashboardCharts = dynamic(
  () => import("@/components/admin/AdminDashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <Panel title="Cơ cấu doanh thu nhóm hàng">
        <div className="h-[300px] rounded-[4px] bg-slate-50" />
      </Panel>
    ),
  },
);

const AdminDashboardTrendChart = dynamic(
  () => import("@/components/admin/AdminDashboardTrendChart"),
  {
    ssr: false,
    loading: () => (
      <Panel title="Doanh thu · giá vốn · lợi nhuận theo tháng">
        <div className="h-[300px] rounded-[4px] bg-slate-50" />
      </Panel>
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

const AdminDashboardTopProductsChart = dynamic(
  () => import("@/components/admin/AdminDashboardTopProductsChart"),
  {
    ssr: false,
    loading: () => <div className="h-[220px] rounded-[4px] bg-slate-50" />,
  },
);

const AdminDashboardInventoryHealthChart = dynamic(
  () => import("@/components/admin/AdminDashboardInventoryHealthChart"),
  {
    ssr: false,
    loading: () => <div className="h-[180px] rounded-[4px] bg-slate-50" />,
  },
);

type BranchOption = {
  id: number;
  name: string;
};

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

const monthEndDate = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
};

const orderCountText = (value: number) => `${numberText(value)} đơn`;
const customerCountText = (value: number) => `${numberText(value)} khách`;

const orderStatusRows = (
  pending: PendingOrdersSummary | undefined,
  getOrderHref: (status?: string | null) => string,
) => [
  {
    label: "Chờ duyệt",
    value: pending?.pendingApproval ?? 0,
    href: getOrderHref("PENDING"),
  },
  {
    label: "Chờ thanh toán",
    value: pending?.pendingPayment ?? 0,
    href: getOrderHref("AWAITING_PAYMENT"),
  },
  {
    label: "Chờ đóng gói",
    value: pending?.pendingPacking ?? 0,
    href: getOrderHref("PROCESSING"),
  },
  {
    label: "Chờ lấy hàng",
    value: pending?.pendingPickup ?? 0,
    href: getOrderHref("READY_FOR_PICKUP"),
  },
  {
    label: "Đang giao",
    value: pending?.shipping ?? 0,
    href: getOrderHref("SHIPPING"),
  },
  {
    label: "Hủy giao chờ nhận",
    value: pending?.cancelPending ?? 0,
    href: getOrderHref("CANCELLED"),
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

  const isSuperAdmin = roleSlug === "SUPER_ADMIN";
  const canSelectAllBranches = isSuperAdmin;
  const canViewDashboard = hasPermission(P.DASHBOARD_VIEW);
  const canViewWarehouseWorkflows = hasAnyPermission([
    P.IMPORT_VIEW,
    P.EXPORT_VIEW,
    P.TRANSFER_VIEW,
    P.CHECK_VIEW,
  ]);
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);
  const getOrderHref = (status?: string | null) =>
    getOrderListPath({
      canViewSystemOrders,
      canUseBranchOrders,
      status,
    });
  const canRunProtectedQueries =
    !isLoadingAuth && !isLoadingPermissions && !!user && !!accessToken && canViewDashboard;

  useEffect(() => {

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

  const trendParams = useMemo(() => {
    if (periodMode === "month") {
      return {
        granularity: "MONTH" as const,
        startDate: `${fromMonth}-01`,
        endDate: monthEndDate(toMonth),
      };
    }
    if (periodMode === "date") {
      return {
        granularity: "DAY" as const,
        startDate: fromDate,
        endDate: toDate,
      };
    }
    const today = new Date();
    return {
      granularity: "DAY" as const,
      startDate: toIsoDate(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13),
      ),
      endDate: toIsoDate(today),
    };
  }, [periodMode, fromDate, toDate, fromMonth, toMonth]);

  const {
    data: businessTrend,
    isLoading: isTrendLoading,
    isError: isTrendError,
  } = useQuery<BusinessTrend>({
    queryKey: ["business-trend", selectedBranchId, trendParams],
    queryFn: () =>
      dashboardService.getBusinessTrend({
        branchId: selectedBranchId,
        ...trendParams,
      }),
    enabled: canRunProtectedQueries,
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

  const {
    data: categoryDistribution = [],
    isError: isCategoryDistributionError,
  } = useQuery<CategoryDistribution[]>({
    queryKey: ["category-distribution", selectedBranchId],
    queryFn: () => dashboardService.getCategoryDistribution(selectedBranchId),
    enabled: canRunProtectedQueries,
  });

  const { data: backorders = [], isError: isBackordersError } = useQuery<
    MissingItemReport[]
  >({
    queryKey: ["backorder-report", selectedBranchId],
    queryFn: () => orderService.getBackorderReport(selectedBranchId),
    enabled: canRunProtectedQueries && canViewSystemOrders,
    refetchInterval: 60000,
  });

  const hasLoadError =
    isStatsError ||
    isDailyError ||
    isRangeError ||
    isTrendError ||
    isPendingSummaryError ||
    isInventoryInfoError ||
    isTopProductsError ||
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
    () => orderStatusRows(pendingSummary, getOrderHref),
    [getOrderHref, pendingSummary],
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

  const comparisonNoun =
    periodMode === "today"
      ? "hôm qua"
      : periodMode === "month" && fromMonth === toMonth
        ? "tháng trước"
        : "kỳ trước";
  const isPrimaryMetricsLoading = isRangeMode ? isRangeLoading : isDailyLoading;
  const revenueValue = isRangeMode
    ? rangeResults?.currentMonthRevenue
    : dailyResults?.todayRevenue;
  const profitValue = isRangeMode
    ? rangeResults?.currentMonthProfit
    : dailyResults?.todayProfit;
  const ordersValue = isRangeMode
    ? rangeResults?.currentMonthOrders
    : dailyResults?.todayOrders;

  const periodChange = (metric: "revenue" | "profit" | "order") => {
    const source = isRangeMode ? rangeResults : dailyResults;
    if (!source) return undefined;
    if (metric === "revenue") return source.revenueChange;
    if (metric === "profit") return source.profitChange;
    return source.orderChange;
  };
  const moneyTrend = (change?: MetricChange, noun = comparisonNoun) =>
    describeTrend(change, noun, currency);
  const orderTrend = (change?: MetricChange, noun = comparisonNoun) =>
    describeTrend(change, noun, orderCountText);

  const NO_QUALITY_DATA_CHANGE: MetricChange = {
    current: 0,
    previous: 0,
    changeAmount: 0,
    changePercent: 0,
    comparable: false,
    newBaseline: false,
    negativeBaseline: false,
    direction: "FLAT",
  };
  const qualityTrend = (
    denominatorThisPeriod: number,
    change: MetricChange | undefined,
    lowerIsBetter: boolean,
    noun = comparisonNoun,
  ) =>
    describeTrend(
      denominatorThisPeriod > 0 ? change : NO_QUALITY_DATA_CHANGE,
      noun,
      orderCountText,
      lowerIsBetter,
    );

  const orderQualitySource = isRangeMode ? rangeResults : dailyResults;
  const deliveredOrders = orderQualitySource?.deliveredOrders ?? 0;
  const returnedOrders = orderQualitySource?.returnedOrders ?? 0;
  const cancelledOrders = orderQualitySource?.cancelledOrders ?? 0;

  const shippedResolved = deliveredOrders + returnedOrders;

  const totalResolvedOrders = shippedResolved + cancelledOrders;
  const deliverySuccessRate = qualityRateText(deliveredOrders, shippedResolved);
  const returnRate = qualityRateText(returnedOrders, shippedResolved);
  const cancelRate = qualityRateText(cancelledOrders, totalResolvedOrders);

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
    customerTotal > 0 ? Number(stats?.totalOrders || 0) / customerTotal : 0;
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
        queryClient.invalidateQueries({ queryKey: ["business-trend"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-info"] }),
        queryClient.invalidateQueries({ queryKey: ["top-products"] }),
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
            Phạm vi: {branchLabel} · Kỳ xem: {periodLabel}
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

      <section className="space-y-2">
        <SectionHeading title={`Phát sinh ${periodLabel}`} />
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Doanh thu"
            value={currency(revenueValue)}
            trend={moneyTrend(periodChange("revenue"))}
            loading={isPrimaryMetricsLoading}
          />
          <MetricCard
            label="Lợi nhuận"
            value={currency(profitValue)}
            trend={moneyTrend(periodChange("profit"))}
            loading={isPrimaryMetricsLoading}
            note="Doanh thu trừ giá vốn, chưa trừ chi phí vận hành."
          />
          <MetricCard
            label="Đơn hàng"
            value={numberText(ordersValue)}
            trend={orderTrend(periodChange("order"))}
            loading={isPrimaryMetricsLoading}
          />
          <MetricCard
            label="Việc cần xử lý"
            value={numberText(urgentWork)}
            note={`${numberText(orderWorkload)} việc từ đơn hàng · ${numberText(
              inventoryRisk + backorderCount,
            )} việc từ kho. Đây là số hiện tại, không so với kỳ trước.`}
            emphasis={urgentWork > 0 ? "warning" : undefined}
          />
        </div>
      </section>

      <section className="space-y-2">
        <SectionHeading title={`Chất lượng đơn hàng ${periodLabel}`} />
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-3">
          <MetricCard
            label="Giao hàng thành công"
            value={deliverySuccessRate}
            trend={qualityTrend(shippedResolved, orderQualitySource?.deliveredChange, false)}
            loading={isPrimaryMetricsLoading}
            note={
              shippedResolved > 0
                ? `${numberText(deliveredOrders)}/${numberText(shippedResolved)} đơn đã xuất kho trong kỳ`
                : "Chưa có đơn nào xuất kho trong kỳ này"
            }
          />
          <MetricCard
            label="Tỷ lệ hoàn hàng"
            value={returnRate}
            trend={qualityTrend(shippedResolved, orderQualitySource?.returnedChange, true)}
            loading={isPrimaryMetricsLoading}
            note={
              shippedResolved > 0
                ? `${numberText(returnedOrders)}/${numberText(shippedResolved)} đơn đã xuất kho bị trả về`
                : "Chưa có đơn nào xuất kho trong kỳ này"
            }
            emphasis={returnedOrders > 0 ? "warning" : undefined}
          />
          <MetricCard
            label="Tỷ lệ huỷ đơn"
            value={cancelRate}
            trend={qualityTrend(totalResolvedOrders, orderQualitySource?.cancelledChange, true)}
            loading={isPrimaryMetricsLoading}
            note={
              totalResolvedOrders > 0
                ? `${numberText(cancelledOrders)}/${numberText(totalResolvedOrders)} đơn đã chốt xong bị huỷ`
                : "Chưa có đơn nào chốt xong trong kỳ này"
            }
            emphasis={cancelledOrders > 0 ? "warning" : undefined}
          />
        </div>
      </section>

      <section className="space-y-2">
        <SectionHeading title="Luỹ kế toàn hệ thống" hint="So với cuối hôm qua" />
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Tổng doanh thu"
            value={currency(stats?.totalRevenue)}
            trend={moneyTrend(stats?.revenueChange, "cuối hôm qua")}
            loading={isStatsLoading}
          />
          <MetricCard
            label="Tổng đơn hàng"
            value={numberText(stats?.totalOrders)}
            trend={orderTrend(stats?.ordersChange, "cuối hôm qua")}
            loading={isStatsLoading}
          />
          <MetricCard
            label="Khách hàng"
            value={numberText(stats?.totalCustomers)}
            trend={describeTrend(
              stats?.customersChange,
              "cuối hôm qua",
              customerCountText,
            )}
            loading={isStatsLoading}
          />
          <MetricCard
            label="Giá trị tồn kho"
            value={currency(inventoryInfo?.totalInventoryValue)}
            trend={moneyTrend(inventoryInfo?.valueChange, "cuối hôm qua")}
            note="Suy ra từ biến động nhập/xuất trong ngày vì kho không lưu ảnh chụp theo ngày."
          />
        </div>
      </section>

      {canViewWarehouseWorkflows && (
        <Panel title="Phiếu kho cần xử lý">
          <WarehouseWorkflowCards refreshToken={warehouseRefreshToken} />
        </Panel>
      )}

      <AdminDashboardTrendChart
        trend={businessTrend}
        isLoading={isTrendLoading}
      />

      <Panel
        title="Khách hàng và chuyển đổi"
        footnote="Lượt truy cập do hệ thống tự đo ở tầng middleware (không phải Google Analytics) và tính cho toàn site, không tách theo chi nhánh."
      >
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            label="Đơn / khách"
            value={decimalText(orderPerCustomer)}
            note="Số đơn trung bình mỗi khách đã đặt (không phải % khách đã mua)"
          />
          <InsightBox
            label="Giá trị đơn TB"
            value={currency(averageOrderValue)}
            note="Tổng doanh thu / tổng đơn"
          />
        </div>
      </Panel>

      <AdminDashboardCharts
        categoryRows={categoryRows}
        hasCategoryChartData={hasCategoryChartData}
        categoryTotalPercent={categoryTotalPercent}
      />

      <div className="grid auto-rows-fr gap-4 xl:grid-cols-3">
        <Panel
          title="Đơn hàng đang kẹt"
          description={`${numberText(orderWorkload)} đơn đang nằm ở các bước chưa xong`}
          footnote="Số đơn hiện đang ở mỗi trạng thái (không phải số phát sinh trong kỳ). Bấm vào từng dòng để mở đúng danh sách cần xử lý."
        >
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

        <Panel
          title="Sức khỏe tồn kho"
          description={`${numberText(inventoryInfo?.totalItems)} mặt hàng đang theo dõi`}
          footnote="Thanh ngang là tỷ lệ trên tổng số mặt hàng. Riêng 'Thiếu hàng trong đơn' là số lượng còn thiếu để giao đủ các đơn đã nhận, không phải số mặt hàng. Bấm vào từng dòng để xem đích danh mặt hàng: 'Còn hàng ổn định' mở danh sách sản phẩm, 'Sắp hết hàng'/'Hết hàng' mở báo cáo dưới định mức, 'Thiếu hàng trong đơn' xổ ngay danh sách tại chỗ."
        >
          <AdminDashboardInventoryHealthChart
            totalItems={Number(inventoryInfo?.totalItems || 0)}
            lowStockCount={Number(inventoryInfo?.lowStockCount || 0)}
            outOfStockCount={Number(inventoryInfo?.outOfStockCount || 0)}
            backorderCount={backorderCount}
            backorderItems={backorders}
            branchId={selectedBranchId}
          />
        </Panel>

        <Panel
          title="Top sản phẩm bán chạy"
          description="5 sản phẩm dẫn đầu theo doanh thu"
          footnote="Xếp theo số lượng đã bán của đơn đã hoàn tất/đang giao, tính trên toàn bộ lịch sử (không giới hạn theo thời gian). Biểu đồ tròn chia theo tỷ trọng doanh thu — bấm 'Số liệu' để xem dạng danh sách."
        >
          <AdminDashboardTopProductsChart topProducts={topProducts} />
        </Panel>
      </div>

    </div>
  );
}

function SectionHeading({ hint, title }: { hint?: string; title: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-slate-700">
        {title}
      </h2>
      {hint && <p className="text-[10.5px] text-slate-500">{hint}</p>}
    </div>
  );
}

function MetricCard({
  emphasis,
  label,
  loading,
  note,
  trend,
  value,
}: {
  emphasis?: "warning";
  label: string;
  loading?: boolean;
  note?: string;
  trend?: TrendDisplay | null;
  value: string;
}) {
  const TrendIcon =
    trend?.tone === "up"
      ? ArrowUpRight
      : trend?.tone === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <div
      className={`flex h-full flex-col rounded-[4px] border bg-white p-4 shadow-sm ${
        emphasis === "warning" ? "border-amber-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {emphasis === "warning" && (
          <AlertTriangle size={14} className="shrink-0 text-amber-600" />
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-32 rounded-[4px]" />
      ) : (
        <p className="mt-2 text-[24px] font-semibold leading-tight text-slate-900">
          {value}
        </p>
      )}
      <div className="mt-auto pt-3">
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
              TREND_BADGE_CLASS[trend.tone]
            }`}
          >
            <TrendIcon size={11} aria-hidden />
            {trend.label}
          </span>
        )}

        {(note ?? trend?.hint) && (
          <p className="mt-1.5 text-[10.5px] leading-4 text-slate-500">
            {note ?? trend?.hint}
          </p>
        )}
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
    <div className="flex h-full flex-col rounded-[4px] border border-slate-200 bg-white p-4">
      <p className="text-[10.5px] font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-[18px] font-semibold text-slate-900">{value}</p>
      <p className="mt-auto pt-2 text-[10.5px] leading-4 text-slate-400">
        {note}
      </p>
    </div>
  );
}

