"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSearch,
  CreditCard,
  Package,
  Truck,
  Share2,
  Ban,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/app/services/dashboard.service";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface PendingOrdersProps {
  branchId?: string;
}

export default function PendingOrders({ branchId }: PendingOrdersProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["pending-orders-summary", branchId],
    queryFn: () => dashboardService.getPendingOrdersSummary(branchId),
  });

  const items = [
    { 
      label: "Chờ duyệt", 
      count: data?.pendingApproval ?? 0, 
      icon: FileSearch, 
      color: "text-blue-500",
      href: "/admin/orders?status=PENDING" 
    },
    {
      label: "Chờ thanh toán",
      count: data?.pendingPayment ?? 0,
      icon: CreditCard,
      color: "text-amber-500",
      href: "/admin/orders?status=AWAITING_PAYMENT"
    },
    { 
      label: "Chờ đóng gói", 
      count: data?.pendingPacking ?? 0, 
      icon: Package, 
      color: "text-indigo-500",
      href: "/admin/orders?status=PROCESSING" 
    },
    { 
      label: "Chờ lấy hàng", 
      count: data?.pendingPickup ?? 0, 
      icon: Truck, 
      color: "text-emerald-500",
      href: "/admin/orders?status=READY_FOR_PICKUP" 
    },
    { 
      label: "Đang giao hàng", 
      count: data?.shipping ?? 0, 
      icon: Share2, 
      color: "text-cyan-500",
      href: "/admin/orders?status=SHIPPING" 
    },
    {
      label: "Hủy giao - Chờ nhận",
      count: data?.cancelPending ?? 0,
      icon: Ban,
      color: "text-red-500",
      href: "/admin/orders?status=CANCELLED"
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          Đơn hàng chờ xử lý
        </h2>
        <div className="w-32">
          <Select defaultValue="7days">
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="7 ngày qua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-gray-100">
        {isLoading
          ? [...Array(6)].map((_, index) => (
              <div key={index} className="p-6 flex flex-col items-center justify-center gap-2">
                <Skeleton className="w-10 h-10 rounded-md" />
                <div className="space-y-1 text-center">
                  <Skeleton className="h-2 w-16" />
                  <Skeleton className="h-6 w-8 mx-auto" />
                </div>
              </div>
            ))
          : items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="p-6 flex flex-col items-center justify-center gap-2 hover:bg-blue-50/50 transition-colors cursor-pointer group"
              >
                <div
                  className={`p-2 rounded-md bg-gray-50 group-hover:bg-white group-hover:shadow-sm transition-all`}
                >
                  <item.icon size={20} className={item.color} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-gray-800">{item.count}</p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
