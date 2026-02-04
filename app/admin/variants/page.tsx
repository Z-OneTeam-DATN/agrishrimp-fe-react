"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminVariantTable } from "@/components/admin/AdminVariantTable";

const attributeList = [
  { id: 1, name: "Dạng sản phẩm", code: "PRODUCT_FORM", values: ["Lỏng", "Bột", "Viên nén", "Dung dịch", "Hạt"], useCount: 156, status: "Đang sử dụng" },
  { id: 2, name: "Quy cách đóng gói", code: "PACKAGING", values: ["Chai", "Gói", "Can", "Hũ", "Bao", "Xô"], useCount: 89, status: "Đang sử dụng" },
  { id: 3, name: "Đơn vị tính", code: "UNITS", values: ["ml", "lít", "g", "kg", "tấn"], useCount: 210, status: "Đang sử dụng" }
];

export default function VariantsPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Thuộc tính & Biến thể" 
        addBtnLabel="Tạo thuộc tính mới" 
        addBtnHref="/admin/variants/add" 
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên thuộc tính hoặc mã định danh..." 
          onRefresh={() => console.log("Refreshing attributes...")}
        />
        <AdminVariantTable attributes={attributeList} />
      </div>
    </div>
  );
}