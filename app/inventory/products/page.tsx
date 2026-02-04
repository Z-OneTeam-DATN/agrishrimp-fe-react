"use client";

import React, { useState } from "react";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { ProductTable } from "@/components/inventory/ProductTable";

const mockProducts = [
  { code: "TA001", name: "Thức ăn tôm Grobest 40% đạm", type: "Hàng hóa", unit: "Bao", group: "Thức ăn tôm", stock: 150.00, status: "Đang sử dụng" },
  { code: "VS005", name: "Vi sinh xử lý đáy (BZT)", type: "Hàng hóa", unit: "Gói", group: "Thuốc & Vi sinh", stock: 520.00, status: "Đang sử dụng" },
  { code: "HC003", name: "Khoáng tạt Azomite", type: "Hàng hóa", unit: "Kg", group: "Hóa chất xử lý", stock: 1200.00, status: "Đang sử dụng" },
  { code: "MM002", name: "Máy sục khí 2HP (Guồng quạt)", type: "Hàng hóa", unit: "Cái", group: "Máy móc & Thiết bị", stock: 0.00, status: "Đang sử dụng" },
];

export default function ProductListPage() {
  const [activeTab, setActiveTab] = useState("all");

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  const handleSettings = () => {
    console.log("Opening settings...");
  };

  const handleAddProduct = () => {
    console.log("Add product clicked");
  };

  return (
    <div className="space-y-3">
      <InventoryHeader 
        title="Vật tư hàng hóa" 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddClick={handleAddProduct}
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <InventoryFilters 
          onRefresh={handleRefresh}
          onSettings={handleSettings}
        />
        <ProductTable products={mockProducts} />
      </div>
    </div>
  );
}