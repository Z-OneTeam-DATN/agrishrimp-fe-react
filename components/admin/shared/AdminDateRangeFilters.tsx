"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDateFilterValue(value: string) {
  const [year, month, day] = value.split("-");
  const numericDay = Number(day);

  if (!year || !month || !day || Number.isNaN(numericDay)) {
    return "";
  }

  return `${numericDay}/${month}/${year}`;
}

function AdminDateFilterField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  };

  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <label
        htmlFor={id}
        className="shrink-0 text-[11px] font-semibold text-slate-600"
      >
        {label}:
      </label>
      <div className="relative w-full sm:w-[158px]">
        <button
          type="button"
          onClick={openPicker}
          className="h-[38px] w-full rounded-[4px] border border-slate-200 bg-white px-3 pr-9 text-left text-[13px] text-slate-900 shadow-none outline-none transition-colors hover:border-blue-200 focus-visible:border-blue-300"
        >
          {formatDateFilterValue(value) || "d/MM/yyyy"}
        </button>
        <Calendar
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-y-0 right-0 h-[38px] w-10 cursor-pointer opacity-0"
          aria-label={label}
        />
      </div>
    </div>
  );
}

export function AdminDateRangeFilters({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  className,
  idPrefix = "admin",
}: {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  className?: string;
  idPrefix?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <AdminDateFilterField
        id={`${idPrefix}-from-date`}
        label="Từ ngày"
        value={fromDate}
        onChange={onFromDateChange}
      />
      <AdminDateFilterField
        id={`${idPrefix}-to-date`}
        label="Đến ngày"
        value={toDate}
        onChange={onToDateChange}
      />
    </div>
  );
}
