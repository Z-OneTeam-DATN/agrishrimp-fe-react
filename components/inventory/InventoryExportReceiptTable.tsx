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
import { cn, formatNumber } from "@/lib/utils";

export function InventoryExportReceiptTable({ receipts }: any) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto no-scrollbar">
        <Table className="table-fixed min-w-[1400px] border-collapse">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
              <TableHead className="w-[40px] text-center p-2 border-r border-[#ddd]">
                <input type="checkbox" className="mt-1" />
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Số phiếu xuất kho
              </TableHead>
              <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Ngày xuất kho
              </TableHead>
              <TableHead className="w-[250px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Tên đối tượng nhận hàng
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Kho xuất
              </TableHead>
              <TableHead className="w-[160px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Chi nhánh
              </TableHead>
              <TableHead className="w-[200px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Diễn giải
              </TableHead>
              <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Loại phiếu
              </TableHead>
              <TableHead className="w-[140px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 border-r border-[#ddd] whitespace-nowrap">
                Tham chiếu
              </TableHead>
              <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4 whitespace-nowrap">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length > 0 ? (
              receipts.map((item: any) => (
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
                  <TableCell className="p-2 border-r border-[#eee] font-bold text-slate-800 text-[13px] whitespace-nowrap truncate">
                    {item.customerName}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.warehouse}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.branch}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-slate-600">
                    {item.description}
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-center whitespace-nowrap">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.type}
                    </span>
                  </TableCell>
                  <TableCell className="p-2 border-r border-[#eee] text-[12px] whitespace-nowrap text-blue-500 font-medium">
                    {item.reference}
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
                        className="h-7 w-7 hover:bg-slate-100"
                        title="In"
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-[400px] text-center">
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
    </div>
  );
}
