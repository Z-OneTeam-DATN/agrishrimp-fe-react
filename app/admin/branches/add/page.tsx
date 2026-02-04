"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Save, X, Building2, Phone, Mail, User, MapPin } from "lucide-react";

export default function AddBranchPage() {
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Thêm chi nhánh mới</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mt-1 font-medium">
            <Link href="/admin/branches" className="hover:text-[#139a7e] transition">Chi nhánh</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-400">Thêm mới</span>
          </nav>
        </div>
        <div className="flex gap-3 font-bold">
          <Link href="/admin/branches" className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition active:scale-95">
            <X size={18} /> Hủy bỏ
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#139a7e] text-white hover:bg-[#0e715d] transition shadow-md active:scale-95">
            <Save size={18} /> Lưu chi nhánh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Tên chi nhánh *</label>
            <input type="text" placeholder="Nhập tên chi nhánh..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Số điện thoại *</label>
            <input type="text" placeholder="Hotline chi nhánh..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Mã chi nhánh (Tự động)</label>
            <input type="text" value="CN-AUTO" disabled className="w-full bg-gray-100 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-400 outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Email liên hệ *</label>
            <input type="email" placeholder="branch@agrishrimp.com" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Người phụ trách *</label>
            <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none appearance-none cursor-pointer">
              <option value="">Chọn nhân viên quản lý...</option>
              <option value="1">Nguyễn Văn An (NV-001)</option>
              <option value="2">Trần Thị Bích (NV-002)</option>
            </select>
          </div>

          <div className="space-y-2 pt-10">
            <div className="flex items-center gap-3">
               <span className="text-sm font-bold text-gray-500 uppercase tracking-tighter">Trạng thái</span>
               <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#139a7e] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <span className={`text-sm font-bold ${isActive ? "text-[#139a7e]" : "text-gray-400"}`}>
                {isActive ? "Đang hoạt động" : "Tạm ngưng"}
              </span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-2 mt-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Địa chỉ chi tiết *</label>
            <textarea rows={4} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..." className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 resize-none" />
          </div>
        </div>
      </div>
    </div>
  );
}