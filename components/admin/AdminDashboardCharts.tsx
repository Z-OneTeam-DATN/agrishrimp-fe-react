"use client";

import { BarChart3, PieChart as PieChartIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CategoryDistribution } from "@/app/types/dashboard.type";
import SafeChartViewport from "@/components/admin/SafeChartViewport";

type RevenueChartRow = {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
};

interface AdminDashboardChartsProps {
  revenueChartRows: RevenueChartRow[];
  hasRevenueChartData: boolean;
  categoryRows: CategoryDistribution[];
  hasCategoryChartData: boolean;
  categoryTotalPercent: number;
}

const donutColors = ["#059669", "#64748b", "#2563eb", "#d97706", "#dc2626"];

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const currency = (value?: number | null) =>
  `${toFiniteNumber(value).toLocaleString("vi-VN")} đ`;

export default function AdminDashboardCharts({
  revenueChartRows,
  hasRevenueChartData,
  categoryRows,
  hasCategoryChartData,
  categoryTotalPercent,
}: AdminDashboardChartsProps) {
  const normalizedRevenueRows = revenueChartRows.map((item) => ({
    date: item.date || "--/--",
    revenue: toFiniteNumber(item.revenue),
    profit: toFiniteNumber(item.profit),
    orders: Math.max(0, toFiniteNumber(item.orders)),
  }));

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
      ? normalizedCategoryRows.map((item) => ({
          ...item,
          percentage: item.percentage,
        }))
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
    .map((item) => ({
      ...item,
      percentage: toFiniteNumber(item.percentage),
    }))
    .filter((item) => item.percentage > 0);

  const safeCategoryTotalPercent = chartCategoryRows.reduce(
    (sum, item) => sum + toFiniteNumber(item.percentage),
    0,
  );
  const shouldRenderCategoryChart =
    hasCategoryChartData && chartCategoryRows.length > 0;
  const shouldRenderRevenueChart =
    hasRevenueChartData && normalizedRevenueRows.length > 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
      <Panel title="Doanh thu theo ngày">
        <div className="h-[300px]">
          {!shouldRenderRevenueChart ? (
            <EmptyText
              className="min-h-[300px]"
              icon={BarChart3}
              text="Chưa có dữ liệu doanh thu."
              hint="Biểu đồ sẽ xuất hiện khi hệ thống có doanh thu hoặc lợi nhuận trong giai đoạn này."
            />
          ) : (
            <SafeChartViewport
              className="h-[300px] w-full"
              minHeight={180}
              minWidth={180}
            >
              {({ height, width }) => (
                <AreaChart
                  width={width}
                  height={height}
                  data={normalizedRevenueRows}
                  margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#64748b"
                        stopOpacity={0.16}
                      />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    width={48}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(value) =>
                      toFiniteNumber(value) >= 1_000_000
                        ? `${Math.round(toFiniteNumber(value) / 1_000_000)}tr`
                        : `${Math.round(toFiniteNumber(value) / 1000)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                      boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      currency(toFiniteNumber(value)),
                      name === "revenue" ? "Doanh thu" : "Lợi nhuận",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                    name="Doanh thu"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#64748b"
                    strokeWidth={2}
                    fill="url(#profitFill)"
                    name="Lợi nhuận"
                  />
                </AreaChart>
              )}
            </SafeChartViewport>
          )}
        </div>
      </Panel>

      <Panel title="Cơ cấu doanh thu nhóm hàng">
        {!shouldRenderCategoryChart ? (
          <EmptyText
            icon={PieChartIcon}
            text="Chưa có dữ liệu nhóm hàng."
            hint="Khi có doanh thu phát sinh theo nhóm sản phẩm, sơ đồ tròn sẽ hiển thị ở đây."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1">
            <div className="relative mx-auto h-[180px] w-[180px]">
              <SafeChartViewport
                className="h-[180px] w-[180px]"
                minHeight={160}
                minWidth={160}
              >
                {({ height, width }) => {
                  const centerX = width / 2;
                  const centerY = height / 2;
                  const maxRadius = Math.floor(Math.min(width, height) / 2) - 8;
                  const outerRadius = Math.min(82, maxRadius);
                  const innerRadius = Math.max(
                    0,
                    Math.min(58, outerRadius - 24),
                  );
                  const canDrawPie =
                    [centerX, centerY, outerRadius, innerRadius].every(
                      Number.isFinite,
                    ) && outerRadius > 0;

                  if (!canDrawPie) return null;

                  return (
                    <PieChart width={width} height={height}>
                      <Pie
                        data={chartCategoryRows}
                        dataKey="percentage"
                        nameKey="categoryName"
                        cx={centerX}
                        cy={centerY}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={3}
                        isAnimationActive={false}
                      >
                        {chartCategoryRows.map((item, index) => (
                          <Cell
                            key={`${item.categoryId}-${index}`}
                            fill={donutColors[index % donutColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [
                          `${toFiniteNumber(value).toFixed(1)}%`,
                          "Tỷ trọng",
                        ]}
                      />
                    </PieChart>
                  );
                }}
              </SafeChartViewport>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[20px] font-semibold text-slate-900">
                  {Math.round(
                    safeCategoryTotalPercent > 0
                      ? safeCategoryTotalPercent
                      : categoryTotalPercent,
                  )}
                  %
                </span>
                <span className="text-[10px] text-slate-400">top nhóm</span>
              </div>
            </div>
            <div className="space-y-3">
              {chartCategoryRows.map((item, index) => (
                <NumberBar
                  key={`${item.categoryId}-${index}`}
                  label={item.categoryName}
                  value={`${toFiniteNumber(item.percentage).toFixed(1)}%`}
                  percent={toFiniteNumber(item.percentage)}
                  tone={donutColors[index % donutColors.length]}
                />
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[4px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-[12px] font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function NumberBar({
  label,
  percent,
  tone = "#64748b",
  value,
}: {
  label: string;
  percent: number;
  tone?: string;
  value: string;
}) {
  const safePercent = Math.max(0, Math.min(100, toFiniteNumber(percent)));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-[12px] text-slate-600">{label}</span>
        <span className="shrink-0 text-[12px] font-semibold text-slate-900">
          {value}
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

function EmptyText({
  className = "min-h-[180px]",
  hint,
  icon: Icon = BarChart3,
  text,
}: {
  className?: string;
  hint?: string;
  icon?: typeof BarChart3;
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
