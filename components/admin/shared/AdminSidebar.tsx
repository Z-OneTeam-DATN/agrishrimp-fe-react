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
  ChevronRight, // Icon mũi tên
  ShoppingCart,
  Printer,
  CheckSquare,
  Box,
  List,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/app/services/supplier.service";
import { customerService } from "@/app/services/customer.service";

export default function AdminSidebar() {
  const pathname = usePathname();

  const [supplierCount, setSupplierCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  // State quản lý các nhóm menu đang mở
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
        supplierService.getAll(undefined, undefined, undefined, 0, 1),
        customerService.getAll("", "all", 0, 1)
      ]);

      if (results[0].status === 'fulfilled') {
        setSupplierCount(results[0].value.totalElements || 0);
      }

      if (results[1].status === 'fulfilled') {
        setCustomerCount(results[1].value.totalElements || 0);
      }
    } catch (error) {
      console.warn("Sidebar counts could not be synced");
    }
  };

  useEffect(() => {
    fetchCounts();
    const handleUpdate = () => fetchCounts();
    window.addEventListener("supplierUpdated", handleUpdate);
    window.addEventListener("customerUpdated", handleUpdate);

    return () => {
      window.removeEventListener("supplierUpdated", handleUpdate);
      window.removeEventListener("customerUpdated", handleUpdate);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  // Hàm toggle đóng mở menu
  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev =>
      prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
    );
  };

  return (
    <div className="w-[260px] bg-[#020617] text-slate-400 h-screen flex flex-col border-r border-slate-800/40 sticky top-0 z-30">
      {/* Brand Header */}
      <div className="h-[64px] px-7 flex items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full" />
          <div className="flex flex-col">
            <h1 className="font-black text-white text-[18px] tracking-[0.15em] leading-none uppercase">
              AGRI<span className="text-emerald-500">SHRIMP</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-1">Administrator</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar pb-10">
        {/* Section: Hệ thống */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Hệ thống</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin" icon={LayoutDashboard} label="Tổng quan" active={isActive("/admin") && pathname === "/admin"} color="text-emerald-500" />
            <SidebarLink href="/admin/inventory-dashboard" icon={ClipboardList} label="Bàn làm việc kho" active={isActive("/admin/inventory-dashboard")} color="text-amber-400" />

            {/* === PHẦN XỬ LÝ ĐƠN HÀNG (MỚI) === */}
            <SidebarGroup
              label="Xử lý đơn hàng"
              icon={ShoppingCart}
              isOpen={openGroups.includes("orders")}
              onToggle={() => toggleGroup("orders")}
              active={isActive("/admin/orders")}
            >
              <SidebarLink href="/admin/orders-confirmation" icon={CheckSquare} label="Chờ xác nhận" active={isActive("/admin/orders/confirmation")} isChild />
              <SidebarLink href="/admin/orders-processing" icon={Box} label="Chờ xử lý" active={isActive("/admin/orders/processing")} isChild />
              <SidebarLink
                href="/admin/orders-packing"
                icon={Printer}
                label="In & đóng gói"
                active={isActive("/admin/orders-packing")}
                isChild
              />
              <SidebarLink href="/admin/orders-handover" icon={Archive} label="Bàn giao kiện hàng" active={isActive("/admin/orders/handover")} isChild />
              <SidebarLink href="/admin/orders-all" icon={List} label="Tất cả kiện hàng" active={isActive("/admin/orders/all")} isChild />
            </SidebarGroup>
            {/* ================================== */}

          </div>
        </section>

        {/* Section: Quản trị */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Quản trị</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/employees" icon={UserCircle} label="Nhân viên hệ thống" active={isActive("/admin/employees")} />
            <SidebarLink href="/admin/branches" icon={Building2} label="Chi nhánh & Kho" active={isActive("/admin/branches")} />
          </div>
        </section>

        {/* Section: Hàng hóa */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Hàng hóa</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/products" icon={Package} label="Sản phẩm" active={isActive("/admin/products")} />
            <SidebarLink href="/admin/categories" icon={Tags} label="Danh mục" active={isActive("/admin/categories")} />
            <SidebarLink href="/admin/variants" icon={Layers} label="Thuộc tính" active={isActive("/admin/variants")} />
          </div>
        </section>

        {/* Section: Nghiệp vụ kho */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Giao dịch kho</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/receipts" icon={Warehouse} label="Nhập hàng" active={isActive("/admin/receipts")} />
            <SidebarLink href="/admin/exports" icon={ArrowUpFromLine} label="Xuất hàng" active={isActive("/admin/exports")} />
            <SidebarLink href="/admin/transfers" icon={ArrowRightLeft} label="Điều chuyển" active={isActive("/admin/transfers")} />
            <SidebarLink href="/admin/inventory-checks" icon={ShieldCheck} label="Kiểm kê kho" active={isActive("/admin/inventory-checks")} />
          </div>
        </section>

        {/* Section: Vận chuyển */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Vận chuyển</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/shipping/overview" icon={Truck} label="Tổng quan vận chuyển" active={isActive("/admin/shipping/overview")} />
          </div>
        </section>

        {/* Section: Đối tác */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Đối tác</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/suppliers" icon={Truck} label="Nhà cung cấp" active={isActive("/admin/suppliers")} badge={supplierCount} color="text-orange-400" />
            <SidebarLink href="/admin/customers" icon={Users} label="Khách hàng" active={isActive("/admin/customers")} badge={customerCount} color="text-blue-400" />
          </div>
        </section>

        {/* Section: Báo cáo */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Báo cáo</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/reports/sales" icon={TrendingUp} label="Báo cáo bán hàng" active={isActive("/admin/reports/sales")} color="text-blue-500" />
            <SidebarLink href="/admin/reports/inventory" icon={Warehouse} label="Báo cáo kho" active={isActive("/admin/reports/inventory")} color="text-amber-500" />
            <SidebarLink href="/admin/financial" icon={FileBarChart} label="Báo cáo tài chính" active={isActive("/admin/financial")} color="text-emerald-500" />
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-4 mt-auto border-t border-slate-800/40 bg-[#020617]/50">
        <SidebarLink href="/admin/settings" icon={Settings} label="Cài đặt" active={isActive("/admin/settings")} />
        <SidebarLink href="#" icon={HelpCircle} label="Hỗ trợ" active={false} />
      </div>
    </div>
  );
}

// Component Link đơn lẻ (đã cập nhật để hỗ trợ style cho child link)
function SidebarLink({ href, icon: Icon, label, active, badge, color, badgeColor, isChild }: any) {
  return (
    <Link href={href} className={cn(
      "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative",
      active ? "bg-slate-800/60 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200",
      isChild && "pl-3 py-1.5 text-[12px]" // Style riêng cho link con
    )}>
      {active && !isChild && <div className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-r-full" />}
      <div className="flex items-center gap-3">
        {/* Nếu là link con thì không hiện nền cho icon để gọn hơn, hoặc icon nhỏ hơn */}
        <div className={cn("rounded-md transition-colors",
          isChild ? "p-0 bg-transparent" : "p-1",
          active && !isChild ? "bg-slate-700" : "bg-transparent group-hover:bg-slate-800"
        )}>
          <Icon size={isChild ? 14 : 16} className={cn(active ? (color || "text-emerald-400") : "text-slate-500 group-hover:text-slate-400")} />
        </div>
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <Badge className={cn("border-none text-[10px] h-4.5 px-1.5 font-black", badgeColor || (active ? "bg-white text-emerald-600" : "bg-emerald-500/10 text-emerald-400"))}>
          {badge}
        </Badge>
      )}
    </Link>
  );
}

// Component Nhóm Menu (Sổ xuống)
function SidebarGroup({ icon: Icon, label, children, isOpen, onToggle, active }: any) {
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative select-none",
          active ? "text-emerald-400" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
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

      {/* Hiệu ứng sổ xuống */}
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          {/* Đường kẻ dọc nối các mục con */}
          <div className="pl-2 space-y-0.5 border-l border-slate-800/60 ml-5 mt-1 mb-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}