"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BusinessTrend } from "@/app/types/dashboard.type";
import SafeChartViewport from "@/components/admin/SafeChartViewport";
import {
  ChartLegend,
  EmptyState,
  Panel,
  ViewToggle,
} from "@/components/admin/DashboardPanel";
import {
  VIZ_CHROME,
  VIZ_SERIES,
  VIZ_TOOLTIP_STYLE,
  currency,
  decimalText,
  numberText,
  toFiniteNumber,
} from "@/components/admin/dashboard-viz";

interface AdminDashboardTrendChartProps {
  trend?: BusinessTrend;
  isLoading?: boolean;
}

const SERIES = [
  { key: "revenue", label: "Doanh thu", color: VIZ_SERIES.revenue },
  { key: "cost", label: "Giá vốn", color: VIZ_SERIES.cost },
  { key: "profit", label: "Lợi nhuận", color: VIZ_SERIES.profit },
] as const;

const axisTick = { fontSize: 10, fill: VIZ_CHROME.axis };

const shortMoney = (value: number) => {
  const amount = toFiniteNumber(value);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  if (absolute >= 1_000_000_000) return `${sign}${(absolute / 1_000_000_000).toFixed(1)} tỷ`;
  if (absolute >= 1_000_000) return `${sign}${Math.round(absolute / 1_000_000)} tr`;
  if (absolute >= 1_000) return `${sign}${Math.round(absolute / 1_000)}k`;
  return `${sign}${absolute}`;
};

