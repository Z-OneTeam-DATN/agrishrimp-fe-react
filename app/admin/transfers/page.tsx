"use client";

import React, { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminTransferTable } from "@/components/admin/AdminTransferTable";
import {
  Download,
  Truck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  Search,
  Printer,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { transferService } from "@/app/services/transfer.service";

// Format hiển thị ngày giờ chuẩn VN
const formatDateTime = (dateString: string) => {
  if (!dateString) return "--";
  const d = new Date(dateString);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", "");
};

export default function AdminTransferListPage() {
  const [activeTab, setActiveTab] = useState("outbound");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State API
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");

  // Fetch API thật
  useEffect(() => {
    const fetchTransfers = async () => {
      setIsLoading(true);
      try {
        const data = await transferService.getAll(keyword, status, 0, 50);

        const mappedData = data.content.map((t: any) => ({
          id: t.id.toString(),
          code: t.transferCode,
          date: formatDateTime(t.createdAt),
          deadline: formatDateTime(t.deadline),
          age: "Mới tạo",
          priority: t.priority || "NORMAL",
          fromWarehouse: t.fromBranchName || "Kho xuất",
          toWarehouse: t.toBranchName || "Kho nhận",
          transporter: t.transporter || "--",
          totalQty: t.totalQuantity || 0,
          itemCount: t.itemCount || 0,
          totalValue: t.totalValue || 0,
          status: t.status,
          creator: "Admin",
          isHighValue: t.totalValue > 50000000,
          isOverdue: t.deadline && new Date(t.deadline) < new Date(),
        }));

        setTransfers(mappedData);
      } catch (error) {
        console.error("Lỗi lấy danh sách:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfers();
  }, [keyword, status]);

  // Hàm xử lý xóa phiếu
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn phiếu điều chuyển này không?")) return;

    try {
      await transferService.delete(id);

      // Xóa thành công thì lọc item đó ra khỏi state để UI cập nhật tức thì
      setTransfers((prev) => prev.filter((t) => t.id !== id));

      // Gỡ ID khỏi danh sách chọn (nếu đang chọn)
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));

      alert("Đã xóa phiếu thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa phiếu:", error);
      alert("Không thể xóa phiếu. Vui lòng thử lại!");
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quản lý điều chuyển kho"
        addBtnLabel="Lập lệnh điều chuyển"
        addBtnHref="/admin/transfers/new"
        secondaryBtnLabel="Xuất Excel"
        secondaryBtnIcon={Download}
        /* COMMENT LẠI HÀNG XUẤT HÀNG NHẬP */
        /*
        tabs={[
          {
            id: "outbound",
            label: "Hàng Xuất (Gửi đi)",
            count: transfers.length,
            color: "text-blue-600",
          },
          {
            id: "inbound",
            label: "Hàng Nhập (Sắp về)",
            count: 0,
            color: "text-orange-600",
          },
        ]}
        */
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden mb-8">
        {selectedIds.length > 0 ? (
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-black uppercase tracking-widest">
                Đã chọn {selectedIds.length} phiếu điều chuyển
              </span>
              <div className="h-4 w-[1px] bg-slate-700" />
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase tracking-tighter">
                  <Printer size={14} className="mr-1.5" /> In phiếu loạt
                </Button>
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase tracking-tighter">
                  <CheckCircle2 size={14} className="mr-1.5" /> Xác nhận nhận hàng
                </Button>
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-rose-400 hover:bg-rose-900/30 uppercase tracking-tighter">
                  <Trash2 size={14} className="mr-1.5" /> Hủy hàng loạt
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white">
              <X size={18} />
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border-b border-[#eee] flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Tìm mã phiếu, người chuyển, tài xế..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-9 pl-10 text-[13px] border-slate-200 focus:border-blue-500 rounded-none shadow-none bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 h-9">
                <Warehouse size={14} className="text-slate-400" />
                <select
                  className="text-[11px] font-black outline-none bg-transparent h-full cursor-pointer uppercase tracking-tighter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="PENDING">Chờ xuất kho</option>
                  <option value="SHIPPING">Đang vận chuyển</option>
                  <option value="COMPLETED">Đã hoàn thành</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="py-10 text-center text-slate-400 font-bold text-sm">Đang tải dữ liệu...</div>
        ) : (
          <AdminTransferTable
            data={transfers}
            mode={activeTab}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}