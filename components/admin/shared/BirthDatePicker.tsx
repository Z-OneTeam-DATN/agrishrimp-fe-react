"use client";

import * as React from "react";
import { format, getMonth, getYear, parseISO, setMonth, setYear } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SharedDatePickerProps = {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  heading?: string;
  emptyStateLabel?: string;
  buttonClassName?: string;
  contentClassName?: string;
  fromDate?: Date;
  toDate?: Date;
  disabledDate?: (date: Date) => boolean;
  variant?: "default" | "compact";
};

const MIN_YEAR = 1950;
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: `Tháng ${index + 1}`,
}));

const parseValueToDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export function BirthDatePicker({
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = "Chọn ngày sinh",
}: Omit<SharedDatePickerProps, "heading" | "emptyStateLabel" | "fromDate" | "toDate" | "disabledDate" | "variant">) {
  return (
    <SharedDatePicker
      value={value}
      onChange={onChange}
      disabled={disabled}
      hasError={hasError}
      placeholder={placeholder}
      heading="Ngày sinh"
      emptyStateLabel="Chưa chọn ngày sinh"
      fromDate={new Date(MIN_YEAR, 0, 1)}
      toDate={new Date()}
    />
  );
}

export function SharedDatePicker({
  value,
  onChange,
  disabled = false,
  hasError = false,
  placeholder = "Chọn ngày",
  heading = "Ngày",
  emptyStateLabel = "Chưa chọn ngày",
  buttonClassName,
  contentClassName,
  fromDate,
  toDate,
  disabledDate,
  variant = "default",
}: SharedDatePickerProps) {
  const selectedDate = React.useMemo(() => parseValueToDate(value), [value]);
  const [open, setOpen] = React.useState(false);
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    selectedDate ?? new Date(2000, 0, 1),
  );
  const isCompact = variant === "compact";
  const minYear = fromDate?.getFullYear() ?? MIN_YEAR;
  const maxYear = toDate?.getFullYear() ?? new Date().getFullYear();
  const yearOptions = React.useMemo(
    () =>
      Array.from({ length: Math.max(maxYear - minYear + 1, 1) }, (_, index) => maxYear - index),
    [maxYear, minYear],
  );

  React.useEffect(() => {
    if (selectedDate) {
      setDisplayMonth(selectedDate);
    }
  }, [selectedDate]);

  const formattedValue = selectedDate ? format(selectedDate, "dd/MM/yyyy") : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-lg border bg-white px-3 text-left text-[13px] font-medium shadow-none transition-colors",
            hasError
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-slate-200 hover:border-slate-300",
            !formattedValue && "text-slate-400",
          )}
        >
          <span className="flex items-center gap-2 overflow-hidden">
            <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{formattedValue || placeholder}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={-6}
        collisionPadding={{ top: 88, right: 16, bottom: 112, left: 16 }}
        className={cn(
          "z-[1100] w-[300px] rounded-xl border border-slate-200 p-0 shadow-xl",
          contentClassName,
        )}
      >
        <div className={cn("border-b border-slate-100 px-4 py-3", isCompact && "px-3.5 py-3")}>
          <div className="mb-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {heading}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-slate-800">
              {formattedValue || emptyStateLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={String(getMonth(displayMonth))}
              onValueChange={(nextValue) =>
                setDisplayMonth(setMonth(displayMonth, Number(nextValue)))
              }
            >
              <SelectTrigger
                className={cn(
                  "h-8 rounded-lg border-slate-200 px-3 text-[12px] font-medium shadow-none",
                  isCompact && "h-8.5",
                )}
              >
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)} className="text-[12px]">
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(getYear(displayMonth))}
              onValueChange={(nextValue) =>
                setDisplayMonth(setYear(displayMonth, Number(nextValue)))
              }
            >
              <SelectTrigger
                className={cn(
                  "h-8 rounded-lg border-slate-200 px-3 text-[12px] font-medium shadow-none",
                  isCompact && "h-8.5",
                )}
              >
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)} className="text-[12px]">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={cn("p-2.5", isCompact && "p-2")}>
          <Calendar
            mode="single"
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setDisplayMonth(date);
              setOpen(false);
            }}
            locale={vi}
            fromDate={fromDate}
            toDate={toDate}
            disabled={disabledDate}
            showOutsideDays={false}
            className="p-0"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "hidden",
              head_row: "flex justify-between",
              row: "mt-1 flex w-full justify-between",
              head_cell: "w-9 text-[11px] font-semibold text-slate-500",
              cell: "h-9 w-9 p-0 text-sm",
              day: "h-9 w-9 rounded-lg p-0 text-[13px] font-medium text-slate-700 hover:bg-slate-100",
              day_selected:
                "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
              day_today: "bg-blue-50 text-blue-700",
              day_disabled: "text-slate-300 opacity-60",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
