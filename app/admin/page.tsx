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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    description: "Tạo và theo dõi các phiếu xuất đang chờ hoàn tất.",
    permission: P.EXPORT_VIEW,
    tone: "from-sky-500 to-blue-600",
  },
  {
    href: "/admin/receipts",
    icon: Package,
    label: "Nhập hàng",
    description: "Tiếp nhận hàng hóa từ NCC và xác nhận đúng chứng từ.",
    permission: P.IMPORT_VIEW,
    tone: "from-emerald-500 to-teal-600",
  },
  {
    href: "/admin/transfers",
    icon: ArrowRightLeft,
    label: "Điều chuyển",
    description: "Điều phối hàng giữa các điểm để tránh thiếu tồn.",
    permission: P.TRANSFER_VIEW,
    tone: "from-amber-400 to-orange-500",
  },
  {
    href: "/admin/inventory-checks",
    icon: CheckCircle2,
    label: "Kiểm kê",
    description: "Khởi tạo phiên kiểm kê và xử lý chênh lệch nhanh.",
    permission: P.CHECK_VIEW,
    tone: "from-violet-500 to-indigo-600",
  },
];

type BranchOption = {
  id: number;
  name: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading, error: userError } = useCurrentUser();
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

  const workflowHighlights = useMemo(() => {
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
        description: "Ưu tiên xác nhận trước khi luồng bán hàng bị chậm.",
        href: "/admin/orders",
        icon: ShoppingCart,
        tone: "border-sky-200 bg-sky-50 text-sky-700",
      },
      {
        label: "Đơn thiếu hàng",
        value: backorderCount,
        description: "Cần điều phối bổ sung hoặc xử lý thiếu tồn.",
        href: "/admin/transfers",
        icon: AlertTriangle,
        tone: "border-rose-200 bg-rose-50 text-rose-700",
      },
      {
        label: "Khách hàng đang phục vụ",
        value: stats?.totalCustomers ?? 0,
        description: "Theo dõi quy mô tệp khách hàng đang vận hành.",
        href: "/admin/customers",
        icon: Users,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
      {
        label: "Doanh thu hôm nay",
        value: dailyResults?.todayRevenue ?? 0,
        description: "Kiểm tra tốc độ hoàn thành doanh thu trong ngày.",
        href: "/admin/reports/sales",
        icon: Wallet,
        tone: "border-amber-200 bg-amber-50 text-amber-700",
        isCurrency: true,
      },
    ];
  }, [backorders, dailyResults?.todayRevenue, pendingSummary?.pendingApproval, stats?.totalCustomers]);

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
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 rounded-[28px] border border-white/70 bg-white/80">
        <RefreshCw className="animate-spin text-emerald-600" size={32} />
        <p className="text-sm font-medium text-slate-600">
          Đang tải thông tin tổng quan hệ thống...
        </p>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-[28px] border border-rose-100 bg-white p-6 text-center shadow-sm">
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
        <div className="space-y-2 rounded-[28px] border border-white/70 bg-white/80 p-10 text-center shadow-sm">
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
      <section className="overflow-hidden rounded-[32px] border border-white/90 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_30%),linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#ecfeff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)] lg:px-8 lg:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                Dashboard điều hành
              </span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600">
                Phạm vi: {branchLabel}
              </span>
            </div>

            <div className="max-w-3xl">
              <h2 className="text-2xl font-black tracking-tight text-slate-950 lg:text-[34px]">
                Giao diện tổng quan được sắp theo đúng thứ tự vận hành mỗi ngày.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 lg:text-base">
                Bắt đầu từ cảnh báo cần xử lý, chuyển sang thao tác nhanh, rồi
                mới đến số liệu và phân tích sâu. Cách này giúp đội vận hành
                biết việc gì cần làm ngay mà không phải quét cả màn hình.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {workflowHighlights.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "rounded-[24px] border px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                    item.tone,
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-white/70 p-2.5 shadow-sm">
                      <item.icon size={18} />
                    </div>
                    <ChevronRight size={18} />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-2xl font-black tracking-tight">
                    {item.isCurrency
                      ? formatCurrency(item.value)
                      : item.value.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs leading-5 opacity-80">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Bộ lọc điều hành
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Ngữ cảnh đang xem
                </h3>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="rounded-2xl border-slate-200"
              >
                <RefreshCw
                  size={16}
                  className={cn(isRefreshing && "animate-spin")}
                />
                <span className="ml-2 hidden sm:inline">Làm mới</span>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-2.5 text-emerald-600 shadow-sm">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Chi nhánh hiển thị
                    </p>
                    {isAdmin ? (
                      <div className="mt-2">
                        <Select
                          value={selectedBranchId || "all"}
                          onValueChange={(value) =>
                            setSelectedBranchId(value === "all" ? undefined : value)
                          }
                        >
                          <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white text-sm font-semibold">
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
                      <p className="mt-2 truncate text-sm font-bold text-slate-900">
                        {branchLabel}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Hướng dẫn sử dụng
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Ưu tiên xử lý các khối cảnh báo màu đỏ và vàng trước.</li>
                  <li>Luôn xác nhận đúng chi nhánh trước khi tạo phiếu.</li>
                  <li>Dùng thao tác nhanh để vào đúng màn hình nghiệp vụ.</li>
                </ul>
              </div>
            </div>

            {quickActions.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tác vụ nhanh
                </p>
                <div className="grid gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.href}
                      type="button"
                      onClick={() => router.push(action.href)}
                      className="group rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={cn("rounded-2xl bg-gradient-to-br p-2.5 text-white shadow-sm", action.tone)}>
                          <action.icon size={18} />
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-slate-600" size={18} />
                      </div>
                      <p className="mt-4 text-sm font-bold text-slate-900">
                        {action.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {action.description}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.95fr)]">
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
          <section className="overflow-hidden rounded-[28px] border border-white/90 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Nhật ký hoạt động
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Cập nhật gần đây
                </h3>
              </div>
              <Bell size={18} className="text-slate-400" />
            </div>

            <div className="max-h-[560px] space-y-5 overflow-y-auto px-5 py-5">
              {isRecentLoading ? (
                [...Array(5)].map((_, index) => (
                  <div key={index} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-2xl" />
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
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
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
                        <div className="absolute left-5 top-11 bottom-[-22px] w-px bg-slate-100" />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                          config.bgColor,
                          config.iconColor,
                        )}
                      >
                        <config.icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1 rounded-[22px] border border-slate-100 bg-slate-50/70 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {activity.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {config.label} bởi{" "}
                              <span className="font-semibold text-slate-700">
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

          <section className="overflow-hidden rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,#065f46_0%,#047857_45%,#0f766e_100%)] p-5 text-white shadow-[0_20px_60px_rgba(6,95,70,0.28)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-100/90">
              Quy tắc vận hành
            </p>
            <h3 className="mt-2 text-xl font-black">
              Mọi thao tác nên đi theo một chuỗi rõ ràng
            </h3>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-emerald-50/95">
              <p>1. Xác định đúng chi nhánh hoặc kho trước khi tạo chứng từ.</p>
              <p>2. Xử lý đơn thiếu hàng bằng điều chuyển hoặc bổ sung tồn.</p>
              <p>3. Chỉ chốt phiếu khi trạng thái thanh toán và chứng từ đã khớp.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return `${value.toLocaleString()} đ`;
}
