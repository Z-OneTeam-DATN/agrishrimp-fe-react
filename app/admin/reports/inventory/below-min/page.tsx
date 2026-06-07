"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function InventoryBelowMinReportPage() {
  const router = useRouter();
  
  // --- STATES ---
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let currentBranchId = selectedBranchId;
      let currentBranches = branches;

      // 1. Lấy danh sách chi nhánh (nếu chưa có)
      if (branches.length === 0) {
        const branchData = await branchService.getAll();
        currentBranches = Array.isArray(branchData) ? branchData : (branchData?.content || []);
        setBranches(currentBranches);
        
        // Nếu có danh sách chi nhánh và chưa chọn chi nhánh nào, chọn chi nhánh đầu tiên
        if (currentBranches.length > 0 && !selectedBranchId) {
          currentBranchId = currentBranches[0].id.toString();
          setSelectedBranchId(currentBranchId);
        }
      }

      if (!currentBranchId && currentBranches.length > 0) {
        currentBranchId = currentBranches[0].id.toString();
        setSelectedBranchId(currentBranchId);
      }

      if (currentBranchId) {
        // 2. Lấy danh sách sản phẩm theo chi nhánh cụ thể (API trả về mảng trực tiếp)
        const response = await ProductService.getLowStockReport(currentBranchId);
        
        // Backend trả về Array [LowStockReportResponse]
        const lowStockList = Array.isArray(response) ? response : [];
        
        setProducts(lowStockList);
        setFilteredProducts(lowStockList);
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

  // Handle Search locally or re-fetch
  const handleSearch = (val: string) => {
    setSearchTerm(val);
    const searchLower = val.toLowerCase();
    const results = products.filter(p => 
      (p.productName || p.name || "").toLowerCase().includes(searchLower) || 
      (p.sku || "").toLowerCase().includes(searchLower)
    );
    setFilteredProducts(results);
  };

  const handleExportExcel = async () => {
    if (filteredProducts.length === 0) {
      toast.warning("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      const XLSX = await import("xlsx");
      
      const branchName = branches.find(b => b.id.toString() === selectedBranchId)?.name || "Chi Nhánh";
      const exportDate = new Date().toLocaleString("vi-VN");

      // 1. Tạo Header cho file báo cáo
      const headerInfo = [
        ["BÁO CÁO CHI TIẾT SẢN PHẨM DƯỚI ĐỊNH MỨC TỒN KHO"],
        [`Chi nhánh: ${branchName}`],
        [`Thời gian xuất: ${exportDate}`],
        [], // Dòng trống
      ];

      // 2. Chuẩn bị dữ liệu bảng (Chỉ thông tin sản phẩm và tồn kho)
      const tableData = filteredProducts.map((p, index) => {
        const qty = p.quantity || 0;

        return {
          "STT": index + 1,
          "SKU": p.sku || "",
          "Tên sản phẩm": p.productName || "",
          "Tồn hiện tại": qty,
          "Định mức": p.minThreshold || 10
        };
      });

      // 3. Tạo worksheet và thêm header
      const ws = XLSX.utils.aoa_to_sheet(headerInfo);
      
      // 4. Thêm dữ liệu bảng từ dòng thứ 5 (sau header)
      XLSX.utils.sheet_add_json(ws, tableData, { origin: "A5" });

      // 5. Định dạng độ rộng cột cho bảng 5 cột
      const wscols = [
        { wch: 8 },  // STT
        { wch: 25 }, // SKU
        { wch: 60 }, // Tên SP
        { wch: 20 }, // Tồn hiện tại
        { wch: 20 }, // Định mức
      ];
      ws['!cols'] = wscols;

      // 6. Merge ô cho tiêu đề chính (Căn chỉnh theo 5 cột A-E)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } } 
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

  return (
    <div className="space-y-4 pb-10 bg-[#f0f2f5] min-h-screen">
      {/* Top Header */}
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
            className="bg-green-600 hover:bg-green-700 text-white text-[12px] font-black uppercase h-9 rounded-none shadow-sm flex items-center gap-2"
          >
            {isExporting ? <RefreshCw className="animate-spin" size={16} /> : <FileDown size={16} />}
            Xuất báo cáo
          </Button>
          <div className="h-6 w-[1px] bg-slate-300 mx-2"></div>
          <div className="flex items-center gap-4 text-[13px] font-medium text-slate-600">
            <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Download size={16} /> Tải PDF
            </button>
            <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Printer size={16} /> In
            </button>
            <button className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-2 flex items-center gap-4 bg-white/50">
        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
          <SelectTrigger className="h-8 w-[240px] text-[13px] border-slate-300 rounded-none shadow-none bg-white font-bold">
            <SelectValue placeholder="Chọn chi nhánh" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
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

      {/* Report Table */}
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
                    <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[50px]">STT</TableHead>
                    <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 p-3 min-w-[200px]">Phiên bản sản phẩm</TableHead>
                    <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-center w-[120px]">Mã SKU</TableHead>
                    <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-right w-[150px]">Tồn kho hiện tại</TableHead>
                    <TableHead className="text-white font-bold text-[11px] uppercase border-r border-white/10 text-right w-[170px]">Định mức tối thiểu</TableHead>
                    <TableHead className="text-white font-bold text-[11px] uppercase text-right w-[150px]">Thiếu hụt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p, index) => (
                    <TableRow key={p.variantId || p.sku || index} className="bg-white border-b border-[#eee] hover:bg-slate-50 transition-colors group">
                      <TableCell className="text-center text-slate-400 font-bold text-[12px]">{index + 1}</TableCell>
                      <TableCell className="p-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.productName || p.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-rose-100 text-rose-600 border-rose-200 text-[9px] px-1.5 py-0 rounded-full font-black uppercase tracking-tighter">
                              Tồn thấp
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-[12px] text-blue-600">{p.sku}</TableCell>
                      <TableCell className="text-right font-black text-[14px] text-rose-600 bg-rose-50/30">{p.quantity || 0}</TableCell>
                      <TableCell className="text-right font-bold text-[13px] text-slate-500 italic">10</TableCell>
                      <TableCell className="text-right p-3">
                        <div className="flex items-center justify-end gap-1.5 text-rose-600 font-black">
                          <AlertTriangle size={14} />
                          <span className="text-[14px]">{Math.max(0, 10 - (p.quantity || 0))}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  <TableRow className="bg-slate-50 border-t-2 border-slate-200 font-black">
                    <TableCell colSpan={4} className="p-4 text-right text-[12px] uppercase text-slate-500">Tổng cộng sản phẩm sắp hết hàng:</TableCell>
                    <TableCell colSpan={2} className="p-4 text-right text-[16px] text-rose-600 pr-8">
                      {filteredProducts.length} mặt hàng
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Action Footer */}
              <div className="p-6 bg-blue-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[13px] text-blue-700 font-medium">
                  <RefreshCw size={18} />
                  <span>Dữ liệu được cập nhật dựa trên tồn kho thực tế của chi nhánh đã chọn.</span>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/admin/receipts/select-request")}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 font-bold uppercase text-[12px] h-10 rounded-none px-6"
                >
                  Tạo phiếu nhập kho ngay
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
