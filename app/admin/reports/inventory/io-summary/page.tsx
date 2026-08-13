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
import { formatNumber } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { TablePagination } from "@/components/admin/shared/TablePagination";

import { branchService } from "@/app/services/branchService";
import {
  InventoryReportService,
  type InventoryIOSummaryData,
} from "@/app/services/inventory-report.service";
import { useAuthStore } from "@/stores/useAuthStore";

const PAGE_SIZE = 20;

const toIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function InventoryIOSummaryContent() {
  const router = useRouter();
  const { user, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canSelectAllBranches = hasPermission(P.REPORT_INVENTORY_VIEW_ALL_BRANCHES);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [branches, setBranches] = useState<any[]>([]);
  // Tồn đầu/nhập/xuất/tồn cuối đều cộng dồn được bình thường giữa các chi nhánh (y hệt cách "Báo
  // cáo tồn kho" cộng cột "Hệ thống") — trước đây thiếu lựa chọn "Tất cả chi nhánh" do nhầm tưởng
  // không cộng dồn được, không phải giới hạn kỹ thuật thật sự.
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    canSelectAllBranches ? "all" : ownBranchId || "",
  );
  const [dateFrom, setDateFrom] = useState(toIso(firstDayOfMonth));
  const [dateTo, setDateTo] = useState(toIso(today));
  const [rows, setRows] = useState<InventoryIOSummaryData[]>([]);
  const [filteredRows, setFilteredRows] = useState<InventoryIOSummaryData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await branchService.getAll();
        const list = Array.isArray(res) ? res : res?.data || res?.content || [];
        const scoped =
          !canSelectAllBranches && ownBranchId
            ? list.filter((b: any) => String(b.id) === ownBranchId)
            : list;
        setBranches(scoped);
        if (!selectedBranchId && scoped.length > 0) {
          setSelectedBranchId(scoped[0].id.toString());
        }
      } catch (error) {
        console.error("Lỗi tải danh sách chi nhánh", error);
      }
    };
    void loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSelectAllBranches, ownBranchId]);

  const fetchData = async () => {
    if (!selectedBranchId) return;
    setIsLoading(true);
    try {
      const data = await InventoryReportService.getIOSummary({
        branchId: selectedBranchId,
        startDate: dateFrom,
        endDate: dateTo,
      });
      setRows(Array.isArray(data) ? data : []);
      setFilteredRows(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (error) {
      console.error("Lỗi tải báo cáo xuất nhập tồn:", error);
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, dateFrom, dateTo]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    const lower = val.toLowerCase();
    setFilteredRows(
      rows.filter(
        (r) => r.productName?.toLowerCase().includes(lower) || r.sku?.toLowerCase().includes(lower),
      ),
    );
    setPage(1);
  };

  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = async () => {
    if (filteredRows.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const exportData = filteredRows.map((r, index) => ({
        STT: index + 1,
        SKU: r.sku,
        "Tên sản phẩm": r.productName,
        "Tồn đầu kỳ - SL": r.openingQuantity,
        "Tồn đầu kỳ - Giá trị": r.openingValue,
        "Nhập trong kỳ - SL": r.importedQuantity,
        "Nhập trong kỳ - Giá trị": r.importedValue,
        "Xuất trong kỳ - SL": r.exportedQuantity,
        "Xuất trong kỳ - Giá trị": r.exportedValue,
        "Tồn cuối kỳ - SL": r.closingQuantity,
        "Tồn cuối kỳ - Giá trị": r.closingValue,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Xuat nhap ton");
      XLSX.writeFile(wb, `Xuat_Nhap_Ton_${dateFrom}_den_${dateTo}.xlsx`);
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
          <h1 className="text-[20px] font-medium text-slate-800">Báo cáo xuất nhập tồn sản phẩm</h1>
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

        <AdminDateRangeFilters idPrefix="inventory-io-summary" fromDate={dateFrom} toDate={dateTo} onFromDateChange={setDateFrom} onToDateChange={setDateTo} />

        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            placeholder="Tìm theo tên hoặc mã SKU..."
            className="w-full h-8 pl-9 text-[13px] border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-slate-300" onClick={fetchData}>
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="px-6">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 size={40} className="animate-spin text-blue-600 mb-2" />
              <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest">Đang tải dữ liệu báo cáo...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white">
              <div className="relative w-24 h-24 mb-6 text-slate-200">
                <Search size={96} strokeWidth={1} />
              </div>
              <p className="text-[18px] text-slate-500 font-medium tracking-tight">Báo cáo không có dữ liệu</p>
            </div>
          ) : (
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-[#5c7293] hover:bg-[#5c7293] border-b border-white/20">
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[50px]">STT</TableHead>
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 min-w-[200px]">Phiên bản sản phẩm</TableHead>
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[120px]">Mã SKU</TableHead>
                  <TableHead colSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center bg-[#4a5d7a]">Tồn đầu kỳ</TableHead>
                  <TableHead colSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center bg-[#4a5d7a]">Nhập trong kỳ</TableHead>
                  <TableHead colSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center bg-[#4a5d7a]">Xuất trong kỳ</TableHead>
                  <TableHead colSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap text-center bg-[#4a5d7a]">Tồn cuối kỳ</TableHead>
                </TableRow>
                <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[85px]">SL</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[120px]">Giá trị</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[85px]">SL</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[120px]">Giá trị</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[85px]">SL</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[120px]">Giá trị</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[85px]">SL</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap text-right w-[120px]">Giá trị</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-slate-50 border-b border-[#eee] font-black">
                  <TableCell colSpan={3} className="p-3 pl-6 text-[13px] text-slate-800">
                    Tổng {filteredRows.length} sản phẩm
                  </TableCell>
                  <TableCell colSpan={8} />
                </TableRow>
                {pagedRows.map((r, index) => (
                  <TableRow key={r.variantId} className="bg-white border-b border-[#eee] hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center text-slate-400 font-bold text-[12px]">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell className="p-3 text-[13px] font-bold text-slate-800">{r.productName}</TableCell>
                    <TableCell className="text-center font-mono text-[12px] text-blue-600">{r.sku}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-600">{formatNumber(r.openingQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-600">{formatNumber(r.openingValue)}</TableCell>
                    <TableCell className="text-right text-[13px] text-emerald-600">{formatNumber(r.importedQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] text-emerald-600">{formatNumber(r.importedValue)}</TableCell>
                    <TableCell className="text-right text-[13px] text-rose-600">{formatNumber(r.exportedQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] text-rose-600">{formatNumber(r.exportedValue)}</TableCell>
                    <TableCell className="text-right text-[13px] font-bold text-slate-800">{formatNumber(r.closingQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] font-bold text-slate-800">{formatNumber(r.closingValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && filteredRows.length > 0 && (
            <TablePagination page={page} totalItems={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InventoryIOSummaryReportPage() {
  return (
    <PermissionGuard permission={P.REPORT_INVENTORY_VIEW}>
      <InventoryIOSummaryContent />
    </PermissionGuard>
  );
}
