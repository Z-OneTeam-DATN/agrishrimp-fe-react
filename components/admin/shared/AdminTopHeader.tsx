"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  LogOut,
  MapPin,
  Menu,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { branchService } from "@/app/services/branchService";
import { useLogout } from "@/hooks/use-logout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/useAuthStore";

type AdminTopHeaderProps = {
  onOpenSidebar?: () => void;
};

type BranchSummary = {
  id: number;
  name: string;
};

type BranchResponse = BranchSummary[] | { content?: BranchSummary[] };

const PAGE_META = [
  {
    path: "/admin/orders/return",
    title: "Quản lý trả hàng",
    description: "Xử lý hoàn trả và theo dõi trạng thái trả hàng.",
  },
  {
    path: "/admin/orders",
    title: "Quản lý đơn hàng",
    description: "Theo dõi đơn mới, thanh toán, đóng gói và giao hàng.",
  },
  {
    path: "/admin/receipts",
    title: "Phiếu nhập hàng",
    description: "Kiểm tra, đối chiếu và hoàn tất tiếp nhận hàng hóa.",
  },
  {
    path: "/admin/exports",
    title: "Xuất kho",
    description: "Điều phối xuất hàng và hoàn trả nhà cung cấp đúng tiến độ.",
  },
  {
    path: "/admin/transfers",
    title: "Điều chuyển kho",
    description: "Cân bằng tồn kho giữa các chi nhánh và kho tổng.",
  },
  {
    path: "/admin/inventory-checks",
    title: "Kiểm kê kho",
    description: "Đối chiếu tồn thực tế và xử lý chênh lệch kiểm kê.",
  },
  {
    path: "/admin/products",
    title: "Sản phẩm",
    description: "Quản lý danh mục hàng hóa đang kinh doanh.",
  },
  {
    path: "/admin/customers",
    title: "Khách hàng",
    description: "Tra cứu hồ sơ mua hàng và thông tin chăm sóc khách hàng.",
  },
  {
    path: "/admin/suppliers",
    title: "Nhà cung cấp",
    description: "Theo dõi đối tác cung ứng và công nợ liên quan.",
  },
  {
    path: "/admin/employees/roles",
    title: "Vai trò và quyền",
    description: "Phân quyền để thao tác đúng vai trò và đúng phạm vi.",
  },
  {
    path: "/admin/employees",
    title: "Nhân viên",
    description: "Quản lý hồ sơ nhân sự và phân công vận hành.",
  },
  {
    path: "/admin/financial",
    title: "Tài chính",
    description: "Theo dõi doanh thu, chi phí, công nợ và lợi nhuận.",
  },
  {
    path: "/admin/reports",
    title: "Báo cáo",
    description: "Phân tích doanh thu, tồn kho và hiệu quả vận hành.",
  },
  {
    path: "/admin/blog",
    title: "Nội dung blog",
    description: "Điều phối bài viết và chuyên mục nội dung marketing.",
  },
  {
    path: "/admin/banners",
    title: "Banner hiển thị",
    description: "Quản lý nội dung trực quan trên kênh public.",
  },
  {
    path: "/admin",
    title: "Tổng quan vận hành",
    description: "Nhìn nhanh toàn cảnh kinh doanh, kho vận và việc cần xử lý.",
  },
];

