"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function OrderTabs() {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";

  const tabs = [
    { label: "Tất cả", value: "ALL" },
    { label: "Chờ thanh toán", value: "AWAITING_PAYMENT" },
    { label: "Chờ nhập thêm", value: "AWAITING_REPLENISHMENT" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Chờ lấy hàng", value: "READY_FOR_PICKUP" },
    { label: "Chờ giao hàng", value: "SHIPPING" },
    { label: "Đã giao", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
    { label: "Trả hàng", value: "RETURNED" },
  ];

  return (
    <div className="scrollbar-hide flex overflow-x-auto rounded-t-lg border-b border-gray-200 bg-white">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "ALL" ? "/orders/list" : `/orders/list?status=${tab.value}`}
          className={cn(
            "whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:text-[#2d9f8d]",
            currentStatus === tab.value && "border-[#2d9f8d] font-bold text-[#2d9f8d]",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
