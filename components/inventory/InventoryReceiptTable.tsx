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
  Warehouse,
  User,
  Clock,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface InventoryReceiptTableProps {
  receipts: any[];
  onDeleteClick: (id: number, code: string) => void;
  // Thêm props phân trang
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function InventoryReceiptTable({ 
  receipts, 
  onDeleteClick,
  totalCount,
  currentPage,
  totalPages,
  onPageChange
}: InventoryReceiptTableProps) {
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "IMPORTED":
        return "text-emerald-600 bg-white border-emerald-200";
      case "PENDING":
      case "PO":
        return "text-blue-500 bg-white border-blue-200";
      case "APPROVED":
        return "text-indigo-500 bg-white border-indigo-200";
      case "CANCELLED":
      case "REJECTED":
        return "text-slate-400 bg-white border-slate-200";
      default:
        return "text-slate-500 bg-white border-slate-100";
    }
  };

  const totalAmount = receipts.reduce((acc, item) => acc + (item.total || 0), 0);
  const totalDebt = receipts.reduce((acc, item) => acc + (item.debt || 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar">
        <Table className="table-custom border-collapse min-w-[1400px] w-full">
          <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
            <TableRow className="bg-white border-b border-slate-100 hover:bg-white">
              <TableHead className="w-[60px] font-bold text-[10px] uppercase p-3 pl-5 text-slate-400">ID</TableHead>
              <TableHead className="w-[140px] font-bold text-[10px] uppercase p-3 text-slate-400">Mã phiếu</TableHead>
              <TableHead className="w-[160px] font-bold text-[10px] uppercase p-3 text-slate-400">Thời gian</TableHead>
              <TableHead className="w-[160px] font-bold text-[10px] uppercase p-3 text-slate-400">Người tạo</TableHead>
              <TableHead className="min-w-[250px] font-bold text-[10px] uppercase p-3 text-slate-400">Đối tác / Nhà cung cấp</TableHead>
              <TableHead className="w-[180px] font-bold text-[10px] uppercase p-3 text-slate-400">Kho nhập</TableHead>
              <TableHead className="w-[130px] text-right font-bold text-[10px] uppercase p-3 text-slate-400">Tổng giá trị</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[10px] uppercase p-3 text-slate-400">Còn nợ</TableHead>
              <TableHead className="w-[130px] font-bold text-[10px] uppercase p-3 text-center text-slate-400">Trạng thái</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[10px] uppercase p-3 pr-5 text-slate-400">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((item: any) => {
              const isPending = item.status === "PENDING" || item.status === "PO";
              const isInternal = item.importType === "INTERNAL";

              return (
                <TableRow key={item.code} className="hover:bg-slate-50/50 border-b border-slate-50 transition-colors cursor-pointer group h-[64px]">
                  <TableCell className="p-3 pl-5 text-[11px] font-bold text-slate-300 uppercase">#{item.id || "0"}</TableCell>

                  <TableCell className="p-3">
                    <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                      <FileText size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      {item.code}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 whitespace-nowrap uppercase">
                      {item.date}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 uppercase whitespace-nowrap">
                      {item.creator || "N/A"}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <span className={cn(
                      "text-[12px] font-bold leading-tight block truncate max-w-[250px]",
                      isInternal ? "text-blue-500" : "text-slate-600"
                    )} title={item.supplier}>
                      {item.supplier}
                    </span>
                  </TableCell>

                  <TableCell className="p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase whitespace-nowrap">
                      {item.warehouse}
                    </div>
                  </TableCell>

                  <TableCell className="p-3 text-right text-[12px] font-bold text-slate-700 whitespace-nowrap">{formatNumber(item.total || 0)}</TableCell>

                  <TableCell className="p-3 text-right">
                    <span className={cn("text-[12px] font-bold whitespace-nowrap", (item.debt || 0) > 0 ? "text-rose-500" : "text-emerald-500")}>
                      {formatNumber(item.debt || 0)}
                    </span>
                  </TableCell>

                  <TableCell className="p-3 text-center">
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border tracking-tight uppercase whitespace-nowrap", getStatusStyle(item.status))}>
                      {item.status === "COMPLETED" || item.status === "IMPORTED"
                        ? "Đã nhập"
                        : item.status === "APPROVED"
                        ? "Đã duyệt"
                        : isPending
                        ? "Chờ duyệt"
                        : "Đã hủy"}
                    </span>
                  </TableCell>

                  <TableCell className="p-3 text-right pr-5">
                    <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7" title="Chỉnh sửa"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/receipts/new?id=${item.id}`);
                        }}
                      >
                        <Pencil size={13} className="text-slate-400 hover:text-blue-600" />
                      </Button>

                      <Button
                        variant="ghost" size="icon" className="h-7 w-7" title="In phiếu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Printer size={13} className="text-slate-400" />
                      </Button>

                      {isPending && (
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" title="Xóa"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(item.id, item.code);
                          }}
                        >
                          <Trash2 size={13} className="text-slate-400 hover:text-rose-600" />
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

      {/* Footer thanh tổng cộng */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white min-w-full shrink-0">
        <div className="flex items-center gap-8 whitespace-nowrap">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Hiển thị {receipts.length} / {totalCount} bản ghi</p>
          <div className="flex items-center gap-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Giá trị: <span className="text-slate-700 ml-1">{formatNumber(totalAmount)} ₫</span></p>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Công nợ: <span className="text-rose-500 ml-1">{formatNumber(totalDebt)} ₫</span></p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 disabled:opacity-30"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Trước
          </Button>
          <div className="flex items-center justify-center h-7 w-auto px-3 text-[10px] font-black bg-slate-100 text-slate-600 rounded-full min-w-[28px]">
            {currentPage} / {totalPages || 1}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-3 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 disabled:opacity-30"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}