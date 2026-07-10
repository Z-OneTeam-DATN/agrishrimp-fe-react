"use client";

import { ShoppingCart } from "lucide-react";
import {
  Bar as RechartsBar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SafeChartViewport from "@/components/admin/SafeChartViewport";

type OrderChartRow = {
  name: string;
  value: number;
};

interface AdminDashboardOrderChartProps {
  orderChartRows: OrderChartRow[];
  hasOrderChartData: boolean;
}

const numberText = (value?: number | null) =>
  toFiniteNumber(value).toLocaleString("vi-VN");

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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
      <EmptyText
        className="min-h-[220px]"
        icon={ShoppingCart}
        text="Chưa có đơn hàng cần xử lý."
        hint="Khi xuất hiện đơn chờ duyệt, đóng gói hoặc giao hàng, biểu đồ sẽ hiển thị tại đây."
      />
    );
  }

  return (
    <SafeChartViewport
      className="h-[220px] w-full"
      minHeight={160}
      minWidth={180}
    >
      {({ height, width }) => (
        <BarChart
          width={width}
          height={height}
          data={chartRows}
          layout="vertical"
          margin={{ left: 6, right: 12, top: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              fontSize: 12,
            }}
            formatter={(value: number) => [
              numberText(toFiniteNumber(value)),
              "Số đơn",
            ]}
          />
          <RechartsBar
            dataKey="value"
            minPointSize={0}
            radius={[0, 4, 4, 0]}
            fill="#64748b"
          />
        </BarChart>
      )}
    </SafeChartViewport>
  );
}

function EmptyText({
  className,
  hint,
  icon: Icon,
  text,
}: {
  className: string;
  hint?: string;
  icon: typeof ShoppingCart;
  text: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-[4px] border border-dashed border-slate-200 bg-slate-50 px-4 text-center ${className}`}
    >
      <div className="flex max-w-[320px] flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
          <Icon size={18} />
        </div>
        <div className="space-y-1">
          <p className="text-[12px] font-medium text-slate-600">{text}</p>
          {hint && (
            <p className="text-[11px] leading-5 text-slate-400">{hint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
