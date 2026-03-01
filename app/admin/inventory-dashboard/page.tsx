"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  Clock,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  FileText,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- IMPORT CÁC API SERVICES ---
import { InventoryApiService, InventoryExportApiService } from "@/app/services/inventory.service";
import { transferService } from "@/app/services/transfer.service";

// Interface cho một thẻ Phiếu riêng lẻ
interface TicketData {
  id: string;
  code: string;
  typeLabel: string;
  statusLabel: string;
  time: string;
  icon: React.ElementType;
  iconColor: string;
  href: string;
}

// Component hiển thị Từng Phiếu Một
const TicketCard = ({ data }: { data: TicketData }) => {
  const router = useRouter();
  const Icon = data.icon;

  // Hàm format thời gian đẹp
  const formatTime = (isoString: string) => {
    if (!isoString) return "--";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col h-full overflow-hidden group">
      <div className="p-4 flex justify-between items-start gap-2">
        <div className="flex gap-3 min-w-0 flex-1 items-center">
          <div
            className={cn(
              "p-2.5 rounded-none flex-shrink-0 transition-colors",
              data.iconColor
            )}
          >
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h5 className="text-[11px] font-bold text-slate-500 leading-tight truncate uppercase tracking-widest">
              {data.typeLabel}
            </h5>
            <p className="text-[16px] font-black text-slate-800 mt-0.5 whitespace-nowrap tracking-tight">
              {data.code}
            </p>
          </div>
        </div>
        {/* Status Badge */}
        <span
          className={cn(
            "text-[10px] font-black px-2 py-1 uppercase tracking-tighter whitespace-nowrap border rounded-sm",
            data.statusLabel === "Chờ xuất" ||
              data.statusLabel === "Chờ xử lý" ||
              data.statusLabel === "Chờ duyệt"
              ? "bg-amber-50 text-amber-600 border-amber-200"
              : "bg-cyan-50 text-cyan-600 border-cyan-200"
          )}
        >
          {data.statusLabel}
        </span>
      </div>

      <div className="px-4 py-2 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
            <Clock size={10} /> Thời gian tạo
          </span>
          <span className="text-[12px] font-bold text-slate-600 mt-0.5">
            {formatTime(data.time)}
          </span>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-white">
        <span className="text-[11px] font-medium text-slate-400">
          Cần được xử lý
        </span>
        <button
          onClick={() => router.push(data.href)}
          className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 hover:bg-blue-600 hover:text-white transition-all uppercase flex items-center gap-1 border border-blue-100"
        >
          Xử lý phiếu <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default function WarehouseDashboard() {
  const [tasks, setTasks] = useState<TicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Gọi song song API lấy dữ liệu Phiếu
      const [receiptsRes, exportPendingRes, transfersRes] = await Promise.all([
        InventoryApiService.getAllReceipts().catch(() => []),
        InventoryExportApiService.getAllExportCommands().catch(() => []), // Lấy lệnh xuất đang chờ xử lý
        transferService.getAll("", "all", 0, 50).catch(() => ({ content: [] })),
      ]);

      const allTasks: TicketData[] = [];

      // 1. Phân tích Nhập Kho (Lấy những phiếu đang chờ)
      const rawReceipts = Array.isArray(receiptsRes) ? receiptsRes : receiptsRes?.content || [];
      rawReceipts
        .filter((r: any) => r.status === "PENDING" || r.status === "PO")
        .forEach((r: any) => {
          allTasks.push({
            id: r.id,
            code: r.code || `PNK-${r.id}`,
            typeLabel: "Lệnh nhập kho",
            statusLabel: r.status === "PO" ? "Chờ duyệt" : "Chờ xử lý",
            time: r.createdAt || r.entryDate || new Date().toISOString(),
            icon: ArrowDownToLine,
            iconColor: "bg-emerald-50 text-emerald-600",
            href: `/admin/receipts`,
          });
        });

      // 2. Phân tích Xuất Kho (API ExportCommands mặc định trả về phiếu Pending)
      const pendingExports = Array.isArray(exportPendingRes) ? exportPendingRes : [];
      pendingExports.forEach((e: any) => {
        allTasks.push({
          id: e.id,
          code: e.code || `PXK-${e.id}`,
          typeLabel: "Lệnh xuất kho",
          statusLabel: "Chờ xuất",
          time: e.createdAt || e.entryDate || new Date().toISOString(),
          icon: ArrowUpFromLine,
          iconColor: "bg-blue-50 text-blue-600",
          href: `/admin/exports`,
        });
      });

      // 3. Phân tích Điều Chuyển
      const rawTransfers = transfersRes?.content || [];
      rawTransfers
        .filter((t: any) => t.status === "PENDING" || t.status === "SHIPPING")
        .forEach((t: any) => {
          allTasks.push({
            id: t.id,
            code: t.transferCode || `PDC-${t.id}`,
            typeLabel: "Điều chuyển kho",
            statusLabel: t.status === "PENDING" ? "Chờ xuất" : "Đang đi",
            time: t.createdAt || t.transferDate || new Date().toISOString(),
            icon: Truck,
            iconColor: "bg-purple-50 text-purple-600",
            href: `/admin/transfers`,
          });
        });

      // Sắp xếp danh sách phiếu theo thứ tự: Mới nhất nằm lên trên cùng
      allTasks.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );

      setTasks(allTasks);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER BÀN LÀM VIỆC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight uppercase">
            Bàn làm việc kho
          </h1>
          <p className="text-slate-500 text-[12px] mt-1 flex items-center gap-2 font-medium">
            <span
              className={cn(
                "flex h-2 w-2 rounded-full",
                isLoading ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
              )}
            ></span>
            Hệ thống vận hành {isLoading ? "đang tải dữ liệu..." : "ổn định"}. Bạn có{" "}
            <b className="text-slate-800">{tasks.length} phiếu</b> đang chờ xử lý.
          </p>
        </div>
        <button
          onClick={() => {
            fetchDashboardData();
          }}
          className="text-[12px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-all uppercase"
        >
          <RotateCw size={14} className={cn(isLoading && "animate-spin")} />
          Làm mới
        </button>
      </div>

      {/* DANH SÁCH PHIẾU */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-none shadow-sm">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Đang tải dữ liệu phiếu...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-none shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <FileText className="text-slate-300" size={48} strokeWidth={1.5} />
          </div>
          <p className="text-lg font-black text-slate-700 tracking-tight">
            XIN CHÚC MỪNG!
          </p>
          <p className="text-[13px] font-medium text-slate-500 mt-1">
            Hiện tại không có phiếu nhập, xuất hay điều chuyển nào cần xử lý.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <TicketCard key={`${task.typeLabel}-${task.id}`} data={task} />
          ))}
        </div>
      )}
    </div>
  );
}