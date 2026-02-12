"use client";

import React from "react";
import { InventoryPageHeader } from "@/components/inventory/shared/InventoryPageHeader";
import { InventorySearchFilter } from "@/components/inventory/shared/InventorySearchFilter";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";

export default function ReceiptListPage() {
  const receipts = [
    { 
      code: "PNK00003", 
      date: "12/02/2026 10:30", 
      supplier: "GROBEST VIỆT NAM", 
      warehouse: "Kho Tổng (Trụ sở)", 
      total: 150000000, 
      paid: 50000000, 
      debt: 100000000,
      status: "IMPORTED",
      creator: "Nhiên Lê"
    },
    { 
      code: "PNK00002", 
      date: "11/02/2026 15:45", 
      supplier: "C.P. VIỆT NAM", 
      warehouse: "Kho Sóc Trăng", 
      total: 85000000, 
      paid: 85000000, 
      debt: 0,
      status: "IMPORTED",
      creator: "Admin"
    },
    { 
      code: "PNK00001", 
      date: "10/02/2026 08:20", 
      supplier: "CÔNG TY THỦY SẢN TOÀN CẦU", 
      warehouse: "Kho Tổng (Trụ sở)", 
      total: 42000000, 
      paid: 0, 
      debt: 42000000,
      status: "PO",
      creator: "Nhiên Lê"
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <InventoryPageHeader 
        title="Quản lý phiếu nhập kho" 
        addBtnLabel="Tạo phiếu nhập mới (F2)"
        addBtnHref="/inventory/receipts/new"
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <InventorySearchFilter type="RECEIPT" />
        <InventoryReceiptTable receipts={receipts} />
      </div>
    </div>
  );
}
