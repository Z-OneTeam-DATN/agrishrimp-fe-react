import { MetricChange } from "@/app/types/dashboard.type";

// Bảng màu chuỗi dữ liệu của trang tổng quan. Thứ tự slot là cố định: 1 chỉ tiêu luôn giữ đúng
// 1 màu dù bộ lọc có làm đổi thứ hạng, nếu không người đọc quen "doanh thu màu xanh" sẽ bị đánh lừa.
// Bộ màu này đã được kiểm bằng validate_palette.js trên nền trắng (đạt cả 3 mức: dải sáng, độ bão
// hoà, và khoảng cách màu cho người mù màu). Vì 3 màu nhạt hơn không đạt tương phản 3:1 với nền
// trắng nên mọi biểu đồ dùng chúng đều phải kèm nhãn/chú thích chữ, không được để màu đứng một mình.
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

// VND không có đơn vị lẻ dưới đồng (hào/xu đã bỏ từ lâu) — nhưng các phép chia (ví dụ tổng doanh
// thu / tổng đơn) luôn ra số thập phân, và toLocaleString mặc định hiện tới 3 chữ số lẻ. Phải làm
// tròn + khoá maximumFractionDigits, nếu không sẽ hiện những số vô nghĩa kiểu "6.416.576,577 VND".
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
  // Chuỗi ngắn hiện trong badge: "+12,5%", "gấp 3,2 lần", "Mới", "Không đổi"...
  label: string;
  tone: TrendTone;
  // Câu giải thích ngắn đặt cạnh badge, luôn nói rõ đang so với cái gì.
  hint: string;
};

// Ngưỡng đổi cách diễn đạt: từ +200% trở lên, "gấp N lần" dễ đọc hơn nhiều so với "+1.240%".
const RATIO_THRESHOLD_PERCENT = 200;

const invertTone = (tone: TrendTone): TrendTone =>
  tone === "up" ? "down" : tone === "down" ? "up" : tone;

/**
 * Quyết định CÁCH NÓI về mức tăng trưởng, thay vì in thẳng % ra màn hình.
 *
 * Đây là chỗ sửa lỗi "số % quá to": phần trăm chỉ dùng được khi kỳ trước > 0 (backend đã đánh dấu
 * bằng `comparable`), và ngay cả khi dùng được, tăng quá mạnh vẫn chuyển sang "gấp N lần". Các
 * trường hợp còn lại (kỳ trước = 0, kỳ trước lỗ) không có % nào đúng cả nên phải nói bằng lời.
 *
 * `lowerIsBetter`: mặc định tăng = màu tốt (doanh thu, đơn hàng...). Với các chỉ số mà TĂNG lại là
 * xấu (đơn hoàn, đơn huỷ), bật cờ này để đảo màu — chữ vẫn là "+3 đơn" như cũ, chỉ riêng màu đổi.
 */
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

  // Tăng quá mạnh: đọc "gấp 12,4 lần" nhanh hơn "+1.140%" và không làm vỡ khung thẻ số.
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

// Tỷ lệ trên tổng số đơn ĐÃ XỬ LÝ XONG trong kỳ (giao thành công + hoàn + huỷ). Mẫu số = 0 nghĩa
// là kỳ này chưa có đơn nào chốt xong — không có gì để chia, phải trả "--" thay vì "0%" gây hiểu
// lầm là "0% thành công" (nghe như đang tệ) trong khi thực ra chỉ là chưa có dữ liệu.
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
