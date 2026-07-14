"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Bell,
  User,
  LogOut,
  Settings as SettingsIcon,
  MapPin,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLogout } from "@/hooks/use-logout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { branchService } from "@/app/services/branchService";
import { isAdminRole } from "@/lib/roles";
import { P } from "@/lib/permissions";
import {
  ADMIN_ORDER_STATUS_PAGES,
  getAdminOrderStatusHref,
} from "@/lib/admin-order-status-pages";

type BranchSummary = {
  id: number;
  name: string;
};

type BranchResponse = BranchSummary[] | { content?: BranchSummary[] };

const ADMIN_ORDER_STATUS_ROUTE_LABELS = Object.fromEntries(
  ADMIN_ORDER_STATUS_PAGES.map((page) => [
    getAdminOrderStatusHref(page.slug),
    page.label,
  ]),
) as Record<string, string>;

const ADMIN_ROUTE_LABELS: Record<string, string> = {
  "/admin": "Trang chủ",
  "/admin/employees": "Quản lý nhân sự",
  "/admin/employees/add": "Thêm nhân sự",
  "/admin/employees/edit": "Chỉnh sửa nhân sự",
  "/admin/employees/roles": "Vai trò & quyền",
  "/admin/employees/roles/add": "Thêm vai trò",
  "/admin/employees/roles/edit": "Chỉnh sửa vai trò",
  "/admin/branches": "Chi nhánh & Kho",
  "/admin/branches/add": "Thêm chi nhánh",
  "/admin/customers": "Khách hàng",
  "/admin/customers/add": "Thêm khách hàng",
  "/admin/suppliers": "Nhà cung cấp",
  "/admin/suppliers/add": "Thêm nhà cung cấp",
  "/admin/products": "Sản phẩm",
  "/admin/products/add": "Thêm sản phẩm",
  "/admin/products/edit": "Chỉnh sửa sản phẩm",
  "/admin/categories": "Danh mục",
  "/admin/brands": "Thương hiệu",
  "/admin/variants": "Thuộc tính",
  "/admin/variants/add": "Thêm thuộc tính",
  "/admin/banners": "Banner",
  "/admin/blog/posts": "Bài viết",
  "/admin/blog/posts/new": "Thêm bài viết",
  "/admin/blog/posts/edit": "Chỉnh sửa bài viết",
  "/admin/blog/categories": "Danh mục blog",
  "/admin/orders": "Tổng quan đơn hàng",
  "/admin/orders-all": "Danh sách đơn hàng",
  "/admin/orders/add": "Tạo đơn hàng",
  "/admin/orders/draft": "Đơn hàng nháp",
  "/admin/orders/incomplete": "Đơn hàng chưa hoàn tất",
  "/admin/orders/return": "Trả hàng",
  "/admin/orders-handover": "Bàn giao đơn hàng",
  "/admin/orders-handover/create": "Tạo bàn giao",
  "/admin/orders-processing": "Đơn đang xử lý",
  "/admin/receipts": "Phiếu nhập",
  "/admin/receipts/new": "Lập phiếu nhập",
  "/admin/receipts/select-request": "Chọn phiếu yêu cầu",
  "/admin/exports": "Phiếu xuất",
  "/admin/exports/new": "Lập phiếu xuất",
  "/admin/exports/new-command": "Tạo phiếu xuất trả NCC",
  "/admin/transfers": "Điều chuyển kho",
  "/admin/transfers/new": "Tạo điều chuyển",
  "/admin/transfers/requests": "Yêu cầu điều chuyển",
  "/admin/purchase-requests": "Yêu cầu nhập hàng",
  "/admin/purchase-requests/new": "Tạo yêu cầu nhập",
  "/admin/inventory-checks": "Kiểm kê kho",
  "/admin/inventory-checks/new": "Tạo phiếu kiểm kê",
  "/admin/financial": "Tổng quan tài chính",
  "/admin/financial/cashbook": "Sổ quỹ / Tiền chi",
  "/admin/financial/profit-loss": "Lãi lỗ",
  "/admin/financial/supplier-debt": "Công nợ NCC",
  "/admin/financial/customer-debt": "Công nợ khách hàng",
  "/admin/reports/sales": "Báo cáo doanh thu",
  "/admin/reports/inventory": "Báo cáo nhập xuất tồn",
  "/admin/settings": "Cài đặt",
  "/admin/chat": "Chat khách hàng",
  "/admin/vouchers": "Khuyến mãi",
  "/admin/vouchers/add": "Thêm voucher",
  "/admin/vouchers/edit": "Cập nhật voucher",
  "/admin/shipping/overview": "Tổng quan giao hàng",
};

const HIDDEN_BREADCRUMB_PATHS = new Set([
  "/admin/employees",
]);

const SEGMENT_LABELS: Record<string, string> = {
  add: "Thêm mới",
  edit: "Chỉnh sửa",
  new: "Tạo mới",
  page: "Trang",
};

