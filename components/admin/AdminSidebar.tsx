"use client";

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
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200
     ${
       isActive
         ? "bg-emerald-50 text-emerald-700 font-semibold" // Trạng thái Active: Nền xanh nhạt, chữ xanh đậm
         : "text-slate-600 hover:bg-slate-100 hover:text-slate-900" // Trạng thái thường
     }`;
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">A</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">AgriShrimp</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <Link href="/admin" className={linkClass("/admin")}>
          <LayoutDashboard size={20} />
          Tổng quan
        </Link>

        <p className="mt-8 mb-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Thương mại
        </p>

        <Link href="/admin/products" className={linkClass("/admin/products")}>
          <Package size={20} />
          Sản phẩm
        </Link>

        <Link href="/admin/variants" className={linkClass("/admin/variants")}>
          <Layers size={20} />
          Thuộc tính
        </Link>

        <Link href="/admin/categories" className={linkClass("/admin/categories")}>
          <Tags size={20} />
          Danh mục
        </Link>

        <Link href="/admin/employees" className={linkClass("/admin/employees")}>
          <UserCircle size={20} />
          Nhân viên
        </Link>

        <Link href="/admin/customers" className={linkClass("/admin/customers")}>
          <Users size={20} />
          Khách hàng
        </Link>

        <p className="mt-8 mb-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Hệ thống
        </p>

        <Link href="/admin/branches" className={linkClass("/admin/branches")}>
          <Building2 size={20} />
          Chi nhánh
        </Link>

        <Link href="/admin/financial" className={linkClass("/admin/financial")}>
          <FileBarChart size={20} />
          Tài chính
        </Link>

        <Link href="/admin/settings" className={linkClass("/admin/settings")}>
          <Settings size={20} />
          Cài đặt
        </Link>
      </nav>

      {/* Support Section */}
      <div className="p-4 border-t border-slate-100">
        <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
          <HelpCircle size={20} />
          Hỗ trợ
        </button>
      </div>
    </aside>
  );
}