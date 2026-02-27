"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function OrderTabs() {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";

  const tabs = [
    { label: "Tất cả", value: "ALL" },
    { label: "Chờ xác nhận", value: "PENDING" },
    { label: "Đã xác nhận", value: "CONFIRMED" },
    { label: "Đang xử lý", value: "PROCESSING" },
    { label: "Đang giao", value: "SHIPPING" },
    { label: "Đã giao", value: "COMPLETED" },
    { label: "Đã hủy", value: "CANCELLED" },
    { label: "Trả hàng", value: "RETURNED" },
  ];

  return (
    <div className="bg-white rounded-t-lg p-0 flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          // If value is ALL, remove param, else set it
          href={
            tab.value === "ALL"
              ? "/orders/list"
              : `/orders/list?status=${tab.value}`
          }
          className={cn(
            "px-4 py-3 whitespace-nowrap font-medium text-gray-600 text-sm border-b-2 border-transparent transition-colors hover:text-[#2d9f8d]",
            currentStatus === tab.value &&
              "text-[#2d9f8d] border-[#2d9f8d] font-bold",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
