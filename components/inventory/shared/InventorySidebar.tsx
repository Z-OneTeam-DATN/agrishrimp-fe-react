"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Box,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  BellRing,
  ClipboardCheck,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function InventorySidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const isActive = (path: string, tab?: string) => {
    if (tab) return pathname === path && currentTab === tab;
    return pathname === path && !currentTab;
  };

  return (
    <div className="w-[260px] bg-[#020617] text-slate-400 h-full flex flex-col border-r border-slate-800/40">
      {/* Brand Header */}
      <div className="h-[64px] px-7 flex items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-600 rounded-full" />
          <div className="flex flex-col">
            <h1 className="font-black text-white text-[18px] tracking-[0.15em] leading-none uppercase">
              AGRI<span className="text-blue-500">SHRIMP</span>
            </h1>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-1">
              Warehouse Pro
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 no-scrollbar">
        {/* Section: Hệ thống */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Hệ thống
          </p>
          <div className="space-y-0.5">
            <SidebarLink
              href="/inventory/dashboard"
              icon={LayoutDashboard}
              label="Bàn làm việc"
              active={isActive("/inventory/dashboard")}
              badge={12}
            />
            <SidebarLink
              href="/inventory/products"
              icon={Box}
              label="Danh mục VTHH"
              active={isActive("/inventory/products")}
            />
          </div>
        </section>

        {/* Section: Nhập hàng - TÁCH LÀM 2 TAG */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Nhập hàng
          </p>
          <div className="space-y-0.5">
            <SidebarLink
              href="/inventory/receipts/confirmation"
              icon={ClipboardCheck}
              label="Xác nhận nhập hàng"
              active={pathname.includes("/receipts/confirmation")}
              color="text-emerald-500"
              badge={1}
              badgeColor="bg-emerald-500/20 text-emerald-500"
            />
            <SidebarLink
              href="/inventory/receipts"
              label="Lịch sử nhập kho"
              icon={History}
              active={pathname === "/inventory/receipts"}
              color="text-slate-400"
            />
          </div>
        </section>

        {/* Section: Xuất hàng */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Xuất bán
          </p>
          <SidebarLink
            href="/inventory/exports"
            icon={ArrowUpRight}
            label="Phiếu xuất kho"
            active={pathname === "/inventory/exports"}
            color="text-blue-500"
          />
        </section>

        {/* Section: Phân tích */}
        <section>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">
            Báo cáo
          </p>
          <SidebarLink
            href="/inventory/reports"
            icon={BarChart3}
            label="Báo cáo phân tích"
            active={isActive("/inventory/reports")}
          />
        </section>
      </div>

      {/* Footer Settings */}
      <div className="p-4 mt-auto border-t border-slate-800/40 bg-[#020617]/50">
        <SidebarLink
          href="/inventory/settings"
          icon={Settings}
          label="Cài đặt hệ thống"
          active={isActive("/inventory/settings")}
        />
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
  color?: string;
  badgeColor?: string;
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  color,
  badgeColor,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-200 group relative",
        active
          ? "bg-slate-800/60 text-white shadow-sm"
          : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200",
      )}
    >
      {active && (
        <div className="absolute left-0 w-1 h-4 bg-blue-500 rounded-r-full" />
      )}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-1 rounded-md transition-colors",
            active ? "bg-slate-700" : "bg-transparent group-hover:bg-slate-800",
          )}
        >
          <Icon
            size={16}
            className={cn(
              active
                ? color || "text-blue-400"
                : "text-slate-500 group-hover:text-slate-400",
            )}
          />
        </div>
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <Badge
          className={cn(
            "border-none text-[10px] h-4.5 px-1.5 font-black",
            badgeColor ||
              (active
                ? "bg-white text-blue-600"
                : "bg-blue-500/10 text-blue-400"),
          )}
        >
          {badge}
        </Badge>
      )}
    </Link>
  );
}
