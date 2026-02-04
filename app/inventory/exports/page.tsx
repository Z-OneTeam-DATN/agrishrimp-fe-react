"use client";

import React from "react";
import { InventoryPageHeader } from "@/components/inventory/shared/InventoryPageHeader";
import { InventorySearchFilter } from "@/components/inventory/shared/InventorySearchFilter";
import { InventoryExportTable } from "@/components/inventory/InventoryExportTable";

export default function ExportListPage() {
  const exports = [
    { code: "PXK00003", date: "22/02/2026", receiver: "Nguyễn Văn A", warehouse: "Kho thành phẩm", branch: "Chi nhánh chính", status: "Đã hoàn thành" },
    { code: "PXK00002", date: "20/02/2026", receiver: "Công ty TNHH ABC", warehouse: "Kho thức ăn", branch: "Chi nhánh chính", status: "Đang giao" },
    { code: "PXK00001", date: "15/02/2026", receiver: "Đại lý Miền Tây", warehouse: "Kho thuốc", branch: "Cửa hàng phụ", status: "Đã hoàn thành" },
  ];

  return (
    <div className="space-y-3">
      <InventoryPageHeader 
        title="Phiếu xuất kho" 
        addBtnLabel="Tạo phiếu xuất"
        addBtnHref="/inventory/exports/new"
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <InventorySearchFilter />
        <InventoryExportTable exports={exports} />
      </div>
    </div>
  );
}
