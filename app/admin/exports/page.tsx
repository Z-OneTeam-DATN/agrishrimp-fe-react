"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryExportTable } from "@/components/inventory/InventoryExportTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, RefreshCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InventoryExportApiService } from "@/app/services/inventory.service";
import { branchService } from "@/app/services/branchService";

export default function AdminExportListPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [exports, setExports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State cho tìm kiếm, lọc và phân trang
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([{ label: "Tất cả kho", value: "all" }]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sử dụng API lấy tất cả lệnh xuất làm nguồn dữ liệu chính
      const result = await InventoryExportApiService.getAllExportCommands();
      const data = Array.isArray(result) ? result : (result.content || []);
      console.log("Danh sách lệnh xuất từ API:", data);
      setExports(data);
    } catch (error: any) {
      toast.error("Lỗi tải danh sách lệnh xuất");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
    // Lấy danh sách kho thực tế
    (async () => {
      try {
        const data = await branchService.getAll();
        const list = Array.isArray(data) ? data : (data.content || []);
        const options = list.map((b: any) => ({
          label: b.name || b.branchName,
          value: b.name || b.branchName
        }));
        setWarehouseOptions([{ label: "Tất cả kho", value: "all" }, ...options]);
      } catch (e) { console.error("Lỗi tải danh sách kho:", e); }
    })();
  }, [fetchList]);

  // Reset phân trang khi đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedWarehouse]);

  // Logic lọc dữ liệu
  const filteredData = exports.filter((item) => {
    // 1. Lọc theo Tab
    let matchTab = true;
    const status = (item.status || "").toUpperCase();
    if (activeTab === "pending") matchTab = status === "PENDING";
    else if (activeTab === "approved") matchTab = status === "APPROVED";
    else if (activeTab === "completed") matchTab = status === "COMPLETED";
    else if (activeTab === "cancelled") matchTab = status === "CANCELLED" || status === "REJECTED";
    
    if (!matchTab) return false;

    // 2. Lọc theo Kho xuất
    if (selectedWarehouse !== "all" && item.branchName !== selectedWarehouse) return false;

    // 3. Tìm kiếm theo mã hoặc đối tác
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const displayPartner = (item.displayPartnerName || item.supplierName || item.partnerBranchName || "").toLowerCase();
      if (!item.code.toLowerCase().includes(q) && !displayPartner.includes(q)) return false;
    }

    return true;
  });

  console.log(`Tab hiện tại: ${activeTab}, Số lượng sau lọc: ${filteredData.length}`);

  // Tính toán phân trang
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = React.useMemo(() => {
    const s = (status: string) => (status || "").toUpperCase();
    return {
      all: exports.length,
      pending: exports.filter(t => s(t.status) === "PENDING").length,
      approved: exports.filter(t => s(t.status) === "APPROVED").length,
      completed: exports.filter(t => s(t.status) === "COMPLETED").length,
      cancelled: exports.filter(t => s(t.status) === "CANCELLED" || s(t.status) === "REJECTED").length,
    };
  }, [exports]);

  const tabs = [
    { id: "all", label: "TẤT CẢ" },
    { id: "pending", label: "CHỜ DUYỆT" },
    { id: "approved", label: "ĐÃ DUYỆT" },
    { id: "completed", label: "ĐÃ XUẤT KHO" },
    { id: "cancelled", label: "ĐÃ HỦY" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-5 bg-[#f8f9fa] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b shrink-0">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[16px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
              <FileText className="text-slate-400" size={18}/>
              Danh sách lệnh xuất kho
            </h1>
          </div>
          <AdminPageHeader title="" addBtnLabel="Tạo lệnh xuất" addBtnHref="/admin/exports/new-command" />
        </div>

        <div className="px-6 flex items-center h-[48px] gap-8">
          {tabs.map((tab) => {
            const hasItems = (counts as any)[tab.id] > 0;
            const showRedDot = (tab.id === "pending" || tab.id === "approved") && hasItems;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-full text-[12px] font-black border-b-2 px-1 tracking-wider transition-all relative",
                  activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                {tab.label}
                {showRedDot && (
                  <span className="absolute top-2 -right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                )}
                {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col min-0">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between pr-4 bg-slate-50/50 border-b shrink-0">
            <div className="flex-1">
              <AdminSearchFilter
                placeholder="Tìm mã lệnh, đối tác nhận..."
                filter1Placeholder="Lọc theo kho xuất"
                filter1Options={warehouseOptions}
                onRefresh={fetchList}
                onSearch={setSearchQuery}
                onFilter1Change={setSelectedWarehouse}
                hideFilter2={true}
                hideSort={true}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={fetchList} disabled={isLoading}>
              <RefreshCcw size={16} className={cn(isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 bg-white relative">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center px-10">Đang đồng bộ dữ liệu AgriShrimp...</p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="bg-slate-50 p-4 rounded-full mb-3"><FileText className="opacity-20" size={40} /></div>
                <p className="text-xs font-bold uppercase tracking-tight">Không có dữ liệu phù hợp</p>
              </div>
            ) : (
              <InventoryExportTable
                exports={displayData}
                totalCount={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onRefresh={fetchList}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
