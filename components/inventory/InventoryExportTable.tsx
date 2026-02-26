"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, CheckCircle, AlertTriangle, FileText, Calendar, Warehouse, ArrowRight, User } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { InventoryExportApiService } from "@/app/services/inventory.service";

interface InventoryExportTableProps {
  exports: any[];
  onDelete?: (id: number | string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  selectedIds: (string | number)[];
  setSelectedIds: React.Dispatch<React.SetStateAction<(string | number)[]>>;
}

export function InventoryExportTable({ exports, onDelete, onRefresh, selectedIds, setSelectedIds }: InventoryExportTableProps) {
  const router = useRouter();
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === exports.length) setSelectedIds([]);
    else setSelectedIds(exports.map((item) => item.id));
  };

  const toggleSelectItem = (id: string | number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleComplete = async (id: number, code: string) => {
    if (!confirm(`Xác nhận xuất kho cho lệnh ${code}? Hàng trong kho sẽ bị trừ ngay lập tức.`)) return;
    try {
      await InventoryExportApiService.completeExportCommand(id);
      toast.success(`Đã xuất kho thành công phiếu ${code}!`);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi duyệt xuất kho");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteItem.id);
    } catch (error) {
    } finally {
      setIsDeleting(false);
      setDeleteItem(null);
    }
  };

  const totalAmount = exports.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto no-scrollbar">
        <Table className="table-custom border-collapse min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] border-b border-[#ccc] hover:bg-[#f0f0f0]">
              <TableHead className="w-[40px] text-center p-2 pl-6"><input type="checkbox" className="accent-blue-600" checked={exports.length > 0 && selectedIds.length === exports.length} onChange={toggleSelectAll} /></TableHead>
              <TableHead className="w-[100px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">ID</TableHead>
              <TableHead className="font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Lệnh & Thời gian</TableHead>
              <TableHead className="w-[280px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Đối tác nhận</TableHead>
              <TableHead className="w-[180px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Kho xuất</TableHead>
              <TableHead className="w-[150px] text-right font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Tổng giá trị</TableHead>
              <TableHead className="w-[130px] font-bold text-[11px] uppercase p-2 text-center text-[#1f1f1f]">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[11px] uppercase p-2 pr-6 text-[#1f1f1f]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.map((item: any) => {
              // Xử lý cẩn thận null để tránh N/A không mong muốn
              const isInternal = item.exportType === "INTERNAL" || (item.displayPartnerName && item.displayPartnerName.includes("Nội bộ"));
              let displayPartner = item.displayPartnerName;

              // Nếu Backend chưa trả về đúng trường displayPartnerName, ta xử lý dự phòng tại Frontend
              if (!displayPartner || displayPartner === "N/A") {
                  if (isInternal) {
                      displayPartner = item.partnerBranchName ? `[Nội bộ] ${item.partnerBranchName}` : "[Nội bộ] Chi nhánh nhận";
                  } else {
                      displayPartner = item.supplierName ? `[Trả NCC] ${item.supplierName}` : "N/A";
                  }
              }

              return (
                <TableRow key={item.id} className={cn("hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group", selectedIds.includes(item.id) && "bg-blue-50/50")}>
                  <TableCell className="text-center p-2 pl-6" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="accent-blue-600 cursor-pointer h-4 w-4" checked={selectedIds.includes(item.id)} onChange={() => toggleSelectItem(item.id)} />
                  </TableCell>

                  <TableCell className="p-2 text-[12px] font-black text-slate-500 uppercase" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>#{item.id || "0"}</TableCell>

                  <TableCell className="p-2" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-1.5">
                        <FileText size={14} className={isInternal ? "text-orange-500" : "text-blue-500"} />
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                        <Calendar size={10} className="text-slate-300" /> {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Render Đối tác an toàn */}
                  <TableCell className="p-2" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                    <div className="flex flex-col">
                      <span className={cn("text-[13px] font-bold leading-tight flex items-center gap-1", isInternal ? "text-blue-600" : "text-slate-700")}>
                        {isInternal ? <ArrowRight size={14} className="text-blue-500"/> : <User size={14} className="text-slate-400"/>}
                        {displayPartner}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <User size={10} /> Lập bởi: {item.creatorName || "Hệ thống"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                      <Warehouse size={12} className="text-slate-400" /> {item.branchName || "N/A"}
                    </div>
                  </TableCell>

                  <TableCell className="p-2 text-right text-[14px] font-black text-slate-900" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                    {formatNumber(item.totalAmount || 0)}
                  </TableCell>

                  <TableCell className="p-2 text-center" onClick={() => router.push(`/admin/exports/new-command?id=${item.id}`)}>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded border tracking-tight uppercase text-blue-500 bg-blue-50 border-blue-100">
                      Chờ xử lý
                    </span>
                  </TableCell>

                  <TableCell className="p-2 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); router.push(`/admin/exports/new-command?id=${item.id}`); }}>
                        <Eye size={14} className="text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50" title="Duyệt xuất kho (Trừ tồn)" onClick={(e) => { e.stopPropagation(); handleComplete(item.id, item.code); }}>
                        <CheckCircle size={14} className="text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50" title="Xóa lệnh" onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}>
                        <Trash2 size={14} className="text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <div className="flex items-center gap-6">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Tổng cộng {exports.length} lệnh chờ</p>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[11px] font-bold uppercase">Tổng giá trị: <span className="text-blue-600 font-black">{formatNumber(totalAmount)}</span></p>
        </div>
      </div>

      {deleteItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
             <div className="flex items-center gap-3 mb-4"><AlertTriangle className="text-rose-600" /><h3 className="font-black text-slate-800">Xác nhận xóa lệnh {deleteItem.code}</h3></div>
             <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setDeleteItem(null)} disabled={isDeleting}>Hủy</Button><Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? "Đang xóa..." : "Xóa ngay"}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}