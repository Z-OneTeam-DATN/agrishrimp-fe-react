"use client";

import { toFiniteNumber } from "@/components/admin/dashboard-viz";

export interface DonutSegment {
  key: string;
  value: number;
  color: string;
  label: string;
}

/**
 * Donut vẽ bằng SVG thuần (stroke-dasharray trên 1 vòng tròn), không qua Recharts.
 *
 * Lý do: `<Pie>` của Recharts (kể cả khi đổi từ đo tay sang ResponsiveContainer) không vẽ ra vòng
 * tròn trong trình duyệt thực tế — chỉ có phần nhãn giữa (không phụ thuộc kích thước đo được) hiện
 * ra, còn SVG của Pie thì không, dù test 2 cơ chế đo kích thước khác nhau đều ra kết quả giống hệt
 * nhau. Cách vẽ này dùng viewBox CỐ ĐỊNH (100x100, không cần đo runtime), CSS chỉ co giãn khung
 * chứa — loại bỏ hoàn toàn phần đo kích thước động (nguồn nghi vấn) khỏi phương trình.
 */
export function DonutChart({
  centerLabel,
  centerSub,
  segments,
  size = 160,
  thickness = 18,
}: {
  centerLabel?: string;
  centerSub?: string;
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}) {
  const radius = 50 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce(
    (sum, segment) => sum + Math.max(0, toFiniteNumber(segment.value)),
    0,
  );

  let cumulative = 0;
  // Khoảng hở 2 đơn vị (trên vòng chu vi 100-đơn-vị) giữa các lát cắt, thay cho việc vẽ viền quanh
  // từng lát — đúng nguyên tắc "2px surface gap" đang dùng cho các biểu đồ khác trong dashboard.
  const gapUnits = 2;

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {total <= 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={thickness}
          />
        ) : (
          segments
            .filter((segment) => toFiniteNumber(segment.value) > 0)
            .map((segment) => {
              const fraction = toFiniteNumber(segment.value) / total;
              const rawDash = fraction * circumference;
              const dash = Math.max(0, rawDash - gapUnits);
              const offset = -cumulative;
              cumulative += rawDash;

              return (
                <circle
                  key={segment.key}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                >
                  <title>{segment.label}</title>
                </circle>
              );
            })
        )}
      </svg>
      {(centerLabel || centerSub) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && (
            <span className="text-[16px] font-semibold text-slate-900">
              {centerLabel}
            </span>
          )}
          {centerSub && (
            <span className="text-[9.5px] text-slate-400">{centerSub}</span>
          )}
        </div>
      )}
    </div>
  );
}
