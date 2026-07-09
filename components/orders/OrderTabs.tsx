"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { normalizeUserOrderFilter, USER_ORDER_TABS } from "./order-status-utils";

export function OrderTabs() {
  const searchParams = useSearchParams();
  const currentStatus = normalizeUserOrderFilter(searchParams.get("status"));

  return (
    <div className="overflow-x-auto border-b border-gray-200 bg-white">
      <div className="scrollbar-hide flex min-w-max sm:grid sm:min-w-0 sm:grid-cols-7">
        {USER_ORDER_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "ALL" ? "/orders/list" : `/orders/list?status=${tab.value}`}
            className={cn(
              "flex items-center justify-center whitespace-nowrap border-b-[3px] border-transparent px-6 py-5 text-center text-base font-medium text-gray-700 transition-colors hover:text-[#1965a2]",
              currentStatus === tab.value && "border-[#1965a2] font-semibold text-[#1965a2]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

