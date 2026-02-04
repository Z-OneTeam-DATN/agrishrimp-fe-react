"use client";

import React from "react";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryCheckTable } from "@/components/inventory/InventoryCheckTable";

export default function InventoryListPage() {
  const inventories = [
    { date: "25/01/2026", code: "PKK00009", warehouse: "Kho Thuốc", branch: "CN Cà Mau", cutOffDate: "25/01/2026", deadline: "07/08/2026", status: "Chưa thực hiện" },
    { date: "20/01/2026", code: "PKK00008", warehouse: "Kho Thức ăn", branch: "CN Bạc Liêu", cutOffDate: "20/01/2026", deadline: "30/01/2026", status: "Đã hoàn thành" },
  ];

  return (
    <div className="space-y-3">
      <InventoryHeader 
        title="Danh sách yêu cầu kiểm kê" 
        addBtnLabel="Thêm"
        addBtnHref="/inventory/inventory-checks/new"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <InventoryFilters />
        <InventoryCheckTable checks={inventories} />
      </div>
    </div>
  );
}