export default function AdminTopHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editingBranchId = searchParams.get("id");
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const { logout, isLoading: isLoggingOut } = useLogout();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const warehouseId = useAuthStore((state) => state.warehouseId);
  const accessToken = useAuthStore((state) => state.accessToken);
  const shouldFetchBranchDirectory =
    !!accessToken &&
    hasPermission(P.BRANCH_VIEW) &&
    !user?.branch?.name &&
    !!warehouseId;

  const { data: branches, isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getAll(),
    enabled: shouldFetchBranchDirectory,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getUserDisplayName = () => {
    if (isUserLoading) return "Đang tải...";
    if (!user) return "Admin";
    return (
      user.fullName ||
      user.displayName ||
      user.phoneNumber ||
      user.email ||
      "Admin"
    );
  };

  const formattedDate = mounted
    ? time.toLocaleDateString("vi-VN", {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  const formattedTime = mounted
    ? time.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: { href: string; label: string }[] = [];
    const hideDetailBreadcrumb = pathname.startsWith("/admin/vouchers/edit/");

    if (segments[0] !== "admin") {
      return items;
    }

    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      const exactLabel =
        currentPath === "/admin/branches/add" && editingBranchId
          ? "Cập nhật chi nhánh"
          : ADMIN_ROUTE_LABELS[currentPath] ??
            ADMIN_ORDER_STATUS_ROUTE_LABELS[currentPath];
      const isLast = index === segments.length - 1;

      if (pathname.startsWith("/admin/employees/roles") && HIDDEN_BREADCRUMB_PATHS.has(currentPath)) {
        return;
      }

      if (exactLabel) {
        items.push({ href: currentPath, label: exactLabel });
        return;
      }

      if (/^\d+$/.test(segment) || segment.startsWith("[")) {
        if (isLast && !hideDetailBreadcrumb) {
          items.push({ href: currentPath, label: "Chi tiết" });
        }
        return;
      }

      const segmentLabel =
        SEGMENT_LABELS[segment] ??
        segment
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

      items.push({ href: currentPath, label: segmentLabel });
    });

    return items;
  }, [pathname, editingBranchId]);

  const getUserRoleName = () => {
    if (typeof user?.role === "object" && user.role !== null) {
      return user.role.displayName || "Quản trị viên";
    }
    return user?.role || "Quản trị viên";
  };

  const getUserBranchName = () => {
    if (isUserLoading) return "Đang tải...";

    if (user?.branch?.name) return user.branch.name;

    if (isAdminRole(user?.role) && !warehouseId) {
      return "Toàn hệ thống";
    }

    if (!shouldFetchBranchDirectory) {
      return warehouseId ? `Chi nhánh (ID: ${warehouseId})` : "Chưa có chi nhánh";
    }

    if (isBranchesLoading) return "Đang tải...";

    const branchData = branches as BranchResponse | undefined;
    const branchList = Array.isArray(branchData)
      ? branchData
      : branchData?.content ?? [];

    if (warehouseId && branches) {
      const currentBranch = branchList.find((branch) => branch.id === warehouseId);
      if (currentBranch) return currentBranch.name;
    }

    if (isAdminRole(user?.role)) {
      return branchList.length > 0 ? "Toàn hệ thống" : "Chưa có chi nhánh";
    }

    return warehouseId
      ? `Chi nhánh (ID: ${warehouseId})`
      : (branchList.length > 0 ? "Chưa gán chi nhánh" : "Chưa có chi nhánh");
  };

  return (
    <header className="h-[64px] border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap overflow-x-auto whitespace-nowrap text-[13px] font-medium text-slate-400 no-scrollbar">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <Fragment key={item.href}>
                    <BreadcrumbItem className="min-w-0">
                      {isLast ? (
                        <BreadcrumbPage className="truncate text-[13px] font-bold text-slate-800">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="truncate text-[13px] text-slate-500 hover:text-blue-600">
                          <Link href={item.href}>{item.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator className="text-slate-300" />}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="hidden xl:flex items-center gap-4 text-slate-500">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100/50">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[13px] font-bold text-slate-700 font-mono tracking-wider">
              {formattedTime}
            </span>
            <div className="w-[1px] h-3 bg-slate-200 mx-1" />
            <span className="text-[12px] font-medium text-slate-500">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
          <MapPin size={14} className="text-blue-600" />
          <span className="text-[12px] font-bold text-blue-700">
            {getUserBranchName()}
          </span>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-1"></div>
        </div>

        <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all ml-2 group">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                  {getUserDisplayName()}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                  {getUserRoleName()}
                </p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-white shadow-md ring-1 ring-slate-100">
                <AvatarImage src={user?.avatar?.imageUrl ?? ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[11px] font-bold">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 mt-3 shadow-2xl border-slate-100 rounded-xl p-2"
          >
            <DropdownMenuLabel className="px-3 py-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {isAdminRole(user?.role)
                    ? "Quyền hạn cao nhất"
                    : "Thông tin tài khoản"}
                </span>
                <span className="text-[13px] font-bold text-slate-800 mt-0.5">
                  {user?.email || user?.phoneNumber || "Đang tải..."}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50 mx-2" />
            <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5 px-3 text-slate-600 hover:bg-blue-50 focus:bg-blue-50 group">
              <User className="mr-3 h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              <span className="text-[13px] font-medium">Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5 px-3 text-slate-600 hover:bg-blue-50 focus:bg-blue-50 group">
              <SettingsIcon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              <span className="text-[13px] font-medium">Cài đặt hệ thống</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50 mx-2" />
            <DropdownMenuItem
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-600 font-bold py-2.5 px-3 rounded-lg group"
            >
              <LogOut className="mr-3 h-4 w-4 text-rose-400 group-hover:text-rose-600" />
              <span className="text-[13px]">
                {isLoggingOut ? "Đang xử lý..." : "Đăng xuất"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

