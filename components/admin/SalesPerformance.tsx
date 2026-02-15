"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function SalesPerformance() {
  const [activeTab, setActiveTab] = useState("revenue");

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm mt-4">
      <div className="px-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${
              activeTab === "revenue"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Doanh thu bán hàng
          </button>
          <button
            onClick={() => setActiveTab("proportion")}
            className={`px-4 py-3 text-xs font-bold uppercase border-b-2 transition-colors ${
              activeTab === "proportion"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Tỷ trọng bán hàng
          </button>
        </div>
        <div className="flex gap-2 py-2">
          <div className="w-40">
            <Select defaultValue="all">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tất cả chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
      </div>
      <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative w-48 h-48 opacity-40 grayscale">
          {/* Placeholder for the empty state illustration */}
          <img
            src="/images/no-data.png"
            alt="No data"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src =
                "https://cdn-icons-png.flaticon.com/512/7486/7486744.png";
            }}
          />
        </div>
        <p className="mt-4 text-sm text-gray-400 font-medium italic">
          Chưa có dữ liệu
        </p>
      </div>
    </div>
  );
}
