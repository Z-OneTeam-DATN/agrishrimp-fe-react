"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Save,
  X,
  PlusCircle,
  Trash2,
  Layers,
  Type,
  Code
} from "lucide-react";

export default function AddAttributePage() {
  const [attributeName, setAttributeName] = useState("");
  const [attributeCode, setAttributeCode] = useState("");
  const [values, setValues] = useState<string[]>([""]);

  // Hàm chuyển đổi tiếng Việt có dấu thành Slug (mã định danh)
  const generateSlug = (text: string) => {
    const slug = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug.toUpperCase(); // Để mã định danh in hoa cho chuyên nghiệp
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setAttributeName(name);
    setAttributeCode(generateSlug(name)); // Tự động sinh mã khi nhập tên
  };

  const addValueField = () => {
    setValues([...values, ""]);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
  };

  const removeValueField = (index: number) => {
    if (values.length > 1) {
      setValues(values.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Thêm thuộc tính mới</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mt-1 font-medium">
            <Link href="/admin/variants" className="hover:text-[#139a7e] transition">Thuộc tính</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-400">Thêm mới</span>
          </nav>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/variants"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition active:scale-95"
          >
            <X size={18} /> Hủy bỏ
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#139a7e] text-white font-bold hover:bg-[#0e715d] transition shadow-md active:scale-95">
            <Save size={18} /> Lưu thuộc tính
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cấu hình chính */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <h5 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Layers size={20} className="text-[#139a7e]" /> Thông tin thuộc tính
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Type size={14} className="text-gray-400" /> Tên thuộc tính *
              </label>
              <input
                type="text"
                value={attributeName}
                onChange={handleNameChange}
                placeholder="VD: Dạng bào chế, Màu sắc..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Code size={14} className="text-gray-400" /> Mã định danh (Tự động)
              </label>
              <input
                type="text"
                value={attributeCode}
                onChange={(e) => setAttributeCode(e.target.value)}
                placeholder="DANG-BAO-CHE"
                className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-mono outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all text-[#139a7e] font-bold"
              />
            </div>
          </div>
        </div>

        {/* Danh sách các giá trị */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 font-bold">
          <div className="flex items-center justify-between mb-8">
            <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PlusCircle size={20} className="text-[#139a7e]" /> Danh sách giá trị mẫu
            </h5>
            <button
              onClick={addValueField}
              className="text-xs font-black text-[#139a7e] bg-[#139a7e]/10 px-5 py-2.5 rounded-xl hover:bg-[#139a7e]/20 transition"
            >
              + THÊM GIÁ TRỊ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((val, index) => (
              <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 font-black">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder="Nhập giá trị..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#139a7e] transition-all font-medium"
                />
                <button
                  onClick={() => removeValueField(index)}
                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}