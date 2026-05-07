"use client";

import React from "react";
import {
  ChevronRight,
  AlertCircle,
  Package,
  AlertTriangle,
  Boxes,
  Wallet,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface InventoryInfoProps {
  branchId?: string;
}

export default function InventoryInfo({ branchId }: InventoryInfoProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory-info", branchId],
    queryFn: () => dashboardService.getInventoryInfo(branchId),
  });

  // Format tiền tệ VNĐ
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const inventoryStats = [
    {
      label: "Tổng số mặt hàng",
      value: (data?.totalItems ?? 0).toLocaleString(),
      subtext: "Sản phẩm duy nhất",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/products",
    },
    {
      label: "Hết hàng",
      value: (data?.outOfStockCount ?? 0).toLocaleString(),
      subtext: "Cần nhập hàng ngay",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      alert: (data?.outOfStockCount ?? 0) > 0,
      href: "/admin/products?stock=out",
    },
    {
      label: "Sắp hết hàng",
      value: (data?.lowStockCount ?? 0).toLocaleString(),
      subtext: "Tồn kho dưới 10",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      alert: (data?.lowStockCount ?? 0) > 0,
      href: "/admin/products?stock=low",
    },
    {
      label: "Tổng giá trị kho",
      value: formatCurrency(data?.totalInventoryValue ?? 0),
      subtext: "Giá vốn hiện tại",
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/admin/inventory-dashboard",
    },
  ];

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <AlertCircle className="text-red-500 mb-2" size={32} />
        <p className="text-sm font-bold text-gray-700">Lỗi tải thông tin kho</p>
        <p className="text-xs text-gray-500 mt-1">
          Không thể kết nối với dữ liệu kho hàng
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Boxes size={15} className="text-slate-500" />
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-700">
            Thông tin kho hàng
          </h2>
        </div>
        <Link
          href="/admin/inventory-dashboard"
          className="text-[11px] font-semibold text-blue-600 hover:underline"
        >
          Chi tiết kho
        </Link>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-slate-100">
        {isLoading
          ? [...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))
          : inventoryStats.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group flex items-center justify-between p-4 transition-all hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "rounded-lg p-2 transition-transform group-hover:scale-105",
                      item.bgColor,
                      item.color,
                    )}
                  >
                    <item.icon size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {item.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-base font-semibold tracking-tight",
                          item.color,
                        )}
                      >
                        {item.value}
                      </p>
                      {item.alert && (
                        <span
                          className={cn(
                            "animate-pulse h-2 w-2 rounded-full",
                            item.color.replace("text", "bg"),
                          )}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{item.subtext}</p>
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500"
                />
              </Link>
            ))}
      </div>
    </div>
  );
}
