"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, AlertCircle } from "lucide-react";

export default function InventoryInfo() {
  const items = [
    {
      label: "Sản phẩm dưới định mức",
      value: "0",
      hasAlert: true,
    },
    {
      label: "Số tồn kho chi nhánh",
      value: "0",
      hasAlert: false,
    },
    {
      label: "Giá trị tồn kho chi nhánh",
      value: "0",
      hasAlert: false,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          Thông tin kho
        </h2>
        <div className="w-48">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 flex flex-col divide-y divide-gray-100">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 hover:bg-blue-50/50 transition-colors cursor-pointer group flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-gray-500 font-medium">
                  {item.label}
                </p>
                {item.hasAlert && (
                  <AlertCircle size={14} className="text-red-500" />
                )}
              </div>
              <p className="text-lg font-bold text-gray-800">{item.value}</p>
            </div>
            <ChevronRight
              size={18}
              className="text-gray-300 group-hover:text-blue-500 transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
