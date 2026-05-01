"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpFromLine,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import DailyBusinessResults from "@/components/admin/DailyBusinessResults";
import SalesPerformance from "@/components/admin/SalesPerformance";
import PendingOrders from "@/components/admin/PendingOrders";
import TopProducts from "@/components/admin/TopProducts";
import InventoryInfo from "@/components/admin/InventoryInfo";
import DashboardStats from "@/components/admin/DashboardStats";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { dashboardService } from "@/app/services/dashboard.service";
import { branchService } from "@/app/services/branchService";
import { orderService } from "@/app/services/order.service";
import { RecentActivity } from "@/app/types/dashboard.type";
import { formatDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole, normalizeRoleSlug } from "@/lib/roles";

const quickActionConfigs = [
  {
    href: "/admin/exports",
    icon: ArrowUpFromLine,
    label: "Xuất kho",
    description: "Xử lý phiếu xuất và theo dõi tiến độ bàn giao.",
    permission: P.EXPORT_VIEW,
  },
  {
    href: "/admin/receipts",
    icon: Package,
    label: "Nhập hàng",
    description: "Tiếp nhận hàng từ NCC và xác nhận chứng từ.",
    permission: P.IMPORT_VIEW,
  },
  {
    href: "/admin/transfers",
    icon: ArrowRightLeft,
    label: "Điều chuyển",
    description: "Cân bằng tồn kho giữa các chi nhánh và kho tổng.",
    permission: P.TRANSFER_VIEW,
  },
  {
    href: "/admin/inventory-checks",
    icon: CheckCircle2,
    label: "Kiểm kê",
    description: "Mở phiên kiểm kê và xử lý chênh lệch tồn kho.",
    permission: P.CHECK_VIEW,
  },
];

type BranchOption = {
  id: number;
  name: string;
};

