"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/utils";

interface InventoryReceiptTableProps {
  receipts: any[];
  onDeleteClick: (id: number, code: string) => void;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "COMPLETED":
    case "IMPORTED":
      return "Đã nhập kho";
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
    case "PO":
      return "Chờ duyệt";
    case "CANCELLED":
    case "REJECTED":
      return "Đã hủy";
    default:
      return status || "Chưa xác định";
  }
};

export function InventoryReceiptTable({
  receipts,
  onDeleteClick,
  totalCount,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: InventoryReceiptTableProps) {
  const router = useRouter();
  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalCount);

  const actionButton = (
    label: string,
    icon: React.ReactNode,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
    className = "",
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          className={`h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-blue-600 ${className}`}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full">
        <Table className="table-custom w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[16%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
          </colgroup>
          <TableHeader>
            <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
              <TableHead className="p-3 pl-4 text-[10px] font-semibold text-[#1f1f1f]">Mã phiếu</TableHead>
              <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">Ngày tạo</TableHead>
              <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">Nhà cung cấp</TableHead>
              <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">Kho nhập</TableHead>
              <TableHead className="p-3 text-right text-[10px] font-semibold text-[#1f1f1f]">Tổng giá trị</TableHead>
              <TableHead className="p-3 text-[10px] font-semibold text-[#1f1f1f]">Trạng thái</TableHead>
              <TableHead className="p-3 pr-4 text-right text-[10px] font-semibold text-[#1f1f1f]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((item) => {
              const isPending = item.status === "PENDING" || item.status === "PO";
              return (
                <TableRow
                  key={item.code}
                  className="group cursor-pointer border-b border-slate-100 hover:bg-slate-50/70"
                  onClick={() => router.push(`/admin/receipts/${item.id}`)}
                >
                  <TableCell className="p-3 pl-4">
                    <p className="text-[12px] font-semibold text-slate-800">{item.code}</p>
                    <p className="mt-1 text-[10px] text-slate-400">Tạo bởi {item.creator || "Hệ thống"}</p>
                  </TableCell>
                  <TableCell className="p-3 text-[11.5px] text-slate-500">{item.date}</TableCell>
                  <TableCell className="p-3">
                    <p className="line-clamp-2 text-[11.5px] font-medium text-slate-700">{item.supplier}</p>
                  </TableCell>
                  <TableCell className="p-3 text-[11.5px] text-slate-500">{item.warehouse}</TableCell>
                  <TableCell className="p-3 text-right">
                    <p className="text-[12px] font-semibold text-slate-800">{formatNumber(item.total || 0)} ₫</p>
                    {(item.debt || 0) > 0 && (
                      <p className="mt-1 text-[10px] text-slate-400">Còn nợ {formatNumber(item.debt)} ₫</p>
                    )}
                  </TableCell>
                  <TableCell className="p-3 text-[11.5px] text-slate-600">{getStatusLabel(item.status)}</TableCell>
                  <TableCell className="p-3 pr-4 text-right">
                    <div className="flex justify-end">
                      {actionButton("Xem chi tiết", <Eye size={15} />, (event) => {
                        event.stopPropagation();
                        router.push(`/admin/receipts/${item.id}`);
                      })}
                      {isPending && actionButton("Chỉnh sửa", <Pencil size={14} />, (event) => {
                        event.stopPropagation();
                        router.push(`/admin/receipts/new?id=${item.id}`);
                      })}
                      {isPending && actionButton(
                        "Xóa phiếu",
                        <Trash2 size={14} />,
                        (event) => {
                          event.stopPropagation();
                          onDeleteClick(item.id, item.code);
                        },
                        "hover:text-rose-600",
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#f8f9fa] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            Hiển thị {firstItem} - {lastItem} trong {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-[11px] font-medium"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Trước
            </Button>
            <span className="min-w-[60px] text-center text-[11px] text-slate-500">
              {currentPage} / {totalPages || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-[11px] font-medium"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

