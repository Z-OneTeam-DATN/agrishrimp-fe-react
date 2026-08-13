"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { AdminDateRangeFilters } from "@/components/admin/shared/AdminDateRangeFilters";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { cn, formatNumber } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { TablePagination } from "@/components/admin/shared/TablePagination";

import { branchService } from "@/app/services/branchService";
import {
  InventoryReportService,
  type InventoryLedgerEntryData,
} from "@/app/services/inventory-report.service";
import { useAuthStore } from "@/stores/useAuthStore";

const PAGE_SIZE = 20;

const toIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateTimeVN = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function InventoryLedgerContent() {
  const router = useRouter();
  const { user, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canSelectAllBranches = hasPermission(P.REPORT_INVENTORY_VIEW_ALL_BRANCHES);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    canSelectAllBranches ? "all" : ownBranchId || "all",
  );
  const [dateFrom, setDateFrom] = useState(toIso(defaultStart));
  const [dateTo, setDateTo] = useState(toIso(today));
  const [direction, setDirection] = useState<"all" | "import" | "export" | "transfer">("all");
  const [entries, setEntries] = useState<InventoryLedgerEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!canSelectAllBranches && ownBranchId) {
      setSelectedBranchId(ownBranchId);
    }
  }, [canSelectAllBranches, ownBranchId]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchService.getAll();
        const list = Array.isArray(res) ? res : res?.data || res?.content || [];
        setBranches(
          !canSelectAllBranches && ownBranchId
            ? list.filter((b: any) => String(b.id) === ownBranchId)
            : list,
        );
      } catch (error) {
        console.error("Lỗi tải danh sách chi nhánh", error);
      }
    };
    void loadBranches();
  }, [canSelectAllBranches, ownBranchId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryReportService.getLedger({
        branchId: selectedBranchId,
        startDate: dateFrom,
        endDate: dateTo,
        direction,
      });
      setEntries(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (error) {
      console.error("Lỗi tải sổ kho:", error);
      toast.error("Không thể tải dữ liệu sổ kho");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, dateFrom, dateTo, direction]);

  const pagedEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = async () => {
    if (entries.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const exportData = entries.map((e, index) => ({
        STT: index + 1,
        "Thời gian": formatDateTimeVN(e.createdAt),
        SKU: e.sku,
        "Tên sản phẩm": e.productName,
        "Loại giao dịch": e.type,
        "Số lượng": e.quantityChange,
        "Tồn trước": e.balanceBefore,
        "Tồn sau": e.balanceAfter,
        "Chi nhánh": e.branchName,
        "Người tạo": e.createdByName,
        "Lý do": e.reason || "",
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "So kho");
      XLSX.writeFile(wb, `So_Kho_${dateFrom}_den_${dateTo}.xlsx`);
      toast.success("Đã xuất báo cáo Excel");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-10 bg-[#f0f2f5] min-h-screen">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/reports/inventory")}
            className="h-8 w-8 text-slate-500 border border-slate-200 rounded-none"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[20px] font-medium text-slate-800">Sổ kho</h1>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting || isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black uppercase h-9 rounded-none shadow-sm flex items-center gap-2"
        >
          {isExporting ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
          Xuất báo cáo
        </Button>
      </div>

      <div className="px-6 py-2 flex flex-wrap items-center gap-4 bg-white/50">
        <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={!canSelectAllBranches}>
          <SelectTrigger className="h-8 w-[200px] text-[13px] border-slate-300 rounded-none shadow-none bg-white font-medium">
            <SelectValue placeholder="Chọn chi nhánh" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {canSelectAllBranches && <SelectItem value="all">Tất cả chi nhánh</SelectItem>}
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id.toString()}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AdminDateRangeFilters idPrefix="inventory-ledger" fromDate={dateFrom} toDate={dateTo} onFromDateChange={setDateFrom} onToDateChange={setDateTo} />

        <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
          <SelectTrigger className="h-8 w-[160px] text-[13px] border-slate-300 rounded-none shadow-none bg-white">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem value="all">Tất cả giao dịch</SelectItem>
            <SelectItem value="import">Nhập kho</SelectItem>
            <SelectItem value="export">Xuất kho</SelectItem>
            <SelectItem value="transfer">Điều chuyển</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-slate-300" onClick={fetchData}>
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="px-6">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 size={40} className="animate-spin text-blue-600 mb-2" />
              <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest">Đang tải dữ liệu sổ kho...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white">
              <div className="relative w-24 h-24 mb-6 text-slate-200">
                <Search size={96} strokeWidth={1} />
              </div>
              <p className="text-[18px] text-slate-500 font-medium tracking-tight">Không có giao dịch nào trong kỳ đã chọn</p>
            </div>
          ) : (
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[50px]">STT</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[150px]">Thời gian</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 min-w-[200px]">Phiên bản sản phẩm</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[100px]">Mã SKU</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[140px]">Loại giao dịch</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[100px]">Số lượng</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[100px]">Tồn trước</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[100px]">Tồn sau</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[130px]">Người tạo</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap min-w-[180px]">Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-slate-50 border-b border-[#eee] font-black">
                  <TableCell colSpan={10} className="p-3 pl-6 text-[13px] text-slate-800">
                    Tổng {entries.length} giao dịch
                  </TableCell>
                </TableRow>
                {pagedEntries.map((e, index) => (
                  <TableRow key={e.id} className="bg-white border-b border-[#eee] hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center text-slate-400 font-bold text-[12px]">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell className="text-center text-[12px] text-slate-600">{formatDateTimeVN(e.createdAt)}</TableCell>
                    <TableCell className="p-3 text-[13px] font-bold text-slate-800">{e.productName}</TableCell>
                    <TableCell className="text-center font-mono text-[12px] text-blue-600">{e.sku}</TableCell>
                    <TableCell className="text-center text-[12px] text-slate-600">{e.type}</TableCell>
                    <TableCell className={cn("text-right text-[13px] font-bold", e.quantityChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {e.quantityChange >= 0 ? "+" : ""}{formatNumber(e.quantityChange)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] text-slate-500">{formatNumber(e.balanceBefore)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-800 font-bold">{formatNumber(e.balanceAfter)}</TableCell>
                    <TableCell className="text-center text-[12px] text-slate-600">{e.createdByName}</TableCell>
                    <TableCell className="p-3 text-[12px] text-slate-500">{e.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && entries.length > 0 && (
            <TablePagination page={page} totalItems={entries.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InventoryLedgerReportPage() {
  return (
    <PermissionGuard permission={P.REPORT_INVENTORY_VIEW}>
      <InventoryLedgerContent />
    </PermissionGuard>
  );
}

