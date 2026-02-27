"use client";

import React from "react";
import {
  DollarSign,
  FileText,
  RotateCcw,
  XCircle,
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
      value: "15.420.000 đ",
      icon: DollarSign,
      iconBg: "bg-blue-600",
      color: "text-blue-600",
      change: "+12.5%",
      isPositive: true,
    },
    {
      label: "Đơn hàng mới",
      value: "42",
      icon: FileText,
      iconBg: "bg-emerald-500",
      color: "text-emerald-500",
      change: "+8.2%",
      isPositive: true,
    },
    {
      label: "Đơn trả hàng",
      value: "2",
      icon: RotateCcw,
      iconBg: "bg-orange-400",
      color: "text-orange-400",
      change: "-15%",
      isPositive: false,
    },
    {
      label: "Đơn hủy",
      value: "1",
      icon: XCircle,
      iconBg: "bg-red-500",
      color: "text-red-500",
      change: "-50%",
      isPositive: false,
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
              <SelectItem value="cn1">Chi nhánh Quận 1</SelectItem>
              <SelectItem value="cn2">Chi nhánh Quận 7</SelectItem>
              <SelectItem value="cn3">Chi nhánh Thủ Đức</SelectItem>
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
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <span
                  className={`text-[10px] font-bold ${
                    stat.isPositive ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
