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
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export function InventoryTransferTable({ transfers }: any) {
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
              <TableHead className="w-[40px] text-center p-[10px]">
                <Checkbox className="h-3.5 w-3.5" />
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
                Số phiếu
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
                Ngày điều chuyển
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
                Lý do
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
                Kho xuất
              </TableHead>
              <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length > 0 ? (
              transfers.map((item: any) => (
                <TableRow
                  key={item.code}
                  className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
                >
                  <TableCell className="text-center p-[10px]">
                    <Checkbox className="h-3.5 w-3.5" />
                  </TableCell>
                  <TableCell className="p-[10px] text-slate-900 font-bold">
                    {item.code}
                  </TableCell>
                  <TableCell className="p-[10px] text-slate-500 font-medium">
                    {item.date}
                  </TableCell>
                  <TableCell className="p-[10px] text-slate-800 font-bold">
                    {item.description}
                  </TableCell>
                  <TableCell className="p-[10px] text-slate-500 font-medium">
                    {item.sourceWarehouse}
                  </TableCell>
                  <TableCell className="p-[10px]">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-tighter ${
                        item.status === "COMPLETED"
                          ? "bg-blue-50 text-blue-600 border-blue-100"
                          : item.status === "SHIPPING" || item.status === "TRANSIT"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : item.status === "PENDING"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : item.status === "APPROVED"
                                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                      }`}
                    >
                      {item.status === "PENDING" ? "Chờ duyệt" : 
                       item.status === "APPROVED" ? "Đã duyệt" :
                       item.status === "SHIPPING" ? "Đang chuyển" :
                       item.status === "COMPLETED" ? "Hoàn thành" :
                       item.status === "CANCELLED" ? "Đã hủy" :
                       item.status === "REJECTED" ? "Từ chối" : item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-[300px] text-center">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Search size={48} className="mb-2 opacity-20" />
                    <p className="font-black text-slate-400 uppercase text-[11px] tracking-widest">
                      Không có dữ liệu
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/30">
        <p className="text-[11px] font-bold text-slate-400 uppercase">
          Hiển thị <span className="text-slate-900">{transfers.length}</span>{" "}
          bản ghi
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200 bg-white"
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-blue-600 text-white border-blue-600 font-black text-[11px]"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200 bg-white"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </>
  );
}

