"use client";

import React from "react";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  branchId?: string;
}

export default function DashboardStats({ branchId }: DashboardStatsProps) {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats", branchId],
    queryFn: () => dashboardService.getStats(branchId),
  });

  const displayStats = [
    {
      label: "Tổng khách hàng",
      value: stats?.totalCustomers?.toLocaleString() ?? "0",
      icon: Users,
      accent: "from-sky-500/15 to-sky-500/5 text-sky-700 border-sky-100",
      helper: "Tệp khách hàng đang được phục vụ",
    },
    {
      label: "Sản phẩm kinh doanh",
      value: stats?.totalProducts?.toLocaleString() ?? "0",
      icon: Package,
      accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-700 border-emerald-100",
      helper: "Danh mục hàng hóa đang hoạt động",
    },
    {
      label: "Tổng doanh thu",
      value: `${(stats?.totalRevenue ?? 0).toLocaleString()} đ`,
      icon: TrendingUp,
      accent: "from-amber-500/15 to-amber-500/5 text-amber-700 border-amber-100",
      helper: "Doanh thu lũy kế trong phạm vi đang xem",
    },
    {
      label: "Tổng đơn hàng",
      value: stats?.totalOrders?.toLocaleString() ?? "0",
      icon: ShoppingBag,
      accent: "from-violet-500/15 to-violet-500/5 text-violet-700 border-violet-100",
      helper: "Khối lượng giao dịch đã ghi nhận",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-[26px] border border-white/80 bg-white/85 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="mt-8 h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-36" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-[26px] border border-rose-100 bg-white/85 p-5 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-500">
              Lỗi dữ liệu
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Không thể tải thông số tổng quan ở thời điểm này.
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {displayStats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[26px] border border-white/90 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(15,23,42,0.09)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${stat.accent}`}
            >
              <stat.icon size={20} />
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Tổng hợp
            </span>
          </div>
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
            {stat.label}
          </p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {stat.value}
          </h3>
          <p className="mt-2 text-sm text-slate-500">{stat.helper}</p>
        </div>
      ))}
    </div>
  );
}
