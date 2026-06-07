"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AdminTransferTableProps {
  data: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
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
  pageSize,
  onPageChange,
  selectedIds,
  onSelectionChange,
  onDelete,
}: AdminTransferTableProps) {
  const router = useRouter();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ duyệt";
      case "APPROVED":
        return "Đã duyệt";
      case "TRANSIT":
      case "SHIPPING":
        return "Đang chuyển";
      case "COMPLETED":
        return "Hoàn thành";
      case "OVERDUE":
        return "Quá hạn";
      case "CANCELLED":
        return "Đã hủy";
      case "REJECTED":
        return "Từ chối";
      default:
        return status;
    }
  };

  const getTransferTypeLabel = (item: any) => {
    if (item.transferType === "ORDER_REPLENISHMENT") {
      return "Tự động từ đơn thiếu hàng";
    }
    return "Thủ công";
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((item) => item.id));
    }
  };

  void toggleSelectAll;

  const handleViewDetail = (id: any) => {
    router.push(`/admin/transfers/${id}`);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-x-auto relative custom-scrollbar">
          <Table className="table-custom border-collapse min-w-[1060px] w-full">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className="border-b border-[#ccc] bg-[#f0f0f0] hover:bg-[#f0f0f0]">
                <TableHead className="w-[52px] px-1.5 py-2 pl-4 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  STT
                </TableHead>
                <TableHead className="w-[122px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Mã phiếu
                </TableHead>
                <TableHead className="w-[160px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Loại
                </TableHead>
                <TableHead className="w-[118px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Ngày lập
                </TableHead>
                <TableHead className="w-[244px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Lộ trình (Gửi -&gt; Nhận)
                </TableHead>
                <TableHead className="w-[128px] px-1.5 py-2 text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Người giao
                </TableHead>
                <TableHead className="w-[82px] px-1.5 py-2 text-right text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Số lượng
                </TableHead>
                <TableHead className="w-[104px] px-1.5 py-2 text-center text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Trạng thái
                </TableHead>
                <TableHead className="w-[84px] px-1.5 py-2 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f] whitespace-nowrap">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => {
                const canDelete = item.status === "PENDING" || item.status === "DRAFT";
                const rowNumber = (currentPage - 1) * pageSize + index + 1;

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => handleViewDetail(item.id)}
                    className={cn(
                      "cursor-pointer border-b border-[#eee] transition-colors hover:bg-[#f0f8ff] group",
                      selectedIds.includes(item.id) && "bg-blue-50/30",
                    )}
                  >
                    <TableCell className="px-1.5 py-2 pl-4 text-[11px] font-medium text-slate-500 transition-colors group-hover:text-blue-500">
                      {rowNumber}
                    </TableCell>

                    <TableCell className="px-1.5 py-2">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="whitespace-nowrap text-[11px] font-semibold tracking-tight text-slate-700">
                          {item.transferCode || item.code}
                        </span>
                        {(item.referenceCode || item.description) && (
                          <span className="max-w-[180px] truncate text-[10px] text-slate-400">
                            {item.referenceCode || item.description}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-1.5 py-2 text-[11px] text-slate-600">
                      {getTransferTypeLabel(item)}
                    </TableCell>

                    <TableCell className="px-1.5 py-2">
                      <span className="text-[11px] font-medium text-slate-600 whitespace-nowrap">
                        {item.date || new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </TableCell>

                    <TableCell className="px-1.5 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="max-w-[98px] truncate text-[11px] font-medium text-slate-500">
                          {item.fromBranchName || item.fromWarehouse || item.sourceBranchName}
                        </span>
                        <span className="text-slate-300">-&gt;</span>
                        <span className="max-w-[98px] truncate text-[11px] font-semibold tracking-tight text-slate-800">
                          {item.toBranchName || item.toWarehouse || item.destBranchName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-1.5 py-2">
                      <span className="block max-w-[118px] truncate text-[11px] font-medium leading-tight text-slate-500">
                        {item.transporter || "Chưa cập nhật"}
                      </span>
                    </TableCell>

                    <TableCell className="px-1.5 py-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                          {item.totalQuantity || item.totalQty || 0}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-1.5 py-2 text-center whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">
                        {getStatusLabel(item.status)}
                      </span>
                    </TableCell>

                    <TableCell
                      className="px-1 py-2 text-right pr-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewDetail(item.id)}
                          title="Xem chi tiet"
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
                          title={canDelete ? "Xoa phieu" : "Khong the xoa phieu da xu ly"}
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

        <div className="flex min-w-full shrink-0 items-center justify-between border-t border-slate-100 bg-[#f8f9fa] px-5 py-3">
          <p className="text-[12px] font-semibold text-slate-500">
            Tổng số: {totalCount} bản ghi
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-[11px] font-bold text-slate-400 uppercase hover:text-slate-600"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <div className="flex h-7 min-w-[28px] w-auto items-center justify-center rounded-full bg-slate-100 px-3 text-[11px] font-black text-slate-600">
              {currentPage} / {totalPages || 1}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 text-[11px] font-bold text-slate-400 uppercase hover:text-slate-600"
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
