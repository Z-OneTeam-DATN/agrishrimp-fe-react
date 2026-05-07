"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  CreditCard,
  FileSearch,
  Package,
  Share2,
  Truck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { orderService } from "@/app/services/order.service";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/useAuthStore";
import { isAdminRole } from "@/lib/roles";
import { getOrderListPath } from "@/lib/order-routing";
import { cn } from "@/lib/utils";

interface PendingOrdersProps {
  branchId?: string;
}

export default function PendingOrders({ branchId }: PendingOrdersProps) {
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);

  const { data, isLoading } = useQuery({
    queryKey: ["pending-orders-summary", branchId],
    queryFn: () => dashboardService.getPendingOrdersSummary(branchId),
  });

  const { data: backorders, isLoading: isBackordersLoading } = useQuery({
    queryKey: ["backorder-report", isAdmin],
    queryFn: () => orderService.getBackorderReport(),
    enabled: isAdmin,
    refetchInterval: 60000,
  });

  const backorderCount =
    backorders?.reduce(
      (
        sum: number,
        item: {
          totalMissingQuantity?: number;
        },
      ) => sum + (item.totalMissingQuantity || 0),
      0,
    ) ?? 0;

  const items = [
    {
      label: "Thiếu hàng",
      count: backorderCount,
      icon: AlertTriangle,
      href: getOrderListPath(user, "AWAITING_REPLENISHMENT"),
      accent: "bg-rose-50 text-rose-700 border-rose-100",
    },
    {
      label: "Chờ duyệt",
      count: data?.pendingApproval ?? 0,
      icon: FileSearch,
      href: getOrderListPath(user, "PENDING"),
      accent: "bg-sky-50 text-sky-700 border-sky-100",
    },
    {
      label: "Chờ thanh toán",
      count: data?.pendingPayment ?? 0,
      icon: CreditCard,
      href: getOrderListPath(user, "AWAITING_PAYMENT"),
      accent: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      label: "Chờ đóng gói",
      count: data?.pendingPacking ?? 0,
      icon: Package,
      href: getOrderListPath(user, "PROCESSING"),
      accent: "bg-violet-50 text-violet-700 border-violet-100",
    },
    {
      label: "Chờ lấy hàng",
      count: data?.pendingPickup ?? 0,
      icon: Truck,
      href: getOrderListPath(user, "READY_FOR_PICKUP"),
      accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "Đang giao",
      count: data?.shipping ?? 0,
      icon: Share2,
      href: getOrderListPath(user, "SHIPPING"),
      accent: "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    {
      label: "Hủy giao chờ nhận",
      count: data?.cancelPending ?? 0,
      icon: Ban,
      href: getOrderListPath(user, "CANCELLED"),
      accent: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Luồng xử lý đơn hàng
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            Điểm nghẽn cần xử lý trước
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          Theo trạng thái
        </span>
      </div>

      {isAdmin && !isBackordersLoading && backorderCount > 0 && (
        <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white p-2 text-rose-600 shadow-sm">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-700">
                  Thiếu {backorderCount} sản phẩm ở {backorders?.length ?? 0}{" "}
                  dòng hàng.
                </p>
              </div>
            </div>
            <Link
              href={getOrderListPath(user, "AWAITING_REPLENISHMENT")}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-white px-3.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Xem đơn thiếu hàng
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? [...Array(7)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5"
              >
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="mt-3 h-4 w-28" />
                <Skeleton className="mt-2.5 h-7 w-16" />
              </div>
            ))
          : items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex min-h-[122px] flex-col rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-slate-300 hover:bg-white"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border",
                    item.accent,
                  )}
                >
                  <item.icon size={16} />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {item.label}
                </p>
                <p className="mt-1 text-[24px] font-semibold tracking-tight text-slate-900">
                  {item.count}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
