"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Tags,
  Users,
  UserCircle,
  Building2,
  FileBarChart,
  Settings,
  HelpCircle,
  Truck,
  TrendingUp,
  Warehouse,
  ArrowRightLeft,
  ArrowUpFromLine,
  ShieldCheck,
  ClipboardList,
  ChevronRight,
  ShoppingCart,
  Printer,
  CheckSquare,
  Box,
  List,
  Archive,
  RotateCcw,
  Ticket, // Đã bổ sung icon Ticket ở đây
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/app/services/supplier.service";
import { customerService } from "@/app/services/customer.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { hasPermission, hasAnyPermission } = usePermissions();
  // Normalize role (chỉ dùng để hiển thị label, logic bảo vệ dùng hasPermission)
  const rawRole = (typeof user?.role === "object" ? user.role?.slug : user?.role)?.toUpperCase() || "USER";
  const role = rawRole.startsWith("ROLE_") ? rawRole.replace("ROLE_", "") : rawRole;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";

  const [supplierCount, setSupplierCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  // Quản lý các nhóm menu đang mở
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Tự động mở nhóm menu nếu đang truy cập trang con bên trong
  useEffect(() => {
    if (pathname.startsWith("/admin/orders")) {
      setOpenGroups(prev => prev.includes("orders") ? prev : [...prev, "orders"]);
    }
  }, [pathname]);

  const fetchCounts = async () => {
    try {
      const results = await Promise.allSettled([
        supplierService.getAll(undefined, undefined, 0, 1),
        customerService.getAll("", "all", 0, 1)
      ]);

      if (results[0].status === 'fulfilled') {
        setSupplierCount(results[0].value.totalElements || 0);
      }
      if (results[1].status === 'fulfilled') {
        setCustomerCount(results[1].value.totalElements || 0);
      }
    } catch (error) {
      console.warn("Sidebar counts sync failed");
    }
  };

  useEffect(() => {
    fetchCounts();
    const handleUpdate = () => fetchCounts();
    window.addEventListener("supplierUpdated", handleUpdate);
    window.addEventListener("customerUpdated", handleUpdate);
    window.addEventListener("orderUpdated", handleUpdate);

    return () => {
      window.removeEventListener("supplierUpdated", handleUpdate);
      window.removeEventListener("customerUpdated", handleUpdate);
      window.removeEventListener("orderUpdated", handleUpdate);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev =>
      prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
    );
  };

  return (
    <div className="w-[260px] bg-[#020617] text-slate-400 h-screen flex flex-col border-r border-slate-800/40 sticky top-0 z-30">
      <div className="h-[64px] px-7 flex items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full" />
          <div className="flex flex-col">
            <h1 className="font-black text-white text-[18px] tracking-[0.15em] leading-none uppercase">
              AGRI<span className="text-emerald-500">SHRIMP</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-1">
              {role === "ADMIN" ? "Administrator" : role === "MANAGER" ? "Manager" : "User"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
        {/* SECTION: HỆ THỐNG */}

        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Hệ thống
          </p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin" icon={LayoutDashboard} label="Tổng quan" active={pathname === "/admin"} color="text-emerald-500" />
            <SidebarLink href="/admin/inventory-dashboard" icon={ClipboardList} label="Bàn làm việc kho" active={isActive("/admin/inventory-dashboard")} color="text-amber-400" />
          </div>
        </section>

        {/* SECTION: BÁO CÁO */}
        {hasAnyPermission([P.REPORT_REVENUE_VIEW, P.REPORT_INVENTORY_VIEW, P.REPORT_FINANCE_VIEW]) && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Báo cáo
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.REPORT_REVENUE_VIEW) && (
                <SidebarLink
                  href="/admin/reports/sales"
                  icon={TrendingUp}
                  label="Doanh thu"
                  active={isActive("/admin/reports/sales")}
                  color="text-blue-500"
                />
              )}
              {hasPermission(P.REPORT_INVENTORY_VIEW) && (
                <SidebarLink
                  href="/admin/reports/inventory"
                  icon={Warehouse}
                  label="Báo cáo kho"
                  active={isActive("/admin/reports/inventory")}
                  color="text-amber-500"
                />
              )}
              {hasPermission(P.REPORT_FINANCE_VIEW) && (
                <SidebarLink
                  href="/admin/financial"
                  icon={FileBarChart}
                  label="Tài chính"
                  active={isActive("/admin/financial")}
                  color="text-emerald-500"
                />
              )}
            </div>
          </section>
        )}

        {/* SECTION: QUẢN TRỊ */}
        {hasAnyPermission([P.STAFF_VIEW, P.BRANCH_VIEW, P.ROLE_VIEW, P.SUPPLIER_VIEW]) && (
          <section>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
              Quản trị
            </p>
            <div className="space-y-0.5">
              {hasPermission(P.STAFF_VIEW) && (
                <SidebarLink href="/admin/employees" icon={UserCircle} label="Nhân viên" active={isActive("/admin/employees")} />
              )}
              {hasPermission(P.BRANCH_VIEW) && (
                <SidebarLink href="/admin/branches" icon={Building2} label="Chi nhánh & Kho" active={isActive("/admin/branches")} />
              )}
              {hasPermission(P.ROLE_VIEW) && (
                <SidebarLink href="/admin/roles" icon={ShieldCheck} label="Vai trò & Quyền" active={isActive("/admin/roles")} color="text-violet-400" />
              )}
              {hasPermission(P.SUPPLIER_VIEW) && (
                <SidebarLink
                  href="/admin/suppliers"
                  icon={Truck}
                  label="Nhà cung cấp"
                  active={isActive("/admin/suppliers")}
                  badge={supplierCount}
                  color="text-orange-400"
                />
              )}
            </div>
          </section>
        )}

        {/* =======================
            SECTION MỚI: KINH DOANH
            ======================= */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Kinh doanh
          </p>
          <div className="space-y-0.5">
            <SidebarGroup
              label="Quản lý Đơn hàng"
              icon={ShoppingCart}
              isOpen={openGroups.includes("orders")}
              onToggle={() => toggleGroup("orders")}
              active={pathname.startsWith("/admin/orders")}
            >
              <SidebarLink
                href="/admin/orders"
                icon={List}
                label="Danh sách đơn hàng"
                active={pathname === "/admin/orders" || (pathname.startsWith("/admin/orders/") && !pathname.includes("return"))}
                isChild
              />
              <SidebarLink href="/admin/orders-processing" icon={Box} label="Điều hành & Gom đơn" active={pathname === "/admin/orders-processing"} isChild />
              <SidebarLink href="/admin/orders-handover" icon={Archive} label="Bàn giao kiện" active={pathname === "/admin/orders-handover"} isChild />
              <SidebarLink href="/admin/orders-all" icon={List} label="Tất cả kiện hàng" active={pathname === "/admin/orders-all"} isChild />
              <SidebarLink
                href="/admin/orders/return"
                icon={RotateCcw}
                label="Trả hàng"
                active={pathname.startsWith("/admin/orders/return")}
                isChild
              />
            </SidebarGroup>

            {hasPermission(P.VOUCHER_VIEW) && ( // Đã thêm kiểm tra quyền nếu bạn có cài đặt
                  <SidebarLink
                    href="/admin/vouchers"
                    icon={Ticket}
                    label="Khuyến mãi & Voucher"
                    active={isActive("/admin/vouchers")}
                    color="text-pink-400"
                  />
                )}
            {hasPermission(P.CUSTOMER_VIEW) && (
              <SidebarLink
                href="/admin/customers"
                icon={Users}
                label="Khách hàng"
                active={isActive("/admin/customers")}
                badge={customerCount}
                color="text-blue-400"
              />
            )}
          </div>
        </section>

        {/* SECTION: HÀNG HÓA - Only for ADMIN */}

        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Hàng hóa
          </p>

          <div className="space-y-0.5">
            {hasPermission(P.PRODUCT_VIEW) && (
              <SidebarLink
                href="/admin/products"
                icon={Package}
                label="Sản phẩm"
                active={isActive("/admin/products")}
              />
            )}
            {hasPermission(P.CATEGORY_VIEW) && (
              <SidebarLink
                href="/admin/categories"
                icon={Tags}
                label="Danh mục"
                active={isActive("/admin/categories")}
              />
            )}
            {hasPermission(P.ATTRIBUTE_VIEW) && (
              <SidebarLink
                href="/admin/variants"
                icon={Layers}
                label="Thuộc tính"
                active={isActive("/admin/variants")}
              />
            )}
          </div>
        </section>

        {/* SECTION: GIAO DỊCH KHO */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Giao dịch kho
          </p>
          <div className="space-y-0.5">
            {hasPermission(P.IMPORT_VIEW) && (
              <SidebarLink href="/admin/receipts" icon={Warehouse} label="Nhập hàng" active={isActive("/admin/receipts")} />
            )}
            {hasPermission(P.EXPORT_VIEW) && (
              <SidebarLink href="/admin/exports" icon={ArrowUpFromLine} label="Xuất hàng" active={isActive("/admin/exports")} />
            )}
            {hasPermission(P.TRANSFER_VIEW) && (
              <SidebarLink href="/admin/transfers" icon={ArrowRightLeft} label="Điều chuyển" active={isActive("/admin/transfers")} />
            )}
            {hasPermission(P.IMPORT_VIEW) && (
              <SidebarLink href="/admin/inventory-checks" icon={ShieldCheck} label="Kiểm kê kho" active={isActive("/admin/inventory-checks")} />
            )}
          </div>
        </section>
      </div>

      <div className="p-4 mt-auto border-t border-slate-800/40 bg-[#020617]/50">
        <SidebarLink href="/admin/settings" icon={Settings} label="Cài đặt" active={isActive("/admin/settings")} />
        <SidebarLink href="#" icon={HelpCircle} label="Hỗ trợ" active={false} />
      </div>
    </div>
  );
}

function SidebarLink({ href, icon: Icon, label, active, badge, color, badgeColor, isChild }: any) {
  return (
    <Link href={href} className={cn(
      "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative",
      active ? "bg-slate-800/60 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200",
      isChild && "pl-3 py-1.5 text-[12px]"
    )}>
      {active && !isChild && <div className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-r-full" />}
      <div className="flex items-center gap-3">
        <div className={cn("rounded-md transition-colors",
          isChild ? "p-0 bg-transparent" : "p-1",
          active && !isChild ? "bg-slate-700" : "bg-transparent group-hover:bg-slate-800"
        )}>
          <Icon size={isChild ? 14 : 16} className={cn(active ? (color || "text-emerald-400") : "text-slate-500 group-hover:text-slate-400")} />
        </div>
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge className={cn("border-none text-[10px] h-4.5 px-1.5 font-black", active ? "bg-white text-emerald-600" : "bg-emerald-500/10 text-emerald-400")}>
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function SidebarGroup({ icon: Icon, label, children, isOpen, onToggle, active }: any) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative select-none",
          active ? "text-emerald-400 bg-slate-800/20" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1 rounded-md transition-colors", active ? "bg-slate-800/50" : "bg-transparent group-hover:bg-slate-800")}>
            <Icon size={16} className={cn(active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400")} />
          </div>
          <span className="truncate">{label}</span>
        </div>
        <ChevronRight size={14} className={cn("transition-transform duration-200 text-slate-600", isOpen && "rotate-90")} />
      </button>
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="pl-2 space-y-0.5 border-l border-slate-800/60 ml-5 mt-1 mb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}