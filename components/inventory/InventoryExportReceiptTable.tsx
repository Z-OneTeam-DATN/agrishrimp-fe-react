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
import {
  Eye,
  Printer,
  Trash2,
  Calendar,
  User,
  Warehouse,
  ArrowRight // Tránh lỗi undefined, dùng ArrowRight
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

export function InventoryExportReceiptTable({ receipts }: any) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto no-scrollbar">
        <Table className="table-fixed min-w-[1400px] border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa] border-b border-[#ddd]">
              <TableHead className="w-[40px] text-center p-2 border-r border-[#ddd]">
                <input type="checkbox" className="mt-1 accent-blue-600" />
              </TableHead>
              <TableHead className="w-[180px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">
                Mã phiếu xuất
              </TableHead>
              <TableHead className="w-[160px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">
                Ngày ghi sổ
              </TableHead>
              <TableHead className="w-[300px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider">
                Đối tượng nhận hàng
              </TableHead>
              <TableHead className="w-[180px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">
                Kho hàng xuất
              </TableHead>
              <TableHead className="w-[250px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider">
                Lý do / Diễn giải
              </TableHead>
              <TableHead className="w-[120px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-center">
                Trạng thái
              </TableHead>
              <TableHead className="w-[150px] font-black text-[#444] text-[10px] uppercase p-2 border-r border-[#ddd] tracking-wider text-right">
                Tổng giá trị
              </TableHead>
              <TableHead className="w-[100px] text-right font-black text-[#444] text-[10px] uppercase p-2 pr-4 tracking-wider">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts && receipts.length > 0 ? (
              receipts.map((item: any) => (
                <TableRow
                  key={item.id || item.code}
                  className="hover:bg-blue-50/30 border-b border-[#eee] transition-colors cursor-pointer group h-[52px]"
                >
                  <TableCell className="text-center p-2 border-r border-[#eee]">
                    <input type="checkbox" className="accent-blue-600" />
                  </TableCell>

                  <TableCell className="p-2 border-r border-[#eee] font-bold text-blue-600 text-[12px] text-center">
                    {item.code}
                  </TableCell>

                  <TableCell className="p-2 border-r border-[#eee] text-[12px] text-slate-600 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(item.createdAt)}
                    </div>
                  </TableCell>

                  {/* Đối tượng nhận hàng */}
                  <TableCell className="p-2 border-r border-[#eee] font-bold text-slate-700 text-[12px] truncate">
                    <div className="flex items-center gap-2">
                      {item.supplierName ? (
                        <>
                          <User size={14} className="text-slate-400 shrink-0" />
                          <span title={item.supplierName}>{item.supplierName}</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight size={14} className="text-blue-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-blue-600 font-black uppercase leading-none mb-0.5">Nội bộ</span>
                            <span className="truncate text-blue-800" title={item.partnerBranchName || "Chi nhánh nhận"}>
                              {item.partnerBranchName || "Khách hàng lẻ"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="p-2 border-r border-[#eee] text-[12px] text-slate-600 text-center truncate font-medium">
                    {item.branchName || "Kho tổng"}
                  </TableCell>

                  <TableCell className="p-2 border-r border-[#eee] text-[12px] text-slate-500 italic truncate" title={item.reason}>
                    {item.reason || "Không có diễn giải"}
                  </TableCell>

                  <TableCell className="p-2 border-r border-[#eee] text-center">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter",
                      item.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      item.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>
                      {item.status === "COMPLETED" ? "Đã xuất" : "Chờ xử lý"}
                    </span>
                  </TableCell>

                  <TableCell className="p-2 border-r border-[#eee] text-right font-bold text-slate-700 text-[12px]">
                    {formatNumber(item.totalAmount || 0)} ₫
                  </TableCell>

                  <TableCell className="p-2 text-right pr-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-100" title="Xem chi tiết">
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-100" title="In phiếu">
                        <Printer size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-100" title="Xóa phiếu">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center opacity-40">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png"
                      alt="Empty"
                      className="w-20 h-20 mb-4 grayscale"
                    />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Hệ thống chưa có dữ liệu phiếu xuất
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}