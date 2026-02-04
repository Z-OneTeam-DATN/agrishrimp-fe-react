"use client";

import React from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  RotateCw, 
  Settings, 
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function ReceiptListPage() {
  const receipts = [
    { code: "PNK00003", date: "21/02/2026", supplier: "CÔNG TY THỦY SẢN TOÀN CẦU", warehouse: "Kho thuốc", total: "15,500,000", status: "COMPLETED" },
    { code: "PNK00001", date: "10/02/2026", supplier: "C.P. VIỆT NAM", warehouse: "Kho thức ăn", total: "8,200,000", status: "COMPLETED" },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "CANCELLED": return "text-red-600 bg-red-50 border-red-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "COMPLETED": return "Đã vào kho";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Lịch sử nhập kho</h1>
        <div className="flex items-center gap-2">
          <Link href="/inventory/receipts/new">
            <Button className="h-[32px] text-[12px] bg-[#007bff] hover:bg-[#0069d9] text-white border-none rounded-[4px] font-semibold">
              <Plus className="mr-1 h-3 w-3" /> Tạo phiếu nhập
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full max-w-[250px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input placeholder="Tìm kiếm phiếu..." className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px] h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="completed">Đã vào kho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white"><RotateCw size={14} className="text-gray-500" /></Button>
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white"><Settings size={14} className="text-gray-500" /></Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="table-custom">
            <TableHeader>
              <TableRow className="bg-[#f0f0f0] border-b border-[#ccc]">
                <TableHead className="w-[40px] text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Số phiếu</TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Ngày nhập</TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Nhà cung cấp</TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Trạng thái</TableHead>
                <TableHead className="text-right font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((item) => (
                <TableRow key={item.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer">
                  <TableCell className="text-center p-[10px]"><Checkbox className="h-3.5 w-3.5" /></TableCell>
                  <TableCell className="p-[10px] text-[#1f1f1f]">{item.code}</TableCell>
                  <TableCell className="p-[10px] text-[#555]">{item.date}</TableCell>
                  <TableCell className="p-[10px] text-[#1f1f1f]">{item.supplier}</TableCell>
                  <TableCell className="p-[10px]">
                    <span className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                      getStatusStyle(item.status)
                    )}>
                      {getStatusLabel(item.status)}
                    </span>
                  </TableCell>
                  <TableCell className="p-[10px] text-right">
                    {item.status === "PENDING" ? (
                      <Button variant="outline" className="h-7 text-[11px] border-orange-500 text-orange-600 hover:bg-orange-50 font-bold px-2">
                        Kiểm đếm & Xác nhận
                      </Button>
                    ) : (
                      <Button variant="ghost" className="h-7 text-[11px] text-gray-400 font-medium px-2" disabled>
                        Đã đối soát
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}