"use client";

import React from "react";
import { InventoryHeader } from "@/components/inventory/InventoryHeader";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { TransferTable } from "@/components/inventory/TransferTable";

export default function TransferListPage() {
  const transfers = [
    { code: "PDC00003", date: "23/02/2026", description: "Điều chuyển hàng chi nhánh HN -> HCM", sourceBranch: "Chi nhánh Hà Nội", sourceWarehouse: "Kho Hàng Hóa (HH)", status: "Đang vận chuyển" },
    { code: "PDC00002", date: "21/02/2026", description: "Luân chuyển thức ăn tôm", sourceBranch: "Chi nhánh Hồ Chí Minh", sourceWarehouse: "Kho Lạnh (KL)", status: "Hoàn thành" },
    { code: "PDC00001", date: "18/02/2026", description: "Cân đối tồn kho", sourceBranch: "Cửa hàng Cầu Giấy", sourceWarehouse: "Kho Nguyên Liệu (NL)", status: "Chờ xử lý" },
  ];

  return (
    <div className="space-y-3">
      <InventoryHeader 
        title="Điều chuyển" 
        addBtnLabel="Thêm phiếu điều chuyển"
        addBtnHref="/inventory/transfers/new"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <InventoryFilters />
        <TransferTable transfers={transfers} />
      </div>
    </div>
  );
}