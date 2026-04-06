"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { normalizeUserOrderFilter, USER_ORDER_TABS } from "./order-status-utils";

export function OrderTabs() {
  const searchParams = useSearchParams();
  const currentStatus = normalizeUserOrderFilter(searchParams.get("status"));

  return (
    <div className="scrollbar-hide flex overflow-x-auto rounded-t-lg border-b border-gray-200 bg-white">
      {USER_ORDER_TABS.map((tab) => (
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
