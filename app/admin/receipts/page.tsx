"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { InventoryReceiptTable } from "@/components/inventory/InventoryReceiptTable";

const warehouseFilters = [
  { label: "Tất cả kho", value: "all" },
  { label: "Kho Tổng (Trụ sở)", value: "tong" },
  { label: "Kho Sóc Trăng", value: "soc-trang" },
  { label: "Kho Bạc Liêu", value: "bac-lieu" },
];

const statusFilters = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã nhập kho", value: "imported" },
  { label: "Phiếu tạm", value: "po" },
];

export default function AdminReceiptListPage() {
  const receipts = [
    { 
      id: 1,
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
      id: 2,
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
      id: 3,
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
    <div className="space-y-3">
      <AdminPageHeader 
        title="Quản lý phiếu nhập hàng" 
        addBtnLabel="Tạo phiếu nhập"
        addBtnHref="/admin/receipts/new"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        <AdminSearchFilter 
          placeholder="Tìm mã phiếu, nhà cung cấp..." 
          filter1Placeholder="Lọc theo kho"
          filter1Options={warehouseFilters}
          filter2Placeholder="Trạng thái"
          filter2Options={statusFilters}
          onRefresh={() => console.log("Refreshing receipts...")}
        />
        <InventoryReceiptTable receipts={receipts} />
      </div>
    </div>
  );
}
