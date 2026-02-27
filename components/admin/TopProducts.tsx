"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";

export default function TopProducts() {
  const products = [
    {
      id: 1,
      name: "Thức ăn tôm Grobest",
      category: "Thức ăn",
      sales: 150,
      revenue: "45.000.000 đ",
      image: "https://placehold.co/40x40?text=Grobest",
    },
    {
      id: 2,
      name: "Men vi sinh BZT Digester",
      category: "Thuốc thú y",
      sales: 85,
      revenue: "22.100.000 đ",
      image: "https://placehold.co/40x40?text=BZT",
    },
    {
      id: 3,
      name: "Khoáng tạt Mix 2000",
      category: "Khoáng chất",
      sales: 64,
      revenue: "12.800.000 đ",
      image: "https://placehold.co/40x40?text=Mix",
    },
    {
      id: 4,
      name: "Máy sục khí 2HP",
      category: "Thiết bị",
      sales: 12,
      revenue: "36.000.000 đ",
      image: "https://placehold.co/40x40?text=Machine",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase">
          Top sản phẩm
        </h2>
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
      <div className="flex-1">
        <div className="divide-y divide-gray-100">
          {products.map((product) => (
            <div
              key={product.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm overflow-hidden border border-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-[10px] text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-600">
                  {product.revenue}
                </p>
                <p className="text-[10px] text-gray-400">Đã bán: {product.sales}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-100 text-center">
          <button className="text-xs text-blue-500 font-medium hover:underline">
            Xem tất cả sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}
