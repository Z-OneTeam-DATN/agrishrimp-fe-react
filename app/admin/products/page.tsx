"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Kháng sinh Enrofloxacin",
    category: "Thuốc & Chế phẩm",
    stock: 124,
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
  },
  {
    id: 2,
    name: "Men vi sinh xử lý đáy",
    category: "Chế phẩm sinh học",
    stock: 15,
    image: "https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png",
  },
  {
    id: 3,
    name: "Máy đo độ pH cầm tay",
    category: "Dụng cụ đo",
    stock: 0,
    image: "https://thuysanvietnam.com.vn/wp-content/uploads/2022/08/thu-hoach-tom-CN.jpg",
  },
];

export default function ProductsPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tất cả sản phẩm</h2>
          <p className="text-sm text-gray-500">Quản lý kho và sản phẩm</p>
        </div>
        <Link href="/admin/products/add">
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded">
            <Plus size={16} />
            Thêm sản phẩm
          </button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2">
        <div className="relative w-72">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            placeholder="Tìm tên sản phẩm..."
            className="w-full border rounded pl-8 pr-3 py-2 text-sm"
          />
        </div>
        <button className="border rounded px-3">
          <Filter size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="border rounded bg-white overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-center">ID</th>
              <th className="border px-3 py-2 text-center">Ảnh</th>
              <th className="border px-3 py-2">Sản phẩm</th>
              <th className="border px-3 py-2">Danh mục</th>
              <th className="border px-3 py-2 text-center">Tồn kho</th>
              <th className="border px-3 py-2 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2 text-center text-gray-500">
                  #{p.id}
                </td>

                <td className="border px-3 py-2">
                  <div className="w-12 h-12 mx-auto border rounded flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon size={18} className="text-gray-300" />
                    )}
                  </div>
                </td>

                <td className="border px-3 py-2 font-medium">
                  {p.name}
                </td>

                <td className="border px-3 py-2">
                  {p.category}
                </td>

                <td className="border px-3 py-2 text-center font-semibold">
                  <span className={p.stock === 0 ? "text-red-500" : ""}>
                    {p.stock}
                  </span>
                </td>

                <td className="border px-3 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button className="text-blue-500">
                      <Pencil size={16} />
                    </button>
                    <button className="text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
          <span className="text-gray-500">
            Hiển thị {products.length} / 45 sản phẩm
          </span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 border rounded" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 border rounded bg-gray-200">1</button>
            <button className="px-3 py-1 border rounded">2</button>
            <button className="px-2 py-1 border rounded">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
