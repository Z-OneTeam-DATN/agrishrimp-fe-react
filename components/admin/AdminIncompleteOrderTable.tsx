"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Settings, ArrowUpDown, Box, Mail, SendHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AdminIncompleteOrderTable({ orders }: { orders: any[] }) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]));
  };

  const handleSendRecovery = (id: string) => {
    toast.success(`Đã gửi email nhắc nhở cho đơn hàng ${id}`);
  };

  return (
    <div className="w-full">
      {/* Thanh Tabs */}
      <div className="flex items-center border-b border-slate-200 px-4 bg-white">
        <button className="py-3 px-4 text-[13px] font-medium border-b-2 border-blue-600 text-blue-600">Tất cả</button>
        <button className="py-3 px-4 text-[13px] font-medium border-b-2 border-transparent text-slate-600">Đã gửi email</button>
      </div>

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f4f6f8] border-b border-slate-200 h-10">
            <TableHead className="w-[40px] text-center p-0"><Settings size={14} className="text-slate-400 mx-auto"/></TableHead>
            <TableHead className="w-[40px] text-center p-0"><Checkbox className="border-slate-400"/></TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Mã giỏ hàng</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Ngày tạo <ArrowUpDown size={12} className="inline ml-1 opacity-30"/></TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Khách hàng</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3 text-right">Giá trị giỏ hàng</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3 text-center">Trạng thái nhắc nhở</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3 text-center">Hành động</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.map((order) => {
            const isExpanded = expandedRows.includes(order.id);
            return (
              <React.Fragment key={order.id}>
                <TableRow className={cn("cursor-pointer border-b hover:bg-[#f0f8ff] text-[13px]", isExpanded && "bg-[#f8f9fa] border-b-0")} onClick={() => toggleRow(order.id)}>
                  <TableCell className="text-center p-0">{isExpanded ? <ChevronUp size={14} className="text-blue-600 mx-auto"/> : <ChevronDown size={14} className="text-blue-600 mx-auto"/>}</TableCell>
                  <TableCell className="text-center p-0" onClick={(e) => e.stopPropagation()}><Checkbox className="border-slate-300"/></TableCell>
                  <TableCell className="p-3 font-medium text-blue-600">{order.id}</TableCell>
                  <TableCell className="p-3 text-slate-600">{order.createdAt}</TableCell>
                  <TableCell className="p-3">
                      <div className="font-medium text-blue-600">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                  </TableCell>
                  <TableCell className="p-3 text-right font-bold text-slate-800">{order.totalAmount}</TableCell>
                  
                  <TableCell className="p-3 text-center">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] border whitespace-nowrap", 
                        order.recoveryStatus === "Đã gửi email" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-500 border-slate-200")}>
                        {order.recoveryStatus}
                    </span>
                  </TableCell>

                  <TableCell className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => handleSendRecovery(order.id)}>
                          <SendHorizontal size={12} className="mr-1"/> Gửi nhắc nhở
                      </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded Row */}
                {isExpanded && (
                  <TableRow className="bg-[#fcfcfc]">
                    <TableCell colSpan={8} className="p-0 border-b border-slate-200">
                      <div className="p-4 pl-12">
                        <div className="bg-white border border-slate-200 rounded-sm p-3 w-full shadow-inner">
                          <h4 className="text-[12px] font-bold text-slate-700 uppercase flex items-center gap-2 mb-2"><Box size={14}/> Sản phẩm trong giỏ hàng</h4>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[13px] py-1.5 border-b border-dashed border-slate-100 last:border-0">
                              <span className="text-blue-600">{item.productName} <span className="text-slate-400 text-[11px]">({item.sku})</span></span>
                              <span>x{item.quantity} - <strong>{item.totalPrice}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Phân trang */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-[#f8f9fa]">
        <p className="text-[11px] text-slate-500 font-bold uppercase">Hiển thị {orders.length} đơn chưa hoàn tất</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] bg-white border-slate-300 font-bold" disabled>Trước</Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-[11px] bg-blue-600 text-white border-blue-600 font-bold">1</Button>
          <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] bg-white border-slate-300 font-bold" disabled>Sau</Button>
        </div>
      </div>
    </div>
  );
}