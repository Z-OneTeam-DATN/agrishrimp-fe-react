"use client";

import { BarChart3, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Panel({
  action,
  children,
  description,
  footnote,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  footnote?: string;
  title: string;
}) {
  return (
    <section className="flex h-full flex-col rounded-[4px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[12px] font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-1 text-[10.5px] leading-4 text-slate-500">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="flex-1 p-4">{children}</div>
      {footnote && (
        <p className="border-t border-slate-100 px-4 py-2.5 text-[10.5px] leading-4 text-slate-500">
          <span className="font-semibold text-slate-600">Ghi chú:</span>{" "}
          {footnote}
        </p>
      )}
    </section>
  );
}

export function ChartLegend({
  items,
  className = "",
}: {
  items: { color: string; label: string; note?: string }[];
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[11px] font-medium text-slate-600">
            {item.label}
          </span>
          {item.note && (
            <span className="text-[10.5px] text-slate-400">{item.note}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ViewToggle({
  onChange,
  value,
}: {
  onChange: (value: "chart" | "table") => void;
  value: "chart" | "table";
}) {
  return (
    <div className="flex shrink-0 rounded-[4px] border border-slate-200 p-0.5">
      {(
        [
          { key: "chart", label: "Biểu đồ" },
          { key: "table", label: "Số liệu" },
        ] as const
      ).map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-[3px] px-2 py-1 text-[10.5px] font-semibold transition ${
            value === option.key
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  className = "min-h-[180px]",
  hint,
  icon: Icon = BarChart3,
  text,
}: {
  className?: string;
  hint?: string;
  icon?: LucideIcon;
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

