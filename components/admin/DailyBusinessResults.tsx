"use client";

import React from "react";
import { Activity, DollarSign, FileText, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyBusinessResultsProps {
  branchId?: string;
}

export default function DailyBusinessResults({
  branchId,
}: DailyBusinessResultsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-results", branchId],
    queryFn: () => dashboardService.getDailyResults(branchId),
  });

  const formatPercent = (percent?: number) => {
    if (percent === undefined) {
      return "0%";
    }
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const stats = [
    {
      label: "Doanh thu hôm nay",
      value: `${(data?.todayRevenue ?? 0).toLocaleString()} đ`,
      icon: DollarSign,
      change: formatPercent(data?.revenueChangePercent),
      isPositive: (data?.revenueChangePercent ?? 0) >= 0,
    },
    {
      label: "Lợi nhuận hôm nay",
      value: `${(data?.todayProfit ?? 0).toLocaleString()} đ`,
      icon: TrendingUp,
      change: formatPercent(data?.profitChangePercent),
      isPositive: (data?.profitChangePercent ?? 0) >= 0,
    },
    {
      label: "Đơn hàng mới",
      value: (data?.todayOrders ?? 0).toString(),
      icon: FileText,
      change: formatPercent(data?.orderChangePercent),
      isPositive: (data?.orderChangePercent ?? 0) >= 0,
    },
    {
      label: "Nhịp vận hành",
      value: "Ổn định",
      icon: Activity,
      change: "Theo dõi tốt",
      isPositive: true,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-[12px] font-semibold text-slate-900">
            Chỉ số vận hành hôm nay
          </h2>
        </div>
        <span className="text-[10.5px] font-medium text-slate-400">
          Cập nhật liên tục
        </span>
      </div>

      <div className="grid gap-px bg-slate-100 lg:grid-cols-4">
        {isLoading
          ? [...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-9 rounded-[4px]" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="mt-5 h-4 w-28" />
                <Skeleton className="mt-2.5 h-7 w-32" />
              </div>
            ))
          : stats.map((stat) => (
              <div key={stat.label} className="bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-slate-200 bg-slate-50 text-slate-500">
                    <stat.icon size={16} />
                  </div>
                  <span
                    className={
                      stat.isPositive
                        ? "text-[10.5px] font-medium text-emerald-600"
                        : "text-[10.5px] font-medium text-rose-600"
                    }
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="mt-4 text-[10.5px] font-semibold text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-[22px] font-semibold text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}
