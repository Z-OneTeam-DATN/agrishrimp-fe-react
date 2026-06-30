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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryProductTable({ products }: any) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
            <TableHead className="w-[40px] text-center p-[10px]">
              <Checkbox className="h-3.5 w-3.5" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
              Mã hàng
            </TableHead>
            <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
              Tên hàng
            </TableHead>
            <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
              ĐVT
            </TableHead>
            <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
              Nhóm
            </TableHead>
            <TableHead className="text-right font-bold text-slate-500 text-[11px] uppercase p-[10px]">
              Số lượng tồn
            </TableHead>
            <TableHead className="font-bold text-slate-500 text-[11px] uppercase p-[10px]">
              Trạng thái
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: any) => (
            <TableRow
              key={product.code}
              className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
            >
              <TableCell
                className="text-center p-[10px]"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox className="h-3.5 w-3.5" />
              </TableCell>
              <TableCell className="p-[10px] text-slate-500 font-medium">
                #{product.code}
              </TableCell>
              <TableCell className="p-[10px]">
                <Link
                  href={`/inventory/products/${product.code}`}
                  className="text-slate-900 font-bold hover:text-blue-600"
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell className="p-[10px] text-slate-500 font-medium">
                {product.unit}
              </TableCell>
              <TableCell className="p-[10px]">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black">
                  {product.group}
                </span>
              </TableCell>
              <TableCell
                className={cn(
                  "p-[10px] text-right font-black",
                  product.stock === 0 ? "text-rose-500" : "text-slate-900",
                )}
              >
                {product.stock.toLocaleString("vi-VN", {
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="p-[10px]">
                <span className="text-blue-600 font-black text-[11px] uppercase tracking-tighter">
                  {product.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/30">
        <p className="text-[11px] font-bold text-slate-400 uppercase">
          Hiển thị <span className="text-slate-900">{products.length}</span> /
          50 bản ghi
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

