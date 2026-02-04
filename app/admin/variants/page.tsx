"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  PlusCircle,
  Search,
  Pencil,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Settings2,
  MoreHorizontal
} from "lucide-react";

// Dữ liệu mẫu cho các thuộc tính
const attributeList = [
  {
    id: 1,
    name: "Dạng sản phẩm",
    code: "PRODUCT_FORM",
    values: ["Lỏng", "Bột", "Viên nén", "Dung dịch", "Hạt"],
    useCount: 156,
    status: "Đang sử dụng"
  },
  {
    id: 2,
    name: "Quy cách đóng gói",
    code: "PACKAGING",
    values: ["Chai", "Gói", "Can", "Hũ", "Bao", "Xô"],
    useCount: 89,
    status: "Đang sử dụng"
  },
  {
    id: 3,
    name: "Đơn vị tính",
    code: "UNITS",
    values: ["ml", "lít", "g", "kg", "tấn"],
    useCount: 210,
    status: "Đang sử dụng"
  }
];

export default function VariantsPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Quản lý thuộc tính</h2>
          <p className="text-sm text-gray-500 font-medium">
            Thiết lập các loại đặc tính sản phẩm (dạng, quy cách, đơn vị...) để tạo biến thể.
          </p>
        </div>

        {/* Gắn Link vào nút thêm mới */}
        <Link href="/admin/variants/add">
          <button className="flex items-center justify-center gap-2 bg-[#139a7e] hover:bg-[#0e715d] text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-95">
            <Plus size={18} />
            Tạo thuộc tính mới
          </button>
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm tên thuộc tính hoặc mã..."
                className="w-full bg-white border border-gray-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#139a7e]/10 focus:border-[#139a7e] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                <Settings2 size={16} /> Bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Tên thuộc tính</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Mã định danh</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Các giá trị</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Sử dụng</th>
                <th className="px-4 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attributeList.map((attr) => (
                <tr key={attr.id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#139a7e]/10 rounded-xl flex items-center justify-center text-[#139a7e]">
                        <Layers size={20} />
                      </div>
                      <span className="text-sm font-bold text-gray-800">{attr.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 font-mono text-xs text-gray-400 tracking-wider">
                    {attr.code}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                      {attr.values.slice(0, 4).map((val, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold border border-gray-200/50">
                          {val}
                        </span>
                      ))}
                      {attr.values.length > 4 && (
                        <span className="text-[10px] text-gray-400 font-bold ml-1">+{attr.values.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className="text-sm font-black text-gray-700">{attr.useCount}</span>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase
                      ${attr.status === "Đang sử dụng" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}
                    `}>
                      {attr.status}
                    </span>
                  </td>

                  {/* Bổ sung cột hành động luôn hiển thị */}
                  <td className="px-8 py-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-blue-500 bg-white border border-gray-100 rounded-lg hover:shadow-md transition active:scale-95">
                        <Pencil size={16} />
                      </button>
                      <button className="p-2 text-red-500 bg-white border border-gray-100 rounded-lg hover:shadow-md transition active:scale-95">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-8 py-5 bg-gray-50/20 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] font-bold text-gray-400 italic">
            Hiển thị <span className="text-gray-700">3</span> thuộc tính hệ thống
          </p>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-300 hover:bg-gray-100 rounded-xl transition disabled:opacity-30" disabled>
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              <button className="w-9 h-9 flex items-center justify-center rounded-xl text-xs font-black bg-[#139a7e] text-white shadow-md">1</button>
              <button className="w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-100 transition">2</button>
              <span className="px-1 text-gray-300"><MoreHorizontal size={14} /></span>
            </div>
            <button className="p-2 text-[#139a7e] hover:bg-gray-100 rounded-xl transition">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}