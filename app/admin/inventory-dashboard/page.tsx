"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  Clock,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- IMPORT CÁC API SERVICES ---
import { InventoryApiService, InventoryExportApiService } from "@/app/services/inventory.service";
import { transferService } from "@/app/services/transfer.service";
import { orderService } from "@/app/services/order.service"; // Thêm API Đơn hàng
import { useAuthStore } from "@/stores/useAuthStore";
import { getOrderListPath } from "@/lib/order-routing";

interface StatItem {
  val: number;
  label: string;
  colorClass: string;
  bgClass: string;
  width: string;
}

interface DashCardProps {
  title: string;
  totalAction: string;
  icon: React.ElementType;
  iconColor: string;
  stats: StatItem[];
  time: string;
  href?: string;
}

const BusinessCard = ({
  title,
  totalAction,
  icon: Icon,
  iconColor,
  stats,
  time,
  href,
}: DashCardProps) => {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 rounded-none shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
      <div className="p-3 flex justify-between items-start gap-2">
        <div className="flex gap-2.5 min-w-0 flex-1">
          <div className={cn("p-2 rounded-none flex-shrink-0 transition-colors", iconColor)}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h5
              className="text-[14px] font-bold text-slate-800 leading-tight truncate uppercase"
              title={title}
            >
              {title}
            </h5>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 whitespace-nowrap font-bold">
              <Clock size={10} className="flex-shrink-0" /> CẬP NHẬT: {time}
            </p>
          </div>
        </div>
        {/* Nút bấm chuyển hướng */}
        <button
          onClick={() => href && router.push(href)}
          className="text-[10px] cursor-pointer font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-100 flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap hover:bg-blue-600 hover:text-white transition-all uppercase"
        >
          {totalAction} <ChevronRight size={10} className="flex-shrink-0" />
        </button>
      </div>

      <div className="px-4 py-2 flex items-center justify-between gap-1 overflow-hidden">
        {stats.map((item, idx) => (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-start min-w-0 group/item flex-1">
              <span className={cn("text-[16px] font-black tracking-tight whitespace-nowrap", item.colorClass)}>
                {item.val}
              </span>
              <span
                className="text-[9px] text-slate-400 font-bold whitespace-nowrap uppercase tracking-tighter truncate w-full"
                title={item.label}
              >
                {item.label}
              </span>
            </div>
            {idx < stats.length - 1 && (
              <div className="h-6 w-[1px] bg-slate-100 flex-shrink-0 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="px-4 mt-3 mb-4">
        <div className="flex h-1.5 w-full rounded-none overflow-hidden bg-slate-100 ring-1 ring-slate-50 flex-shrink-0">
          {stats.map((item, idx) => (
            <div
              key={idx}
              className={cn("h-full transition-all duration-500 flex-shrink-0", item.bgClass)}
              style={{ width: item.width }}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto bg-slate-50/30 p-2 border-t border-slate-100 flex justify-center flex-shrink-0">
        <button
          onClick={() => window.location.reload()}
          className="text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <RotateCw size={10} className="flex-shrink-0" /> Làm mới dữ liệu
        </button>
      </div>
    </div>
  );
};

export default function WarehouseDashboard() {
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State lưu số liệu động từ API
  const [dbData, setDbData] = useState({
    receipts: { pending: 0, completed: 0 },
    exports: { pending: 0, completed: 0 },
    transfers: { pending: 0, shipping: 0, completed: 0, cancelled: 0 },
    orders: { pending: 0, processing: 0, shipping: 0, completed: 0 },
  });

  // Hàm tính toán % chiều dài cho thanh màu progress bar
  const getWidth = (val: number, total: number) => {
    if (total === 0) return "0%";
    return `${Math.round((val / total) * 100)}%`;
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Gọi song song 5 API để lấy dữ liệu nhanh nhất
      const [receiptsRes, exportPendingRes, exportCompletedRes, transfersRes, ordersRes] = await Promise.all([
        InventoryApiService.getAllReceipts().catch(() => []),
        InventoryExportApiService.getAllExportCommands().catch(() => []),
        InventoryExportApiService.getAllExportReceipts().catch(() => []),
        transferService.getAll("", "all", 0, 1000).catch(() => ({ content: [] })),
        orderService.getBranchOrders().catch(() => []) // Lấy danh sách Đơn Hàng
      ]);

      // 1. Phân tích Nhập Kho
      const rawReceipts = Array.isArray(receiptsRes) ? receiptsRes : (receiptsRes?.content || []);
      const pendingReceipts = rawReceipts.filter((r: any) => r.status === "PENDING" || r.status === "PO").length;
      const completedReceipts = rawReceipts.filter((r: any) => r.status === "COMPLETED" || r.status === "IMPORTED").length;

      // 2. Phân tích Xuất Kho
      const pendingExports = Array.isArray(exportPendingRes) ? exportPendingRes.length : 0;
      const completedExports = Array.isArray(exportCompletedRes) ? exportCompletedRes.length : 0;

      // 3. Phân tích Điều Chuyển
      const rawTransfers = transfersRes?.content || [];
      const pendingTransfers = rawTransfers.filter((t: any) => t.status === "PENDING").length;
      const shippingTransfers = rawTransfers.filter((t: any) => t.status === "SHIPPING").length;
      const completedTransfers = rawTransfers.filter((t: any) => t.status === "COMPLETED").length;
      const cancelledTransfers = rawTransfers.filter((t: any) => t.status === "CANCELLED").length;

      // 4. Phân tích Đơn Mua Hàng
      const rawOrders = Array.isArray(ordersRes) ? ordersRes : [];
      const pendingOrders = rawOrders.filter((o: any) => o.subOrderStatus === "PENDING").length;
      const processingOrders = rawOrders.filter((o: any) => o.subOrderStatus === "CONFIRMED" || o.subOrderStatus === "PROCESSING").length;
      const shippingOrders = rawOrders.filter((o: any) => o.subOrderStatus === "SHIPPING").length;
      const completedOrders = rawOrders.filter((o: any) => o.subOrderStatus === "COMPLETED").length;

      setDbData({
        receipts: { pending: pendingReceipts, completed: completedReceipts },
        exports: { pending: pendingExports, completed: completedExports },
        transfers: { pending: pendingTransfers, shipping: shippingTransfers, completed: completedTransfers, cancelled: cancelledTransfers },
        orders: { pending: pendingOrders, processing: processingOrders, shipping: shippingOrders, completed: completedOrders },
      });

      // Lấy giờ hiện tại cập nhật
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));

    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Tổng số lượng "cần xử lý" (Pending của tất cả các phiếu)
  const totalTasks = dbData.receipts.pending + dbData.exports.pending + dbData.transfers.pending + dbData.orders.pending;

  // Tổng số cho từng card để tính % thanh màu
  const totalReceipts = dbData.receipts.pending + dbData.receipts.completed;
  const totalExports = dbData.exports.pending + dbData.exports.completed;
  const totalTransfers = dbData.transfers.pending + dbData.transfers.shipping + dbData.transfers.completed + dbData.transfers.cancelled;
  const totalOrders = dbData.orders.pending + dbData.orders.processing + dbData.orders.shipping + dbData.orders.completed;

  // Cấu hình mảng hiển thị (4 thẻ API động)
  const businessWorkflows = [
    {
      title: "Lệnh nhập kho",
      totalAction: `${dbData.receipts.pending} Cần làm`,
      href: "/admin/receipts",
      icon: ArrowDownToLine,
      iconColor: "bg-emerald-50 text-emerald-600",
      time: currentTime || "Đang tải",
      stats: [
        {
          val: dbData.receipts.pending,
          label: "Chờ xử lý (PO)",
          colorClass: "text-amber-500",
          bgClass: "bg-amber-500",
          width: getWidth(dbData.receipts.pending, totalReceipts),
        },
        {
          val: dbData.receipts.completed,
          label: "Đã Nhập Xong",
          colorClass: "text-emerald-600",
          bgClass: "bg-emerald-500",
          width: getWidth(dbData.receipts.completed, totalReceipts),
        }
      ],
    },
    {
      title: "Lệnh xuất kho",
      totalAction: `${dbData.exports.pending} Cần làm`,
      href: "/admin/exports",
      icon: ArrowUpFromLine,
      iconColor: "bg-blue-50 text-blue-600",
      time: currentTime || "Đang tải",
      stats: [
        {
          val: dbData.exports.pending,
          label: "Đã duyệt",
          colorClass: "text-amber-600",
          bgClass: "bg-amber-500",
          width: getWidth(dbData.exports.pending, totalExports),
        },
        {
          val: dbData.exports.completed,
          label: "Đã xuất kho",
          colorClass: "text-blue-600",
          bgClass: "bg-blue-500",
          width: getWidth(dbData.exports.completed, totalExports),
        }
      ],
    },
    {
      title: "Điều chuyển kho",
      totalAction: `${dbData.transfers.pending} Cần làm`,
      href: "/admin/transfers",
      icon: Truck,
      iconColor: "bg-cyan-50 text-cyan-600",
      time: currentTime || "Đang tải",
      stats: [
        {
          val: dbData.transfers.pending,
          label: "Đã duyệt",
          colorClass: "text-amber-500",
          bgClass: "bg-amber-500",
          width: getWidth(dbData.transfers.pending, totalTransfers),
        },
        {
          val: dbData.transfers.shipping,
          label: "Đang đi",
          colorClass: "text-cyan-600",
          bgClass: "bg-cyan-500",
          width: getWidth(dbData.transfers.shipping, totalTransfers),
        },
        {
          val: dbData.transfers.completed,
          label: "Đã đến",
          colorClass: "text-emerald-600",
          bgClass: "bg-emerald-500",
          width: getWidth(dbData.transfers.completed, totalTransfers),
        },
      ],
    },
    {
      title: "Đơn đặt hàng",
      totalAction: `${dbData.orders.pending} Cần duyệt`,
      href: getOrderListPath(user),
      icon: ShoppingCart,
      iconColor: "bg-indigo-50 text-indigo-600",
      time: currentTime || "Đang tải",
      stats: [
        {
          val: dbData.orders.pending,
          label: "Chờ xác nhận",
          colorClass: "text-rose-500",
          bgClass: "bg-rose-500",
          width: getWidth(dbData.orders.pending, totalOrders),
        },
        {
          val: dbData.orders.processing,
          label: "Đang xử lý",
          colorClass: "text-amber-500",
          bgClass: "bg-amber-500",
          width: getWidth(dbData.orders.processing, totalOrders),
        },
        {
          val: dbData.orders.shipping,
          label: "Đang giao",
          colorClass: "text-indigo-600",
          bgClass: "bg-indigo-500",
          width: getWidth(dbData.orders.shipping, totalOrders),
        },
      ],
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight uppercase">
            Bàn làm việc kho
          </h1>
          <p className="text-slate-500 text-[12px] mt-1 flex items-center gap-2 font-medium">
            <span className={cn("flex h-2 w-2 rounded-full", isLoading ? "bg-amber-500" : "bg-emerald-500 animate-pulse")}></span>
            Hệ thống vận hành {isLoading ? "đang tải dữ liệu..." : "ổn định"}. Bạn có{" "}
            <b className="text-slate-800">{totalTasks} nhiệm vụ</b> cần xử lý.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {businessWorkflows.map((card, index) => (
          <BusinessCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}
