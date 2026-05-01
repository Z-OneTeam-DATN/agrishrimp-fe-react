"use client";

import React from "react";
import { Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  branchId?: string;
}

const statsConfig = [
  {
    label: "Tổng khách hàng",
    key: "customers",
    icon: Users,
    accent: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    label: "Sản phẩm kinh doanh",
    key: "products",
    icon: Package,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    label: "Tổng doanh thu",
    key: "revenue",
    icon: TrendingUp,
    accent: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    label: "Tổng đơn hàng",
    key: "orders",
    icon: ShoppingBag,
    accent: "bg-violet-50 text-violet-700 border-violet-100",
  },
];

export default function DashboardStats({ branchId }: DashboardStatsProps) {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats", branchId],
    queryFn: () => dashboardService.getStats(branchId),
  });

  const displayStats = [
    {
      ...statsConfig[0],
      value: stats?.totalCustomers?.toLocaleString() ?? "0",
    },
    {
      ...statsConfig[1],
      value: stats?.totalProducts?.toLocaleString() ?? "0",
    },
    {
      ...statsConfig[2],
      value: `${(stats?.totalRevenue ?? 0).toLocaleString()} đ`,
    },
    {
      ...statsConfig[3],
      value: stats?.totalOrders?.toLocaleString() ?? "0",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-6 h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-36" />
            <Skeleton className="mt-2 h-3 w-32" />
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
            className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500">
              Lỗi dữ liệu
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Không thể tải chỉ số tổng hợp ở thời điểm này.
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
          className="flex min-h-[168px] flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl border",
                stat.accent,
              )}
            >
              <stat.icon size={18} />
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Tổng hợp
            </span>
          </div>
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {stat.label}
          </p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {stat.value}
          </h3>
        </div>
      ))}
    </div>
  );
}
