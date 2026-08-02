"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { P } from "@/lib/permissions";
import { TablePagination } from "@/components/admin/shared/TablePagination";

import { InventoryCheckApiService } from "@/app/services/inventory.service";

const PAGE_SIZE = 20;

const toIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateVN = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN");
};

// COMPLETED / COUNTING_COMPLETED (giá trị legacy) đều là trạng thái "đã duyệt cân bằng tồn kho" —
// chỉ những phiếu này mới có số liệu chốt cuối cùng, đáng tin cậy để đưa vào báo cáo.
const COMPLETED_STATUSES = new Set(["COMPLETED", "COUNTING_COMPLETED"]);

type CheckReportRow = {
  key: string;
  checkDate: string | null;
  productName: string;
  sku: string;
  systemQuantity: number;
  actualQuantity: number;
  diff: number;
  damaged: number;
  reason: string;
  branchName: string;
  checkCode: string;
};

function InventoryCheckReportContent() {
  const router = useRouter();
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(toIso(defaultStart));
  const [dateTo, setDateTo] = useState(toIso(today));
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await InventoryCheckApiService.getAll();
      setNotes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải báo cáo kiểm kê:", error);
      toast.error("Không thể tải dữ liệu báo cáo kiểm kê");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const rows: CheckReportRow[] = useMemo(() => {
    const start = dateFrom ? new Date(dateFrom) : null;
    const end = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const searchLower = searchTerm.trim().toLowerCase();

    const flattened: CheckReportRow[] = [];
    for (const note of notes) {
      if (!COMPLETED_STATUSES.has(note.checkWorkflowStatus)) continue;

      const checkDate: string | null = note.checkDate || note.checkApprovedAt || note.createdAt || null;
      if (checkDate) {
        const d = new Date(checkDate);
        if (start && d < start) continue;
        if (end && d > end) continue;
      }

      for (const detail of note.details || []) {
        const productName = detail.productName || detail.name || "";
        const sku = detail.sku || "";
        if (
          searchLower &&
          !productName.toLowerCase().includes(searchLower) &&
          !sku.toLowerCase().includes(searchLower)
        ) {
          continue;
        }

        const systemQuantity = detail.systemQuantity ?? detail.quantity ?? 0;
        const actualQuantity = detail.quantityReal ?? 0;

        flattened.push({
          key: `${note.id}-${detail.id}`,
          checkDate,
          productName,
          sku,
          systemQuantity,
          actualQuantity,
          diff: actualQuantity - systemQuantity,
          damaged: detail.quantityRejected ?? 0,
          reason: detail.note || "",
          branchName: note.branchName || "",
          checkCode: note.code || "",
        });
      }
    }

    flattened.sort((a, b) => (b.checkDate || "").localeCompare(a.checkDate || ""));
    return flattened;
  }, [notes, dateFrom, dateTo, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, searchTerm, notes]);

  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = async () => {
    if (rows.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      const exportData = rows.map((r, index) => ({
        STT: index + 1,
        "Mã phiếu": r.checkCode,
        "Ngày kiểm kê": formatDateVN(r.checkDate),
        "Chi nhánh": r.branchName,
        SKU: r.sku,
        "Tên sản phẩm": r.productName,
        "Tồn hệ thống": r.systemQuantity,
        "Thực tế": r.actualQuantity,
        Lệch: r.diff,
        "Hàng hỏng": r.damaged,
        "Lý do": r.reason,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kiem ke");
      XLSX.writeFile(wb, `Bao_Cao_Kiem_Ke_${dateFrom}_den_${dateTo}.xlsx`);
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
          <div>
            <h1 className="text-[20px] font-medium text-slate-800">Báo cáo kiểm kê hàng hóa</h1>
            <p className="text-[12px] text-slate-500 font-medium">Chỉ hiển thị các phiếu kiểm kê đã duyệt cân bằng tồn kho</p>
          </div>
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
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-700">Từ ngày</span>
          <SharedDatePicker value={dateFrom} onChange={setDateFrom} placeholder="Từ ngày" variant="compact" buttonClassName="h-8 w-[140px] border-slate-300 rounded-none text-[13px] shadow-none" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-700">Đến ngày</span>
          <SharedDatePicker value={dateTo} onChange={setDateTo} placeholder="Đến ngày" variant="compact" buttonClassName="h-8 w-[140px] border-slate-300 rounded-none text-[13px] shadow-none" />
        </div>

        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            placeholder="Tìm theo tên hoặc mã SKU..."
            className="w-full h-8 pl-9 text-[13px] border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          ) : rows.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white">
              <div className="relative w-24 h-24 mb-6 text-slate-200">
                <Search size={96} strokeWidth={1} />
              </div>
              <p className="text-[18px] text-slate-500 font-medium tracking-tight">Chưa có phiếu kiểm kê nào đã duyệt trong kỳ này</p>
            </div>
          ) : (
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[50px]">STT</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[120px]">Ngày kiểm kê</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 min-w-[200px]">Phiên bản sản phẩm</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-center w-[110px]">Mã SKU</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[110px]">Tồn hệ thống</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[90px]">Thực tế</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[80px]">Lệch</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap border-r border-white/10 text-right w-[110px]">Hàng hỏng</TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase whitespace-nowrap text-left w-[160px]">Lý do</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-slate-50 border-b border-[#eee] font-black">
                  <TableCell colSpan={9} className="p-3 pl-6 text-[13px] text-slate-800">
                    Tổng {rows.length} dòng kiểm kê
                  </TableCell>
                </TableRow>
                {pagedRows.map((r, index) => (
                  <TableRow key={r.key} className="bg-white border-b border-[#eee] hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center text-slate-400 font-bold text-[12px]">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell className="text-center text-[12px] text-slate-600">{formatDateVN(r.checkDate)}</TableCell>
                    <TableCell className="p-3 text-[13px] font-bold text-slate-800">{r.productName}</TableCell>
                    <TableCell className="text-center font-mono text-[12px] text-blue-600">{r.sku}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-600">{formatNumber(r.systemQuantity)}</TableCell>
                    <TableCell className="text-right text-[13px] text-slate-800 font-bold">{formatNumber(r.actualQuantity)}</TableCell>
                    <TableCell className={`text-right text-[13px] font-bold ${r.diff === 0 ? "text-slate-400" : r.diff > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {r.diff > 0 ? "+" : ""}{formatNumber(r.diff)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] text-rose-600">
                      {r.damaged > 0 ? (
                        <Badge className="bg-rose-100 text-rose-600 border-none">{formatNumber(r.damaged)}</Badge>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                    <TableCell className="text-left text-[12px] text-slate-500 italic">{r.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && rows.length > 0 && (
            <TablePagination page={page} totalItems={rows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InventoryCheckReportPage() {
  return (
    <PermissionGuard permission={P.REPORT_INVENTORY_VIEW}>
      <InventoryCheckReportContent />
    </PermissionGuard>
  );
}
