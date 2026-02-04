"use client";

import React from "react";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { ReceiptTable } from "@/components/inventory/ReceiptTable";

export default function ReceiptListPage() {
  const receipts = [
    { code: "PNK00003", date: "21/02/2026", supplier: "CÔNG TY THỦY SẢN TOÀN CẦU", warehouse: "Kho thuốc", total: "15,500,000", status: "COMPLETED" },
    { code: "PNK00001", date: "10/02/2026", supplier: "C.P. VIỆT NAM", warehouse: "Kho thức ăn", total: "8,200,000", status: "COMPLETED" },
  ];

  return (
    <div className="space-y-3">
      <InventoryHeader 
        title="Lịch sử nhập kho" 
        addBtnLabel="Tạo phiếu nhập"
        addBtnHref="/inventory/receipts/new"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <InventoryFilters />
        <ReceiptTable receipts={receipts} />
      </div>
    </div>
  );
}
