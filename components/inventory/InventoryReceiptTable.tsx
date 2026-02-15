"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Printer,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

export function InventoryReceiptTable({ receipts }: any) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "IMPORTED":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "PO":
        return "text-blue-500 bg-blue-50 border-blue-100";
      case "CANCELLED":
        return "text-rose-600 bg-rose-50 border-rose-100";
      default:
        return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  // Tính toán tổng cộng cho footer
  const totalAmount = receipts.reduce(
    (acc: number, item: any) => acc + (item.total || 0),
    0,
  );

  // CHỈNH SỬA 2: Tính tổng nợ THỰC TẾ (loại trừ các phiếu ĐẶT HÀNG - PO)
  const totalDebt = receipts.reduce((acc: number, item: any) => {
    if (item.status === "PO") return acc;
    return acc + (item.debt || 0);
  }, 0);

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="table-custom border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[50px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">
                ID
              </TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">
                Mã phiếu / Thời gian
              </TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
                Nhà cung cấp
              </TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
                Kho nhập
              </TableHead>
              <TableHead className="text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
                Tổng tiền
              </TableHead>
              <TableHead className="text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
                Còn nợ
              </TableHead>
              <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">
                Trạng thái
              </TableHead>
              <TableHead className="w-[110px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((item: any) => (
              <TableRow
                key={item.code}
                className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group"
              >
                <TableCell className="text-center text-slate-400 font-bold text-[11px]">
                  #{item.id || "0"}
                </TableCell>
                <TableCell className="p-2 pl-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-[#1f1f1f] font-bold text-[13px] leading-tight">
                      {item.code}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {item.date}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-2 whitespace-nowrap">
                  <span className="text-slate-700 font-bold text-[13px]">
                    {item.supplier}
                  </span>
                </TableCell>
                <TableCell className="p-2 whitespace-nowrap">
                  <span className="text-slate-600 text-[12px]">
                    {item.warehouse}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-right whitespace-nowrap font-bold text-slate-900 text-[13px]">
                  {formatNumber(item.total || 0)}
                </TableCell>

                {/* CHỈNH SỬA 1: Xử lý hiển thị CÒN NỢ cho phiếu ĐẶT HÀNG */}
                <TableCell className="p-2 text-right whitespace-nowrap font-bold text-[13px]">
                  {item.status === "PO" ? (
                    <span className="text-slate-400">0</span>
                  ) : (
                    <span
                      className={cn(
                        (item.debt || 0) > 0
                          ? "text-rose-600"
                          : "text-emerald-600",
                      )}
                    >
                      {formatNumber(item.debt || 0)}
                    </span>
                  )}
                </TableCell>

                <TableCell className="p-2 text-center">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase",
                      getStatusStyle(item.status),
                    )}
                  >
                    {/* CHỈNH SỬA 3: Đổi tên PHIẾU TẠM -> ĐẶT HÀNG */}
                    {item.status === "IMPORTED"
                      ? "Đã nhập kho"
                      : item.status === "PO"
                        ? "Đặt hàng"
                        : item.status}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-blue-50"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} className="text-blue-600" />
                    </Button>

                    {/* CHỈNH SỬA 3: Luôn hiện nút IN để gửi cho NCC */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-slate-100"
                      title="In phiếu / Xuất đơn"
                    >
                      <Printer size={14} className="text-slate-500" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-rose-50"
                      title="Xóa"
                    >
                      <Trash2 size={14} className="text-rose-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <div className="flex items-center gap-6">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Tổng cộng {receipts.length} phiếu
          </p>
          <div className="h-4 w-[1px] bg-slate-200" />
          <p className="text-[11px] font-bold uppercase">
            Tổng tiền:{" "}
            <span className="text-blue-600">{formatNumber(totalAmount)}</span>
          </p>
          <p className="text-[11px] font-bold uppercase">
            Tổng nợ thực tế:{" "}
            <span className="text-rose-600">{formatNumber(totalDebt)}</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 text-[10px] bg-blue-600 text-white border-blue-600"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