export default function AdminTopHeader({
  onOpenSidebar,
}: AdminTopHeaderProps) {
  const pathname = usePathname();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const { logout, isLoading: isLoggingOut } = useLogout();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { hasPermission } = usePermissions();
  const warehouseId = useAuthStore((state) => state.warehouseId);

  const { data: branches, isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getAll(),
    enabled: hasPermission(P.BRANCH_VIEW),
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pageMeta = useMemo(
    () => PAGE_META.find((item) => pathname.startsWith(item.path)) ?? PAGE_META.at(-1)!,
    [pathname],
  );

  const formattedDate = mounted
    ? time.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  const formattedTime = mounted
    ? time.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const getUserDisplayName = () => {
    if (isUserLoading) {
      return "Đang tải...";
    }
    return (
      user?.fullName ||
      user?.displayName ||
      user?.phoneNumber ||
      user?.email ||
      "Quản trị viên"
    );
  };

  const getUserRoleName = () => {
    if (typeof user?.role === "object" && user.role !== null) {
      return user.role.displayName || "Quản trị viên";
    }
    return user?.role || "Quản trị viên";
  };

  const getUserBranchName = () => {
    if (isUserLoading || isBranchesLoading) {
      return "Đang tải chi nhánh...";
    }

    if (user?.branch?.name) {
      return user.branch.name;
    }

    if (warehouseId && branches) {
      const branchData = branches as BranchResponse;
      const branchList = Array.isArray(branchData)
        ? branchData
        : branchData.content ?? [];
      const currentBranch = branchList.find((branch) => branch.id === warehouseId);
      if (currentBranch) {
        return currentBranch.name;
      }
    }

    if (warehouseId === 1 || isAdminRole(user?.role)) {
      return "Kho tổng Cần Thơ";
    }

    return warehouseId
      ? `Chi nhánh #${warehouseId}`
      : "Đang xác định chi nhánh...";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onOpenSidebar}
            className="h-10 w-10 rounded-2xl border-slate-200 lg:hidden"
          >
            <Menu size={18} />
          </Button>

          <div className="hidden h-11 w-11 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm lg:block">
            <img
              src="/images/logo_arishrimp.jpg"
              alt="AgriShrimp Logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                Admin
              </Badge>
              <span className="hidden text-xs font-medium text-slate-400 md:inline">
                Điều hướng theo luồng nghiệp vụ
              </span>
            </div>
            <h1 className="mt-2 truncate text-lg font-black tracking-tight text-slate-900 lg:text-[26px]">
              {pageMeta.title}
            </h1>
            <p className="hidden truncate text-sm text-slate-500 lg:block">
              {pageMeta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 xl:flex">
            <Clock3 size={16} className="text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-700">{formattedTime}</p>
              <p className="text-[11px] text-slate-500">{formattedDate}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 lg:flex">
            <MapPin size={16} className="text-emerald-600" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Đang thao tác tại
              </p>
              <p className="max-w-[220px] truncate text-sm font-semibold text-emerald-900">
                {getUserBranchName()}
              </p>
            </div>
          </div>

          {hasPermission(P.ROLE_VIEW) && (
            <Link href="/admin/employees/roles" className="hidden xl:block">
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-violet-200 bg-violet-50 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-100"
              >
                <ShieldCheck size={16} className="mr-2 text-violet-500" />
                Vai trò & Quyền
              </Button>
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-800">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {getUserRoleName()}
                  </p>
                </div>
                <Avatar className="h-10 w-10 border border-white shadow-sm ring-2 ring-slate-100">
                  <AvatarImage src={user?.avatar?.imageUrl ?? ""} />
                  <AvatarFallback className="bg-slate-900 text-sm font-bold text-white">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="mt-3 w-72 rounded-2xl border-slate-200 p-2 shadow-2xl"
            >
              <DropdownMenuLabel className="px-3 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Phiên làm việc
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {user?.email || user?.phoneNumber || "Đang tải thông tin"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{getUserBranchName()}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5 text-slate-700 focus:bg-slate-100">
                <User className="mr-3 h-4 w-4 text-slate-400" />
                Hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5 text-slate-700 focus:bg-slate-100">
                <SettingsIcon className="mr-3 h-4 w-4 text-slate-400" />
                Cài đặt hệ thống
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="cursor-pointer rounded-xl px-3 py-2.5 font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
              >
                <LogOut className="mr-3 h-4 w-4 text-rose-400" />
                {isLoggingOut ? "Đang xử lý..." : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
