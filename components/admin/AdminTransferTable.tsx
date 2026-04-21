"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Pencil,
  Clock,
  ArrowRight,
  Truck,
  FileText,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminTransferTableProps {
  data: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
}

export function AdminTransferTable({
  data,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onDelete,
}: AdminTransferTableProps) {
  const router = useRouter();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-white text-amber-600 border-amber-200";
      case "APPROVED":
        return "bg-white text-blue-600 border-blue-200";
      case "TRANSIT":
      case "SHIPPING":
        return "bg-white text-indigo-600 border-indigo-200";
      case "COMPLETED":
        return "bg-white text-emerald-600 border-emerald-200";
      case "CANCELLED":
      case "REJECTED":
      case "OVERDUE":
        return "bg-white text-rose-600 border-rose-200";
      default:
        return "bg-white text-slate-500 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return "CHỜ DUYỆT";
      case "APPROVED": return "ĐÃ DUYỆT";
      case "TRANSIT":
      case "SHIPPING": return "ĐANG CHUYỂN";
      case "COMPLETED": return "HOÀN THÀNH";
      case "OVERDUE": return "QUÁ HẠN";
      case "CANCELLED": return "ĐÃ HỦY";
      case "REJECTED": return "TỪ CHỐI";
      default: return status;
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => item.id));
    }
  };

  const handleViewDetail = (id: any) => {
    router.push(`/admin/transfers/${id}`);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-x-auto relative custom-scrollbar">
          <Table className="table-custom border-collapse min-w-[1000px] w-full">
            <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
              <TableRow className="bg-white border-b border-slate-100 hover:bg-white">
                <TableHead className="w-[50px] font-bold text-slate-400 text-[10px] uppercase p-3 pl-5">
                  ID
                </TableHead>
                <TableHead className="w-[120px] font-bold text-slate-400 text-[10px] uppercase p-3">
                  Mã phiếu
                </TableHead>
                <TableHead className="w-[130px] font-bold text-slate-400 text-[10px] uppercase p-3">
                  Ngày lập
                </TableHead>
                <TableHead className="w-[280px] font-bold text-slate-400 text-[10px] uppercase p-3">
                  Lộ trình (Gửi → Nhận)
                </TableHead>
                <TableHead className="w-[150px] font-bold text-slate-400 text-[10px] uppercase p-3">
                  Người giao
                </TableHead>
                <TableHead className="w-[100px] text-right font-bold text-slate-400 text-[10px] uppercase p-3">
                  Số lượng
                </TableHead>
                <TableHead className="w-[110px] font-bold text-slate-400 text-[10px] uppercase p-3 text-center">
                  Trạng thái
                </TableHead>
                <TableHead className="w-[100px] text-right font-bold text-slate-400 text-[10px] uppercase p-3 pr-5">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const canDelete = item.status === "PENDING" || item.status === "DRAFT";

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => handleViewDetail(item.id)}
                    className={cn(
                      "hover:bg-slate-50/50 border-b border-slate-50 transition-colors cursor-pointer group h-[56px]",
                      selectedIds.includes(item.id) && "bg-blue-50/30",
                    )}
                  >
                    <TableCell className="p-3 pl-5 text-[10px] font-bold text-slate-300 uppercase group-hover:text-blue-400 transition-colors">
                      #{item.id || "0"}
                    </TableCell>

                    <TableCell className="p-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-slate-700 font-bold text-[11px] tracking-tight uppercase flex items-center gap-1.5 whitespace-nowrap">
                          <FileText size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                          {item.transferCode || item.code}
                        </span>
                        {item.transferType === "ORDER_REPLENISHMENT" ? (
                          <>
                            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                              Tá»± Ä‘á»™ng tá»« Ä‘Æ¡n thiáº¿u hÃ ng
                            </span>
                            <span className="max-w-[220px] truncate text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                              {item.referenceCode || item.description || "Phiáº¿u bá»• sung chá» duyá»‡t"}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="p-3">
                      <span className="text-[10px] text-slate-500 font-medium uppercase whitespace-nowrap">
                        {item.date || new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </TableCell>

                    <TableCell className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[120px]">
                          {item.fromBranchName || item.fromWarehouse || item.sourceBranchName}
                        </span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tight truncate max-w-[120px]">
                          {item.toBranchName || item.toWarehouse || item.destBranchName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="p-3">
                      <div className="flex items-center gap-1.5 max-w-[130px]">
                        <Truck size={11} className="text-slate-300 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight truncate">
                          {item.transporter || 'N/A'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                          {item.totalQuantity || item.totalQty || 0} SP
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="p-3 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-full border tracking-tight uppercase whitespace-nowrap",
                          getStatusStyle(item.status),
                        )}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </TableCell>

                    <TableCell
                      className="p-3 text-right pr-5 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewDetail(item.id)}
                          title="Sửa / Chi tiết"
                        >
                          <Pencil size={13} className="text-slate-400 hover:text-blue-500" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            !canDelete && "opacity-20 grayscale",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canDelete) onDelete(item.id);
                          }}
                          disabled={!canDelete}
                          title={canDelete ? "Xóa phiếu" : "Không thể xóa phiếu đã xử lý"}
                        >
                          <Trash2 size={13} className="text-slate-400 hover:text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white min-w-full shrink-0">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            Tổng số: {totalCount} bản ghi
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <div className="flex items-center justify-center h-7 w-auto px-3 text-[10px] font-black bg-slate-100 text-slate-600 rounded-full min-w-[28px]">
              {currentPage} / {totalPages || 1}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
