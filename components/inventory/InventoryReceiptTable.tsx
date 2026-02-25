"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  Warehouse,
  User,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface InventoryReceiptTableProps {
  receipts: any[];
  onDeleteClick: (id: number, code: string) => void;
}

export function InventoryReceiptTable({ receipts, onDeleteClick }: InventoryReceiptTableProps) {
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "IMPORTED":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "PENDING":
      case "PO":
        return "text-blue-500 bg-blue-50 border-blue-100";
      case "CANCELLED":
        return "text-rose-600 bg-rose-50 border-rose-100";
      default:
        return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  const totalAmount = receipts.reduce((acc, item) => acc + (item.total || 0), 0);
  const totalDebt = receipts.reduce((acc, item) => acc + (item.debt || 0), 0);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="table-custom border-collapse min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] border-b border-[#ccc] hover:bg-[#f0f0f0]">
              <TableHead className="w-[100px] font-bold text-[11px] uppercase p-2 pl-6 text-[#1f1f1f]">ID</TableHead>
              <TableHead className="font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Phiếu & Thời gian</TableHead>
              <TableHead className="font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Đối tác / Nhà cung cấp</TableHead>
              <TableHead className="w-[180px] font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Kho nhập</TableHead>
              <TableHead className="w-[150px] text-right font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Tổng giá trị</TableHead>
              <TableHead className="w-[150px] text-right font-bold text-[11px] uppercase p-2 text-[#1f1f1f]">Còn nợ</TableHead>
              <TableHead className="w-[130px] font-bold text-[11px] uppercase p-2 text-center text-[#1f1f1f]">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[11px] uppercase p-2 pr-6 text-[#1f1f1f]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((item: any) => {
              const isPending = item.status === "PENDING" || item.status === "PO";
              const isInternal = item.importType === "INTERNAL";

              return (
                <TableRow key={item.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group">
                  <TableCell className="p-2 pl-6 text-[12px] font-black text-slate-500 uppercase">#{item.id || "0"}</TableCell>

                  <TableCell className="p-2">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-1.5">
                        <FileText size={14} className={isInternal ? "text-orange-500" : "text-blue-500"} />
                        {item.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                        <Calendar size={10} className="text-slate-300" /> {item.date}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2">
                    <div className="flex flex-col">
                      {/* Highlight màu xanh cho phiếu nội bộ */}
                      <span className={cn(
                        "text-[13px] font-bold leading-tight",
                        isInternal ? "text-blue-600" : "text-slate-700"
                      )}>
                        {item.supplier}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
                        <User size={10} /> Người tạo: {item.creator || "N/A"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="p-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold">
                      <Warehouse size={12} className="text-slate-400" /> {item.warehouse}
                    </div>
                  </TableCell>

                  <TableCell className="p-2 text-right text-[14px] font-black text-slate-900">{formatNumber(item.total || 0)}</TableCell>

                  <TableCell className="p-2 text-right">
                    <span className={cn("text-[14px] font-black", (item.debt || 0) > 0 ? "text-rose-600" : "text-emerald-600")}>
                      {formatNumber(item.debt || 0)}
                    </span>
                  </TableCell>

                  <TableCell className="p-2 text-center">
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded border tracking-tight uppercase", getStatusStyle(item.status))}>
                      {item.status === "COMPLETED" || item.status === "IMPORTED"
                        ? "Đã nhập kho"
                        : isPending
                        ? "Đặt hàng"
                        : "Đã hủy"}
                    </span>
                  </TableCell>

                  <TableCell className="p-2 text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="Chỉnh sửa phiếu"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/receipts/new?id=${item.id}`);
                        }}
                      >
                        <Pencil size={14} className="text-blue-600" />
                      </Button>

                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="In phiếu / Xuất đơn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Printer size={14} className="text-slate-500" />
                      </Button>

                      {isPending ? (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 hover:bg-rose-50" title="Xóa phiếu tạm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(item.id, item.code);
                          }}
                        >
                          <Trash2 size={14} className="text-rose-600" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 opacity-20 cursor-not-allowed" disabled title="Không thể xóa phiếu đã hoàn thành"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 size={14} className="text-slate-400" />
                        </Button>
                      )}
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
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Tổng cộng {receipts.length} phiếu nhập</p>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[11px] font-bold uppercase">Tổng giá trị: <span className="text-blue-600 font-black">{formatNumber(totalAmount)}</span></p>
          <p className="text-[11px] font-bold uppercase">Tổng nợ: <span className="text-rose-600 font-black">{formatNumber(totalDebt)}</span></p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-blue-600 text-white border-blue-600 font-bold">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </div>
  );
}