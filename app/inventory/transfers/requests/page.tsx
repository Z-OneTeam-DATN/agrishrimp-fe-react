"use client";

import React from "react";
import Link from "next/link";
import { 
  BellRing, 
  Search, 
  RotateCw, 
  Settings,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function TransferRequestsPage() {
  const incomingRequests = [
    { code: "YCDC0045", date: "23/02/2026", from: "Chi nhánh Hà Nội", items: 3, priority: "Gấp" },
    { code: "YCDC0042", date: "22/02/2026", from: "Chi nhánh Hồ Chí Minh", items: 7, priority: "Bình thường" },
    { code: "YCDC0039", date: "21/02/2026", from: "Chi nhánh Bạc Liêu", items: 15, priority: "Bình thường" },
  ];

  return (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">Yêu cầu điều chuyển (Đơn vị khác yêu cầu)</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-[32px] border-[#ddd] bg-white text-gray-500 font-semibold">
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-2 border-b border-[#eee] bg-[#f8f9fa] flex items-center justify-between">
          <div className="relative w-full max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input 
              placeholder="Tìm mã yêu cầu, chi nhánh..." 
              className="pl-8 h-[30px] text-[13px] bg-white border-[#ddd] rounded-[4px] focus-visible:ring-1 focus-visible:ring-[#007bff]" 
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-[30px] w-[30px] border-[#ddd] bg-white text-gray-500">
              <Settings size={14} />
            </Button>
          </div>
        </div>

        {/* Professional Table */}
        <div className="overflow-x-auto">
          <Table className="table-custom">
            <TableHeader>
              <TableRow className="bg-[#f0f0f0] hover:bg-[#f0f0f0] border-b border-[#ccc]">
                <TableHead className="w-[40px] text-center p-[10px]">
                  <Checkbox className="h-3.5 w-3.5" />
                </TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Mã yêu cầu</TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Đơn vị yêu cầu</TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Ngày yêu cầu</TableHead>
                <TableHead className="text-right font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Số mặt hàng</TableHead>
                <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap text-center">Độ ưu tiên</TableHead>
                <TableHead className="w-[150px] text-center font-bold text-[#1f1f1f] text-[12px] uppercase p-[10px] whitespace-nowrap">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingRequests.map((req) => (
                <TableRow key={req.code} className="hover:bg-[#f0f8ff] border-b border-[#eee] transition-colors cursor-pointer">
                  <TableCell className="text-center p-[10px]">
                    <Checkbox className="h-3.5 w-3.5" />
                  </TableCell>
                  <TableCell className="p-[10px] text-[#007bff] font-bold">{req.code}</TableCell>
                  <TableCell className="p-[10px] text-[#1f1f1f] font-medium">{req.from}</TableCell>
                  <TableCell className="p-[10px] text-[#555]">{req.date}</TableCell>
                  <TableCell className="p-[10px] text-right font-bold text-[#1f1f1f]">{req.items}</TableCell>
                  <TableCell className="p-[10px] text-center">
                    <span className={`text-[11px] font-bold ${
                      req.priority === "Gấp" ? "text-red-600" : "text-gray-500"
                    }`}>
                      {req.priority}
                    </span>
                  </TableCell>
                  <TableCell className="p-[10px] text-center">
                    <Link href={`/inventory/transfers/new?source=${req.code}`}>
                      <Button variant="outline" className="h-[28px] text-[11px] border-[#007bff] text-[#007bff] hover:bg-[#007bff] hover:text-white font-bold rounded-[4px] px-3">
                        Duyệt & Xuất kho
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#eee] bg-[#f8f9fa]">
          <p className="text-[12px] text-gray-500">Hiển thị 1 - 3 trên tổng số 3 bản ghi</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Trước</Button>
            <Button variant="outline" size="sm" className="h-[28px] w-[28px] p-0 text-[12px] bg-[#007bff] text-white border-[#007bff]">1</Button>
            <Button variant="outline" size="sm" className="h-[28px] px-2 text-[12px] bg-white border-[#ddd]">Sau</Button>
          </div>
        </div>
      </div>
    </div>
  );
}