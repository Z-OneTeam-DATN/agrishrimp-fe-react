import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const agronomistBlue = "#252896";

export const agronomistInputClassName =
  "h-[38px] rounded-[2px] border-[#d5d8e5] bg-white text-[12px] text-slate-700 shadow-none outline-none focus-visible:border-[#252896] focus-visible:ring-0";

export const agronomistTextareaClassName =
  "rounded-[2px] border-[#d5d8e5] bg-white text-[12px] leading-5 text-slate-700 shadow-none outline-none focus-visible:border-[#252896] focus-visible:ring-0";

export const agronomistPrimaryButtonClassName =
  "inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[4px] bg-[#252896] px-4 text-[12px] font-semibold text-white shadow-none transition-colors hover:bg-[#1d2078] disabled:cursor-not-allowed disabled:bg-slate-300";

export const agronomistOutlineButtonClassName =
  "inline-flex h-[38px] items-center justify-center gap-1.5 rounded-[4px] border border-[#c9cedd] bg-white px-4 text-[12px] font-medium text-slate-700 shadow-none transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60";

export const agronomistDangerButtonClassName =
  "inline-flex h-[34px] items-center justify-center gap-1.5 rounded-[4px] bg-[#d2453f] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#b93632] disabled:cursor-not-allowed disabled:opacity-60";

export const agronomistTableHeadClassName =
  "bg-[#f0f1f3] text-[11px] font-semibold uppercase text-slate-500";

export const agronomistTableCellClassName =
  "px-4 py-4 text-[12px] text-slate-600";

export function AgronomistPageHeader({
  title,
  actions,
  className,
}: {
  title: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <h1 className="text-[22px] font-semibold uppercase tracking-tight text-[#232323]">
        {title}
      </h1>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function AgronomistStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-3">{children}</div>;
}

export function AgronomistStatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-h-[96px] rounded-[8px] border border-[#dcdfe8] bg-white px-5 py-4">
      <p className="text-[12px] font-bold uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <p
        className={cn(
          "mt-4 text-[24px] font-bold leading-none text-[#232323]",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function AgronomistPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[8px] border border-[#e1e4ec] bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AgronomistToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 bg-[#f7f8fa] p-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AgronomistStatusPill({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: "blue" | "gray" | "green" | "amber" | "red";
  className?: string;
}) {
  const toneClassName = {
    blue: "bg-[#dfe4ff] text-[#252896]",
    gray: "bg-[#e5e5e5] text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex min-w-[88px] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-medium",
        toneClassName,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AgronomistPagination({
  page,
  pageSize,
  total,
  onPageChange,
  disabled,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const firstVisiblePage =
    totalPages <= 3 ? 0 : Math.min(Math.max(page - 1, 0), totalPages - 3);
  const visiblePages = Array.from(
    { length: Math.min(totalPages, 3) },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-[#e8ebf1] bg-[#f7f8fa] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-slate-500">
        Hiển thị {start}-{end} của {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={page === 0 || disabled}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          className="h-7 w-7 rounded-[4px] border-[#cfd5e2] bg-white text-slate-500 shadow-none"
          title="Trang trước"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        {visiblePages.map((pageIndex) => (
          <Button
            key={pageIndex}
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onPageChange(pageIndex)}
            className={cn(
              "h-7 w-7 rounded-[4px] border-[#cfd5e2] p-0 text-[11px] font-medium shadow-none",
              page === pageIndex
                ? "border-[#252896] bg-[#252896] text-white hover:bg-[#252896]"
                : "bg-white text-slate-600",
            )}
          >
            {pageIndex + 1}
          </Button>
        ))}
        {totalPages > 3 &&
        visiblePages[visiblePages.length - 1] < totalPages - 1 ? (
          <span className="px-1 text-[11px] text-slate-400">...</span>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={page >= totalPages - 1 || disabled}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          className="h-7 w-7 rounded-[4px] border-[#cfd5e2] bg-white text-slate-500 shadow-none"
          title="Trang sau"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
