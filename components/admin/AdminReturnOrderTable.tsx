"use client";

import React, { useState } from "react";
import Link from "next/link"; // [QUAN TRỌNG]
import { ChevronDown, ChevronUp, Settings, ArrowUpDown, Box, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminReturnOrderTable({ orders }: { orders: any[] }) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]));
  };

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "returning", label: "Đang hoàn trả" },
    { id: "search", label: "Tìm kiếm" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center border-b border-slate-200 px-4 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              "py-3 px-4 text-[13px] font-medium border-b-2 transition-colors",
              tab.id === "all" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f4f6f8] border-b border-slate-200 h-10">
            <TableHead className="w-[40px] text-center p-0"><Settings size={14} className="text-slate-400 mx-auto"/></TableHead>
            <TableHead className="w-[40px] text-center p-0"><Checkbox className="border-slate-400"/></TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Mã đơn trả</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Ngày tạo <ArrowUpDown size={12} className="inline ml-1 opacity-30"/></TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Mã đơn hàng</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Khách hàng</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3">Sản phẩm</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3 text-center">Hoàn trả</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3 text-center">Nhận hàng</TableHead>
            <TableHead className="text-[12px] font-bold text-slate-800 p-3 text-center">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {orders.map((order) => {
            const isExpanded = expandedRows.includes(order.id);
            // [SỬA LỖI] Tạo URL sạch, xóa dấu #
            const detailUrl = `/admin/orders/return/${order.id.replace('#', '')}`;

            return (
              <React.Fragment key={order.id}>
                <TableRow className={cn("cursor-pointer border-b hover:bg-[#f0f8ff] text-[13px] transition-colors", isExpanded && "bg-[#f8f9fa] border-b-0")} onClick={() => toggleRow(order.id)}>
                  <TableCell className="text-center p-0">{isExpanded ? <ChevronUp size={14} className="text-blue-600 mx-auto"/> : <ChevronDown size={14} className="text-blue-600 mx-auto"/>}</TableCell>
                  <TableCell className="text-center p-0" onClick={(e) => e.stopPropagation()}><Checkbox className="border-slate-300"/></TableCell>
                  
                  {/* CỘT MÃ ĐƠN CÓ LINK */}
                  <TableCell className="p-3 font-medium">
                    <Link 
                        href={detailUrl}
                        className="text-blue-600 hover:underline block w-full"
                        onClick={(e) => e.stopPropagation()} // Chặn click lan ra dòng
                    >
                        {order.id}
                    </Link>
                  </TableCell>
                  
                  <TableCell className="p-3 text-slate-600">{order.createdAt}</TableCell>
                  
                  {/* Link Mã đơn hàng gốc */}
                  <TableCell className="p-3 font-medium">
                     <Link href={`/admin/orders/${order.orderId.replace('#', '')}`} className="text-blue-600 hover:underline block w-full" onClick={(e) => e.stopPropagation()}>
                        {order.orderId}
                     </Link>
                  </TableCell>
                  
                  <TableCell className="p-3 text-blue-600 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{order.customerName}</TableCell>
                  <TableCell className="p-3 text-slate-800">{order.productsCount}</TableCell>
                  <TableCell className="p-3 text-center"><span className={cn("px-2.5 py-0.5 rounded-full text-[11px] border whitespace-nowrap", order.refundStatus === "Đã hoàn trả" ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-[#fff7e6] text-[#d97706] border-[#ffe58f]")}>{order.refundStatus}</span></TableCell>
                  <TableCell className="p-3 text-center"><span className={cn("px-2.5 py-0.5 rounded-full text-[11px] border whitespace-nowrap", order.receiveStatus === "Đã nhận hàng" ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-[#fff7e6] text-[#d97706] border-[#ffe58f]")}>{order.receiveStatus}</span></TableCell>
                  <TableCell className="p-3 text-center"><span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap", order.returnStatus === "Đã hủy" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-[#fff7e6] text-[#d97706] border-[#ffe58f]")}>{order.returnStatus}</span></TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow className="bg-[#fcfcfc] hover:bg-[#fcfcfc]" onClick={(e) => e.stopPropagation()}>
                    <TableCell colSpan={10} className="p-0 border-b border-slate-200">
                      <div className="p-4 pl-12 flex gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="bg-white border border-slate-200 rounded-sm p-3 w-full shadow-inner">
                          <div className="flex justify-between items-center mb-2 border-b pb-2">
                             <h4 className="text-[12px] font-bold text-slate-700 uppercase flex items-center gap-2"><Box size={14} className="text-slate-400"/> Sản phẩm trả lại</h4>
                             {/* Nút In đơn cũng link sang trang chi tiết */}
                             <Link href={detailUrl}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-[11px] px-3 font-bold"><Printer size={12} className="mr-1"/> Xem & In đơn</Button>
                             </Link>
                          </div>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[13px] py-1 border-b border-dashed border-slate-100 last:border-0">
                              <span className="text-blue-600 hover:underline cursor-pointer">{item.productName} ({item.sku})</span>
                              <span>x{item.quantity} - <strong>{item.totalPrice}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-12 py-2 mb-2"><button className="text-[12px] text-blue-600 flex items-center gap-1 hover:underline font-medium" onClick={() => toggleRow(order.id)}><ChevronUp size={14}/> Thu gọn</button></div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}