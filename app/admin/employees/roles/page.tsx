"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminRoleTable } from "@/components/admin/AdminRoleTable";
import { ShieldCheck, Users } from "lucide-react";

const rolesData: any[] = [
  { 
    id: 1, 
    name: "Quản trị viên", 
    group: "HỆ THỐNG", 
    activeCount: 2, 
    inactiveCount: 0, 
    moduleCount: 18, 
    actionCount: 72, 
    powerLevel: 'FULL', 
    createdAt: "01/01/2024", 
    updatedAt: "05/02/2026", 
    note: "Toàn quyền điều hành hệ thống" 
  },
  { 
    id: 2, 
    name: "Nhân viên kho", 
    group: "VẬN HÀNH", 
    activeCount: 5, 
    inactiveCount: 1, 
    moduleCount: 6, 
    actionCount: 24, 
    powerLevel: 'MEDIUM', 
    createdAt: "05/02/2026", 
    updatedAt: "05/02/2026", 
    note: "Quản lý kho hàng" 
  },
  { 
    id: 3, 
    name: "Bán hàng", 
    group: "KINH DOANH", 
    activeCount: 12, 
    inactiveCount: 3, 
    moduleCount: 4, 
    actionCount: 16, 
    powerLevel: 'LIMITED', 
    createdAt: "05/02/2026", 
    updatedAt: "05/02/2026", 
    note: "Tư vấn khách hàng" 
  },
  { 
    id: 4, 
    name: "Quản lý chi nhánh", 
    group: "QUẢN TRỊ", 
    activeCount: 4, 
    inactiveCount: 0, 
    moduleCount: 12, 
    actionCount: 48, 
    powerLevel: 'HIGH', 
    createdAt: "05/02/2026", 
    updatedAt: "05/02/2026", 
    note: "Điều hành chi nhánh" 
  },
];

const groupFilters = [
  { label: "Tất cả nhóm", value: "all" },
  { label: "Nhóm HỆ THỐNG", value: "sys" },
  { label: "Nhóm VẬN HÀNH", value: "ops" },
  { label: "Nhóm KINH DOANH", value: "biz" },
];

export default function RolesManagementPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Danh sách vai trò hệ thống" 
        addBtnLabel="Thêm vai trò mới" 
        addBtnHref="/admin/employees/roles/add" 
        secondaryBtnLabel="Quản lý nhân sự"
        secondaryBtnHref="/admin/employees"
        secondaryBtnIcon={Users}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm kiếm tên vai trò, phân nhóm..." 
          filter1Placeholder="Lọc theo nhóm"
          filter1Options={groupFilters}
          onRefresh={() => console.log("Refreshing roles list...")}
        />
        <AdminRoleTable roles={rolesData} />
      </div>
    </div>
  );
}