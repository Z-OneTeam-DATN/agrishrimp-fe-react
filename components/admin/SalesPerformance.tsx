"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import {
  CategoryDistribution,
  SalesPerformanceData,
} from "@/app/types/dashboard.type";
import { formatDate } from "@/lib/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface SalesPerformanceProps {
  branchId?: string;
}

export default function SalesPerformance({ branchId }: SalesPerformanceProps) {
  const [activeTab, setActiveTab] = useState("revenue");
  const [days, setDays] = useState("7days");
  const [isClient, setIsClient] = useState(false);
  const { user, isLoadingAuth } = useAuthStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: performanceResponse,
    isLoading: isPerfLoading,
    isError: isPerfError,
  } = useQuery({
    queryKey: ["sales-performance", branchId, days],
    queryFn: () => dashboardService.getSalesPerformance(branchId),
    enabled: isClient && !!user && !isLoadingAuth && activeTab === "revenue",
  });

  const {
    data: distributionResponse,
    isLoading: isDistLoading,
    isError: isDistError,
  } = useQuery({
    queryKey: ["category-distribution", branchId],
    queryFn: () => dashboardService.getCategoryDistribution(branchId),
    enabled: isClient && !!user && !isLoadingAuth && activeTab === "proportion",
  });

  // Cấu hình Chart Doanh thu
  const chartData = useMemo(() => {
    const raw: SalesPerformanceData[] = performanceResponse?.data ?? [];
    return {
      labels: raw.map((item) => formatDate(item.date, "dd/MM")),
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: raw.map((item) => Number(item.revenue) || 0),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          hoverBackgroundColor: "#2563eb",
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: "Lợi nhuận (VNĐ)",
          data: raw.map((item) => Number(item.profit) || 0),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          hoverBackgroundColor: "#059669",
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
      rawData: raw,
    };
  }, [performanceResponse]);

  // Cấu hình Chart Tỷ trọng (Doughnut)
  const doughnutData = useMemo(() => {
    const raw: CategoryDistribution[] = distributionResponse ?? [];
    return {
      labels: raw.map((item) => item.categoryName || "Khác"),
      datasets: [
        {
          data: raw.map((item) => Number(item.percentage) || 0),
          backgroundColor: [
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#ec4899",
            "#06b6d4",
          ],
          borderWidth: 4,
          borderColor: "#fff",
          hoverOffset: 15,
        },
      ],
    };
  }, [distributionResponse]);

  if (!isClient)
    return (
      <div>
        <Skeleton className="h-[420px] w-full rounded-[4px]" />
      </div>
    );

  return (
    <div className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
      {/* Header chuyên nghiệp */}
      <div className="flex flex-col items-start justify-between border-b border-slate-100 bg-white px-4 py-3 md:flex-row md:items-center">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`inline-flex h-9 items-center rounded-[4px] border px-3 text-[12px] font-semibold transition-all ${
              activeTab === "revenue"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            Hiệu suất doanh số
          </button>
          <button
            onClick={() => setActiveTab("proportion")}
            className={`inline-flex h-9 items-center rounded-[4px] border px-3 text-[12px] font-semibold transition-all ${
              activeTab === "proportion"
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
            }`}
          >
            Tỷ trọng nhóm hàng
          </button>
        </div>

        <div className="flex items-center gap-2 px-1 pt-3 md:px-0 md:pt-0">
          <span className="hidden text-[10.5px] font-semibold text-slate-500 sm:inline">
            Thời gian
          </span>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-9 w-36 rounded-[4px] border-slate-200 bg-white text-[12px] font-medium shadow-none focus:ring-blue-500">
              <SelectValue placeholder="7 ngày qua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ngày gần nhất</SelectItem>
              <SelectItem value="30days">30 ngày gần nhất</SelectItem>
              <SelectItem value="90days">Quý này</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nội dung Biểu đồ */}
      <div className="p-4">
        {isPerfLoading || isDistLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[320px] w-full rounded-[4px]" />
          </div>
        ) : isPerfError || isDistError ? (
          <div className="flex h-[320px] flex-col items-center justify-center rounded-[4px] border border-rose-100 border-dashed bg-rose-50/20 text-rose-500">
            <AlertCircle size={32} className="mb-3 opacity-50" />
            <p className="text-[12.5px] font-semibold">
              Không thể kết nối máy chủ dữ liệu
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 h-9 rounded-[4px] border border-rose-200 bg-white px-4 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              Thử lại
            </button>
          </div>
        ) : activeTab === "revenue" ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="relative h-[320px] w-full">
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: "index" as const, intersect: false },
                  plugins: {
                    legend: {
                      display: true,
                      position: "top" as const,
                      align: "end" as const,
                      labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 20,
                        font: { size: 11, weight: "bold" },
                        color: "#64748b",
                      },
                    },
                    tooltip: {
                      backgroundColor: "#1e293b",
                      padding: 12,
                      titleFont: { size: 13, weight: "bold" },
                      bodyFont: { size: 12 },
                      cornerRadius: 4,
                      callbacks: {
                        label: (ctx) => {
                          const value = ctx.parsed.y ?? 0;
                          return ` ${ctx.dataset.label?.split(" ")[0]}: ${value.toLocaleString()} đ`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      border: { display: false },
                      grid: { color: "#f1f5f9" },
                      ticks: {
                        font: { size: 10, weight: 500 },
                        color: "#94a3b8",
                        padding: 10,
                        callback: (val) =>
                          Number(val) >= 1000000
                            ? `${(Number(val) / 1000000).toFixed(1)}M`
                            : Number(val) >= 1000
                              ? `${(Number(val) / 1000).toFixed(0)}K`
                              : val,
                      },
                    },
                    x: {
                      border: { display: false },
                      grid: { display: false },
                      ticks: {
                        font: { size: 10, weight: 500 },
                        color: "#94a3b8",
                        padding: 10,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 md:flex-row">
            <div className="relative flex h-[350px] w-full justify-center md:w-1/2">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "65%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      padding: 12,
                      callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%`,
                      },
                    },
                  },
                }}
              />
            </div>

            <div className="flex-1 space-y-3 w-full">
              <p className="mb-4 text-[12px] font-semibold text-slate-900">
                Chi tiết tỷ trọng doanh thu
              </p>
              {doughnutData.labels.map((label: string, i: number) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 rounded-sm hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-[4px]"
                      style={{
                        backgroundColor:
                          doughnutData.datasets[0].backgroundColor[i],
                      }}
                    ></div>
                    <span className="text-[12px] font-medium text-slate-600">
                      {label}
                    </span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-800">
                    {doughnutData.datasets[0].data[i]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

