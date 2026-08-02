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
  type StockSummaryData,
} from "@/app/services/inventory-report.service";
import { useAuthStore } from "@/stores/useAuthStore";

const PAGE_SIZE = 20;

function InventoryStockSummaryContent() {
  const router = useRouter();
  const { user, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();
  const canSelectAllBranches = hasPermission(P.REPORT_INVENTORY_VIEW_ALL_BRANCHES);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    canSelectAllBranches ? "all" : ownBranchId || "all",
  );
  const [rows, setRows] = useState<StockSummaryData[]>([]);
  const [filteredRows, setFilteredRows] = useState<StockSummaryData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      const data = await InventoryReportService.getStockSummary(selectedBranchId);
      setRows(Array.isArray(data) ? data : []);
      setFilteredRows(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (error) {
      console.error("Lỗi tải báo cáo tồn kho:", error);
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    const lower = val.toLowerCase();
    setFilteredRows(
      rows.filter(
        (r) =>
          r.productName?.toLowerCase().includes(lower) ||
          r.sku?.toLowerCase().includes(lower),
      ),
    );
    setPage(1);
  };

  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const branchLabel =
    selectedBranchId === "all"
      ? "Tất cả chi nhánh"
      : branches.find((b) => b.id.toString() === selectedBranchId)?.name || "Chi nhánh";

  const totals = filteredRows.reduce(
    (acc, r) => ({
      branchQuantity: acc.branchQuantity + (r.branchQuantity || 0),
      branchValue: acc.branchValue + (r.branchValue || 0),
      systemQuantity: acc.systemQuantity + (r.systemQuantity || 0),
      systemValue: acc.systemValue + (r.systemValue || 0),
    }),
    { branchQuantity: 0, branchValue: 0, systemQuantity: 0, systemValue: 0 },
  );

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
        "Loại sản phẩm": r.categoryName || "",
        [`Tồn kho (${branchLabel})`]: r.branchQuantity,
        [`Giá trị tồn kho (${branchLabel})`]: r.branchValue,
        "Giá vốn": r.branchAvgCost,
        "Tỷ trọng (%)": r.branchWeightPercent,
        "Tồn kho hệ thống": r.systemQuantity,
        "Giá trị tồn kho hệ thống": r.systemValue,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bao cao ton kho");
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Bao_Cao_Ton_Kho_${dateStr}.xlsx`);
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
          <h1 className="text-[20px] font-medium text-slate-800">Báo cáo tồn kho</h1>
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

      <div className="px-6 py-2 flex items-center gap-4 bg-white/50">
        <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={!canSelectAllBranches}>
          <SelectTrigger className="h-8 w-[220px] text-[13px] border-slate-300 rounded-none shadow-none bg-white font-medium">
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

        <div className="relative flex-1 max-w-[400px]">
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
              <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest">
                Đang tải dữ liệu báo cáo...
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white">
              <div className="relative w-24 h-24 mb-6 text-slate-200">
                <Search size={96} strokeWidth={1} />
              </div>
              <p className="text-[18px] text-slate-500 font-medium tracking-tight">
                Báo cáo không có dữ liệu
              </p>
            </div>
          ) : (
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-[#5c7293] hover:bg-[#5c7293] border-b border-white/20">
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[60px]">STT</TableHead>
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center min-w-[200px]">Phiên bản sản phẩm</TableHead>
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[120px]">Loại sản phẩm</TableHead>
                  <TableHead rowSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[120px]">Mã SKU</TableHead>
                  <TableHead colSpan={4} className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center bg-[#4a5d7a]">{branchLabel}</TableHead>
                  <TableHead colSpan={2} className="text-white font-bold text-[11px] uppercase whitespace-nowrap text-center bg-[#4a5d7a]">Hệ thống</TableHead>
                </TableRow>
                <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[100px]">Tồn kho</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[140px]">Giá trị tồn kho</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[130px]">Giá vốn</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[110px]">Tỷ trọng (%)</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[100px]">Tồn kho</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap text-right w-[140px]">Giá trị tồn kho</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-slate-50 border-b border-[#eee] font-black">
                  <TableCell colSpan={4} className="p-3 pl-6 text-[13px] text-slate-800">
                    Tổng {filteredRows.length} sản phẩm
                  </TableCell>
                  <TableCell className="p-3 text-right text-[13px] text-slate-800">{formatNumber(totals.branchQuantity)}</TableCell>
                  <TableCell className="p-3 text-right text-[13px] text-slate-800">{formatNumber(totals.branchValue)}</TableCell>
                  <TableCell className="p-3" />
                  <TableCell className="p-3" />
                  <TableCell className="p-3 text-right text-[13px] text-slate-800">{formatNumber(totals.systemQuantity)}</TableCell>
                  <TableCell className="p-3 text-right text-[13px] text-slate-800">{formatNumber(totals.systemValue)}</TableCell>
                </TableRow>
                {pagedRows.map((r, index) => (
                  <TableRow key={r.variantId} className="bg-white border-b border-[#eee] hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center text-slate-400 font-bold text-[12px]">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell className="p-3 text-[13px] font-bold text-slate-800">{r.productName}</TableCell>
                    <TableCell className="text-center text-[12px] text-slate-600">{r.categoryName || "—"}</TableCell>
                    <TableCell className="text-center font-mono text-[12px] text-blue-600">{r.sku}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-800">{formatNumber(r.branchQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-800">{formatNumber(r.branchValue)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-500">{formatNumber(r.branchAvgCost)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-500">{r.branchWeightPercent.toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-800">{formatNumber(r.systemQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-800">{formatNumber(r.systemValue)}</TableCell>
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

export default function InventoryStockSummaryReportPage() {
  return (
    <PermissionGuard permission={P.REPORT_INVENTORY_VIEW}>
      <InventoryStockSummaryContent />
    </PermissionGuard>
  );
}
