"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryExportTable } from "@/components/inventory/InventoryExportTable";
import { InventoryExportReceiptTable } from "@/components/inventory/InventoryExportReceiptTable";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, RefreshCcw, FileText, AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminExportListPage() {
  const [activeTab, setActiveTab] = useState("commands");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý danh sách các phiếu được tích chọn
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setSelectedIds([]); // Reset chọn khi load lại trang hoặc đổi tab
    try {
      const endpoint = activeTab === "commands"
        ? "/api/v1/inventory/export-commands"
        : "/api/v1/inventory/export-receipts";

      const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) throw new Error("Lỗi server");

      const result = await response.json();
      setData(Array.isArray(result) ? result : (result.content || []));
    } catch (error: any) {
      toast.error(`Không thể tải dữ liệu: ${error.message}`);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Hàm xóa 1 phiếu
  const handleDeleteCommand = async (id: string | number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
    const response = await fetch(`http://localhost:8080/api/v1/inventory/export-commands/${id}`, {
      method: "DELETE",
      headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
    });
    if (!response.ok) throw new Error("Không thể xóa");
    await fetchList();
  };

  // Hàm xóa NHIỀU phiếu cùng lúc
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} phiếu đã chọn?`);
    if (!confirmDelete) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;

      // Gửi mảng ID lên Backend (Backend cần API DELETE nhận List ID hoặc loop xóa)
      // Nếu Backend chưa có API bulk, ta dùng Promise.all để xóa từng cái
      await Promise.all(selectedIds.map(id =>
        fetch(`http://localhost:8080/api/v1/inventory/export-commands/${id}`, {
          method: "DELETE",
          headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
        })
      ));

      toast.success(`Đã dọn dẹp ${selectedIds.length} phiếu vào thùng rác thành công`);
      await fetchList();
    } catch (error) {
      toast.error("Xóa hàng loạt thất bại");
    }
  };

  useEffect(() => { fetchList(); }, [fetchList]);

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
          {/* NÚT THÙNG RÁC - CHỈ HIỆN KHI CÓ ITEM ĐƯỢC CHỌN */}
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
              <Button variant="ghost" size="sm" onClick={fetchList} disabled={isLoading}><RefreshCcw size={16} className={cn(isLoading && "animate-spin")} /></Button>
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