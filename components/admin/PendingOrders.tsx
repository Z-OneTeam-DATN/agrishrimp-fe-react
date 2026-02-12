"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSearch, CreditCard, Package, Truck, Share2, Ban } from "lucide-react";

export default function PendingOrders() {
  const items = [
    { label: "Chờ duyệt", count: 0, icon: FileSearch, color: "text-blue-500" },
    { label: "Chờ thanh toán", count: 0, icon: CreditCard, color: "text-blue-500" },
    { label: "Chờ đóng gói", count: 0, icon: Package, color: "text-blue-500" },
    { label: "Chờ lấy hàng", count: 0, icon: Truck, color: "text-blue-500" },
    { label: "Đang giao hàng", count: 0, icon: Share2, color: "text-blue-500" },
    { label: "Hủy giao - Chờ nhận", count: 0, icon: Ban, color: "text-blue-500" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Đơn hàng chờ xử lý</h2>
        <div className="w-32">
          <Select defaultValue="7days">
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="7 ngày qua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 ngày qua</SelectItem>
              <SelectItem value="30days">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-gray-100">
        {items.map((item, index) => (
          <div key={index} className="p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className={`p-2 rounded-md bg-blue-50 group-hover:bg-blue-100 transition-colors`}>
              <item.icon size={20} className={item.color} />
            </div>
            <div className="text-center">
              <p className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{item.label}</p>
              <p className="text-lg font-bold text-gray-800">{item.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