export default function AdminDashboardTrendChart({
  trend,
  isLoading,
}: AdminDashboardTrendChartProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  const isMonthly = trend?.granularity !== "DAY";
  const points = (trend?.points ?? []).map((point) => ({
    label: point.label || "--",
    period: point.period,
    revenue: toFiniteNumber(point.revenue),
    cost: toFiniteNumber(point.cost),
    profit: toFiniteNumber(point.profit),
    orders: Math.max(0, toFiniteNumber(point.orders)),
  }));

  const hasData = points.some(
    (point) => point.revenue !== 0 || point.cost !== 0 || point.profit !== 0,
  );

  const totals = points.reduce(
    (sum, point) => ({
      revenue: sum.revenue + point.revenue,
      cost: sum.cost + point.cost,
      profit: sum.profit + point.profit,
      orders: sum.orders + point.orders,
    }),
    { revenue: 0, cost: 0, profit: 0, orders: 0 },
  );
  const margin =
    totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const showRevenueLabels = points.length <= 8;

  const title = isMonthly
    ? "Doanh thu · giá vốn · lợi nhuận theo tháng"
    : "Doanh thu · giá vốn · lợi nhuận theo ngày";

  return (
    <Panel
      title={title}
      description={trend?.rangeLabel}
      footnote={
        isMonthly
          ? "Doanh thu tính trên đơn đã hoàn tất/đang giao (đã trừ giảm giá, đã gồm phí ship). Giá vốn lấy theo giá nhập của hàng đã xuất. Lợi nhuận = doanh thu − giá vốn, chưa trừ chi phí vận hành. Biểu đồ luôn hiển thị tối thiểu 6 tháng để có mốc so sánh."
          : "Doanh thu tính trên đơn đã hoàn tất/đang giao (đã trừ giảm giá, đã gồm phí ship). Lợi nhuận = doanh thu − giá vốn, chưa trừ chi phí vận hành. Khoảng chọn dài hơn 62 ngày sẽ tự chuyển sang xem theo tháng."
      }
      action={<ViewToggle value={view} onChange={setView} />}
    >
      {isLoading && points.length === 0 ? (
        <div className="h-[300px] animate-pulse rounded-[4px] bg-slate-50" />
      ) : !hasData ? (
        <EmptyState
          className="min-h-[300px]"
          icon={BarChart3}
          text="Chưa có số liệu kinh doanh trong khoảng này."
          hint="Khi có đơn hoàn tất, biểu đồ cột sẽ so sánh doanh thu, giá vốn và lợi nhuận từng kỳ."
        />
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <SummaryBox
              label="Tổng doanh thu"
              value={currency(totals.revenue)}
              color={VIZ_SERIES.revenue}
            />
            <SummaryBox
              label="Tổng giá vốn"
              value={currency(totals.cost)}
              color={VIZ_SERIES.cost}
            />
            <SummaryBox
              label="Tổng lợi nhuận"
              value={currency(totals.profit)}
              color={VIZ_SERIES.profit}
            />
            <SummaryBox
              label="Biên lợi nhuận"
              value={`${decimalText(margin)}%`}
              note={`${numberText(totals.orders)} đơn`}
            />
          </div>

          {view === "table" ? (
            <TrendTable points={points} isMonthly={isMonthly} />
          ) : (
            <>
              <div className="h-[300px]">
                <SafeChartViewport
                  className="h-[300px] w-full"
                  minHeight={200}
                  minWidth={240}
                >
                  {({ height, width }) => (
                    <BarChart

                      key={`${width}x${height}`}
                      width={width}
                      height={height}
                      data={points}
                      margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
                      barCategoryGap="22%"

                      barGap={2}
                    >
                      <CartesianGrid
                        stroke={VIZ_CHROME.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={axisTick}
                        interval={0}
                        height={28}
                      />
                      <YAxis
                        width={52}
                        tickLine={false}
                        axisLine={false}
                        tick={axisTick}
                        tickFormatter={shortMoney}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                        contentStyle={VIZ_TOOLTIP_STYLE}
                        labelStyle={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                        formatter={(value: number, name: string) => [
                          currency(toFiniteNumber(value)),
                          name,
                        ]}
                      />
                      {SERIES.map((series) => (
                        <Bar
                          key={series.key}
                          dataKey={series.key}
                          name={series.label}
                          fill={series.color}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={26}

                          minPointSize={0}
                          isAnimationActive={false}
                          label={
                            showRevenueLabels && series.key === "revenue"
                              ? {
                                  position: "top",
                                  fontSize: 9.5,
                                  fill: "#64748b",
                                  formatter: (value: number) =>
                                    toFiniteNumber(value) === 0
                                      ? ""
                                      : shortMoney(value),
                                }
                              : false
                          }
                        />
                      ))}
                    </BarChart>
                  )}
                </SafeChartViewport>
              </div>
              <ChartLegend
                items={SERIES.map((series) => ({
                  color: series.color,
                  label: series.label,
                }))}
              />
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

function SummaryBox({
  color,
  label,
  note,
  value,
}: {
  color?: string;
  label: string;
  note?: string;
  value: string;
}) {
  return (
    <div className="rounded-[4px] border border-slate-200 bg-slate-50/60 px-3 py-2">
      <div className="flex items-center gap-1.5">
        {color && (
          <span
            aria-hidden
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: color }}
          />
        )}
        <p className="text-[10.5px] font-semibold text-slate-500">{label}</p>
      </div>
      <p className="mt-1 text-[14px] font-semibold text-slate-900">{value}</p>
      {note && <p className="text-[10px] text-slate-400">{note}</p>}
    </div>
  );
}

function TrendTable({
  isMonthly,
  points,
}: {
  isMonthly: boolean;
  points: {
    label: string;
    period: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }[];
}) {
  return (
    <div className="max-h-[336px] overflow-auto rounded-[4px] border border-slate-200">
      <table className="w-full border-collapse text-[11.5px] tabular-nums">
        <thead className="sticky top-0 bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">
              {isMonthly ? "Tháng" : "Ngày"}
            </th>
            <th className="px-3 py-2 text-right font-semibold">Doanh thu</th>
            <th className="px-3 py-2 text-right font-semibold">Giá vốn</th>
            <th className="px-3 py-2 text-right font-semibold">Lợi nhuận</th>
            <th className="px-3 py-2 text-right font-semibold">Đơn</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {points.map((point) => (
            <tr key={point.period} className="hover:bg-slate-50">
              <td className="px-3 py-2 font-medium text-slate-700">
                {point.label}
              </td>
              <td className="px-3 py-2 text-right text-slate-700">
                {currency(point.revenue)}
              </td>
              <td className="px-3 py-2 text-right text-slate-700">
                {currency(point.cost)}
              </td>
              <td
                className={`px-3 py-2 text-right font-semibold ${
                  point.profit < 0 ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {currency(point.profit)}
              </td>
              <td className="px-3 py-2 text-right text-slate-700">
                {numberText(point.orders)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

