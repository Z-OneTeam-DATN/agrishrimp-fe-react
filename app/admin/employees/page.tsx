"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  Phone,
} from "lucide-react";

// Dữ liệu mẫu dựa trên ảnh image_783646.png
const employeeData = [
  {
    id: "NV-001",
    name: "Nguyễn Văn An",
    email: "an.nguyen@agri.com",
    phone: "0909 123 456",
    branchCode: "CN-01",
    branchName: "Chi nhánh Cần Thơ",
    role: "QUẢN LÝ CHI NHÁNH",
    avatarLabel: "AN",
  },
  {
    id: "NV-002",
    name: "Trần Thị Bích",
    email: "bich.tran@agri.com",
    phone: "0988 777 666",
    branchCode: "CN-02",
    branchName: "Chi nhánh Sóc Trăng",
    role: "QUẢN LÝ CHI NHÁNH",
    avatarLabel: "TB",
  },
  {
    id: "NV-005",
    name: "Lê Văn Cường",
    email: "cuong.le@agri.com",
    phone: "0912 345 678",
    branchCode: "CN-03",
    branchName: "Chi nhánh Bạc Liêu",
    role: "QUẢN LÝ CHI NHÁNH",
    avatarLabel: "LC",
  },
];

export default function EmployeeManagementPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
            Quản lý nhân viên & Cấp quyền
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Danh sách nhân viên và phân quyền quản lý chi nhánh.
          </p>
        </div>
        <Link href="/admin/employees/add">
          <button className="flex items-center justify-center gap-2 bg-[#139a7e] hover:bg-[#0e715d] text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-95">
            <UserPlus size={18} />
            Thêm nhân viên mới
          </button>
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden font-bold">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm tên, email, sđt..."
                className="w-full bg-white border border-gray-100 pl-12 pr-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-[#139a7e]/10 outline-none transition-all"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <select className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-[#139a7e]/10 cursor-pointer">
                <option>Tất cả chi nhánh</option>
                <option>Cần Thơ</option>
                <option>Sóc Trăng</option>
                <option>Bạc Liêu</option>
              </select>

              <select className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-[#139a7e]/10 cursor-pointer">
                <option>Tất cả quyền</option>
                <option>Quản lý chi nhánh</option>
                <option>Nhân viên kho</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#139a7e] focus:ring-[#139a7e] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4">MÃ NV</th>
                <th className="px-4 py-4">THÔNG TIN NHÂN VIÊN</th>
                <th className="px-4 py-4">LIÊN HỆ</th>
                <th className="px-4 py-4">CHI NHÁNH QUẢN LÝ</th>
                <th className="px-4 py-4">QUYỀN HẠN</th>
                <th className="px-6 py-4 text-right">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {employeeData.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/80 transition-all">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#139a7e] focus:ring-[#139a7e] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-black text-gray-800">
                    {emp.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-black border border-gray-200 shadow-sm">
                        {emp.avatarLabel}
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {emp.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Mail size={12} /> {emp.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Phone size={12} /> {emp.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded text-[10px] w-fit mb-1">
                        {emp.branchCode}
                      </span>
                      <span className="text-xs font-bold text-[#139a7e]">
                        {emp.branchName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-teal-50 text-[#139a7e] px-4 py-1.5 rounded-full text-[10px] font-black border border-teal-100">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 text-gray-300">
                      <button className="p-2 text-blue-500 bg-white border border-gray-100 rounded-xl hover:shadow-md transition active:scale-95">
                        <Pencil size={16} />
                      </button>
                      <button className="p-2 text-red-500 bg-white border border-gray-100 rounded-xl hover:shadow-md transition active:scale-95">
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
          <span className="text-xs text-gray-400 italic font-medium">
            Hiển thị 3 trên 15 nhân viên
          </span>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-300 hover:bg-gray-100 rounded-xl">
              Trước
            </button>
            <button className="w-9 h-9 bg-[#139a7e] text-white rounded-xl text-xs font-black shadow-md">
              1
            </button>
            <button className="w-9 h-9 text-gray-400 hover:bg-gray-100 rounded-xl text-xs font-bold transition">
              2
            </button>
            <button className="p-2 text-[#139a7e] hover:bg-gray-100 rounded-xl transition font-bold">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}