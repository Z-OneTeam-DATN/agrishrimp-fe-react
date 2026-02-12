"use client";

import React, { useState } from "react";
import { InventoryPageHeader } from "@/components/inventory/shared/InventoryPageHeader";
import { InventorySearchFilter } from "@/components/inventory/shared/InventorySearchFilter";
import { InventoryCheckTable } from "@/components/inventory/InventoryCheckTable";
import { 
  ClipboardCheck, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Trash2,
  Play,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const auditData = [
  { 
    id: "PKK0001", 
    code: "AUD-2026-001", 
    warehouse: "Kho Tổng Hà Nội", 
    keeper: "Nhiên Lê", 
    skuCount: 150, 
    progress: 100, 
    date: "10/02/2026",
    status: "COMPLETED", 
    diffValue: "-5,200,000" 
  },
  { 
    id: "PKK0002", 
    code: "AUD-2026-002", 
    warehouse: "Kho Sóc Trăng", 
    keeper: "Minh Tâm", 
    skuCount: 450, 
    progress: 65, 
    date: "12/02/2026",
    status: "AUDITING", 
    diffValue: "Đang tính..."
  },
];

export default function InventoryAuditPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="space-y-4 p-4 bg-slate-50/30 min-h-screen">
      <InventoryPageHeader
        title="Kiểm kê kho định kỳ"
        addBtnLabel="Tạo đợt kiểm kê mới (F2)"
        addBtnHref="/admin/inventory-checks/new"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-white border border-[#dcdcdc] p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-lg"><ClipboardCheck size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đợt đang kiểm</p>
              <h4 className="text-[18px] font-black text-slate-800">02</h4>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#dcdcdc] p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 flex items-center justify-center rounded-lg"><AlertCircle size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Quá hạn</p>
              <h4 className="text-[18px] font-black text-rose-700">01</h4>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#dcdcdc] p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-lg"><TrendingUp size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu suất</p>
              <h4 className="text-[18px] font-black text-emerald-700">92%</h4>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#dcdcdc] p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 flex items-center justify-center rounded-lg"><Clock size={20} /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã hàng</p>
              <h4 className="text-[18px] font-black text-slate-800">1,240</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm overflow-hidden mb-8">
        {selectedIds.length > 0 && (
          <div className="p-3 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[12px] font-bold uppercase">Đã chọn {selectedIds.length} đợt kiểm kê</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-blue-700"><Play size={14} className="mr-1.5" /> Bắt đầu</Button>
                <Button variant="ghost" className="h-8 text-[11px] font-bold text-white hover:bg-blue-700"><Printer size={14} className="mr-1.5" /> In phiếu</Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="text-white hover:bg-blue-700"><X size={18} /></Button>
          </div>
        )}

        <InventorySearchFilter type="CHECK" />
        <InventoryCheckTable checks={auditData} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
      </div>
    </div>
  );
}
