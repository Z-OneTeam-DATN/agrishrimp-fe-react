"use client";

import React from "react";
import Link from "next/link";
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
  Eye,
  Printer,
  Trash2,
  Pencil,
  User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryCheckTable({
  checks,
  selectedIds,
  onSelectionChange,
}: any) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "AUDITING":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "PENDING":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((i: string) => i !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  return (
    <div className="overflow-x-auto">
      <Table className="table-custom border-collapse min-w-[1100px]">
        <TableHeader>
          <TableRow className="bg-[#f8f9fa] border-b border-[#eee]">
            <TableHead className="w-[40px] text-center p-2 pl-4">
              <Checkbox
                checked={
                  selectedIds.length === checks.length && checks.length > 0
                }
                onCheckedChange={() =>
                  onSelectionChange(
                    selectedIds.length === checks.length
                      ? []
                      : checks.map((c: any) => c.id),
                  )
                }
              />
            </TableHead>
            <TableHead className="w-[120px] font-bold text-slate-700 text-[11px] uppercase p-2">
              Mã / Ngày
            </TableHead>
            <TableHead className="w-[200px] font-bold text-slate-700 text-[11px] uppercase p-2">
              Kho kiểm kê
            </TableHead>
            <TableHead className="w-[150px] font-bold text-slate-700 text-[11px] uppercase p-2">
              Người phụ trách
            </TableHead>
            <TableHead className="w-[100px] text-center font-bold text-slate-700 text-[11px] uppercase p-2">
              SKU
            </TableHead>
            <TableHead className="w-[150px] font-bold text-slate-700 text-[11px] uppercase p-2">
              Tiến độ
            </TableHead>
            <TableHead className="w-[120px] text-right font-bold text-slate-700 text-[11px] uppercase p-2">
              Chênh lệch
            </TableHead>
            <TableHead className="w-[120px] font-bold text-slate-700 text-[11px] uppercase p-2 text-center">
              Trạng thái
            </TableHead>
            <TableHead className="w-[100px] text-right font-bold text-slate-700 text-[11px] uppercase p-2 pr-4">
              Hành động
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checks.map((item: any) => (
            <TableRow
              key={item.id}
              className="hover:bg-blue-50/10 border-b border-[#eee] transition-colors cursor-pointer group"
            >
              <TableCell className="p-2 pl-4 text-center">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell className="p-2">
                <Link href={`/admin/inventory-checks/${item.code}`}>
                  <div className="flex flex-col hover:underline">
                    <span className="text-blue-600 font-bold text-[12px] uppercase">
                      {item.code}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {item.date}
                    </span>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="p-2">
                <span className="text-[12px] font-bold text-slate-700 uppercase">
                  {item.warehouse}
                </span>
              </TableCell>
              <TableCell className="p-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <User size={12} className="text-slate-300" /> {item.keeper}
                </div>
              </TableCell>
              <TableCell className="p-2 text-center font-bold text-slate-700 text-[12px]">
                {item.skuCount}
              </TableCell>
              <TableCell className="p-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600">
                    {item.progress}%
                  </span>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="p-2 text-right font-bold text-slate-700">
                {item.diffValue}
              </TableCell>
              <TableCell className="p-2 text-center">
                <span
                  className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-tighter",
                    getStatusStyle(item.status),
                  )}
                >
                  {item.status}
                </span>
              </TableCell>
              <TableCell
                className="p-2 text-right pr-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/inventory-checks/${item.code}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600"
                    >
                      <Eye size={14} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400"
                  >
                    <Printer size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-600"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

