"use client";

import React from "react";
import { Pencil, Trash2, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminVariantTableProps {
  attributes: any[];
  onDelete: (id: number) => void;
}

export function AdminVariantTable({ attributes, onDelete }: AdminVariantTableProps) {
  const router = useRouter();

  return (
    <div className="w-full">
      <Table className="table-custom border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
            <TableHead className="w-[60px] text-center p-2 font-bold text-[#1f1f1f] text-[11px] uppercase">ID</TableHead>
            <TableHead className="w-[200px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pl-4">Tên thuộc tính</TableHead>
            <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Mã định danh</TableHead>
            <TableHead className="font-bold text-[#1f1f1f] text-[11px] uppercase p-2">Danh sách giá trị</TableHead>
            <TableHead className="w-[120px] font-bold text-[#1f1f1f] text-[11px] uppercase p-2 text-center">Trạng thái</TableHead>
            <TableHead className="w-[100px] text-right font-bold text-[#1f1f1f] text-[11px] uppercase p-2 pr-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attributes.length > 0 ? (
            attributes.map((attr) => (
              <TableRow key={attr.id} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors">
                <TableCell className="text-center text-slate-400 font-bold text-[11px]">#{attr.id}</TableCell>
                <TableCell className="p-2 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-100 rounded-[3px] flex items-center justify-center text-slate-400 border border-slate-200">
                      <Layers size={14} />
                    </div>
                    <span className="text-[13px] font-bold text-[#1f1f1f]">{attr.name}</span>
                  </div>
                </TableCell>
                <TableCell className="p-2 text-center">
                  <code className="bg-slate-50 text-slate-500 text-[10px] font-mono border border-slate-100 px-1.5 py-0.5 rounded-[2px] uppercase">
                    {attr.code}
                  </code>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {attr.values?.map((val: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 text-[11px] font-medium rounded-[2px] shadow-sm">
                        {val}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="p-2 text-center">
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border tracking-tight uppercase",
                    attr.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                  )}>
                    {attr.status === "ACTIVE" ? "ĐANG SỬ DỤNG" : "TẠM NGỪNG"}
                  </span>
                </TableCell>
                <TableCell className="p-2 text-right pr-4">
                  <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                        onClick={() => router.push(`/admin/variants/add?id=${attr.id}`)}
                    >
                      <Pencil size={15} className="text-blue-600" />
                    </Button>
                    <Button
                        variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                        onClick={() => onDelete(attr.id)}
                    >
                      <Trash2 size={15} className="text-rose-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-300 italic">Không có dữ liệu</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}