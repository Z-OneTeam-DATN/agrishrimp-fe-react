"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Printer, ArrowRightLeft, Truck, CheckCircle2 } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface Transfer {
  id: string;
  code: string;
  date: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  totalQty: number;
  totalValue: number;
  status: "DRAFT" | "PENDING" | "TRANSIT" | "COMPLETED" | "CANCELLED";
  creator: string;
}

interface AdminTransferTableProps {
  data: Transfer[];
  mode: "outbound" | "inbound";
}

export function AdminTransferTable({ data, mode }: AdminTransferTableProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "DRAFT": return { label: "Bản nháp", color: "text-slate-500 bg-slate-50 border-slate-200" };
      case "PENDING": return { label: "Chờ duyệt", color: "text-amber-600 bg-amber-50 border-amber-100" };
      case "TRANSIT": return { label: "Đang chuyển", color: "text-blue-600 bg-blue-50 border-blue-100" };
      case "COMPLETED": return { label: "Đã nhận", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
      case "CANCELLED": return { label: "Đã hủy", color: "text-rose-600 bg-rose-50 border-rose-100" };
      default: return { label: status, color: "text-slate-500 bg-slate-50" };
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table className="table-custom border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Mã phiếu</TableHead>
              <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Ngày tạo</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">
                {mode === "outbound" ? "Kho đến (Nơi nhận)" : "Kho đi (Nguồn hàng)"}
              </TableHead>
              <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Số lượng</TableHead>
              <TableHead className="w-[130px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Giá trị</TableHead>
              <TableHead className="w-[130px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
              <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Người tạo</TableHead>
              <TableHead className="w-[120px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              return (
                <TableRow key={item.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group">
                  <TableCell className="p-2 pl-4 whitespace-nowrap">
                    <span className="text-blue-600 font-bold text-[13px]">{item.code}</span>
                  </TableCell>
                  <TableCell className="p-2 whitespace-nowrap text-slate-500 text-[12px]">
                    {item.date}
                  </TableCell>
                  <TableCell className="p-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft size={14} className="text-slate-300" />
                      <span className="text-slate-700 font-bold text-[13px]">
                        {mode === "outbound" ? item.toWarehouse : item.fromWarehouse}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-right whitespace-nowrap font-bold text-slate-700 text-[13px]">
                    {formatNumber(item.totalQty)}
                  </TableCell>
                  <TableCell className="p-2 text-right whitespace-nowrap font-bold text-slate-900 text-[13px]">
                    {formatNumber(item.totalValue)}
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded border tracking-tight uppercase whitespace-nowrap inline-block min-w-[100px]",
                      statusInfo.color
                    )}>
                      {statusInfo.label}
                    </span>
                  </TableCell>
                  <TableCell className="p-2 whitespace-nowrap text-slate-500 text-[12px]">
                    {item.creator}
                  </TableCell>
                  <TableCell className="p-2 text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50" title="Xem chi tiết">
                        <Eye size={14} className="text-blue-600" />
                      </Button>
                      
                      {mode === "inbound" && item.status === "TRANSIT" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-emerald-50 text-emerald-600" title="Nhập kho nhanh">
                          <CheckCircle2 size={14} />
                        </Button>
                      )}

                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100" title="In lệnh điều chuyển">
                        <Printer size={14} className="text-slate-500" />
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
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Tổng cộng {data.length} phiếu điều chuyển
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-blue-600 text-white border-blue-600">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </div>
  );
}
