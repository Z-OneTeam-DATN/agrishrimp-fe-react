"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Download,
  Printer,
  HelpCircle,
  Search,
  FileDown,
  AlertTriangle,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { branchService } from "@/app/services/branchService";
import { ProductService } from "@/app/services/product.service";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { TablePagination } from "@/components/admin/shared/TablePagination";
import { registerVietnameseFont, VIETNAMESE_PDF_FONT } from "@/lib/pdf-vietnamese-font";
import { useAuthStore } from "@/stores/useAuthStore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PAGE_SIZE = 20;

const filterLowStockProducts = (items: any[], keyword: string) => {
  const searchLower = keyword.trim().toLowerCase();
  if (!searchLower) return items;

  return items.filter((p) =>
    (p.productName || p.name || "").toLowerCase().includes(searchLower) ||
    (p.sku || "").toLowerCase().includes(searchLower) ||
    (p.branchName || "").toLowerCase().includes(searchLower)
  );
};

function InventoryBelowMinReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, warehouseId } = useAuthStore();
  const { hasPermission } = usePermissions();

  const canSelectAllBranches = hasPermission(P.REPORT_INVENTORY_VIEW_ALL_BRANCHES);
  const ownBranchId = (user?.branch?.id ?? warehouseId)?.toString() || "";

  const ALL_BRANCHES = "all";

  const branchIdFromUrl = searchParams.get("branchId");
  const initialBranchId =
    branchIdFromUrl && (canSelectAllBranches || branchIdFromUrl === ownBranchId)
      ? branchIdFromUrl
      : canSelectAllBranches
        ? ALL_BRANCHES
        : ownBranchId;

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);

  const selectedBranchName =
    selectedBranchId === ALL_BRANCHES
      ? "Tất cả chi nhánh"
      : branches.find((b) => b.id.toString() === selectedBranchId)?.name ||
        "Chi nhánh";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let currentBranchId = selectedBranchId;
      let currentBranches = branches;

      if (branches.length === 0) {
        const branchData = await branchService.getAll();
        const allBranches = Array.isArray(branchData) ? branchData : (branchData?.content || []);
        currentBranches =
          !canSelectAllBranches && ownBranchId
            ? allBranches.filter((b: any) => String(b.id) === ownBranchId)
            : allBranches;
        setBranches(currentBranches);

        if (!canSelectAllBranches && currentBranches.length > 0 && !selectedBranchId) {
          currentBranchId = currentBranches[0].id.toString();
          setSelectedBranchId(currentBranchId);
        }
      }

      if (!canSelectAllBranches && !currentBranchId && currentBranches.length > 0) {
        currentBranchId = currentBranches[0].id.toString();
        setSelectedBranchId(currentBranchId);
      }

      if (currentBranchId) {

        const response = await ProductService.getLowStockReport(
          currentBranchId === ALL_BRANCHES ? undefined : currentBranchId,
        );

        const lowStockList = Array.isArray(response) ? response : [];

        setProducts(lowStockList);
        setFilteredProducts(filterLowStockProducts(lowStockList, searchTerm));
        setPage(1);
      }
    } catch (error) {
      console.error("Error fetching low-stock report:", error);
      toast.error("Không thể tải dữ liệu báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setFilteredProducts(filterLowStockProducts(products, val));
    setPage(1);
  };

  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportExcel = async () => {
    if (filteredProducts.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");

      const branchName = selectedBranchName;
      const exportDate = new Date().toLocaleString("vi-VN");

      const headerInfo = [
        ["BÁO CÁO CHI TIẾT SẢN PHẨM DƯỚI ĐỊNH MỨC TỒN KHO"],
        [`Chi nhánh: ${branchName}`],
        [`Thời gian xuất: ${exportDate}`],
        [],
      ];

      const tableData = filteredProducts.map((p, index) => {
        const qty = p.quantity || 0;

        return {
          "STT": index + 1,
          "Chi nhánh": p.branchName || branchName,
          "SKU": p.sku || "",
          "Tên sản phẩm": p.productName || "",
          "Tồn hiện tại": qty,
          "Tồn chi nhánh tổng": p.mainBranchQuantity ?? 0,
          "Định mức": p.minThreshold || 10
        };
      });

      const ws = XLSX.utils.aoa_to_sheet(headerInfo);

      XLSX.utils.sheet_add_json(ws, tableData, { origin: "A5" });

      const wscols = [
        { wch: 8 },
        { wch: 25 },
        { wch: 25 },
        { wch: 60 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
      ];
      ws['!cols'] = wscols;

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bao cao ton kho thap");

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "-");
      const fileName = `Bao_Cao_Ton_Kho_Thap_${branchName.replace(/\s/g, "_")}_${dateStr}_${timeStr}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Đã xuất báo cáo danh sách sản phẩm tồn thấp.");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    if (filteredProducts.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }

    const branchName = selectedBranchName;
    const exportDate = new Date().toLocaleString("vi-VN");

    const doc = new jsPDF({ orientation: "landscape" });
    registerVietnameseFont(doc);
    doc.setFontSize(14);
    doc.text("BÁO CÁO TỒN KHO DƯỚI ĐỊNH MỨC AGRI SHRIMP", 14, 14);
    doc.setFontSize(10);
    doc.text(`Chi nhánh: ${branchName}`, 14, 20);
    doc.text(`Thời gian xuất: ${exportDate}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [["Chi nhánh", "SKU", "Tên sản phẩm", "Tồn hiện tại", "Tồn chi nhánh tổng", "Định mức tối thiểu", "Thiếu hụt"]],
      body: filteredProducts.map((p) => [
        p.branchName || branchName,
        p.sku || "",
        p.productName || p.name || "",
        String(p.quantity || 0),
        String(p.mainBranchQuantity ?? 0),
        String(p.minThreshold ?? 10),
        String(p.shortage ?? Math.max(0, (p.minThreshold ?? 10) - (p.quantity || 0))),
      ]),
      styles: { fontSize: 8, font: VIETNAMESE_PDF_FONT },
      headStyles: { fillColor: [92, 114, 147], font: VIETNAMESE_PDF_FONT, fontStyle: "bold" },
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`Bao_Cao_Ton_Kho_Thap_${branchName.replace(/\s/g, "_")}_${dateStr}.pdf`);
    toast.success("Đã tải xuống file PDF");
  };

  const handlePrint = () => {
    if (filteredProducts.length === 0) {
      toast.warning("Không có dữ liệu để in");
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-4 pb-10 bg-[#f0f2f5] min-h-screen">

      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/reports/inventory")}
            className="h-8 w-8 text-slate-400 border border-slate-200 rounded-none"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-[20px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              Báo cáo tồn kho dưới định mức
              <Badge className="bg-rose-100 text-rose-600 border-rose-200 text-[11px] font-bold">CẢNH BÁO</Badge>
            </h1>
            <p className="text-[12px] text-slate-500 font-medium">Sản phẩm có tồn kho dưới 10 hoặc dưới định mức tối thiểu</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleExportExcel}
            disabled={isExporting || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black uppercase h-9 rounded-none shadow-sm flex items-center gap-2"
          >
            {isExporting ? <RefreshCw className="animate-spin" size={16} /> : <FileDown size={16} />}
            Xuất báo cáo
          </Button>
          <div className="h-6 w-[1px] bg-slate-300 mx-2"></div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-600">
            <button onClick={handleExportPdf} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Download size={16} /> Tải PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Printer size={16} /> In
            </button>
            <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-2 flex items-center gap-4 bg-white/50">
        <Select value={selectedBranchId} onValueChange={setSelectedBranchId} disabled={!canSelectAllBranches}>
          <SelectTrigger className="h-8 w-[240px] text-[13px] border-slate-300 rounded-none shadow-none bg-white font-bold">
            <SelectValue placeholder="Chọn chi nhánh" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {canSelectAllBranches && (
              <SelectItem value={ALL_BRANCHES}>TẤT CẢ CHI NHÁNH</SelectItem>
            )}
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id.toString()}>{(b.name || b.branchName).toUpperCase()}</SelectItem>
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

        <div className="ms-auto flex items-center gap-2">
          <Badge className="bg-rose-500 text-white rounded-none border-none font-bold">
            {filteredProducts.length} SẢN PHẨM CẦN NHẬP
          </Badge>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-none border-slate-300" onClick={fetchData}>
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="px-6">
        <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-[400px]">
                <Loader2 size={40} className="animate-spin text-blue-600 mb-2" />
                <p className="text-[13px] text-slate-500 font-bold uppercase tracking-widest">Đang tải dữ liệu báo cáo...</p>
             </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center bg-white">
              <div className="relative w-24 h-24 mb-6 text-slate-200">
                <Search size={96} strokeWidth={1} />
              </div>
              <p className="text-[18px] text-slate-500 font-medium tracking-tight">
                Không tìm thấy sản phẩm nào dưới định mức
              </p>
            </div>
          ) : (
            <>
               <Table className="border-collapse">
                 <TableHeader>
                   <TableRow className="bg-[#5c7293] hover:bg-[#5c7293]">
                     <TableHead className="text-white text-[12px] whitespace-nowrap border-r border-white/10 text-center w-[50px]">STT</TableHead>
                     <TableHead className="text-white text-[12px] whitespace-nowrap border-r border-white/10 p-3 min-w-[200px]">Phiên bản sản phẩm</TableHead>
                     <TableHead className="text-white text-[12px] whitespace-nowrap border-r border-white/10 text-center w-[120px]">Mã SKU</TableHead>
                     <TableHead className="text-white text-[12px] whitespace-nowrap border-r border-white/10 text-right w-[150px]">Tồn kho hiện tại</TableHead>
                     <TableHead className="text-white text-[12px] whitespace-nowrap border-r border-white/10 text-right w-[150px]">Tồn Chi nhánh tổng</TableHead>
                     <TableHead className="text-white text-[12px] whitespace-nowrap border-r border-white/10 text-right w-[170px]">Định mức tối thiểu</TableHead>
                     <TableHead className="text-white text-[12px] whitespace-nowrap text-right w-[150px]">Thiếu hụt</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {pagedProducts.map((p, index) => (
                     <TableRow key={`${p.branchId || "all"}-${p.variantId || p.sku || index}`} className="bg-white border-b border-[#eee] hover:bg-slate-50 transition-colors group">
                       <TableCell className="text-center text-slate-400 font-bold text-[12px]">{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                       <TableCell className="p-3">
                         <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.productName || p.name}</span>
                           <div className="flex items-center gap-2 mt-1">
                             <Badge className="bg-rose-100 text-rose-600 border-rose-200 text-[9px] px-1.5 py-0 rounded-full font-black uppercase tracking-tighter">
                               Tồn thấp
                             </Badge>
                             {p.branchName && (
                               <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[9px] px-1.5 py-0 rounded-full font-black uppercase tracking-tighter">
                                 {p.branchName}
                               </Badge>
                             )}
                           </div>
                         </div>
                       </TableCell>
                       <TableCell className="text-center font-mono text-[12px] text-blue-600">{p.sku}</TableCell>
                       <TableCell className="text-right font-black text-[14px] text-rose-600 bg-rose-50/30">{p.quantity || 0}</TableCell>
                       <TableCell className="text-right font-bold text-[14px] text-slate-700 bg-slate-50/30">{p.mainBranchQuantity ?? 0}</TableCell>
                       <TableCell className="text-right font-bold text-[13px] text-slate-500 italic">{p.minThreshold ?? 10}</TableCell>
                       <TableCell className="text-right p-3">
                         <div className="flex items-center justify-end gap-1.5 text-rose-600 font-black">
                           <AlertTriangle size={14} />
                           <span className="text-[14px]">{p.shortage ?? Math.max(0, (p.minThreshold ?? 10) - (p.quantity || 0))}</span>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}

                   <TableRow className="bg-slate-50 border-t-2 border-slate-200 font-black">
                     <TableCell colSpan={5} className="p-4 text-right text-[12px] uppercase text-slate-500">Tổng cộng sản phẩm sắp hết hàng:</TableCell>
                     <TableCell colSpan={2} className="p-4 text-right text-[16px] text-rose-600 pr-8">
                       {filteredProducts.length} mặt hàng
                     </TableCell>
                   </TableRow>

                </TableBody>
              </Table>
              <TablePagination page={page} totalItems={filteredProducts.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

              <div className="p-6 bg-blue-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[13px] text-blue-700 font-medium">
                  <RefreshCw size={18} />
                  <span>Dữ liệu được cập nhật dựa trên tồn kho thực tế của chi nhánh đã chọn.</span>
                </div>
                {selectedBranchId !== ALL_BRANCHES && selectedBranchId !== "1" ? (
                  <Button
                    onClick={() => {
                      const itemsParam = filteredProducts.map(p => ({
                        variantId: p.variantId,
                        sku: p.sku,
                        productName: p.productName,
                        quantity: p.shortage || Math.max(0, (p.minThreshold ?? 10) - (p.quantity || 0)),
                        unit: p.unit || "Cái",
                        availableQuantity: p.mainBranchQuantity || 0
                      }));
                      router.push(
                        `/admin/transfers/new?sourceBranch=1&destBranch=${selectedBranchId}&items=${encodeURIComponent(
                          JSON.stringify(itemsParam)
                        )}`
                      );
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[12px] h-10 rounded-none px-6"
                    title="Tạo phiếu điều chuyển từ Kho Tổng về chi nhánh hiện tại"
                  >
                    Tạo điều chuyển từ Kho Tổng
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/admin/receipts/select-request")}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 font-bold uppercase text-[12px] h-10 rounded-none px-6"
                    title="Phải có phiếu yêu cầu mua đã gửi nhà cung cấp thì mới tạo được phiếu nhập kho"
                  >
                    Xử lý nhập hàng
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InventoryBelowMinReportPage() {
  return (
    <PermissionGuard permission={P.REPORT_INVENTORY_VIEW}>
      <InventoryBelowMinReportContent />
    </PermissionGuard>
  );
}

