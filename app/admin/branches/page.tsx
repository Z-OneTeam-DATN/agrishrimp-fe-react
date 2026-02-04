"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminBranchTable } from "@/components/admin/AdminBranchTable";

const branchData = [
  { 
    id: "CN-001", 
    name: "Chi nhánh Cần Thơ 1", 
    manager: "Nguyễn Văn An", 
    managerId: "NV-001", 
    phone: "0909 123 456", 
    email: "cantho@agri.com", 
    province: "Cần Thơ",
    district: "Ninh Kiều",
    ward: "Xuân Khánh",
    addressDetail: "123 Đường 3/2",
    status: "Đang hoạt động", 
    avatar: "AN" 
  },
  { 
    id: "CN-002", 
    name: "Chi nhánh Sóc Trăng", 
    manager: "Trần Thị Bích", 
    managerId: "NV-002", 
    phone: "0988 777 666", 
    email: "soctrang@agri.com", 
    province: "Sóc Trăng",
    district: "TP. Sóc Trăng",
    ward: "Phường 2",
    addressDetail: "45 Lê Lợi",
    status: "Đang hoạt động", 
    avatar: "TB" 
  },
  { 
    id: "CN-003", 
    name: "Chi nhánh Bạc Liêu", 
    manager: "Lê Văn Cường", 
    managerId: "NV-005", 
    phone: "0912 345 678", 
    email: "baclieu@agri.com", 
    province: "Bạc Liêu",
    district: "TP. Bạc Liêu",
    ward: "Phường 7",
    addressDetail: "88 Trần Phú",
    status: "Đang bảo trì", 
    avatar: "LC" 
  },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Đang bảo trì", value: "maint" },
  { label: "Ngừng hoạt động", value: "inactive" },
];

const areaFilters = [
  { label: "Tất cả khu vực", value: "all" },
  { label: "Miền Tây", value: "west" },
  { label: "Miền Đông", value: "east" },
];

export default function BranchManagementPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Hệ thống chi nhánh & Kho hàng" 
        addBtnLabel="Thêm chi nhánh" 
        addBtnHref="/admin/branches/add" 
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên, mã chi nhánh, người phụ trách..." 
          filter1Placeholder="Khu vực quản lý"
          filter1Options={areaFilters}
          filter2Placeholder="Trạng thái vận hành"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing branch list...")}
        />
        <AdminBranchTable branches={branchData} />
      </div>
    </div>
  );
}
