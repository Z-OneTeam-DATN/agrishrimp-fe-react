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
import { usePermissions } from "@/hooks/usePermissions";
import { canUseBranchOrderRoutes, getOrderListPath } from "@/lib/order-routing";
import { P } from "@/lib/permissions";

interface PendingOrdersProps {
  branchId?: string;
}

export default function PendingOrders({ branchId }: PendingOrdersProps) {
  const { user, isLoadingAuth, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canViewSystemOrders = hasPermission(P.ORDER_VIEW);
  const canUseBranchOrders = canUseBranchOrderRoutes(user, warehouseId);
  const getOrderHref = (status?: string | null) =>
    getOrderListPath({
      canViewSystemOrders,
      canUseBranchOrders,
      status,
    });
  const canViewSystemBackorders = canViewSystemOrders;

  const { data, isLoading } = useQuery({
    queryKey: ["pending-orders-summary", branchId],
    queryFn: () => dashboardService.getPendingOrdersSummary(branchId),
    enabled: !!user && !isLoadingAuth,
  });

  const { data: backorders, isLoading: isBackordersLoading } = useQuery({
    queryKey: ["backorder-report", canViewSystemBackorders],
    queryFn: () => orderService.getBackorderReport(),
    enabled: !!user && !isLoadingAuth && canViewSystemBackorders,
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
      label: "Thiáº¿u hĂ ng",
      count: backorderCount,
      icon: AlertTriangle,
      href: getOrderHref("AWAITING_REPLENISHMENT"),
    },
    {
      label: "Chá» duyá»‡t",
      count: data?.pendingApproval ?? 0,
      icon: FileSearch,
      href: getOrderHref("PENDING"),
    },
    ...(canViewSystemOrders
      ? [
          {
            label: "Chá» thanh toĂ¡n",
            count: data?.pendingPayment ?? 0,
            icon: CreditCard,
            href: getOrderHref("AWAITING_PAYMENT"),
          },
        ]
      : []),
    {
      label: "Chá» Ä‘Ă³ng gĂ³i",
      count: data?.pendingPacking ?? 0,
      icon: Package,
      href: getOrderHref("PROCESSING"),
    },
    {
      label: "Chá» bĂ n giao",
      count: data?.pendingPickup ?? 0,
      icon: Truck,
      href: getOrderHref("READY_FOR_PICKUP"),
    },
    {
      label: "Äang giao",
      count: data?.shipping ?? 0,
      icon: Share2,
      href: getOrderHref("SHIPPING"),
    },
    {
      label: "Há»§y giao chá» nháº­n",
      count: data?.cancelPending ?? 0,
      icon: Ban,
      href: getOrderHref("CANCELLED"),
    },
  ];

  return (
    <section className="overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-[12px] font-semibold text-slate-900">
            Äiá»ƒm ngháº½n cáº§n xá»­ lĂ½ trÆ°á»›c
          </h2>
        </div>
        <span className="text-[10.5px] font-medium text-slate-400">
          Theo tráº¡ng thĂ¡i
        </span>
      </div>

      {canViewSystemBackorders && !isBackordersLoading && backorderCount > 0 && (
        <div className="mx-4 mt-4 rounded-[4px] border border-rose-200 bg-rose-50 px-3.5 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-[4px] bg-white p-2 text-rose-600 shadow-sm">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-rose-700">
                  Thiáº¿u {backorderCount} sáº£n pháº©m á»Ÿ {backorders?.length ?? 0}{" "}
                  dĂ²ng hĂ ng.
                </p>
              </div>
            </div>
            <Link
              href={getOrderHref("AWAITING_REPLENISHMENT")}
              className="inline-flex h-9 items-center justify-center rounded-[4px] border border-rose-200 bg-white px-3.5 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Xem Ä‘Æ¡n thiáº¿u hĂ ng
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? [...Array(7)].map((_, index) => (
              <div
                key={index}
                className="rounded-[4px] border border-slate-100 bg-slate-50 p-3.5"
              >
                <Skeleton className="h-9 w-9 rounded-[4px]" />
                <Skeleton className="mt-3 h-4 w-28" />
                <Skeleton className="mt-2.5 h-7 w-16" />
              </div>
            ))
          : items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex min-h-[104px] flex-col rounded-[4px] border border-slate-200 bg-slate-50 p-3.5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-slate-200 bg-white text-slate-500">
                  <item.icon size={16} />
                </div>
                <p className="mt-3 text-[10.5px] font-semibold text-slate-500">
                  {item.label}
                </p>
                <p className="mt-1 text-[22px] font-semibold text-slate-900">
                  {item.count}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
