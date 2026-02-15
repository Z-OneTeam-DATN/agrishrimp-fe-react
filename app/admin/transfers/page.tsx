"use client";

import React, { useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminSearchFilter } from "@/components/admin/shared/AdminSearchFilter";
import { AdminTransferTable } from "@/components/admin/AdminTransferTable";
import {
  Download,
  Truck,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  User as UserIcon,
  Warehouse,
  Search,
  Printer,
  Trash2,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Dữ liệu mở rộng chuẩn ERP
const outboundData: any[] = [
  {
    id: "1",
    code: "PDC00005",
    date: "12/02/2026 10:30",
    deadline: "12/02/2026 18:00", // 2. Deadline
    age: "2 giờ",
    priority: "HIGH",
    fromWarehouse: "Kho Tổng Hà Nội", // 1. Kho gửi
    toWarehouse: "Kho Sóc Trăng",
    transporter: "Lê Minh Tâm (Xe 29C-123.45)",
    totalQty: 150,
    itemCount: 8,
    totalValue: 45000000,
    status: "TRANSIT",
    creator: "Admin",
    isHighValue: false,
    isOverdue: false,
  },
  {
    id: "2",
    code: "PDC00004",
    date: "09/02/2026 15:45",
    deadline: "10/02/2026 10:00",
    age: "3 ngày 7 giờ",
    priority: "NORMAL",
    fromWarehouse: "Kho Tổng Hà Nội",
    toWarehouse: "Kho Bạc Liêu",
    transporter: "Nguyễn Văn Hùng",
    totalQty: 85,
    itemCount: 3,
    totalValue: 122000000, // 4. Giá trị cao
    status: "OVERDUE",
    creator: "Nhiên Lê",
    isHighValue: true,
    isOverdue: true,
  },
  {
    id: "5",
    code: "PDC00001",
    date: "12/02/2026 14:20",
    deadline: "13/02/2026 14:00",
    age: "30 phút",
    priority: "LOW",
    fromWarehouse: "Kho Miền Nam",
    toWarehouse: "Kho Cà Mau",
    transporter: "--",
    totalQty: 500,
    itemCount: 12,
    totalValue: 15000000,
    status: "PENDING",
    creator: "Admin",
    isHighValue: false,
    isOverdue: false,
    isLargeQty: true,
  },
];

export default function AdminTransferListPage() {
  const [activeTab, setActiveTab] = useState("outbound");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Quản lý điều chuyển kho"
        addBtnLabel="Lập lệnh điều chuyển"
        addBtnHref="/admin/transfers/new"
        secondaryBtnLabel="Xuất Excel"
        secondaryBtnIcon={Download}
        tabs={[
          {
            id: "outbound",
            label: "Hàng Xuất (Gửi đi)",
            count: 12,
            color: "text-blue-600",
          },
          {
            id: "inbound",
            label: "Hàng Nhập (Sắp về)",
            count: 5,
            color: "text-orange-600",
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Dashboard Mini */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-white border border-[#dcdcdc] p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-none border border-blue-100">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Đang vận chuyển
            </p>
            <h4 className="text-[20px] font-black text-slate-800">12</h4>
          </div>
        </div>
        <div className="bg-white border border-[#dcdcdc] p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-none border border-emerald-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Giá trị hàng đi
            </p>
            <h4 className="text-[20px] font-black text-emerald-700">540.2M</h4>
          </div>
        </div>
        <div className="bg-white border border-[#dcdcdc] p-4 flex items-center gap-4 shadow-sm border-l-4 border-l-rose-500">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 flex items-center justify-center rounded-none border border-rose-100">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1">
              <AlertTriangle size={10} /> Phiếu quá hạn
            </p>
            <h4 className="text-[20px] font-black text-rose-700">03</h4>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden mb-8">
        {/* 6. Bulk Action Bar */}
        {selectedIds.length > 0 ? (
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-black uppercase tracking-widest">
                Đã chọn {selectedIds.length} phiếu điều chuyển
              </span>
              <div className="h-4 w-[1px] bg-slate-700" />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase tracking-tighter"
                >
                  <Printer size={14} className="mr-1.5" /> In phiếu loạt
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 uppercase tracking-tighter"
                >
                  <CheckCircle2 size={14} className="mr-1.5" /> Xác nhận nhận
                  hàng
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 text-[11px] font-bold text-rose-400 hover:bg-rose-900/30 uppercase tracking-tighter"
                >
                  <Trash2 size={14} className="mr-1.5" /> Hủy hàng loạt
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white"
            >
              <X size={18} />
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border-b border-[#eee] flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                placeholder="Tìm mã phiếu, người chuyển, tài xế..."
                className="h-9 pl-10 text-[13px] border-slate-200 focus:border-blue-500 rounded-none shadow-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 h-9">
                <Calendar size={14} className="text-slate-400" />
                <select className="text-[11px] font-black outline-none bg-transparent h-full cursor-pointer uppercase tracking-tighter">
                  <option>Thời gian: Tất cả</option>
                  <option>Hôm nay</option>
                  <option>Tháng này</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 h-9">
                <Warehouse size={14} className="text-slate-400" />
                <select className="text-[11px] font-black outline-none bg-transparent h-full cursor-pointer uppercase tracking-tighter">
                  <option>Kho nhận: Tất cả</option>
                  <option>Kho Sóc Trăng</option>
                  <option>Kho Bạc Liêu</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 h-9">
                <UserIcon size={14} className="text-slate-400" />
                <select className="text-[11px] font-black outline-none bg-transparent h-full cursor-pointer uppercase tracking-tighter">
                  <option>Người tạo: Tất cả</option>
                  <option>Admin</option>
                  <option>Nhiên Lê</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <AdminTransferTable
          data={outboundData}
          mode={activeTab}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </div>
  );
}
