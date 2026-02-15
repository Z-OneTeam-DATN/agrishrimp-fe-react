"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminProductTable } from "@/components/admin/AdminProductTable";

const products = [
  {
    id: 1,
    sku: "ENRO-20-BASE",
    name: "Kháng sinh Enrofloxacin 20%",
    category: "Thuốc & Chế phẩm",
    brand: "APA NANO",
    origin: "Việt Nam",
    priceRange: "150.000 ₫ - 550.000 ₫",
    totalSold: 1240,
    inventory: 240,
    available: 240,
    createdAt: "28/03/2024",
    status: "Đang kinh doanh",
    image: "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
    imageCount: 5,
    techSpecs: [
      { key: "Thành phần", value: "Enrofloxacin 20%" },
      { key: "Độ pH", value: "3.5 - 4.5" },
      { key: "Hạn dùng", value: "24 tháng" },
    ],
    variants: [
      {
        id: "SKU-ENRO-100",
        formulation: "Dung dịch",
        packaging: "Chai nhựa",
        weight: "100",
        unit: "ml",
        price: "150.000 ₫",
        costPrice: "100.000 ₫",
        wholesalePrice: "120.000 ₫",
        inventory: 120,
        available: 120,
        sold: 850,
        barcode: "893000111",
        image:
          "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
      },
      {
        id: "SKU-ENRO-500",
        formulation: "Dung dịch",
        packaging: "Chai nhựa",
        weight: "500",
        unit: "ml",
        price: "550.000 ₫",
        costPrice: "400.000 ₫",
        wholesalePrice: "480.000 ₫",
        inventory: 120,
        available: 120,
        sold: 390,
        barcode: "893000555",
        image: null,
      },
    ],
  },
  {
    id: 2,
    sku: "BIO-BASE-01",
    name: "Men vi sinh xử lý đáy ao",
    category: "Chế phẩm sinh học",
    brand: "BIO-PHARMA",
    origin: "Mỹ",
    priceRange: "220.000 ₫",
    totalSold: 850,
    inventory: 60,
    available: 59,
    createdAt: "27/03/2024",
    status: "Đang kinh doanh",
    image:
      "https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png",
    imageCount: 3,
    techSpecs: [
      { key: "Mật độ khuẩn", value: "10^9 CFU/g" },
      { key: "Dạng", value: "Bột mịn" },
    ],
    variants: [
      {
        id: "SKU-BIO-1KG",
        formulation: "Bột mịn",
        packaging: "Gói nhôm",
        weight: "1",
        unit: "kg",
        price: "220.000 ₫",
        costPrice: "150.000 ₫",
        wholesalePrice: "180.000 ₫",
        inventory: 60,
        available: 59,
        sold: 850,
        barcode: "893000222",
        image:
          "https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png",
      },
    ],
  },
];

const categoryFilters = [
  { label: "Tất cả danh mục", value: "all" },
  { label: "Thuốc & Chế phẩm", value: "thuoc" },
  { label: "Thức ăn", value: "thuc-an" },
];

const statusFilters = [
  { label: "Đang kinh doanh", value: "active" },
  { label: "Ngừng kinh doanh", value: "inactive" },
];

export default function ProductsPage() {
  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Hệ thống sản phẩm"
        addBtnLabel="Thêm sản phẩm"
        addBtnHref="/admin/products/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter
          placeholder="Tìm tên sản phẩm, thương hiệu, mã SKU..."
          filter1Placeholder="Tất cả danh mục"
          filter1Options={categoryFilters}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing...")}
        />
        <AdminProductTable products={products} />
      </div>
    </div>
  );
}
