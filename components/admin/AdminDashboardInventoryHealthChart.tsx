"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

import { MissingItemReport } from "@/app/types/order.types";
import { DonutChart } from "@/components/admin/DonutChart";
import { numberText, toFiniteNumber } from "@/components/admin/dashboard-viz";

interface AdminDashboardInventoryHealthChartProps {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  backorderCount: number;

  backorderItems?: MissingItemReport[];

  branchId?: string;
}

const STATUS_COLORS = {
  stable: "#0ca30c",
  low: "#fab219",
  out: "#d03b3b",
  backorder: "#ec835a",
} as const;

const MAX_BACKORDER_ITEMS_SHOWN = 6;

export default function AdminDashboardInventoryHealthChart({
  totalItems,
  lowStockCount,
  outOfStockCount,
  backorderCount,
  backorderItems = [],
  branchId,
}: AdminDashboardInventoryHealthChartProps) {
  const [showBackorderDetail, setShowBackorderDetail] = useState(false);

  const safeTotalItems = Math.max(0, toFiniteNumber(totalItems));
  const safeLowStock = Math.max(0, toFiniteNumber(lowStockCount));
  const safeOutOfStock = Math.max(0, toFiniteNumber(outOfStockCount));
  const safeBackorder = Math.max(0, toFiniteNumber(backorderCount));
  const stableCount = Math.max(0, safeTotalItems - safeLowStock - safeOutOfStock);

  const belowMinHref = `/admin/reports/inventory/below-min${branchId ? `?branchId=${branchId}` : ""}`;

  const donutRows = [
    { key: "stable", label: "Còn hàng ổn định", value: stableCount, color: STATUS_COLORS.stable },
    { key: "low", label: "Sắp hết hàng", value: safeLowStock, color: STATUS_COLORS.low },
    { key: "out", label: "Hết hàng", value: safeOutOfStock, color: STATUS_COLORS.out },
  ].filter((row) => row.value > 0);

  const rows = [
    { key: "stable", label: "Còn hàng ổn định", value: stableCount, percent: safeTotalItems > 0 ? (stableCount / safeTotalItems) * 100 : 0, color: STATUS_COLORS.stable, href: "/admin/products" },
    { key: "low", label: "Sắp hết hàng", value: safeLowStock, percent: safeTotalItems > 0 ? (safeLowStock / safeTotalItems) * 100 : 0, color: STATUS_COLORS.low, href: belowMinHref },
    { key: "out", label: "Hết hàng", value: safeOutOfStock, percent: safeTotalItems > 0 ? (safeOutOfStock / safeTotalItems) * 100 : 0, color: STATUS_COLORS.out, href: belowMinHref },
    { key: "backorder", label: "Thiếu hàng trong đơn", value: safeBackorder, percent: safeBackorder > 0 ? 100 : 0, color: STATUS_COLORS.backorder, href: undefined },
  ];

  const shouldRenderDonut = safeTotalItems > 0 && donutRows.length > 0;

  return (
    <div className="grid gap-4 sm:grid-cols-[130px_minmax(0,1fr)] xl:grid-cols-1">
      {shouldRenderDonut && (
        <DonutChart
          size={140}
          thickness={20}
          centerLabel={numberText(safeTotalItems)}
          centerSub="mặt hàng"
          segments={donutRows.map((row) => ({
            key: row.key,
            value: row.value,
            color: row.color,
            label: `${row.label}: ${numberText(row.value)}`,
          }))}
        />
      )}
      <div className="grid gap-3">
        {rows.map((row) => {

          const isLinkable = !!row.href && row.value > 0;
          const isExpandableBackorder =
            row.key === "backorder" && safeBackorder > 0 && backorderItems.length > 0;
          const isInteractive = isLinkable || isExpandableBackorder;

          const content = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: row.color }}
                  />
                  <span
                    className={`truncate text-[12px] text-slate-600 ${
                      isInteractive ? "underline decoration-dotted underline-offset-2" : ""
                    }`}
                  >
                    {row.label}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-slate-900">
                  {numberText(row.value)}
                  {isExpandableBackorder &&
                    (showBackorderDetail ? (
                      <ChevronUp size={13} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={13} className="text-slate-400" />
                    ))}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, row.percent))}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </>
          );

          if (isLinkable) {
            return (
              <Link
                key={row.key}
                href={row.href as string}
                className="-mx-1.5 rounded-[4px] px-1.5 py-0.5 transition hover:bg-slate-50"
                title={`Xem danh sách mặt hàng ${row.label.toLowerCase()}`}
              >
                {content}
              </Link>
            );
          }

          if (isExpandableBackorder) {
            return (
              <div key={row.key}>
                <button
                  type="button"
                  onClick={() => setShowBackorderDetail((value) => !value)}
                  className="-mx-1.5 w-[calc(100%+12px)] rounded-[4px] px-1.5 py-0.5 text-left transition hover:bg-slate-50"
                >
                  {content}
                </button>
                {showBackorderDetail && (
                  <ul className="mt-2 space-y-1.5 rounded-[4px] border border-slate-100 bg-slate-50 p-2.5">
                    {backorderItems.slice(0, MAX_BACKORDER_ITEMS_SHOWN).map((item) => (
                      <li
                        key={item.productVariantId}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="min-w-0 truncate text-slate-600">
                          {item.productName}
                          {item.variantName ? ` - ${item.variantName}` : ""}
                        </span>
                        <span className="shrink-0 font-semibold text-amber-700">
                          -{numberText(item.totalMissingQuantity)}
                        </span>
                      </li>
                    ))}
                    {backorderItems.length > MAX_BACKORDER_ITEMS_SHOWN && (
                      <li className="pt-0.5 text-[10.5px] text-slate-400">
                        +{numberText(backorderItems.length - MAX_BACKORDER_ITEMS_SHOWN)} mặt hàng khác
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          }

          return <div key={row.key}>{content}</div>;
        })}
      </div>
    </div>
  );
}

