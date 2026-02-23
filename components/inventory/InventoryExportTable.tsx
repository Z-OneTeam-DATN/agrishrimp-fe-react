"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, User, Warehouse, ClipboardList, UserRound, ArrowRight, AlertTriangle } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

interface InventoryExportTableProps {
  exports: any[];
  onDelete?: (id: number | string) => Promise<void>;
  selectedIds: (string | number)[];
  setSelectedIds: React.Dispatch<React.SetStateAction<(string | number)[]>>;
}

export function InventoryExportTable({ exports, onDelete, selectedIds, setSelectedIds }: InventoryExportTableProps) {
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Logic tích chọn ---
  const toggleSelectAll = () => {
    if (selectedIds.length === exports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(exports.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id: string | number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteItem.id);
      toast.success(`Đã xóa thành công lệnh ${deleteItem.code}`);
    } catch (error) {
      toast.error("Xóa thất bại");
    } finally {
      setIsDeleting(false);
      setDeleteItem(null);
    }
  };

  return (
    <div className="w-full relative">
      <div className="overflow-x-auto no-scrollbar">
        <Table className="table-fixed min-w-[1500px] border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f8f9fa] border-b border-[#ddd]">
              <TableHead className="w-[40px] text-center p-2 border-r border-[#ddd]">
                <input
                  type="checkbox"
                  className="accent-blue-600 cursor-pointer h-4 w-4"
                  checked={exports.length > 0 && selectedIds.length === exports.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[180px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">Mã lệnh xuất</TableHead>
              <TableHead className="w-[140px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">Ngày lập</TableHead>
              <TableHead className="w-[320px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider">Đối tượng nhận hàng</TableHead>
              <TableHead className="w-[180px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">Kho xuất hàng</TableHead>
              <TableHead className="w-[180px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">Người lập lệnh</TableHead>
              <TableHead className="w-[150px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">Tình trạng</TableHead>
              <TableHead className="w-[180px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-right">Tổng tiền (Dự kiến)</TableHead>
              <TableHead className="w-[100px] text-right font-black text-[#444] text-[10px] uppercase p-2 pr-4 tracking-wider">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.map((item: any) => (
              <TableRow
                key={item.id}
                className={cn(
                  "hover:bg-blue-50/30 border-b border-[#eee] transition-colors group h-[52px]",
                  selectedIds.includes(item.id) && "bg-blue-50/50" // Highligh dòng được chọn
                )}
              >
                <TableCell className="text-center p-2 border-r border-[#eee]">
                  <input
                    type="checkbox"
                    className="accent-blue-600 cursor-pointer h-4 w-4"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelectItem(item.id)}
                  />
                </TableCell>

                <TableCell className="p-2 border-r border-[#eee] font-bold text-blue-600 text-[12px] text-center">{item.code}</TableCell>
                <TableCell className="p-2 border-r border-[#eee] text-[12px] text-slate-600 text-center">{formatDate(item.createdAt)}</TableCell>

                <TableCell className="p-2 border-r border-[#eee] font-bold text-slate-700 text-[12px] truncate">
                   <div className="flex items-center gap-2">
                    {item.supplierName ? <span>{item.supplierName}</span> : <span>{item.partnerBranchName || "---"}</span>}
                   </div>
                </TableCell>

                <TableCell className="p-2 border-r border-[#eee] text-[12px] text-slate-600 text-center truncate">{item.branchName}</TableCell>
                <TableCell className="p-2 border-r border-[#eee] text-[12px] text-slate-700 font-semibold text-center">{item.creatorName || "Hệ thống"}</TableCell>

                <TableCell className="p-2 border-r border-[#eee] text-center">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-600 uppercase">Chờ xử lý</span>
                </TableCell>

                <TableCell className="p-2 border-r border-[#eee] text-right font-bold text-slate-700 text-[12px]">{formatNumber(item.totalAmount || 0)} ₫</TableCell>

                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-50"><Eye size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-50" onClick={() => setDeleteItem(item)}><Trash2 size={14} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MODAL XÓA (Giữ nguyên logic của bạn) */}
      {deleteItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
             <div className="flex items-center gap-3 mb-4">
               <AlertTriangle className="text-rose-600" />
               <h3 className="font-black text-slate-800">Xác nhận xóa lệnh {deleteItem.code}</h3>
             </div>
             <div className="flex justify-end gap-3">
               <Button variant="outline" onClick={() => setDeleteItem(null)} disabled={isDeleting}>Hủy</Button>
               <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? "Đang xóa..." : "Xóa ngay"}</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}