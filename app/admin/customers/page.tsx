"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminCustomerTable } from "@/components/admin/AdminCustomerTable";

const customerData = [
  { id: "KH-001", name: "Nguyễn Văn Đại", type: "Chủ ao", location: "Bạc Liêu", phone: "0901 222 333", totalSpent: "125.000.000", totalOrders: 12, status: "Hoạt động" },
  { id: "KH-002", name: "Lê Thị Hồng", type: "Đại lý", location: "Cà Mau", phone: "0988 444 555", totalSpent: "450.000.000", totalOrders: 45, status: "Hoạt động" },
  { id: "KH-003", name: "Trần Hữu Lộc", type: "Chủ ao", location: "Sóc Trăng", phone: "0912 999 888", totalSpent: "45.000.000", totalOrders: 5, status: "Tạm khóa" },
];

const customerTypeFilters = [
  { label: "Tất cả phân loại", value: "all" },
  { label: "Chủ ao nuôi", value: "chu-ao" },
  { label: "Đại lý phân phối", value: "dai-ly" },
];

const statusFilters = [
  { label: "Trạng thái: Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Đang tạm khóa", value: "locked" },
];

export default function CustomerManagementPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Quản lý danh sách khách hàng" 
        addBtnLabel="Thêm khách hàng"
        addBtnHref="/admin/customers/add"
        secondaryBtnLabel="Đăng ký đại lý"
        secondaryBtnHref="/admin/customers/add-dealer"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên, số điện thoại, khu vực khách hàng..." 
          filter1Placeholder="Tất cả phân loại"
          filter1Options={customerTypeFilters}
          filter2Placeholder="Trạng thái tài khoản"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing customer list...")}
        />
        <AdminCustomerTable customers={customerData} />
      </div>
    </div>
  );
}