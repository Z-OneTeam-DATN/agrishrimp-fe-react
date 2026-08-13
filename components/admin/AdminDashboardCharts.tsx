"use client";

import { useState } from "react";
import { PieChart as PieChartIcon } from "lucide-react";

import { CategoryDistribution } from "@/app/types/dashboard.type";
import { DonutChart } from "@/components/admin/DonutChart";
import {
  EmptyState,
  Panel,
  ViewToggle,
} from "@/components/admin/DashboardPanel";
import {
  VIZ_CATEGORICAL,
  currency,
  decimalText,
  numberText,
  toFiniteNumber,
} from "@/components/admin/dashboard-viz";

interface AdminDashboardChartsProps {
  categoryRows: CategoryDistribution[];
  hasCategoryChartData: boolean;
  categoryTotalPercent: number;
}

export default function AdminDashboardCharts({
  categoryRows,
  hasCategoryChartData,
  categoryTotalPercent,
}: AdminDashboardChartsProps) {
  const [categoryView, setCategoryView] = useState<"chart" | "table">("chart");

  const normalizedCategoryRows = categoryRows.map((item, index) => ({
    ...item,
    categoryId: item.categoryId ?? index,
    categoryName: item.categoryName || "Không xác định",
    percentage: Math.max(0, toFiniteNumber(item.percentage)),
    totalRevenue: Math.max(0, toFiniteNumber(item.totalRevenue)),
    totalQuantity: Math.max(0, toFiniteNumber(item.totalQuantity)),
  }));

  const totalPercent = normalizedCategoryRows.reduce(
    (sum, item) => sum + Math.max(0, item.percentage),
    0,
  );
  const totalRevenue = normalizedCategoryRows.reduce(
    (sum, item) => sum + Math.max(0, item.totalRevenue),
    0,
  );
  const totalQuantity = normalizedCategoryRows.reduce(
    (sum, item) => sum + Math.max(0, item.totalQuantity),
    0,
  );

  const rawChartCategoryRows =
    totalPercent > 0
      ? normalizedCategoryRows
      : totalRevenue > 0
        ? normalizedCategoryRows.map((item) => ({
            ...item,
            percentage: (item.totalRevenue / totalRevenue) * 100,
          }))
        : totalQuantity > 0
          ? normalizedCategoryRows.map((item) => ({
              ...item,
              percentage: (item.totalQuantity / totalQuantity) * 100,
            }))
          : [];

  const chartCategoryRows = rawChartCategoryRows
    .map((item) => ({ ...item, percentage: toFiniteNumber(item.percentage) }))
    .filter((item) => item.percentage > 0);

  const safeCategoryTotalPercent = chartCategoryRows.reduce(
    (sum, item) => sum + toFiniteNumber(item.percentage),
    0,
  );
  const shouldRenderCategoryChart =
    hasCategoryChartData &&
    chartCategoryRows.length > 0 &&
    safeCategoryTotalPercent > 0;

  return (
    <Panel
      title="Cơ cấu doanh thu nhóm hàng"
      description={
        shouldRenderCategoryChart
          ? `${chartCategoryRows.length} nhóm hàng đang chiếm ${decimalText(
              Math.min(100, safeCategoryTotalPercent),
            )}% doanh thu`
          : undefined
      }
      footnote="Tỷ trọng tính trên doanh thu luỹ kế của các nhóm hàng đã phát sinh bán, không giới hạn theo bộ lọc thời gian. Mỗi dòng đều ghi kèm % và số tiền để không phải đoán theo màu."
      action={
        shouldRenderCategoryChart ? (
          <ViewToggle value={categoryView} onChange={setCategoryView} />
        ) : undefined
      }
    >
      {!shouldRenderCategoryChart ? (
        <EmptyState
          icon={PieChartIcon}
          text="Chưa có dữ liệu nhóm hàng."
          hint="Khi có doanh thu phát sinh theo nhóm sản phẩm, sơ đồ tròn sẽ hiển thị ở đây."
        />
      ) : categoryView === "table" ? (
        <div className="overflow-hidden rounded-[4px] border border-slate-200">
          <table className="w-full border-collapse text-[11.5px] tabular-nums">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Nhóm</th>
                <th className="px-3 py-2 text-right font-semibold">
                  Doanh thu
                </th>
                <th className="px-3 py-2 text-right font-semibold">SL</th>
                <th className="px-3 py-2 text-right font-semibold">Tỷ trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartCategoryRows.map((item, index) => (
                <tr
                  key={`${item.categoryId}-${index}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-3 py-2 font-medium text-slate-700">
                    {item.categoryName}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {currency(item.totalRevenue)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {numberText(item.totalQuantity)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">
                    {decimalText(item.percentage)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)] xl:grid-cols-2">
          <DonutChart
            size={180}
            thickness={24}
            centerLabel={`${Math.round(
              safeCategoryTotalPercent > 0
                ? Math.min(100, safeCategoryTotalPercent)
                : categoryTotalPercent,
            )}%`}
            centerSub={`${chartCategoryRows.length} nhóm`}
            segments={chartCategoryRows.map((item, index) => ({
              key: `${item.categoryId}-${index}`,
              value: item.percentage,
              color: VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length],
              label: `${item.categoryName}: ${decimalText(item.percentage)}% · ${currency(item.totalRevenue)}`,
            }))}
          />
          <div className="space-y-3">
            {chartCategoryRows.map((item, index) => (
              <NumberBar
                key={`${item.categoryId}-${index}`}
                label={item.categoryName}
                value={`${decimalText(item.percentage)}%`}
                note={currency(item.totalRevenue)}
                percent={item.percentage}
                tone={VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length]}
              />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function NumberBar({
  label,
  note,
  percent,
  tone,
  value,
}: {
  label: string;
  note?: string;
  percent: number;
  tone: string;
  value: string;
}) {
  const safePercent = Math.max(0, Math.min(100, toFiniteNumber(percent)));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: tone }}
          />
          <span className="truncate text-[12px] text-slate-600">{label}</span>
        </span>
        <span className="shrink-0 text-[12px] font-semibold text-slate-900">
          {value}
          {note && (
            <span className="ml-1.5 font-normal text-[10.5px] text-slate-400">
              {note}
            </span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full"
          style={{ width: `${safePercent}%`, backgroundColor: tone }}
        />
      </div>
    </div>
  );
}

