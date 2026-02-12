"use client";

import React from "react";
import Link from "next/link";
import { 
  ClipboardCheck, 
  Search, 
  RotateCw, 
  AlertCircle,
  CheckCircle2,
  ChevronRight
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
import { Card, CardContent } from "@/components/ui/card";

export default function ReceiptConfirmationPage() {
  // Chỉ hiển thị các phiếu ở trạng thái PENDING
  const pendingReceipts = [
    { code: "PNK00002", date: "19/02/2026", supplier: "GROBEST VIỆT NAM", warehouse: "Kho thức ăn", items: 8, status: "PENDING" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[18px] font-bold text-[#1f1f1f]">Xác nhận nhập hàng</h1>
          <p className="text-[12px] text-gray-500">Danh sách các lô hàng đang chờ kiểm đếm thực tế để nhập kho</p>
        </div>
        <Button variant="outline" size="sm" className="h-[32px] border-[#ddd] bg-white">
          <RotateCw className="mr-2 h-4 w-4 text-gray-400" /> Tải lại danh sách
        </Button>
      </div>

      {/* Control Box */}
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[4px] flex items-start gap-3">
        <AlertCircle className="text-emerald-600 mt-0.5 flex-shrink-0" size={18} />
        <div className="text-[12px] text-emerald-800 leading-relaxed">
          <p className="font-bold">Lưu ý quan trọng:</p>
          <p>Việc xác nhận sẽ chính thức <b>cộng số lượng hàng vào tồn kho thực tế</b>. Vui lòng kiểm tra kỹ số lượng thực nhập và tình trạng bao bì (hư hỏng nếu có) trước khi nhấn Xác nhận.</p>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-3 border-b border-[#eee] flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input placeholder="Tìm mã phiếu hoặc NCC..." className="pl-9 h-[32px] text-[13px] border-[#ddd]" />
          </div>
        </div>

        <Table className="table-custom">
          <TableHeader>
            <TableRow className="bg-[#f0f0f0]">
              <TableHead className="w-[150px] font-bold text-[#1f1f1f] text-[12px] uppercase">Mã phiếu nhập</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase">Nhà cung cấp</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase">Kho đích</TableHead>
              <TableHead className="font-bold text-[#1f1f1f] text-[12px] uppercase">Thời gian</TableHead>
              <TableHead className="text-right font-bold text-[#1f1f1f] text-[12px] uppercase">Số mặt hàng</TableHead>
              <TableHead className="w-[180px] text-center font-bold text-[#1f1f1f] text-[12px] uppercase">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingReceipts.length > 0 ? (
              pendingReceipts.map((item) => (
                <TableRow key={item.code} className="hover:bg-slate-50 border-b border-[#eee]">
                  <TableCell className="font-bold text-blue-600">{item.code}</TableCell>
                  <TableCell className="text-[#1f1f1f] font-medium">{item.supplier}</TableCell>
                  <TableCell className="text-[#555]">{item.warehouse}</TableCell>
                  <TableCell className="text-[#555] text-[13px]">{item.date}</TableCell>
                  <TableCell className="text-right font-bold text-[#1f1f1f]">{item.items}</TableCell>
                  <TableCell className="text-center">
                    <Link href={`/inventory/receipts/confirmation/${item.code}`}>
                      <Button className="h-[28px] text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[4px] px-4 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Kiểm đếm & Nhập kho
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-[200px] text-center text-gray-400">
                  <ClipboardCheck size={48} className="mx-auto mb-2 opacity-10" />
                  <p className="font-bold text-[#1f1f1f]">Không có phiếu chờ xác nhận</p>
                  <p className="text-[12px]">Tất cả các lô hàng đã được đối soát xong.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
