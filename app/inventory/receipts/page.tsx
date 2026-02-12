"use client";

import React from "react";
import { InventoryPageHeader } from "@/components/inventory/shared/InventoryPageHeader";
import { InventorySearchFilter } from "@/components/inventory/shared/InventorySearchFilter";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";

export default function ReceiptListPage() {
  const receipts = [
    { code: "PNK00003", date: "21/02/2026", supplier: "CÔNG TY THỦY SẢN TOÀN CẦU", warehouse: "Kho thuốc", total: "15,500,000", status: "COMPLETED" },
    { code: "PNK00001", date: "10/02/2026", supplier: "C.P. VIỆT NAM", warehouse: "Kho thức ăn", total: "8,200,000", status: "COMPLETED" },
  ];

  return (
    <div className="space-y-3">
      <InventoryPageHeader 
        title="Lịch sử nhập kho" 
        addBtnLabel="Tạo phiếu nhập"
        addBtnHref="/inventory/receipts/new"
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <InventorySearchFilter />
        <InventoryReceiptTable receipts={receipts} />
      </div>
    </div>
  );
}