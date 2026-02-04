"use client";

import React from "react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Product {
  code: string;
  name: string;
  type: string;
  unit: string;
  group: string;
  stock: number;
  status: string;
}

interface ProductTableProps {
  products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <>
      <Table className="table-custom">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[40px] text-center p-[10px]">
              <Checkbox className="h-3.5 w-3.5" />
            </TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Mã hàng</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Tên hàng</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Tính chất</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">ĐVT chính</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Nhóm VTHH</TableHead>
            <TableHead className="text-right font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Số lượng tồn</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow 
              key={product.code} 
              className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer"
            >
              <TableCell className="text-center p-[10px]" onClick={(e) => e.stopPropagation()}>
                <Checkbox className="h-3.5 w-3.5" />
              </TableCell>
              <TableCell className="p-[10px] text-gray-600">{product.code}</TableCell>
              <TableCell className="p-[10px]">
                <Link 
                  href={`/inventory/products/${product.code}`}
                  className="text-[#1f1f1f] hover:underline"
                >
                  {product.name}
                </Link>
              </TableCell>
              <TableCell className="p-[10px] text-gray-500">{product.type}</TableCell>
              <TableCell className="p-[10px] text-gray-500">{product.unit}</TableCell>
              <TableCell className="p-[10px] text-gray-500">{product.group}</TableCell>
              <TableCell className={cn(
                "p-[10px] text-right font-bold",
                product.stock === 0 ? "text-red-500" : "text-[#1f1f1f]"
              )}>
                {product.stock.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="p-[10px]">
                <span className="text-[#16a34a] font-semibold text-[12px]">
                  {product.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[12px] text-gray-500">
          Hiển thị 1 - {products.length} trên tổng số 50 bản ghi
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-[#007bff] text-white border-[#007bff]">1</Button>
          <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-white border-[#ddd]">2</Button>
          <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </>
  );
}
