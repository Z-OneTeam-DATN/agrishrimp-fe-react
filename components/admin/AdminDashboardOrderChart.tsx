"use client";

import { ShoppingCart } from "lucide-react";

import { DonutChart } from "@/components/admin/DonutChart";
import { ChartLegend, EmptyState } from "@/components/admin/DashboardPanel";
import {
  VIZ_CATEGORICAL,
  numberText,
  toFiniteNumber,
} from "@/components/admin/dashboard-viz";

type OrderChartRow = {
  name: string;
  value: number;
};

interface AdminDashboardOrderChartProps {
  orderChartRows: OrderChartRow[];
  hasOrderChartData: boolean;
}

export default function AdminDashboardOrderChart({
  orderChartRows,
  hasOrderChartData,
}: AdminDashboardOrderChartProps) {
  const chartRows = orderChartRows.map((item) => ({
    name: item.name || "Không xác định",
    value: Math.max(0, toFiniteNumber(item.value)),
  }));
  const shouldRenderChart =
    hasOrderChartData && chartRows.some((item) => item.value > 0);

  if (!shouldRenderChart) {
    return (
      <EmptyState
        className="min-h-[220px]"
        icon={ShoppingCart}
        text="Chưa có đơn hàng cần xử lý."
        hint="Khi xuất hiện đơn chờ duyệt, đóng gói hoặc giao hàng, biểu đồ sẽ hiển thị tại đây."
      />
    );
  }

  const totalOrders = chartRows.reduce((sum, row) => sum + row.value, 0);
  const segments = chartRows
    .filter((row) => row.value > 0)
    .map((row, index) => ({
      key: row.name,
      value: row.value,
      color: VIZ_CATEGORICAL[index % VIZ_CATEGORICAL.length],
      label: `${row.name}: ${numberText(row.value)} đơn`,
    }));

  return (
    <div className="space-y-3">
      <DonutChart
        size={200}
        thickness={26}
        centerLabel={numberText(totalOrders)}
        centerSub="đơn đang kẹt"
        segments={segments}
      />
      <ChartLegend
        items={segments.map((segment) => ({
          color: segment.color,
          label: segment.key,
          note: numberText(segment.value),
        }))}
        className="justify-center"
      />
    </div>
  );
}
