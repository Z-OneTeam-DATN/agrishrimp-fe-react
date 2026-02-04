"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Save,
  X,
  Image as ImageIcon,
  Upload,
  Type,
  Info,
  Layers,
  Eye,
  EyeOff
} from "lucide-react";

export default function AddCategoryPage() {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Hiển thị");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Xử lý khi chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Thêm danh mục mới</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mt-1 font-medium">
            <Link href="/admin/categories" className="hover:text-[#139a7e] transition">Danh mục</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-400">Thêm mới</span>
          </nav>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition active:scale-95"
          >
            <X size={18} /> Hủy bỏ
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#139a7e] text-white font-bold hover:bg-[#0e715d] transition shadow-md active:scale-95">
            <Save size={18} /> Lưu danh mục
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin chính */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Layers size={20} className="text-[#139a7e]" /> Thông tin chung
            </h5>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Type size={14} className="text-gray-400" /> Tên danh mục *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="VD: Thuốc & Chế phẩm, Dụng cụ nuôi..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Info size={14} className="text-gray-400" /> Mô tả ngắn
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn về danh mục này..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all font-medium resize-none"
                />
              </div>
            </div>
          </div>

          {/* Cấu hình trạng thái */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Eye size={20} className="text-[#139a7e]" /> Trạng thái hiển thị
            </h5>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setStatus("Hiển thị")}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${
                  status === "Hiển thị"
                  ? "border-[#139a7e] bg-[#139a7e]/5 text-[#139a7e]"
                  : "border-gray-50 bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                <Eye size={20} /> Hiển thị
              </button>
              <button
                onClick={() => setStatus("Đang ẩn")}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${
                  status === "Đang ẩn"
                  ? "border-orange-500 bg-orange-50 text-orange-500"
                  : "border-gray-50 bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                <EyeOff size={20} /> Tạm ẩn
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-4 font-medium italic">
              * Khi chọn "Tạm ẩn", khách hàng sẽ không thấy danh mục này trên cửa hàng.
            </p>
          </div>
        </div>

        {/* Cột phải: Hình ảnh danh mục */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ImageIcon size={20} className="text-[#139a7e]" /> Hình ảnh đại diện
            </h5>

            <div className="relative group">
              <div className={`w-full aspect-square rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative ${
                imagePreview ? "border-[#139a7e]" : "border-gray-200 hover:border-[#139a7e]/50 bg-gray-50"
              }`}>
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center p-6 text-center">
                    <div className="w-16 h-16 bg-[#139a7e]/10 text-[#139a7e] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload size={28} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Tải ảnh lên</span>
                    <span className="text-xs text-gray-400 mt-2 font-medium">Hỗ trợ JPG, PNG (Tối đa 2MB)</span>
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#139a7e]/5 rounded-2xl">
              <h6 className="text-[12px] font-black text-[#139a7e] uppercase mb-2">Lưu ý:</h6>
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                Nên sử dụng ảnh vuông (1:1) để hiển thị tốt nhất trên ứng dụng AgriShrimp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}