"use client";

import React from "react";
import {
  DollarSign,
  FileText,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyBusinessResultsProps {
  branchId?: string;
}

export default function DailyBusinessResults({ branchId }: DailyBusinessResultsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-results", branchId],
    queryFn: () => dashboardService.getDailyResults(branchId),
  });

  const formatPercent = (percent?: number) => {
    if (percent === undefined) return "0%";
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const stats = [
    {
      label: "Doanh thu hôm nay",
      value: (data?.todayRevenue ?? 0).toLocaleString() + " đ",
      icon: DollarSign,
      iconBg: "bg-blue-600",
      color: "text-blue-600",
      change: formatPercent(data?.revenueChangePercent),
      isPositive: (data?.revenueChangePercent ?? 0) >= 0,
    },
    {
      label: "Lợi nhuận hôm nay",
      value: (data?.todayProfit ?? 0).toLocaleString() + " đ",
      icon: TrendingUp,
      iconBg: "bg-emerald-500",
      color: "text-emerald-500",
      change: formatPercent(data?.profitChangePercent),
      isPositive: (data?.profitChangePercent ?? 0) >= 0,
    },
    {
      label: "Đơn hàng mới",
      value: (data?.todayOrders ?? 0).toString(),
      icon: FileText,
      iconBg: "bg-orange-400",
      color: "text-orange-400",
      change: formatPercent(data?.orderChangePercent),
      isPositive: (data?.orderChangePercent ?? 0) >= 0,
    },
    {
      label: "Hoạt động",
      value: "Ổn định",
      icon: Activity,
      iconBg: "bg-purple-500",
      color: "text-purple-500",
      change: "Bình thường",
      isPositive: true,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          Kết quả kinh doanh trong ngày
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
        {isLoading
          ? [...Array(4)].map((_, index) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))
          : stats.map((stat, index) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <div className={`${stat.iconBg} p-2 rounded-full text-white`}>
                  <stat.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                    <span
                      className={`text-[10px] font-bold ${
                        stat.isPositive ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
