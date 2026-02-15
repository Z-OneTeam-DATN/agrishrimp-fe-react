"use client";

import React from "react";
import {
  DollarSign,
  FileText,
  RotateCcw,
  XCircle,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DailyBusinessResults() {
  const stats = [
    {
      label: "Doanh thu",
      value: "0",
      icon: DollarSign,
      iconBg: "bg-blue-600",
      color: "text-blue-600",
    },
    {
      label: "Đơn hàng mới",
      value: "0",
      icon: FileText,
      iconBg: "bg-emerald-500",
      color: "text-emerald-500",
    },
    {
      label: "Đơn trả hàng",
      value: "0",
      icon: RotateCcw,
      iconBg: "bg-orange-400",
      color: "text-orange-400",
    },
    {
      label: "Đơn hủy",
      value: "0",
      icon: XCircle,
      iconBg: "bg-red-500",
      color: "text-red-500",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          Kết quả kinh doanh trong ngày
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
        {stats.map((stat, index) => (
          <div key={index} className="p-4 flex items-center gap-4">
            <div className={`${stat.iconBg} p-2 rounded-full text-white`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
