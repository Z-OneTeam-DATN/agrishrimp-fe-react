"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { activityLogService, ActivityLogItem, ActivityLogModule } from "@/app/services/activity-log.service";
import { branchService } from "@/app/services/branchService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { isAdminRole } from "@/lib/roles";
import { P } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type BranchOption = {
  id: number;
  name: string;
};

const PAGE_SIZE = 20;

const actionClassNames: Record<string, string> = {
  CREATE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  UPDATE: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVE: "border-violet-200 bg-violet-50 text-violet-700",
  DELETE: "border-red-200 bg-red-50 text-red-700",
  CANCEL: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function ActivityLogsPage() {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const isAdmin = isAdminRole(user?.role);
  const canLoadBranches = isAdmin || hasPermission(P.BRANCH_VIEW);

  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [modules, setModules] = useState<ActivityLogModule[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [module, setModule] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let mounted = true;

    activityLogService
      .getModules()
      .then((data) => {
        if (mounted) setModules(data);
      })
      .catch(() => {
        if (mounted) setModules([]);
      });

    if (canLoadBranches) {
      branchService
        .getAll()
        .then((data) => {
          if (!mounted) return;
          const branchList = Array.isArray(data) ? data : data?.content ?? [];
          setBranches(
            branchList
              .map((branch: any) => ({
                id: Number(branch.id),
                name: branch.name || branch.branchName || `Chi nhánh #${branch.id}`,
              }))
              .filter((branch: BranchOption) => Number.isFinite(branch.id)),
          );
        })
        .catch(() => setBranches([]));
    }

    return () => {
      mounted = false;
    };
  }, [canLoadBranches]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await activityLogService.search({
        branchId: branchId === "all" ? undefined : Number(branchId),
        module,
        fromDate: toIsoDateFilter(fromDate),
        toDate: toIsoDateFilter(toDate),
        keyword: debouncedKeyword,
        page,
        size: PAGE_SIZE,
      });

      setLogs(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (error) {
      toast.error("Không thể tải nhật ký hoạt động");
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [branchId, debouncedKeyword, fromDate, module, page, toDate]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const stats = useMemo(() => {
    const approvable = logs.filter((log) => log.action === "APPROVE").length;
    const destructive = logs.filter((log) => ["DELETE", "CANCEL"].includes(log.action)).length;
    const touchedModules = new Set(logs.map((log) => log.module)).size;
    return { approvable, destructive, touchedModules };
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
            Nhật ký hoạt động
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-md bg-white text-[12px]"
          onClick={() => void fetchLogs()}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryItem label="Tổng bản ghi" value={totalElements} icon={Activity} />
        <SummaryItem label="Thao tác duyệt trên trang" value={stats.approvable} icon={ShieldCheck} />
        <SummaryItem label="Xóa hoặc hủy trên trang" value={stats.destructive} icon={Filter} />
        <SummaryItem label="Nhóm chức năng trên trang" value={stats.touchedModules} icon={Filter} />
      </div>

      <div className="rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-3 xl:grid-cols-[minmax(260px,1fr)_180px_240px_160px_160px] xl:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm người thực hiện, nội dung, đường dẫn..."
              className="h-9 rounded-md border-slate-200 bg-white pl-9 text-[12px] shadow-none"
            />
          </div>

          <Select
            value={branchId}
            onValueChange={(value) => {
              setBranchId(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[12px] shadow-none">
              <SelectValue placeholder="Chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={module}
            onValueChange={(value) => {
              setModule(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 rounded-md border-slate-200 bg-white text-[12px] shadow-none">
              <SelectValue placeholder="Nhóm chức năng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhóm chức năng</SelectItem>
              {modules.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateInput
            value={fromDate}
            onChange={(value) => {
              setFromDate(value);
              setPage(0);
            }}
            label="Từ ngày"
          />
          <DateInput
            value={toDate}
            onChange={(value) => {
              setToDate(value);
              setPage(0);
            }}
            label="Đến ngày"
          />

        </div>

        {isInitialLoading ? (
          <AdminDataSyncLoader />
        ) : (
          <div className={cn("relative", isLoading && "opacity-60")}>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            )}

            {logs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-[70px] text-center text-[11px] font-semibold uppercase text-slate-500">STT</TableHead>
                      <TableHead className="w-[170px] text-[11px] font-semibold uppercase text-slate-500">Thời gian</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-slate-500">Hoạt động</TableHead>
                      <TableHead className="w-[180px] text-[11px] font-semibold uppercase text-slate-500">Người thực hiện</TableHead>
                      <TableHead className="w-[160px] text-[11px] font-semibold uppercase text-slate-500">Nhóm</TableHead>
                      <TableHead className="w-[160px] text-[11px] font-semibold uppercase text-slate-500">Chi nhánh</TableHead>
                      <TableHead className="w-[140px] text-[11px] font-semibold uppercase text-slate-500">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, index) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-center text-[12px] font-medium text-slate-500">
                          {page * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell className="text-[12px] text-slate-500">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-[13px] font-medium text-slate-900">{log.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-[13px] font-medium text-slate-700">{log.actorName || "Hệ thống"}</p>
                        </TableCell>
                        <TableCell className="text-[12px] text-slate-600">
                          {log.moduleLabel || log.module}
                        </TableCell>
                        <TableCell className="text-[12px] text-slate-600">
                          {log.branchName || (log.branchId ? `#${log.branchId}` : "Toàn hệ thống")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("rounded-[4px] text-[11px] font-medium", actionClassNames[log.action] || "border-slate-200 bg-white text-slate-600")}
                          >
                            {log.actionLabel || log.action}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fcfcfc] px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-[11px] text-slate-500">
                    Hiển thị {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, totalElements)} trong {totalElements}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 bg-white text-[11px]"
                      disabled={page === 0 || isLoading}
                      onClick={() => setPage((value) => Math.max(value - 1, 0))}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Trước
                    </Button>
                    <span className="min-w-[60px] text-center text-[11px] font-medium text-slate-500">
                      {totalPages === 0 ? 0 : page + 1} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 bg-white text-[11px]"
                      disabled={page >= totalPages - 1 || isLoading}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Sau
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-300">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-slate-700">Chưa có hoạt động phù hợp</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

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
    <label className="relative block">
      <button
        type="button"
        onClick={openPicker}
        className={cn(
          "h-9 w-full rounded-md border border-slate-200 bg-white px-3 pr-9 text-left text-[12px] shadow-none outline-none transition-colors hover:border-blue-200 focus-visible:border-blue-300",
          !value && "text-slate-400",
        )}
        aria-label={label}
      >
        {value || "dd/mm/yyyy"}
      </button>
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        ref={inputRef}
        type="date"
        value={toIsoDateFilter(value) ?? ""}
        onChange={(event) => onChange(formatIsoDateForDisplay(event.target.value))}
        aria-label={label}
        className="absolute inset-y-0 right-0 h-9 w-10 cursor-pointer opacity-0"
      />
    </label>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm">
      <div>
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-[22px] font-semibold leading-none text-slate-900">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-slate-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const pad = (number: number) => String(number).padStart(2, "0");
  const time = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(":");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${time} ${day}/${month}/${year}`;
}

function formatDateFilterInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 4),
    digits.slice(4, 8),
  ].filter(Boolean);

  return parts.join("/");
}

function formatIsoDateForDisplay(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function toIsoDateFilter(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return `${yearText}-${monthText}-${dayText}`;
}
