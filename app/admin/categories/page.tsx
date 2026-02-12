"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminCategoryTable } from "@/components/admin/AdminCategoryTable";

const categoryData = [
  {
    id: 1,
    name: "Thuốc & Chế phẩm",
    description: "Kháng sinh, Vi sinh, Khoáng cho tôm...",
    productCount: 120,
    status: "Hiển thị",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Thức ăn & Dinh dưỡng",
    description: "Thức ăn tăng trọng, bổ sung đạm...",
    productCount: 85,
    status: "Hiển thị",
    image: "https://images.unsplash.com/photo-1621813137938-f9b87002e260?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Dụng cụ & Thiết bị",
    description: "Máy đo pH, Quạt nước, Máy sục khí...",
    productCount: 45,
    status: "Hiển thị",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Giống Tôm",
    description: "Tôm thẻ chân trắng, Tôm sú giống...",
    productCount: 32,
    status: "Đang ẩn",
    image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=200&h=200&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Dịch vụ Tư vấn",
    description: "Kỹ thuật nuôi, setup ao công nghệ cao...",
    productCount: 12,
    status: "Hiển thị",
    image: null,
  },
];

export default function CategoryManagementPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader 
        title="Quản lý danh mục hàng hóa" 
        addBtnLabel="Thêm danh mục"
        addBtnHref="/admin/categories/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm tên danh mục..." 
          onRefresh={() => console.log("Refreshing categories...")}
        />
        <AdminCategoryTable categories={categoryData} />
      </div>
    </div>
  );
}