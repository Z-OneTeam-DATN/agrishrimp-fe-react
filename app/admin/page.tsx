"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar as RechartsBar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { dashboardService } from "@/app/services/dashboard.service";
import { branchService } from "@/app/services/branchService";
import { orderService } from "@/app/services/order.service";
import { customerService } from "@/app/services/customer.service";
import {
  CategoryDistribution,
  DailyResults,
  DashboardStats,
  InventoryInfo,
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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole, normalizeRoleSlug } from "@/lib/roles";

type BranchOption = {
  id: number;
  name: string;
};

type OrderRisk = {
  totalMissingQuantity?: number;
};

type CustomerSummary = {
  createdAt?: string;
  userStatus?: string;
};

type CustomerResponse =
  | CustomerSummary[]
  | {
      content?: CustomerSummary[];
      totalElements?: number;
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

const percentText = (value?: number | null) => {
  const amount = Number(value || 0);
  if (amount === 0) return "0%";
  return `${amount > 0 ? "+" : ""}${amount.toFixed(1)}%`;
};

const getTrendColor = (value?: number | null) => {
  const amount = Number(value || 0);
  if (amount > 0) return "text-emerald-600";
  if (amount < 0) return "text-red-600";
  return "text-slate-400";
};

const orderStatusRows = (pending?: PendingOrdersSummary) => [
  {
    label: "Chờ duyệt",
    value: pending?.pendingApproval ?? 0,
    href: "/admin/orders-all",
  },
  {
    label: "Chờ thanh toán",
    value: pending?.pendingPayment ?? 0,
    href: "/admin/orders-all",
  },
  {
    label: "Chờ đóng gói",
    value: pending?.pendingPacking ?? 0,
    href: "/admin/orders-processing",
  },
  {
    label: "Chờ lấy hàng",
    value: pending?.pendingPickup ?? 0,
    href: "/admin/orders-handover",
  },
  {
    label: "Đang giao",
    value: pending?.shipping ?? 0,
    href: "/admin/orders-handover",
  },
  {
    label: "Hủy giao chờ nhận",
    value: pending?.cancelPending ?? 0,
    href: "/admin/orders-all",
  },
];

const getCustomerItems = (response?: CustomerResponse) => {
  if (!response) return [];
  return Array.isArray(response) ? response : response.content ?? [];
};

const getCustomerTotal = (response?: CustomerResponse) => {
  if (!response) return 0;
  return Array.isArray(response) ? response.length : response.totalElements ?? 0;
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading, error: userError } =
    useCurrentUser();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const roleSlug = normalizeRoleSlug(user?.role);
  const isAdmin = isAdminRole(user?.role);
  const canViewDashboard = hasPermission(P.DASHBOARD_VIEW);
  const isRestricted = ["MANAGER", "STAFF", "EMPLOYEE"].includes(roleSlug);

  useEffect(() => {
    if (user && isRestricted && user.branch?.id) {
      setSelectedBranchId(user.branch.id.toString());
    }
  }, [isRestricted, user]);

  const { data: branches = [] } = useQuery<BranchOption[]>({
    queryKey: ["branches-list"],
    queryFn: () => branchService.getAll(),
    enabled: isAdmin && canViewDashboard && hasPermission(P.BRANCH_VIEW),
  });

  const { data: customerSnapshot } = useQuery<CustomerResponse>({
    queryKey: ["dashboard-customers-snapshot"],
    queryFn: () => customerService.getAll("", "all", 0, 500),
    enabled: !!user && canViewDashboard && hasPermission(P.CUSTOMER_VIEW),
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", selectedBranchId],
    queryFn: () => dashboardService.getStats(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: dailyResults, isLoading: isDailyLoading } =
    useQuery<DailyResults>({
      queryKey: ["daily-results", selectedBranchId],
      queryFn: () => dashboardService.getDailyResults(selectedBranchId),
      enabled: !!user && canViewDashboard,
    });

  const { data: pendingSummary } = useQuery<PendingOrdersSummary>({
    queryKey: ["pending-orders-summary", selectedBranchId],
    queryFn: () => dashboardService.getPendingOrdersSummary(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: inventoryInfo } = useQuery<InventoryInfo>({
    queryKey: ["inventory-info", selectedBranchId],
    queryFn: () => dashboardService.getInventoryInfo(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: topProducts = [] } = useQuery<TopProduct[]>({
    queryKey: ["top-products", selectedBranchId],
    queryFn: () => dashboardService.getTopProducts(5, selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: salesPerformance } = useQuery({
    queryKey: ["sales-performance", selectedBranchId],
    queryFn: () => dashboardService.getSalesPerformance(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: categoryDistribution = [] } = useQuery<CategoryDistribution[]>({
    queryKey: ["category-distribution", selectedBranchId],
    queryFn: () => dashboardService.getCategoryDistribution(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: backorders = [] } = useQuery<OrderRisk[]>({
    queryKey: ["backorder-report", isAdmin],
    queryFn: () => orderService.getBackorderReport(),
    enabled: !!user && canViewDashboard && isAdmin,
    refetchInterval: 60000,
  });

  const branchLabel = isAdmin
    ? selectedBranchId
      ? branches.find((branch) => branch.id.toString() === selectedBranchId)
          ?.name || "Chi nhánh đã chọn"
      : "Tất cả chi nhánh"
    : user?.branch?.name || "Chi nhánh của bạn";

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

  const salesRows = salesPerformance?.data ?? [];
  const categoryRows = categoryDistribution.slice(0, 5);
  const categoryTotalPercent = categoryRows.reduce(
    (sum, item) => sum + Number(item.percentage || 0),
    0,
  );
  const customerRows = getCustomerItems(customerSnapshot);
  const customerTotal = getCustomerTotal(customerSnapshot);
  const now = new Date();
  const newCustomersThisMonth = customerRows.filter((customer) => {
    if (!customer.createdAt) return false;
    const createdAt = new Date(customer.createdAt);
    return (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear()
    );
  }).length;
  const activeCustomers = customerRows.filter(
    (customer) => customer.userStatus === "ACTIVE",
  ).length;
  const averageOrderValue =
    stats?.totalOrders && stats.totalOrders > 0
      ? Number(stats.totalRevenue || 0) / Number(stats.totalOrders)
      : 0;
  const orderPerCustomer =
    customerTotal > 0
      ? (Number(stats?.totalOrders || 0) / customerTotal) * 100
      : 0;
  const revenueChartRows = salesRows.map((item: SalesPerformanceData) => ({
    date: new Date(item.date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }),
    revenue: Number(item.revenue || 0),
    profit: Number(item.profit || 0),
    orders: Number(item.orderCount || 0),
  }));
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
        queryClient.invalidateQueries({ queryKey: ["inventory-info"] }),
        queryClient.invalidateQueries({ queryKey: ["top-products"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-performance"] }),
        queryClient.invalidateQueries({ queryKey: ["category-distribution"] }),
        queryClient.invalidateQueries({ queryKey: ["pending-orders-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["backorder-report"] }),
      ]);
      toast.success("Đã làm mới dữ liệu tổng quan");
    } catch {
      toast.error("Không thể làm mới dữ liệu");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isUserLoading || isLoadingAuth) {
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
          className="mt-6 h-10 rounded-[4px] bg-emerald-600 px-5 text-[13px] font-semibold hover:bg-emerald-700"
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
          {isAdmin && (
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Doanh thu hôm nay"
          value={compactCurrency(dailyResults?.todayRevenue)}
          subValue={percentText(dailyResults?.revenueChangePercent)}
          subLabel="so với hôm qua"
          loading={isDailyLoading}
          trendColor={getTrendColor(dailyResults?.revenueChangePercent)}
        />
        <MetricCard
          label="Lợi nhuận hôm nay"
          value={compactCurrency(dailyResults?.todayProfit)}
          subValue={percentText(dailyResults?.profitChangePercent)}
          subLabel="so với hôm qua"
          loading={isDailyLoading}
          trendColor={getTrendColor(dailyResults?.profitChangePercent)}
        />
        <MetricCard
          label="Đơn hôm nay"
          value={numberText(dailyResults?.todayOrders)}
          subValue={percentText(dailyResults?.orderChangePercent)}
          subLabel="so với hôm qua"
          loading={isDailyLoading}
          trendColor={getTrendColor(dailyResults?.orderChangePercent)}
        />
        <MetricCard
          label="Việc cần xử lý"
          value={numberText(urgentWork)}
          subValue={`${orderWorkload} đơn · ${inventoryRisk + backorderCount} kho`}
          subLabel="đang cần chú ý"
          trendColor={urgentWork > 0 ? "text-amber-600" : "text-slate-400"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          compact
          label="Tổng doanh thu"
          value={compactCurrency(stats?.totalRevenue)}
          loading={isStatsLoading}
        />
        <MetricCard
          compact
          label="Tổng đơn hàng"
          value={numberText(stats?.totalOrders)}
          loading={isStatsLoading}
        />
        <MetricCard
          compact
          label="Khách hàng"
          value={numberText(stats?.totalCustomers)}
          loading={isStatsLoading}
        />
        <MetricCard
          compact
          label="Giá trị tồn kho"
          value={compactCurrency(inventoryInfo?.totalInventoryValue)}
        />
      </div>

      <Panel title="Khách hàng và chuyển đổi">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <InsightBox
            label="Lượt truy cập"
            value="Chưa kết nối"
            note="Cần API tracking/GA để lấy số thật"
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
            value={`${orderPerCustomer.toFixed(1)}%`}
            note="Tổng đơn so với tổng khách"
          />
          <InsightBox
            label="Giá trị đơn TB"
            value={compactCurrency(averageOrderValue)}
            note="Tổng doanh thu / tổng đơn"
          />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <Panel title="Doanh thu theo ngày">
          <div className="h-[300px]">
            {!hasRevenueChartData ? (
              <EmptyText
                className="min-h-[300px]"
                icon={BarChart3}
                text="Chưa có dữ liệu doanh thu."
                hint="Biểu đồ sẽ xuất hiện khi hệ thống có doanh thu hoặc lợi nhuận trong giai đoạn này."
              />
            ) : (
              <ChartViewport className="h-[300px] w-full">
                {({ height, width }) => (
                  <AreaChart
                    width={width}
                    height={height}
                    data={revenueChartRows}
                    margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.16} />
                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      width={48}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(value) =>
                        Number(value) >= 1_000_000
                          ? `${Math.round(Number(value) / 1_000_000)}tr`
                          : `${Math.round(Number(value) / 1000)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 4,
                        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [
                        currency(value),
                        name === "revenue" ? "Doanh thu" : "Lợi nhuận",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#059669"
                      strokeWidth={2}
                      fill="url(#revenueFill)"
                      name="Doanh thu"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#64748b"
                      strokeWidth={2}
                      fill="url(#profitFill)"
                      name="Lợi nhuận"
                    />
                  </AreaChart>
                )}
              </ChartViewport>
            )}
          </div>
        </Panel>

        <Panel title="Cơ cấu doanh thu nhóm hàng">
          {!hasCategoryChartData ? (
            <EmptyText
              icon={PieChartIcon}
              text="Chưa có dữ liệu nhóm hàng."
              hint="Khi có doanh thu phát sinh theo nhóm sản phẩm, sơ đồ tròn sẽ hiển thị ở đây."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1">
              <div className="relative mx-auto h-[180px] w-[180px]">
                <ChartViewport className="h-[180px] w-[180px]">
                  {({ height, width }) => (
                    <PieChart width={width} height={height}>
                      <Pie
                        data={categoryRows}
                        dataKey="percentage"
                        nameKey="categoryName"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={3}
                      >
                        {categoryRows.map((item, index) => (
                          <Cell
                            key={item.categoryId}
                            fill={donutColors[index % donutColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [
                          `${Number(value || 0).toFixed(1)}%`,
                          "Tỷ trọng",
                        ]}
                      />
                    </PieChart>
                  )}
                </ChartViewport>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[20px] font-semibold text-slate-900">
                    {Math.round(categoryTotalPercent)}%
                  </span>
                  <span className="text-[10px] text-slate-400">top nhóm</span>
                </div>
              </div>
              <div className="space-y-3">
                {categoryRows.map((item, index) => (
                  <NumberBar
                    key={item.categoryId}
                    label={item.categoryName}
                    value={`${Number(item.percentage || 0).toFixed(1)}%`}
                    percent={Number(item.percentage || 0)}
                    tone={donutColors[index % donutColors.length]}
                  />
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Đơn hàng đang kẹt">
          <div className="space-y-4">
            <div className="h-[220px]">
              {!hasOrderChartData ? (
                <EmptyText
                  className="min-h-[220px]"
                  icon={ShoppingCart}
                  text="Chưa có đơn hàng cần xử lý."
                  hint="Khi xuất hiện đơn chờ duyệt, đóng gói hoặc giao hàng, biểu đồ sẽ hiển thị tại đây."
                />
              ) : (
                <ChartViewport className="h-[220px] w-full">
                  {({ height, width }) => (
                    <BarChart
                      width={width}
                      height={height}
                      data={orderChartRows}
                      layout="vertical"
                      margin={{ left: 6, right: 12, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={92}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [
                          numberText(value),
                          "Số đơn",
                        ]}
                      />
                      <RechartsBar
                        dataKey="value"
                        minPointSize={0}
                        radius={[0, 4, 4, 0]}
                        fill="#64748b"
                      />
                    </BarChart>
                  )}
                </ChartViewport>
              )}
            </div>
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

function ChartViewport({
  children,
  className,
}: {
  children: (size: { height: number; width: number }) => React.ReactNode;
  className: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const updateSize = () => {
      const nextWidth = Math.floor(element.clientWidth);
      const nextHeight = Math.floor(element.clientHeight);

      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
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
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        {description}
      </p>
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
          {hint && <p className="text-[11px] leading-5 text-slate-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

const donutColors = ["#059669", "#64748b", "#2563eb", "#d97706", "#dc2626"];
