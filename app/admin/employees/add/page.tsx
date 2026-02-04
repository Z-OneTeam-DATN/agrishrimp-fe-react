"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Building2,
  Lock
} from "lucide-react";

export default function AddEmployeePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    branch: "",
    role: "",
    isActive: true
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Thêm nhân viên mới</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mt-1 font-medium">
            <Link href="/admin/employees" className="hover:text-[#139a7e] transition">Nhân viên</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-400">Thêm mới</span>
          </nav>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/employees"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition active:scale-95"
          >
            <X size={18} /> Hủy bỏ
          </Link>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#139a7e] text-white font-bold hover:bg-[#0e715d] transition shadow-md active:scale-95">
            <Save size={18} /> Lưu nhân viên
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-10">

          {/* Section 1: Thông tin cá nhân */}
          <section className="space-y-6">
            <h5 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User size={16} /> Thông tin cá nhân
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Họ và tên *</label>
                <input
                  type="text"
                  placeholder="Nhập họ tên..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email *</label>
                <input
                  type="email"
                  placeholder="example@agri.com"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Số điện thoại *</label>
                <input
                  type="text"
                  placeholder="09xxx..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-gray-100 w-full"></div>

          {/* Section 2: Phân quyền & Chi nhánh */}
          <section className="space-y-6">
            <h5 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} /> Phân quyền & Chi nhánh
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Chi nhánh *</label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all appearance-none cursor-pointer font-medium text-gray-600">
                  <option value="">-- Chọn chi nhánh --</option>
                  <option value="CN01">Chi nhánh Cần Thơ</option>
                  <option value="CN02">Chi nhánh Sóc Trăng</option>
                  <option value="CN03">Chi nhánh Bạc Liêu</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Vai trò *</label>
                <select className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#139a7e]/20 transition-all appearance-none cursor-pointer font-medium text-gray-600">
                  <option value="">-- Chọn vai trò --</option>
                  <option value="manager">Quản lý chi nhánh</option>
                  <option value="staff">Nhân viên kho</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1 font-mono uppercase tracking-tighter">Mật khẩu mặc định</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value="Agri@123456"
                    className="w-full bg-gray-100 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-400 outline-none"
                  />
                  <Lock size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>

              {/* Toggle Kích hoạt */}
              <div className="flex items-center gap-3 pt-8 ml-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#139a7e]"></div>
                </label>
                <span className="text-sm font-bold text-gray-700">Kích hoạt tài khoản ngay</span>
              </div>
            </div>
          </section>

          {/* Action Buttons Bottom */}
          <div className="pt-10 flex justify-end gap-3">
             <Link href="/admin/employees" className="px-8 py-2.5 rounded-xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition">
               Hủy bỏ
             </Link>
             <button className="px-8 py-2.5 rounded-xl bg-[#139a7e] text-white font-bold hover:bg-[#0e715d] transition shadow-lg shadow-[#139a7e]/20">
               Lưu nhân viên
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}