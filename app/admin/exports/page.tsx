"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryExportTable } from "@/components/inventory/InventoryExportTable";
import { InventoryExportReceiptTable } from "@/components/inventory/InventoryExportReceiptTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, RefreshCcw, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import Service bạn vừa tạo ở Bước 1 (Sửa lại đường dẫn import cho đúng dự án của bạn)
import { InventoryExportApiService } from "@/app/services/inventory.service";

export default function AdminExportListPage() {
  const [activeTab, setActiveTab] = useState("commands");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // 1. Hàm lấy dữ liệu đã được tối ưu bằng axios
  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const result = activeTab === "commands"
        ? await InventoryExportApiService.getAllExportCommands()
        : await InventoryExportApiService.getAllExportReceipts();

      // result ở đây chính là response.data trả về từ axios
      setData(Array.isArray(result) ? result : (result.content || []));
    } catch (error: any) {
      // Axios sẽ bọc lỗi API vào error.response.data
      const errorMsg = error.response?.data?.message || error.message || "Lỗi server";
      toast.error(`Không thể tải dữ liệu: ${errorMsg}`);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // 2. Hàm xóa 1 phiếu đã được tối ưu
  const handleDeleteCommand = async (id: string | number) => {
    try {
      await InventoryExportApiService.deleteExportCommand(id);
      toast.success("Xóa lệnh xuất thành công");
      await fetchList();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Không thể xóa";
      toast.error(errorMsg);
    }
  };

  // 3. Hàm xóa nhiều phiếu đã được tối ưu
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} phiếu đã chọn?`);
    if (!confirmDelete) return;

    try {
      // Dùng Promise.all với service mới
      await Promise.all(
        selectedIds.map(id => InventoryExportApiService.deleteExportCommand(id))
      );

      toast.success(`Đã dọn dẹp ${selectedIds.length} phiếu thành công`);
      await fetchList();
    } catch (error) {
      toast.error("Xóa hàng loạt thất bại, có thể vài phiếu không hợp lệ");
    }
  };

  useEffect(() => { fetchList(); }, [fetchList]);

  // =============== PHẦN GIAO DIỆN (UI) GIỮ NGUYÊN ===============
  return (
    <div className="space-y-0 flex flex-col h-full -m-4 md:-m-5 bg-[#f8f9fa] min-h-screen">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between bg-white border-b">
        <div className="flex flex-col gap-1">
            <h1 className="text-[20px] font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" size={24}/>
              {activeTab === "commands" ? "Quản lý lệnh xuất kho" : "Quản lý phiếu xuất kho"}
            </h1>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              className="h-9 px-4 font-black uppercase text-[11px] animate-in fade-in slide-in-from-right-4"
              onClick={handleBulkDelete}
            >
              <Trash2 size={16} className="mr-2" /> Xóa {selectedIds.length} mục
            </Button>
          )}

          <AdminPageHeader
            title=""
            addBtnLabel={activeTab === "commands" ? "Tạo lệnh mới" : "Tạo phiếu mới"}
            addBtnHref={activeTab === "commands" ? "/admin/exports/new-command" : "/admin/exports/new"}
          />
        </div>
      </div>

      <div className="bg-white border-b px-6 flex items-center h-[48px] gap-8">
        {[{ id: "commands", label: "LỆNH CHỜ XUẤT" }, { id: "exports", label: "LỊCH SỬ XUẤT KHO" }].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-full text-[12px] font-black border-b-2 px-1 tracking-wider transition-all",
              activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"
            )}
          >{tab.label}</button>
        ))}
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pr-4 bg-slate-50/50 border-b">
              <div className="flex-1">
                <AdminSearchFilter placeholder="Tìm kiếm..." onRefresh={fetchList} />
              </div>
              <Button variant="ghost" size="sm" onClick={fetchList} disabled={isLoading}>
                <RefreshCcw size={16} className={cn(isLoading && "animate-spin")} />
              </Button>
          </div>

          <div className="flex-1 relative">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
              ) : data.length === 0 ? (
                <div className="py-24 text-center italic text-slate-400 font-bold uppercase tracking-widest text-[11px]">Không có dữ liệu</div>
              ) : activeTab === "commands" ? (
                <InventoryExportTable
                  exports={data}
                  onDelete={handleDeleteCommand}
                  onRefresh={fetchList}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                />
              ) : (
                <InventoryExportReceiptTable receipts={data} />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}