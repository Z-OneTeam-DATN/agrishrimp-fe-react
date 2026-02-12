"use client";

import React, { useState } from "react";
import { InventoryPageHeader } from "@/components/inventory/shared/InventoryPageHeader";
import { InventorySearchFilter } from "@/components/inventory/shared/InventorySearchFilter";
import { InventoryProductTable } from "@/components/inventory/InventoryProductTable";

const mockProducts = [
  { code: "TA001", name: "Thức ăn tôm Grobest 40% đạm", type: "Hàng hóa", unit: "Bao", group: "Thức ăn tôm", stock: 150.00, status: "Đang sử dụng" },
  { code: "VS005", name: "Vi sinh xử lý đáy (BZT)", type: "Hàng hóa", unit: "Gói", group: "Thuốc & Vi sinh", stock: 520.00, status: "Đang sử dụng" },
  { code: "HC003", name: "Khoáng tạt Azomite", type: "Hàng hóa", unit: "Kg", group: "Hóa chất xử lý", stock: 1200.00, status: "Đang sử dụng" },
  { code: "MM002", name: "Máy sục khí 2HP (Guồng quạt)", type: "Hàng hóa", unit: "Cái", group: "Máy móc & Thiết bị", stock: 0.00, status: "Đang sử dụng" },
];

export default function ProductListPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-3">
      <InventoryPageHeader 
        title="Vật tư hàng hóa" 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddClick={() => console.log("Add")}
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <InventorySearchFilter 
          onRefresh={() => console.log("Refresh")}
        />
        <InventoryProductTable products={mockProducts} />
      </div>
    </div>
  );
}
