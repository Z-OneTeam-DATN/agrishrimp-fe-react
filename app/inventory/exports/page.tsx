"use client";

import React from "react";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { ExportTable } from "@/components/inventory/ExportTable";

export default function ExportListPage() {
  const exports = [
    { code: "PXK00003", date: "22/02/2026", receiver: "Nguyễn Văn A", warehouse: "Kho thành phẩm", branch: "Chi nhánh chính", status: "Đã hoàn thành" },
    { code: "PXK00002", date: "20/02/2026", receiver: "Công ty TNHH ABC", warehouse: "Kho thức ăn", branch: "Chi nhánh chính", status: "Đang giao" },
    { code: "PXK00001", date: "15/02/2026", receiver: "Đại lý Miền Tây", warehouse: "Kho thuốc", branch: "Cửa hàng phụ", status: "Đã hoàn thành" },
  ];

  return (
    <div className="space-y-3">
      <InventoryHeader 
        title="Phiếu xuất kho" 
        addBtnLabel="Tạo phiếu xuất"
        addBtnHref="/inventory/exports/new"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <InventoryFilters />
        <ExportTable exports={exports} />
      </div>
    </div>
  );
}