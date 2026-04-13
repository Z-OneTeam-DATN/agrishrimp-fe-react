"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DailyBusinessResults from "@/components/admin/DailyBusinessResults";
import SalesPerformance from "@/components/admin/SalesPerformance";
import PendingOrders from "@/components/admin/PendingOrders";
import TopProducts from "@/components/admin/TopProducts";
import InventoryInfo from "@/components/admin/InventoryInfo";
import DashboardStats from "@/components/admin/DashboardStats";
import {
  Bell,
  Package,
  Users,
  ShoppingCart,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  RefreshCw,
  ArrowUpFromLine,
  AlertCircle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { branchService } from "@/app/services/branchService";
import { formatDate } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isAdminRole } from "@/lib/roles";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading, error: userError } = useCurrentUser();
  const { hasPermission, isLoadingAuth } = usePermissions();

  // Mặc định là undefined để Admin thấy TẤT CẢ (theo đặc tả BE: không gửi branchId = xem hết)
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    undefined,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Chuẩn hóa role slug
  const roleSlug =
    typeof user?.role === "object" && user?.role !== null
      ? (user.role.slug || "").toUpperCase()
      : typeof user?.role === "string"
        ? user.role.toUpperCase()
        : "";
  const isAdmin = isAdminRole(user?.role);
  const canViewDashboard = hasPermission(P.DASHBOARD_VIEW);
  // Manager và Staff đều bị giới hạn theo chi nhánh
  const isRestricted = ["MANAGER", "STAFF", "EMPLOYEE"].includes(roleSlug);

  // Hàm làm mới toàn bộ dữ liệu Dashboard
  const handleRefresh = useCallback(async () => {
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
      toast.success("Dữ liệu đã được cập nhật mới nhất");
    } catch (error) {
      toast.error("Không thể làm mới dữ liệu");
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // Lấy danh sách chi nhánh cho Admin chọn
  const { data: branches = [] } = useQuery({
    queryKey: ["branches-list"],
    queryFn: () => branchService.getAll(),
    enabled: isAdmin && canViewDashboard && hasPermission(P.BRANCH_VIEW),
  });

  useEffect(() => {
    // CHỈ khi là Manager/Staff thì mới ép ID chi nhánh của họ vào state
    // Nếu là Admin, selectedBranchId sẽ giữ nguyên là undefined (Tất cả chi nhánh)
    if (user && isRestricted && user.branch?.id) {
      setSelectedBranchId(user.branch.id.toString());
    }
  }, [user, isRestricted]);

  const {
    data: recentActivities = [],
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
  } = useQuery({
    queryKey: ["recent-activities", selectedBranchId],
    queryFn: () => dashboardService.getRecentActivities(selectedBranchId),
    enabled: !!user && canViewDashboard,
    refetchInterval: 120000, // Tăng lên 2 phút để tối ưu hiệu năng
  });

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "ORDER":
        return {
          icon: ShoppingCart,
          iconColor: "text-blue-500",
          bgColor: "bg-blue-50",
        };
      case "INVENTORY":
        return {
          icon: Package,
          iconColor: "text-emerald-500",
          bgColor: "bg-emerald-50",
        };
      case "CUSTOMER":
        return {
          icon: Users,
          iconColor: "text-indigo-500",
          bgColor: "bg-indigo-50",
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-500",
          bgColor: "bg-amber-50",
        };
    }
  };

  const quickActions = [
    { label: "Xuất hàng", icon: ArrowUpFromLine, href: "/admin/exports", color: "bg-blue-600" },
    { label: "Nhập hàng", icon: Package, href: "/admin/receipts", color: "bg-emerald-600" },
    { label: "Điều chuyển", icon: ArrowRightLeft, href: "/admin/transfers", color: "bg-amber-600" },
    { label: "Kiểm kê", icon: CheckCircle2, href: "/admin/inventory-checks", color: "bg-indigo-600" },
  ].filter((action) => {
    if (action.href === "/admin/exports") return hasPermission(P.EXPORT_VIEW);
    if (action.href === "/admin/receipts") return hasPermission(P.IMPORT_VIEW);
    if (action.href === "/admin/transfers") return hasPermission(P.TRANSFER_VIEW);
    if (action.href === "/admin/inventory-checks") return hasPermission(P.CHECK_VIEW);
    return false;
  });

  if (isUserLoading || isLoadingAuth) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <RefreshCw className="animate-spin text-blue-600" size={32} />
      <p className="text-sm font-medium text-slate-600">Đang tải thông tin hệ thống...</p>
    </div>
  );

  if (userError)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertCircle className="text-red-500 mb-2" size={48} />
        <h2 className="text-xl font-bold text-slate-800">
          Không thể tải dữ liệu người dùng
        </h2>
        <p className="text-sm text-slate-500 max-w-md mt-2">
          Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra lại kết nối
          hoặc đăng nhập lại.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-6">
          Thử lại
        </Button>
      </div>
    );

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <AlertTriangle className="mx-auto text-amber-500" size={42} />
          <h2 className="text-xl font-bold text-slate-800">Bạn không có quyền truy cập</h2>
          <p className="text-sm text-slate-500">
            Tài khoản của bạn chưa được cấp quyền xem tổng quan hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10 bg-gray-50/50 min-h-screen p-4">
      {/* Header & Branch Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Tổng quan hệ thống
            </h1>
            <p className="text-xs text-slate-500">
              Dữ liệu kinh doanh cập nhật theo thời gian thực
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all group disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              size={16}
              className={cn(
                "text-gray-500 group-hover:text-blue-600",
                isRefreshing && "animate-spin text-blue-600",
              )}
            />
          </button>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-3 bg-white p-2 rounded-sm border border-gray-200 shadow-sm w-full md:w-auto">
            <div className="bg-blue-50 p-1.5 rounded-sm text-blue-600">
              <Building2 size={16} />
            </div>
            <div className="flex-1 md:w-64">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                Chi nhánh hiển thị
              </p>
              <Select
                value={selectedBranchId || "all"}
                onValueChange={(val) =>
                  setSelectedBranchId(val === "all" ? undefined : val)
                }
              >
                <SelectTrigger className="h-7 text-xs border-none p-0 focus:ring-0 shadow-none font-bold text-slate-700">
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tất cả chi nhánh (Tổng hợp)
                  </SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-sm border border-gray-200 shadow-sm">
            <div className="bg-emerald-50 p-1.5 rounded-sm text-emerald-600">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">
                Đang xem tại
              </p>
              <p className="text-xs font-bold text-slate-700">
                {user?.branch?.name || "Chi nhánh của bạn"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 0. Dashboard Overview Stats */}
      <DashboardStats branchId={selectedBranchId} />

      {/* Quick Actions Bar */}
      {quickActions.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`${action.color} p-1.5 rounded-sm text-white group-hover:scale-110 transition-transform`}>
                <action.icon size={16} />
              </div>
              <span className="text-xs font-bold text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <DailyBusinessResults branchId={selectedBranchId} />
          <SalesPerformance branchId={selectedBranchId} />
          <PendingOrders branchId={selectedBranchId} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopProducts branchId={selectedBranchId} />
            <InventoryInfo branchId={selectedBranchId} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm h-full flex flex-col min-h-[500px]">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">
                Hoạt động gần đây
              </h2>
              <Bell size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {isRecentLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex flex-col gap-1 w-full">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2 w-1/2" />
                      <Skeleton className="h-2 w-1/4 mt-1" />
                    </div>
                  </div>
                ))
              ) : isRecentError ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertTriangle className="text-amber-500 mb-2" size={24} />
                  <p className="text-xs text-gray-500">
                    Không thể tải hoạt động
                  </p>
                  <button
                    onClick={() => refetchRecent()}
                    className="text-[10px] text-blue-500 font-bold mt-2 hover:underline"
                  >
                    Thử lại
                  </button>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-gray-400">
                    Không có hoạt động nào
                  </p>
                </div>
              ) : (
                recentActivities.map((activity, index) => {
                  const config = getActivityConfig(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex gap-3 relative group"
                    >
                      {index !== recentActivities.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-[-24px] w-[1px] bg-gray-100" />
                      )}
                      <div
                        className={`${config.bgColor} ${config.iconColor} p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 z-10`}
                      >
                        <config.icon size={14} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold text-gray-800 line-clamp-1">
                          {activity.title}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Bởi{" "}
                          <span className="font-medium text-gray-700">
                            {activity.user}
                          </span>
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                          <Clock size={10} />
                          {formatDate(activity.timestamp, "HH:mm, dd/MM")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-gray-100 text-center">
              <button className="text-xs text-blue-500 font-medium hover:underline">
                Xem tất cả hoạt động
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-sm p-4 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:scale-110 transition-transform">
              <Package size={100} />
            </div>
            <h3 className="text-sm font-bold mb-2">Thông báo hệ thống</h3>
            <p className="text-[11px] opacity-90 leading-relaxed mb-4">
              Hệ thống sẽ bảo trì định kỳ vào lúc 2:00 sáng Chủ Nhật tuần này.
              Vui lòng hoàn tất các giao dịch trước thời gian này.
            </p>
            <button className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-sm transition-colors backdrop-blur-sm">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
