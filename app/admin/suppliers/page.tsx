"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminSupplierTable } from "@/components/admin/AdminSupplierTable";

const supplierData = [
  { 
    id: "NCC-001", 
    name: "TỔNG CÔNG TY C.P. VIỆT NAM", 
    taxCode: "0300123456", 
    category: "Thức ăn & Dinh dưỡng", 
    contactName: "Mr. Somchai", 
    phone: "028 3812 1212", 
    debt: "420.500.000 ₫", 
    status: "Đang giao dịch" 
  },
  { 
    id: "NCC-002", 
    name: "CÔNG TY THỦY SẢN TOÀN CẦU", 
    taxCode: "0311223344", 
    category: "Thuốc & Chế phẩm", 
    contactName: "Nguyễn Thị Mai", 
    phone: "0909 555 666", 
    debt: "15.200.000 ₫", 
    status: "Đang giao dịch" 
  },
];

const categoryFilters = [
  { label: "Tất cả nhóm hàng", value: "all" },
  { label: "Thức ăn thủy sản", value: "feed" },
  { label: "Thuốc & Vi sinh", value: "med" },
  { label: "Thiết bị nuôi tôm", value: "tech" },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang giao dịch", value: "active" },
  { label: "Tạm ngừng nhập", value: "inactive" },
];

export default function SupplierListPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Quản lý nhà cung cấp hàng hóa" 
        addBtnLabel="Thêm nhà cung cấp" 
        addBtnHref="/admin/suppliers/add" 
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên nhà cung cấp, MST, người liên hệ..." 
          filter1Placeholder="Nhóm hàng cung cấp"
          filter1Options={categoryFilters}
          filter2Placeholder="Trạng thái hợp tác"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing supplier list...")}
        />
        <AdminSupplierTable suppliers={supplierData} />
      </div>
    </div>
  );
}
