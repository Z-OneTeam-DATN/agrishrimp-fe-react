import { MetricChange } from "@/app/types/dashboard.type";

export const VIZ_SERIES = {
  revenue: "#2a78d6",
  cost: "#eb6834",
  profit: "#1baf7a",
} as const;

export const VIZ_CATEGORICAL = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#4a3aa7",
] as const;

export const VIZ_CHROME = {
  grid: "#eef2f7",
  axis: "#94a3b8",
  baseline: "#e2e8f0",
  surface: "#ffffff",
} as const;

export const VIZ_TOOLTIP_STYLE = {
  border: "1px solid #e2e8f0",
  borderRadius: 4,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
  padding: "8px 10px",
} as const;

export const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const currency = (value?: number | null) =>
  `${Math.round(toFiniteNumber(value)).toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  })} VND`;

export const compactCurrency = (value?: number | null) => {
  const amount = toFiniteNumber(value);
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  if (absolute >= 1_000_000_000) {
    return `${sign}${(absolute / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (absolute >= 1_000_000) {
    return `${sign}${(absolute / 1_000_000).toFixed(1)} triệu`;
  }
  return currency(amount);
};

export const numberText = (value?: number | null) =>
  toFiniteNumber(value).toLocaleString("vi-VN");

export const decimalText = (value: number, digits = 1) =>
  toFiniteNumber(value).toLocaleString("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export type TrendTone = "up" | "down" | "flat" | "neutral";

export type TrendDisplay = {

  label: string;
  tone: TrendTone;

  hint: string;
};

const RATIO_THRESHOLD_PERCENT = 200;

const invertTone = (tone: TrendTone): TrendTone =>
  tone === "up" ? "down" : tone === "down" ? "up" : tone;

export const describeTrend = (
  change: MetricChange | undefined,
  comparisonLabel: string,
  formatValue: (value: number) => string,
  lowerIsBetter = false,
): TrendDisplay | null => {
  if (!change) return null;

  const amount = toFiniteNumber(change.changeAmount);
  const previous = toFiniteNumber(change.previous);
  const current = toFiniteNumber(change.current);
  const rawTone: TrendTone = amount > 0 ? "up" : amount < 0 ? "down" : "flat";
  const tone = lowerIsBetter ? invertTone(rawTone) : rawTone;
  const deltaText = `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${formatValue(
    Math.abs(amount),
  )}`;

  if (change.newBaseline) {
    return {
      label: "Mới",
      tone: lowerIsBetter ? "down" : "up",
      hint: `${comparisonLabel} chưa phát sinh nên chưa tính được %`,
    };
  }

  if (change.negativeBaseline) {
    const improved = amount >= 0;
    return {
      label: improved ? "Cải thiện" : "Giảm sâu",
      tone: lowerIsBetter
        ? improved
          ? "down"
          : "up"
        : improved
          ? "up"
          : "down",
      hint: `${comparisonLabel} đang lỗ nên không quy ra %, chênh lệch ${deltaText}`,
    };
  }

  if (!change.comparable) {
    return {
      label: "Không đổi",
      tone: "neutral",
      hint: `Cả kỳ này và ${comparisonLabel} đều chưa phát sinh`,
    };
  }

  const percent = toFiniteNumber(change.changePercent);

  if (Math.abs(percent) < 0.05) {
    return {
      label: "0%",
      tone: "flat",
      hint: `Đi ngang ${comparisonLabel} (${formatValue(previous)})`,
    };
  }

  if (percent >= RATIO_THRESHOLD_PERCENT && previous > 0) {
    return {
      label: `gấp ${decimalText(current / previous)} lần`,
      tone: lowerIsBetter ? "down" : "up",
      hint: `${comparisonLabel} chỉ ${formatValue(previous)}, nên mức tăng rất lớn`,
    };
  }

  return {
    label: `${percent > 0 ? "+" : ""}${decimalText(percent)}%`,
    tone,
    hint: `${comparisonLabel}: ${formatValue(previous)} (${deltaText})`,
  };
};

export const qualityRateText = (numerator: number, denominator: number) =>
  denominator > 0
    ? `${decimalText((toFiniteNumber(numerator) / denominator) * 100)}%`
    : "--";

export const TREND_TEXT_CLASS: Record<TrendTone, string> = {
  up: "text-emerald-700",
  down: "text-rose-600",
  flat: "text-slate-500",
  neutral: "text-slate-500",
};

export const TREND_BADGE_CLASS: Record<TrendTone, string> = {
  up: "border-emerald-200 bg-emerald-50 text-emerald-700",
  down: "border-rose-200 bg-rose-50 text-rose-700",
  flat: "border-slate-200 bg-slate-50 text-slate-600",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

