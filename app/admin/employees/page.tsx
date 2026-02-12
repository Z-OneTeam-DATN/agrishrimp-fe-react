"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminEmployeeTable } from "@/components/admin/AdminEmployeeTable";
import { ShieldCheck } from "lucide-react";

const employeeData = [
  { id: "NV-001", name: "Nguyễn Văn An", email: "an.nguyen@agri.com", phone: "0909 123 456", branchName: "Chi nhánh Cần Thơ", address: "Ninh Kiều, Cần Thơ", role: "QUẢN LÝ CHI NHÁNH", joinDate: "15/01/2024", status: "Đang hoạt động", avatarLabel: "AN" },
  { id: "NV-002", name: "Trần Thị Bích", email: "bich.tran@agri.com", phone: "0988 777 666", branchName: "Chi nhánh Sóc Trăng", address: "Phường 2, TP. Sóc Trăng", role: "QUẢN LÝ CHI NHÁNH", joinDate: "20/03/2024", status: "Đang hoạt động", avatarLabel: "TB" },
  { id: "NV-005", name: "Lê Văn Cường", email: "cuong.le@agri.com", phone: "0912 345 678", branchName: "Chi nhánh Bạc Liêu", address: "TP. Bạc Liêu", role: "NHÂN VIÊN KHO", joinDate: "10/06/2025", status: "Đang tạm khóa", avatarLabel: "LC" },
];

const branchFilters = [
  { label: "Tất cả chi nhánh", value: "all" },
  { label: "Chi nhánh Cần Thơ", value: "ct" },
  { label: "Chi nhánh Sóc Trăng", value: "st" },
  { label: "Chi nhánh Bạc Liêu", value: "bl" },
];

const statusFilters = [
  { label: "Trạng thái: Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Đang tạm khóa", value: "locked" },
];

export default function EmployeeManagementPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Quản lý nhân sự & Cấp quyền" 
        addBtnLabel="Thêm nhân viên mới" 
        addBtnHref="/admin/employees/add" 
        secondaryBtnLabel="Phân quyền vai trò"
        secondaryBtnHref="/admin/employees/roles"
        secondaryBtnIcon={ShieldCheck}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên, email, số điện thoại..." 
          filter1Placeholder="Tất cả chi nhánh"
          filter1Options={branchFilters}
          filter2Placeholder="Trạng thái tài khoản"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing employee list...")}
        />
        <AdminEmployeeTable employees={employeeData} />
      </div>
    </div>
  );
}