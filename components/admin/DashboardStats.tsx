"use client";

import React from "react";
import {
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { cn } from "@/lib/utils";
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
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Sản phẩm kinh doanh",
      value: stats?.totalProducts?.toLocaleString() ?? "0",
      icon: Package,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Tổng doanh thu",
      value: (stats?.totalRevenue ?? 0).toLocaleString() + " đ",
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Tổng đơn hàng",
      value: stats?.totalOrders?.toLocaleString() ?? "0",
      icon: ShoppingBag,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="w-10 h-10 rounded-[4px]" />
            </div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-4 border border-red-100 rounded-[4px] bg-red-50/10"
          >
            <p className="text-[10px] text-red-400 font-bold uppercase">Lỗi dữ liệu</p>
            <p className="text-xs text-gray-400 mt-1">Không thể tải thông số</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {displayStats.map((stat, i) => (
        <div
          key={i}
          className="bg-white p-4 border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={cn(
                "w-10 h-10 rounded-[4px] flex items-center justify-center border",
                stat.bg.replace("bg-", "border-"),
              )}
            >
              <stat.icon size={20} className={stat.color} />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {stat.label}
          </p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            {stat.value}
          </h3>
        </div>
      ))}
    </div>
  );
}