type HighlightItem = {
  href: string;
  icon: typeof ShoppingCart;
  isCurrency?: boolean;
  label: string;
  tone: string;
  value: number;
};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useCurrentUser();
  const { hasPermission, isLoadingAuth } = usePermissions();
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    undefined,
  );
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-results"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-activities"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-info"] }),
        queryClient.invalidateQueries({ queryKey: ["top-products"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-performance"] }),
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

  const { data: branches = [] } = useQuery<BranchOption[]>({
    queryKey: ["branches-list"],
    queryFn: () => branchService.getAll(),
    enabled: isAdmin && canViewDashboard && hasPermission(P.BRANCH_VIEW),
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", selectedBranchId],
    queryFn: () => dashboardService.getStats(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: dailyResults } = useQuery({
    queryKey: ["daily-results", selectedBranchId],
    queryFn: () => dashboardService.getDailyResults(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: pendingSummary } = useQuery({
    queryKey: ["pending-orders-summary", selectedBranchId],
    queryFn: () => dashboardService.getPendingOrdersSummary(selectedBranchId),
    enabled: !!user && canViewDashboard,
  });

  const { data: backorders } = useQuery({
    queryKey: ["backorder-report", isAdmin],
    queryFn: () => orderService.getBackorderReport(),
    enabled: !!user && canViewDashboard && isAdmin,
    refetchInterval: 60000,
  });

  const {
    data: recentActivities = [],
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ["recent-activities", selectedBranchId],
    queryFn: () => dashboardService.getRecentActivities(selectedBranchId),
    enabled: !!user && canViewDashboard,
    refetchInterval: 120000,
  });

  const quickActions = quickActionConfigs.filter((action) =>
    hasPermission(action.permission),
  );

  const workflowHighlights = useMemo<HighlightItem[]>(() => {
    const backorderCount =
      backorders?.reduce(
        (sum: number, item: { totalMissingQuantity?: number }) =>
          sum + (item.totalMissingQuantity || 0),
        0,
      ) ?? 0;

    return [
      {
        label: "Đơn chờ duyệt",
        value: pendingSummary?.pendingApproval ?? 0,
        href: "/admin/orders",
        icon: ShoppingCart,
        tone: "text-sky-700 bg-sky-50 border-sky-100",
      },
      {
        label: "Đơn thiếu hàng",
        value: backorderCount,
        href: "/admin/transfers",
        icon: AlertTriangle,
        tone: "text-rose-700 bg-rose-50 border-rose-100",
      },
      {
        label: "Khách hàng đang phục vụ",
        value: stats?.totalCustomers ?? 0,
        href: "/admin/customers",
        icon: Users,
        tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
      },
      {
        label: "Doanh thu hôm nay",
        value: dailyResults?.todayRevenue ?? 0,
        href: "/admin/reports/sales",
        icon: Wallet,
        tone: "text-amber-700 bg-amber-50 border-amber-100",
        isCurrency: true,
      },
    ];
  }, [
    backorders,
    dailyResults?.todayRevenue,
    pendingSummary?.pendingApproval,
    stats?.totalCustomers,
  ]);

  const branchLabel = isAdmin
    ? selectedBranchId
      ? branches.find((branch) => branch.id.toString() === selectedBranchId)
          ?.name || "Chi nhánh đã chọn"
      : "Tất cả chi nhánh"
    : user?.branch?.name || "Chi nhánh của bạn";

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "ORDER":
        return {
          icon: ShoppingCart,
          iconColor: "text-sky-600",
          bgColor: "bg-sky-50",
          label: "Đơn hàng",
        };
      case "INVENTORY":
        return {
          icon: Package,
          iconColor: "text-emerald-600",
          bgColor: "bg-emerald-50",
          label: "Kho vận",
        };
      case "CUSTOMER":
        return {
          icon: Users,
          iconColor: "text-violet-600",
          bgColor: "bg-violet-50",
          label: "Khách hàng",
        };
      default:
        return {
          icon: Bell,
          iconColor: "text-amber-600",
          bgColor: "bg-amber-50",
          label: "Cập nhật",
        };
    }
  };

  if (isUserLoading || isLoadingAuth) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white">
        <RefreshCw className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm font-medium text-slate-600">
          Đang tải thông tin tổng quan hệ thống...
        </p>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-3xl border border-rose-100 bg-white p-6 text-center shadow-sm">
        <AlertCircle className="mb-3 text-rose-500" size={48} />
        <h2 className="text-xl font-bold text-slate-900">
          Không thể tải dữ liệu người dùng
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Hệ thống chưa kết nối được tới máy chủ. Vui lòng kiểm tra lại phiên
          đăng nhập hoặc tải lại trang.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-6 rounded-2xl">
          Thử lại
        </Button>
      </div>
    );
  }

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto text-amber-500" size={42} />
          <h2 className="text-xl font-bold text-slate-800">
            Bạn không có quyền truy cập
          </h2>
          <p className="text-sm text-slate-500">
            Tài khoản hiện tại chưa được cấp quyền xem tổng quan hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.5fr)_360px] lg:p-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                Tổng quan điều hành
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                Phạm vi: {branchLabel}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-3xl text-2xl font-black tracking-tight text-slate-900 lg:text-[32px]">
                Theo dõi vận hành hằng ngày theo đúng thứ tự ưu tiên xử lý.
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {workflowHighlights.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex min-h-[148px] flex-col rounded-2xl border p-4 transition hover:border-slate-300 hover:bg-slate-50",
                    item.tone,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-white p-2 shadow-sm">
                      <item.icon size={18} />
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-800">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    {item.isCurrency
                      ? formatCurrency(item.value)
                      : item.value.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Bộ lọc làm việc
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Ngữ cảnh hiện tại
                </h2>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-xl border-slate-200 bg-white"
              >
                <RefreshCw
                  size={16}
                  className={cn(isRefreshing && "animate-spin")}
                />
                <span className="ml-2 hidden sm:inline">Làm mới</span>
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Chi nhánh hiển thị
                  </p>
                  {isAdmin ? (
                    <div className="mt-3">
                      <Select
                        value={selectedBranchId || "all"}
                        onValueChange={(value) =>
                          setSelectedBranchId(value === "all" ? undefined : value)
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm font-medium">
                          <SelectValue placeholder="Tất cả chi nhánh" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                          {branches.map((branch) => (
                            <SelectItem
                              key={branch.id}
                              value={branch.id.toString()}
                            >
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {branchLabel}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {quickActions.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Tác vụ nhanh
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {quickActions.map((action) => (
                    <button
                      key={action.href}
                      type="button"
                      onClick={() => router.push(action.href)}
                      className="flex min-h-[124px] flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700">
                          <action.icon size={18} />
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-900">
                        {action.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <DashboardStats branchId={selectedBranchId} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_360px]">
        <div className="space-y-6">
          <DailyBusinessResults branchId={selectedBranchId} />
          <PendingOrders branchId={selectedBranchId} />
          <SalesPerformance branchId={selectedBranchId} />
          <div className="grid gap-6 lg:grid-cols-2">
            <TopProducts branchId={selectedBranchId} />
            <InventoryInfo branchId={selectedBranchId} />
          </div>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Nhật ký hoạt động
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Cập nhật gần đây
                </h3>
              </div>
              <Bell size={18} className="text-slate-400" />
            </div>

            <div className="max-h-[560px] space-y-4 overflow-y-auto px-5 py-5">
              {isRecentLoading ? (
                [...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : isRecentError ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="mb-3 text-amber-500" size={24} />
                  <p className="text-sm text-slate-500">
                    Không thể tải hoạt động gần đây.
                  </p>
                  <button
                    onClick={() => refetchRecent()}
                    className="mt-3 text-sm font-semibold text-emerald-600 hover:underline"
                  >
                    Thử lại
                  </button>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">
                    Chưa có hoạt động nào trong phạm vi đang xem.
                  </p>
                </div>
              ) : (
                recentActivities.map((activity: RecentActivity, index) => {
                  const config = getActivityConfig(activity.type);
                  return (
                    <div key={activity.id} className="relative flex gap-3">
                      {index !== recentActivities.length - 1 && (
                        <div className="absolute left-5 top-11 bottom-[-18px] w-px bg-slate-100" />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          config.bgColor,
                          config.iconColor,
                        )}
                      >
                        <config.icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {activity.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {config.label} bởi{" "}
                              <span className="font-medium text-slate-700">
                                {activity.user}
                              </span>
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {activity.status}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={12} />
                          {formatDate(activity.timestamp, "HH:mm, dd/MM")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Lưu ý
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Kiểm tra đúng chi nhánh, xử lý đơn thiếu hàng trước và chỉ chốt
              phiếu khi chứng từ đã khớp.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return `${value.toLocaleString()} đ`;
}
