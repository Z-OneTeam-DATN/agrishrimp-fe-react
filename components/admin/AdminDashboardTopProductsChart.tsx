"use client";

import { useState } from "react";

import { TopProduct } from "@/app/types/dashboard.type";
import { DonutChart } from "@/components/admin/DonutChart";
import { EmptyState, ViewToggle } from "@/components/admin/DashboardPanel";
import {
  VIZ_CATEGORICAL,
  compactCurrency,
  currency,
  decimalText,
  numberText,
  toFiniteNumber,
} from "@/components/admin/dashboard-viz";

interface AdminDashboardTopProductsChartProps {
  topProducts: TopProduct[];
}

const MAX_SLICES = 5;

export default function AdminDashboardTopProductsChart({
  topProducts,
}: AdminDashboardTopProductsChartProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const rows = topProducts.slice(0, MAX_SLICES).map((product) => ({
    productId: product.productId,
    productName: product.productName || "Không xác định",
    quantitySold: Math.max(0, toFiniteNumber(product.quantitySold)),
    revenue: Math.max(0, toFiniteNumber(product.revenue)),
  }));

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  // Donut chỉ đọc được khi có tiền để so tỷ trọng — nếu doanh thu top 5 đều bằng 0 (chỉ có số
  // lượng bán), phần tròn không mang nghĩa gì nên rơi về bảng danh sách thay vì vẽ 1 vòng trơ.
  const chartRows = rows
    .filter((row) => row.revenue > 0)
    .map((row) => ({ ...row, percentage: (row.revenue / totalRevenue) * 100 }));
  const shouldRenderChart = topProducts.length > 0 && chartRows.length > 0;

  if (topProducts.length === 0) {
    return (
      <EmptyState
        text="Chưa có dữ liệu sản phẩm bán chạy."
        hint="Khi có đơn hoàn tất hoặc đang giao, top sản phẩm sẽ hiển thị tại đây."
      />
    );
  }

  return (
    <div className="space-y-3">
      {shouldRenderChart && (
        <div className="flex justify-end">
          <ViewToggle value={view} onChange={setView} />
        </div>
      )}

      {view === "table" || !shouldRenderChart ? (
        <div className="divide-y divide-slate-100">
          {rows.map((product, index) => (
            <div
              key={product.productId}
              className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 py-3"
            >
              <span className="text-[12px] font-medium text-slate-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex items-center gap-2">
                {shouldRenderChart && (
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor:
                        VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length],
                    }}
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-slate-900">
                    {product.productName}
                  </p>
                  <p className="mt-1 text-[10.5px] text-slate-500">
                    Đã bán {numberText(product.quantitySold)}
                  </p>
                </div>
              </div>
              <p className="text-right text-[12px] font-semibold text-slate-900">
                {currency(product.revenue)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1">
          <DonutChart
            size={160}
            thickness={22}
            centerLabel={compactCurrency(totalRevenue)}
            centerSub={`top ${rows.length} sản phẩm`}
            segments={chartRows.map((row, index) => ({
              key: String(row.productId),
              value: row.revenue,
              color: VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length],
              label: `${row.productName}: ${decimalText(row.percentage)}% · ${currency(row.revenue)}`,
            }))}
          />
          <div className="divide-y divide-slate-100">
            {rows.map((product, index) => {
              const chartRow = chartRows.find(
                (row) => row.productId === product.productId,
              );
              return (
                <div
                  key={product.productId}
                  className="grid grid-cols-[16px_28px_minmax(0,1fr)_auto] items-center gap-2 py-2.5"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor:
                        VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length],
                    }}
                  />
                  <span className="text-[12px] font-medium text-slate-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-slate-900">
                      {product.productName}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      Đã bán {numberText(product.quantitySold)}
                      {chartRow && ` · ${decimalText(chartRow.percentage)}%`}
                    </p>
                  </div>
                  <p className="text-right text-[12px] font-semibold text-slate-900">
                    {currency(product.revenue)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
