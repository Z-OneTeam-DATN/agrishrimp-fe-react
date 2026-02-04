"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";

// Dữ liệu mẫu đã bổ sung link ảnh thực tế
const categoryData = [
  {
    id: 1,
    name: "Thuốc & Chế phẩm",
    description: "Kháng sinh, Vi sinh, Khoáng cho tôm...",
    productCount: 120,
    status: "Hiển thị",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Thức ăn & Dinh dưỡng",
    description: "Thức ăn tăng trọng, bổ sung đạm...",
    productCount: 85,
    status: "Hiển thị",
    image: "https://images.unsplash.com/photo-1621813137938-f9b87002e260?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Dụng cụ & Thiết bị",
    description: "Máy đo pH, Quạt nước, Máy sục khí...",
    productCount: 45,
    status: "Hiển thị",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Giống Tôm",
    description: "Tôm thẻ chân trắng, Tôm sú giống...",
    productCount: 32,
    status: "Đang ẩn",
    image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Dịch vụ Tư vấn",
    description: "Kỹ thuật nuôi, setup ao công nghệ cao...",
    productCount: 12,
    status: "Hiển thị",
    image: null,
  },
];

export default function CategoryManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Quản lý danh mục</h2>
          <p className="text-sm text-gray-500 font-medium">Phân loại sản phẩm AgriShrimp giúp khách hàng dễ dàng tìm kiếm.</p>
        </div>

        {/* Nút thêm danh mục đã được gắn link */}
        <Link href="/admin/categories/add">
          <button className="flex items-center justify-center gap-2 bg-[#139a7e] hover:bg-[#0e715d] text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-95">
            <Plus size={18} />
            Thêm danh mục
          </button>
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden font-bold">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm danh mục..."
                className="w-full bg-white border border-gray-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#139a7e]/10 focus:border-[#139a7e] outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 transition">
              <Filter size={16} /> Bộ lọc
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-4 w-12 text-center">ID</th>
                <th className="px-4 py-4">Hình ảnh & Tên danh mục</th>
                <th className="px-4 py-4 text-center">Sản phẩm</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-8 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categoryData.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-8 py-4 text-center text-xs text-gray-400">#{cat.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 overflow-hidden shrink-0 group shadow-sm">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <ImageIcon size={20} className="opacity-50" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 leading-tight">{cat.name}</span>
                        <span className="text-[11px] text-gray-400 font-medium mt-1 line-clamp-1">{cat.description}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-black">
                      {cat.productCount}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase
                      ${cat.status === "Hiển thị" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}
                    `}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2.5 text-blue-500 bg-white border border-gray-100 rounded-xl hover:shadow-md transition active:scale-95">
                        <Pencil size={16} />
                      </button>
                      <button className="p-2.5 text-red-500 bg-white border border-gray-100 rounded-xl hover:shadow-md transition active:scale-95">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between">
           <span className="text-xs text-gray-400 italic">Tổng số: 5 danh mục chính</span>
           <div className="flex items-center gap-2">
              <button className="p-2 text-gray-300 hover:bg-gray-100 rounded-xl"><ChevronLeft size={20}/></button>
              <button className="w-9 h-9 bg-[#139a7e] text-white rounded-xl text-xs font-black shadow-md shadow-[#139a7e]/20">1</button>
              <button className="p-2 text-[#139a7e] hover:bg-gray-100 rounded-xl"><ChevronRight size={20}/></button>
           </div>
        </div>
      </div>
    </div>
  );
}