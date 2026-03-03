"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminTransferTable } from "@/components/admin/AdminTransferTable";
import { apiJava } from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, AlertCircle, X, Printer, CheckCircle2, Trash2, Search, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminTransferListPage() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "history"
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTransfer, setDeleteTransfer] = useState<{ id: string; code: string } | null>(null);

  // Thêm State để lưu số lượng thống kê cho các Tab
  const [counts, setCounts] = useState({ pending: 0, history: 0 });

  // 1. Hàm gọi API lấy danh sách điều chuyển CÓ KÈM THAM SỐ
  const fetchTransfers = async (tab: string, searchKeyword: string = "") => {
    setIsLoading(true);
    try {
      // Xác định chuỗi trạng thái cần gửi xuống BE dựa vào Tab hiện tại
      // Ghi chú: Hiện tại API Backend của bạn chỉ nhận 1 status (String),
      // để lấy cả PENDING và SHIPPING cho tab "pending", lý tưởng nhất Backend nên nhận List<Status>.
      // Nhưng với API hiện tại, ta sẽ gọi "all" và để Client lọc,
      // HOẶC gọi 2 lần nếu muốn chia chính xác từ BE.
      // Dưới đây là cách gọi "all" và lọc ở FE (giống cách bạn làm) nhưng tối ưu hơn.

      const res = await apiJava.get("/transfers", {
        params: {
          keyword: searchKeyword || undefined,
          status: "all", // Lấy tất cả để thống kê số lượng 2 Tab
          size: 1000 // Tạm thời lấy số lượng lớn (Trong thực tế nên làm API thống kê riêng)
        }
      });

      const rawData = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setTransfers(rawData);

      // Cập nhật số lượng cho các Tab
      const pendingQty = rawData.filter((t: any) => t.status === "PENDING" || t.status === "SHIPPING").length;
      const historyQty = rawData.filter((t: any) => t.status === "COMPLETED" || t.status === "CANCELLED").length;
      setCounts({ pending: pendingQty, history: historyQty });

    } catch (error: any) {
      toast.error("Không thể tải danh sách phiếu điều chuyển");
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API khi component mount hoặc khi keyword thay đổi (có thể thêm debounce)
  useEffect(() => {
    fetchTransfers(activeTab, keyword);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeyword(val);
    // Trong thực tế nên dùng lodash.debounce tại đây để tránh gọi API liên tục
    fetchTransfers(activeTab, val);
  };

  // 2. Hàm xóa phiếu (Chỉ cho phép xóa PENDING)
  const confirmDelete = async () => {
    if (!deleteTransfer) return;
    try {
      await apiJava.delete(`/transfers/${deleteTransfer.id}`);
      toast.success(`Đã xóa phiếu điều chuyển "${deleteTransfer.code}"`);

      // Update UI và giảm count
      setTransfers((prev) => prev.filter((t) => t.id !== deleteTransfer.id));
      setCounts(prev => ({...prev, pending: prev.pending - 1}));

    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa phiếu!");
    } finally {
      setDeleteTransfer(null);
    }
  };

  // 3. Logic lọc dữ liệu theo Tab (Lọc Client-side)
  const displayData = useMemo(() => {
    return transfers.filter((item) => {
      if (activeTab === "pending") {
        return item.status === "PENDING" || item.status === "SHIPPING";
      } else {
        return item.status === "COMPLETED" || item.status === "CANCELLED";
      }
    });
  }, [transfers, activeTab]);

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Điều chuyển kho"
        addBtnLabel="Tạo lệnh điều chuyển"
        addBtnHref="/admin/transfers/new"
        tabs={[
          {
            id: "pending",
            label: "Đang xử lý",
            count: counts.pending,
            color: "text-blue-600",
          },
          {
            id: "history",
            label: "Hoàn thành / Hủy",
            count: counts.history,
            color: "text-slate-600",
          },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedIds([]); // Reset select khi chuyển tab
        }}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden mb-8">
        {/* Bulk Actions (Thao tác hàng loạt) */}
        {selectedIds.length > 0 ? (
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-black uppercase">
                Đã chọn {selectedIds.length} lệnh điều chuyển
              </span>
              <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase">
                  <Printer size={14} className="mr-1.5" /> In danh sách
                </Button>
                {activeTab === "pending" && (
                   <Button variant="ghost" className="h-8 text-[11px] font-bold text-rose-400 hover:bg-rose-900/30 uppercase">
                     <Trash2 size={14} className="mr-1.5" /> Hủy lệnh loạt
                   </Button>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white">
              <X size={18} />
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border-b border-[#eee] flex items-center gap-3">
            <div className="relative flex-1 max-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Tìm mã lệnh, kho xuất, kho nhập..."
                value={keyword}
                onChange={handleSearch}
                className="h-9 pl-10 text-[13px] border-slate-200 focus:border-blue-500 rounded-none bg-white shadow-none"
              />
            </div>
          </div>
        )}

        <div className="relative">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
              <p className="text-[11px] font-black uppercase tracking-widest">Đang truy xuất dữ liệu vận chuyển...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-50 p-4 rounded-full mb-3">
                <ArrowLeftRight className="opacity-20" size={40} />
              </div>
              <p className="text-xs font-bold uppercase">Không có dữ liệu điều chuyển</p>
              <p className="text-[11px] mt-1 text-slate-400">
                {activeTab === "pending" ? "Không có phiếu nào đang chờ xử lý." : "Chưa có lịch sử điều chuyển nào."}
              </p>
            </div>
          ) : (
            <AdminTransferTable
              data={displayData}
              mode={activeTab}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDelete={(id) => {
                const item = transfers.find(t => t.id === id);
                setDeleteTransfer({ id, code: item?.transferCode || "N/A" });
              }}
            />
          )}
        </div>
      </div>

      {/* Dialog xác nhận xóa */}
      <AlertDialog open={!!deleteTransfer} onOpenChange={() => setDeleteTransfer(null)}>
        <AlertDialogContent className="bg-white rounded-none border-slate-200 shadow-xl max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 font-black text-[16px] uppercase flex items-center gap-2">
              <AlertCircle size={20} /> Xác nhận xóa lệnh điều chuyển
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 text-[13px]">
              Hành động này sẽ xóa vĩnh viễn lệnh <span className="font-bold text-slate-900">"{deleteTransfer?.code}"</span>. <br />
              Dữ liệu tồn kho liên quan sẽ được giữ nguyên do phiếu chưa xuất kho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-[32px] text-[12px] font-bold rounded-none">HỦY BỎ</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-[32px] text-[12px] font-bold rounded-none"
            >
              ĐỒNG Ý XÓA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}