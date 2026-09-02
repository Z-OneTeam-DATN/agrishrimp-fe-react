"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { InventoryExportTable } from "@/components/inventory/InventoryExportTable";
import { cn, resolveExportPartnerName } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import AdminDataSyncLoader from "@/components/admin/shared/AdminDataSyncLoader";
import { AdminDateRangeFilters } from "@/components/admin/shared/AdminDateRangeFilters";
import { getCurrentWeekRange, isDateInRange } from "@/lib/admin-date-filter";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AdminExportListPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const user = useAuthStore((state) => state.user);
  const canCreateExport = hasPermission(P.EXPORT_CREATE);
  const canApproveExport = hasPermission(P.EXPORT_APPROVE);
  const canFilterBranches = canApproveExport && isAdminRole(user?.role);
  const defaultDateRange = React.useMemo(() => getCurrentWeekRange(), []);
  const [activeTab, setActiveTab] = useState("all");
  const [exports, setExports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState(defaultDateRange.fromDate);
  const [toDate, setToDate] = useState(defaultDateRange.toDate);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await InventoryExportApiService.getAllExportCommands();
      const data = Array.isArray(result) ? result : result.content || [];
      setExports(data);
    } catch (error: any) {
      toast.error("Lỗi tải danh sách lệnh xuất");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const warehouseOptions = React.useMemo(() => {
    const map = new Map<string, string>();

    exports.forEach((item) => {
      const label = String(item.branchName || item.warehouseName || "").trim();
      if (label) map.set(label, label);
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [exports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedWarehouse, fromDate, toDate]);

  const baseFilteredData = React.useMemo(() => exports.filter((item) => {
    if (canFilterBranches && selectedWarehouse !== "all" && item.branchName !== selectedWarehouse) {
      return false;
    }

    if (!isDateInRange(item.createdAt, fromDate, toDate)) {
      return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const displayPartner = resolveExportPartnerName(item).toLowerCase();
      if (
        !String(item.code || "")
          .toLowerCase()
          .includes(q) &&
        !displayPartner.includes(q)
      ) {
        return false;
      }
    }

    return true;
  }), [exports, selectedWarehouse, searchQuery, fromDate, toDate, canFilterBranches]);

  const filteredData = baseFilteredData.filter((item) => {
    let matchTab = true;
    const status = (item.status || "").toUpperCase();
    if (activeTab === "pending") matchTab = status === "PENDING";
    else if (activeTab === "approved") matchTab = status === "APPROVED";
    else if (activeTab === "completed") matchTab = status === "COMPLETED";
    else if (activeTab === "cancelled") {
      matchTab = status === "CANCELLED" || status === "REJECTED";
    }

    if (!matchTab) return false;
    return true;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const counts = React.useMemo(() => {
    const s = (status: string) => (status || "").toUpperCase();
    return {
      all: baseFilteredData.length,
      pending: baseFilteredData.filter((t) => s(t.status) === "PENDING").length,
      approved: baseFilteredData.filter((t) => s(t.status) === "APPROVED").length,
      completed: baseFilteredData.filter((t) => s(t.status) === "COMPLETED").length,
      cancelled: baseFilteredData.filter(
        (t) => s(t.status) === "CANCELLED" || s(t.status) === "REJECTED",
      ).length,
    };
  }, [baseFilteredData]);
  const totalExportAmount = React.useMemo(
    () => baseFilteredData.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0),
    [baseFilteredData],
  );

  const summaryCards = [
    {
      title: "Tổng giá trị",
      value: `${totalExportAmount.toLocaleString("vi-VN")} ₫`,
      description: "Tổng giá trị các phiếu xuất trả nhà cung cấp",
    },
    {
      title: "Phiếu chờ duyệt",
      value: counts.pending,
      description: "Đang chờ xác nhận trước khi xuất kho",
    },
    {
      title: "Đã xuất kho",
      value: counts.completed,
      description: "Phiếu đã hoàn tất xuất kho",
    },
    {
      title: "Đã hủy",
      value: counts.cancelled,
      description: "Phiếu đã bị hủy hoặc từ chối xử lý",
    },
  ];

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ duyệt" },
    { id: "approved", label: "Đã duyệt" },
    { id: "completed", label: "Đã xuất kho" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-3">
      <div className="mt-2 mb-8 space-y-4 px-1">
        <div className="space-y-3">
          <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
            Danh sách phiếu xuất trả NCC
          </h1>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-[320px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                  size={16}
                />
                <Input
                  placeholder="Tìm mã lệnh, đối tác nhận..."
                  className="h-[38px] rounded-[4px] border-slate-200 bg-white pl-10 text-[13px] shadow-none focus-visible:ring-blue-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <AdminDateRangeFilters
                idPrefix="export"
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
              />
              {canFilterBranches && warehouseOptions.length > 0 && (
                <div className="w-full sm:w-[180px]">
                  <Select
                    value={selectedWarehouse}
                    onValueChange={setSelectedWarehouse}
                  >
                    <SelectTrigger className="h-[38px] rounded-[4px] border-slate-200 bg-white text-[13px] shadow-none focus:ring-0">
                      <SelectValue placeholder="Chọn chi nhánh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Chọn chi nhánh</SelectItem>
                      {warehouseOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

          {canCreateExport && (
          <Button
            className="h-[38px] shrink-0 self-end bg-blue-600 px-4 text-[13px] font-medium text-white shadow-sm hover:bg-blue-700 lg:self-auto"
            onClick={() => router.push("/admin/exports/new-command")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo phiếu xuất trả NCC
          </Button>
          )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          {[
            ...summaryCards.slice(0, 2),
            {
              title: "Đã duyệt",
              value: counts.approved,
              description: "Phiếu chờ chi nhánh kiểm tra và xuất kho",
            },
            ...summaryCards.slice(2),
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[4px] border border-[#dcdcdc] bg-white p-3 shadow-sm"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-600">
                  {card.title}
                </p>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                  {card.value}
                </p>
                <p className="text-[10px] leading-4.5 text-slate-500">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const count = (counts as any)[tab.id] ?? 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "h-[34px] rounded-[4px] border px-3 text-[12px] font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "ml-2 text-[11px]",
                      activeTab === tab.id ? "text-blue-500" : "text-slate-400",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
        </div>

        <div className="overflow-hidden rounded-[4px] border border-[#dcdcdc] bg-white shadow-sm">
          {isLoading ? (
            <AdminDataSyncLoader />
          ) : displayData.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center bg-white text-slate-400">
              <div className="mb-3 rounded-full bg-slate-50 p-4">
                <FileText className="opacity-20" size={40} />
              </div>
              <p className="text-xs font-medium uppercase">
                Không có dữ liệu phù hợp
              </p>
            </div>
          ) : (
            <InventoryExportTable
              exports={displayData}
              totalCount={totalItems}
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onRefresh={fetchList}
            />
          )}
        </div>
      </div>
    </div>
  );
}

