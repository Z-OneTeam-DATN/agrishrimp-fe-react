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
import { getTransferStatusLabel } from "@/lib/transfer-status";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const getStatusClassName = (status: string) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "COMPLETED") {
    return "bg-blue-50 text-blue-600 border-blue-100";
  }
  if (normalizedStatus === "INSPECTING") {
    return "bg-cyan-50 text-cyan-600 border-cyan-100";
  }
  if (normalizedStatus === "SOURCE_CONFIRMED") {
    return "bg-sky-50 text-sky-600 border-sky-100";
  }
  if (normalizedStatus === "SHIPPING" || normalizedStatus === "TRANSIT") {
    return "bg-blue-50 text-blue-600 border-blue-100";
  }
  if (normalizedStatus === "PENDING") {
    return "bg-amber-50 text-amber-600 border-amber-100";
  }
  if (normalizedStatus === "APPROVED") {
    return "bg-indigo-50 text-indigo-600 border-indigo-100";
  }

  return "bg-rose-50 text-rose-600 border-rose-100";
};

export function InventoryTransferTable({ transfers }: any) {
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="w-[40px] p-[10px] text-center">
                <Checkbox className="h-3.5 w-3.5" />
              </TableHead>
              <TableHead className="p-[10px] text-[11px] font-bold uppercase text-slate-500">
                Số phiếu
              </TableHead>
              <TableHead className="p-[10px] text-[11px] font-bold uppercase text-slate-500">
                Ngày điều chuyển
              </TableHead>
              <TableHead className="p-[10px] text-[11px] font-bold uppercase text-slate-500">
                Lý do
              </TableHead>
              <TableHead className="p-[10px] text-[11px] font-bold uppercase text-slate-500">
                Kho xuất
              </TableHead>
              <TableHead className="p-[10px] text-[11px] font-bold uppercase text-slate-500">
                Trạng thái
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length > 0 ? (
              transfers.map((item: any) => (
                <TableRow
                  key={item.code}
                  className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50/80"
                >
                  <TableCell className="p-[10px] text-center">
                    <Checkbox className="h-3.5 w-3.5" />
                  </TableCell>
                  <TableCell className="p-[10px] font-bold text-slate-900">
                    {item.code}
                  </TableCell>
                  <TableCell className="p-[10px] font-medium text-slate-500">
                    {item.date}
                  </TableCell>
                  <TableCell className="p-[10px] font-bold text-slate-800">
                    {item.description}
                  </TableCell>
                  <TableCell className="p-[10px] font-medium text-slate-500">
                    {item.sourceWarehouse}
                  </TableCell>
                  <TableCell className="p-[10px]">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${getStatusClassName(
                        item.status,
                      )}`}
                    >
                      {getTransferStatusLabel(
                        item.status,
                        item.transferBusinessType,
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-[300px] text-center">
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Search size={48} className="mb-2 opacity-20" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Không có dữ liệu
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-3">
        <p className="text-[11px] font-bold uppercase text-slate-400">
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
            className="h-8 w-8 border-blue-600 bg-blue-600 p-0 text-[11px] font-black text-white"
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
