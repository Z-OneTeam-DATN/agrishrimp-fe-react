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
import { Eye, Printer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryExportTable({ exports }: any) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "PENDING":
        return "text-blue-500 bg-blue-50 border-blue-100";
      case "IN_PROGRESS":
        return "text-amber-600 bg-amber-50 border-amber-100";
      default:
        return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto no-scrollbar">
        <Table className="table-fixed min-w-[1800px] border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[40px] text-center p-2 border-r border-[#ddd]">
                <input type="checkbox" className="mt-1" />
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Số lệnh xuất kho
              </TableHead>
              <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Ngày lập lệnh
              </TableHead>
              <TableHead className="w-[130px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Mã đối tượng
              </TableHead>
              <TableHead className="w-[250px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Tên đối tượng nhận hàng
              </TableHead>
              <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Hạn xuất kho
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Kho xuất
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Người giao việc
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Người thực hiện
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Tình trạng thực hiện
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Tình trạng vận chuyển
              </TableHead>
              <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4 whitespace-nowrap">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exports.length > 0 ? (
              exports.map((item: any) => (
                <TableRow
                  key={item.code}
                  className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer group h-[48px]"
                >
                  <TableCell className="text-center p-2 border-r border-[#eee]">
                    <input type="checkbox" />
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] font-bold text-blue-600 text-[12px] whitespace-nowrap">
                    {item.code}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.date}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.customerCode}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] font-bold text-slate-800 text-[13px] whitespace-nowrap truncate">
                    {item.customerName}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-rose-600 font-bold">
                    {item.dueDate}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.warehouse}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.assigner}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.executor}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-center whitespace-nowrap">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-tight",
                        getStatusStyle(item.status),
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-center whitespace-nowrap text-[11px] font-medium text-slate-500">
                    {item.shippingStatusLabel}
                  </TableCell>
                  <TableCell className="p-2 text-right pr-4 whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-50"
                        title="Xem"
                      >
                        <Eye size={14} className="text-blue-600" />
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center grayscale opacity-40">
                    <img
                      src="/images/empty-box.png"
                      alt="Empty"
                      className="w-20 h-20 mb-2"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://cdn-icons-png.flaticon.com/512/4076/4076432.png")
                      }
                    />
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                      Không có dữ liệu
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <div className="flex items-center gap-6">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
            Tổng cộng {exports.length} bản ghi
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
