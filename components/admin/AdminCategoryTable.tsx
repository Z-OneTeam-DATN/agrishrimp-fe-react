"use client";

import React from "react";
import { Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
  status: string;
  image: string | null;
}

interface AdminCategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export function AdminCategoryTable({ categories, onEdit, onDelete }: AdminCategoryTableProps) {
  return (
    <div className="w-full">
      <Table className="table-custom border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[60px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">ID</TableHead>
            <TableHead className="w-[60px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">Ảnh</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Tên danh mục & Mô tả</TableHead>
            <TableHead className="w-[120px] text-center font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Số sản phẩm</TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Trạng thái</TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length > 0 ? (
            categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors">
                <TableCell className="text-center text-slate-400 font-bold text-[11px]">#{cat.id}</TableCell>
                <TableCell className="p-2">
                  <div className="w-10 h-10 mx-auto bg-white border border-[#ddd] rounded-[3px] flex items-center justify-center overflow-hidden shadow-sm">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover p-0.5" />
                    ) : (
                      <ImageIcon size={16} className="text-slate-200" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex flex-col">
                    <span className="text-[#1f1f1f] font-bold text-[13px] leading-tight">{cat.name}</span>
                    <span className="text-slate-500 text-[11px] line-clamp-1">{cat.description}</span>
                  </div>
                </TableCell>
                <TableCell className="p-2 text-center font-bold text-slate-700 text-[12px]">
                  {cat.productCount}
                </TableCell>
                <TableCell className="p-2">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase",
                    cat.status === "Hiển thị" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    {cat.status}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1">
                    {/* Nút Sửa: Gắn sự kiện onEdit */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-slate-100"
                      onClick={() => onEdit(cat)}
                    >
                      <Pencil size={14} className="text-blue-600" />
                    </Button>

                    {/* Nút Xóa: Gắn sự kiện onDelete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-rose-50"
                      onClick={() => onDelete(cat.id)}
                    >
                      <Trash2 size={14} className="text-rose-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-4 text-slate-500 text-[12px]">
                Không có dữ liệu danh mục nào.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
          Tổng số {categories.length} danh mục
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Trước</Button>
          <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-[10px] bg-blue-600 text-white border-blue-600">1</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] font-bold bg-white border-[#ddd]">Sau</Button>
        </div>
      </div>
    </div>
  );
}