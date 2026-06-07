"use client";

import React from "react";
import { Package, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  branchId?: string;
}

const statsConfig = [
  {
    label: "Tổng khách hàng",
    key: "customers",
    icon: Users,
  },
  {
    label: "Sản phẩm kinh doanh",
    key: "products",
    icon: Package,
  },
  {
    label: "Tổng doanh thu",
    key: "revenue",
    icon: TrendingUp,
  },
  {
    label: "Tổng đơn hàng",
    key: "orders",
    icon: ShoppingBag,
  },
];

export default function DashboardStats({ branchId }: DashboardStatsProps) {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-[4px]" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-5 h-4 w-28" />
            <Skeleton className="mt-2.5 h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[10.5px] font-semibold text-red-500">
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {displayStats.map((stat) => (
        <div
          key={stat.label}
          className="flex min-h-[104px] flex-col rounded-[4px] border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <div className="flex items-center justify-between gap-3">
            <stat.icon size={16} className="text-slate-400" />
          </div>
          <p className="mt-4 text-[10.5px] font-semibold text-slate-500">
            {stat.label}
          </p>
          <h3 className="mt-1.5 text-[22px] font-semibold text-slate-900">
            {stat.value}
          </h3>
        </div>
      ))}
    </div>
  );
}
