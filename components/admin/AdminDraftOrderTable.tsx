"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Settings,
  ArrowUpDown,
  FileEdit,
  Trash2,
  Box
} from "lucide-react";

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
import { cn } from "@/lib/utils";

interface OrderItem {
  productName: string;
  sku: string;
  quantity: number;
  totalPrice: string;
}

interface DraftOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  source: string;
  createdAt: string;
  note?: string;
  items?: OrderItem[];
}

interface AdminDraftOrderTableProps {
  orders: DraftOrder[];
}

export function AdminDraftOrderTable({ orders }: AdminDraftOrderTableProps) {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full bg-white border-t border-slate-200 font-sans text-slate-800">
      <div className="w-full overflow-x-auto">
        <Table className="table-custom border-collapse min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-[#f4f6f8] hover:bg-[#f4f6f8] border-b border-slate-200 h-10">
              <TableHead className="w-[40px] text-center p-0">
                <Settings size={14} className="text-slate-400 mx-auto" />
              </TableHead>
              <TableHead className="w-[40px] text-center p-0">
                <Checkbox className="border-slate-400" />
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3">
                <div className="flex items-center gap-1">Mã đơn nháp <ArrowUpDown size={12}/></div>
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3">Khách hàng</TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3">Ghi chú</TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 text-right">Tổng tiền</TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 text-center">
                <div className="flex items-center justify-center gap-1">Ngày tạo <ArrowUpDown size={12}/></div>
              </TableHead>
              <TableHead className="font-bold text-slate-800 text-[12px] p-3 text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.map((order) => {
              const isExpanded = expandedRows.includes(order.id);
              return (
                <React.Fragment key={order.id}>
                  <TableRow 
                    className={cn(
                        "cursor-pointer border-b border-[#eee] hover:bg-[#f0f8ff] transition-colors text-[13px]",
                        isExpanded && "bg-[#f8f9fa] border-b-0"
                    )}
                    onClick={() => toggleRow(order.id)}
                  >
                    <TableCell className="text-center p-0">
                      {isExpanded ? <ChevronUp size={14} className="text-blue-600 mx-auto"/> : <ChevronDown size={14} className="text-slate-400 mx-auto"/>}
                    </TableCell>
                    <TableCell className="text-center p-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox className="border-slate-300" />
                    </TableCell>
                    <TableCell className="p-3 font-medium text-blue-600">
                        <Link href={`/admin/orders/add?draftId=${order.id}`} className="hover:underline flex items-center gap-1">
                            <FileEdit size={12}/> {order.id}
                        </Link>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerPhone}</div>
                    </TableCell>
                    <TableCell className="p-3 text-slate-500 italic max-w-[200px] truncate">
                      {order.note || "---"}
                    </TableCell>
                    <TableCell className="p-3 text-right font-bold">{order.totalAmount}</TableCell>
                    <TableCell className="p-3 text-center text-slate-500">{order.createdAt}</TableCell>
                    <TableCell className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        <Link href={`/admin/orders/add?draftId=${order.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50"><FileEdit size={14}/></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50"><Trash2 size={14}/></Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-[#fcfcfc]">
                      <TableCell colSpan={8} className="p-0 border-b border-[#eee]">
                        <div className="p-4 pl-12">
                          <div className="bg-white border border-slate-200 rounded-sm p-3">
                            <h4 className="text-[12px] font-bold text-slate-700 mb-2 uppercase flex items-center gap-2">
                              <Box size={14}/> Sản phẩm trong đơn nháp
                            </h4>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-[13px] border-b border-dashed border-slate-100 pb-1">
                                  <span className="text-blue-600">{item.productName} ({item.sku})</span>
                                  <span>x{item.quantity} - <strong>{item.totalPrice}</strong></span>
                                </div>
                              ))}
                            </div>
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
      </div>
    </div>
  );
}