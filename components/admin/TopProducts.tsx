"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";

export default function TopProducts() {
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">Top sản phẩm</h2>
        <div className="flex gap-2">
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
          <button className="p-1 border rounded-sm text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
      <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[250px]">
        <div className="relative w-40 h-40 opacity-40 grayscale">
            <img 
                src="/images/no-product.png" 
                alt="No product" 
                className="w-full h-full object-contain"
                onError={(e) => {
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3502/3502114.png";
                }}
            />
        </div>
        <p className="mt-4 text-sm text-gray-400 font-medium italic">Chưa có sản phẩm</p>
      </div>
    </div>
  );
}
