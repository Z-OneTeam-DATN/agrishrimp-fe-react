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
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supplierService } from "@/app/services/supplier.service";
import { customerService } from "@/app/services/customer.service"; 

export default function AdminSidebar() {
  const pathname = usePathname();

  const [supplierCount, setSupplierCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  const fetchCounts = async () => {
    try {
      // Use Promise.allSettled to allow one to fail without blocking the other,
      // and handle errors silently to avoid disruptive "Network Error" overlays in dev
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
      // Silent catch for initial count fetching to avoid UI crashes
      console.warn("Sidebar counts could not be synced (Backend might be offline)");
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
            <SidebarLink href="/admin" icon={LayoutDashboard} label="Tổng quan" active={isActive("/admin")} color="text-emerald-500" />
            <SidebarLink href="/admin/inventory-dashboard" icon={ClipboardList} label="Bàn làm việc kho" active={isActive("/admin/inventory-dashboard")} color="text-amber-400" />
          </div>
        </section>

        {/* Section: Quản trị (Moved up below System) */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Quản trị</p>
          <div className="space-y-0.5">
            <SidebarLink href="/admin/employees" icon={UserCircle} label="Nhân viên hệ thống" active={isActive("/admin/employees")} />
            <SidebarLink href="/admin/branches" icon={Building2} label="Chi nhánh & Kho" active={isActive("/admin/branches")} />
          </div>
        </section>

        {/* Section: Danh mục hàng hóa */}
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

        {/* Section: Phân tích */}
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

function SidebarLink({ href, icon: Icon, label, active, badge, color, badgeColor }: any) {
  return (
    <Link href={href} className={cn(
      "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative",
      active ? "bg-slate-800/60 text-white shadow-sm" : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
    )}>
      {active && <div className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-r-full" />}
      <div className="flex items-center gap-3">
        <div className={cn("p-1 rounded-md transition-colors", active ? "bg-slate-700" : "bg-transparent group-hover:bg-slate-800")}>
          <Icon size={16} className={cn(active ? (color || "text-emerald-400") : "text-slate-500 group-hover:text-slate-400")} />
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