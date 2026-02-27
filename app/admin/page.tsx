"use client";

import React from "react";
import DailyBusinessResults from "@/components/admin/DailyBusinessResults";
import SalesPerformance from "@/components/admin/SalesPerformance";
import PendingOrders from "@/components/admin/PendingOrders";
import TopProducts from "@/components/admin/TopProducts";
import InventoryInfo from "@/components/admin/InventoryInfo";
import { 
  Bell, 
  Plus, 
  Package, 
  Users, 
  ShoppingCart, 
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const recentActivities = [
    {
      id: 1,
      type: "order",
      title: "Đơn hàng mới #DH12345",
      user: "Nguyễn Văn A",
      time: "2 phút trước",
      icon: ShoppingCart,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: 2,
      type: "inventory",
      title: "Nhập kho 500kg Thức ăn tôm",
      user: "Trần Thị B",
      time: "15 phút trước",
      icon: Package,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      id: 3,
      type: "alert",
      title: "Sản phẩm 'Máy sục khí' sắp hết hàng",
      user: "Hệ thống",
      time: "1 giờ trước",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      id: 4,
      type: "customer",
      title: "Khách hàng mới đăng ký",
      user: "Lê Văn C",
      time: "3 giờ trước",
      icon: Users,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
  ];

  const quickActions = [
    { label: "Tạo đơn hàng", icon: Plus, href: "/admin/orders/add", color: "bg-blue-600" },
    { label: "Nhập hàng", icon: Package, href: "/admin/receipts/add", color: "bg-emerald-600" },
    { label: "Điều chuyển", icon: ArrowRightLeft, href: "/admin/transfers/add", color: "bg-amber-600" },
    { label: "Kiểm kê", icon: CheckCircle2, href: "/admin/inventory-checks/add", color: "bg-indigo-600" },
  ];

  return (
    <div className="space-y-4 pb-10 bg-gray-50/50 min-h-screen p-4">
      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`${action.color} p-1.5 rounded-sm text-white group-hover:scale-110 transition-transform`}>
              <action.icon size={16} />
            </div>
            <span className="text-xs font-bold text-gray-700">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* 1. Kết quả kinh doanh trong ngày */}
          <DailyBusinessResults />

          {/* 2. Doanh thu bán hàng / Tỷ trọng bán hàng */}
          <SalesPerformance />

          {/* 3. Đơn hàng chờ xử lý */}
          <PendingOrders />

          {/* 4. Top sản phẩm & Thông tin kho */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopProducts />
            <InventoryInfo />
          </div>
        </div>

        <div className="space-y-4">
          {/* Recent Activities Panel */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700 uppercase">
                Hoạt động gần đây
              </h2>
              <Bell size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3 relative group">
                  {activity.id !== recentActivities.length && (
                    <div className="absolute left-4 top-8 bottom-[-24px] w-[1px] bg-gray-100 group-last:hidden" />
                  )}
                  <div className={`${activity.bgColor} ${activity.iconColor} p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 z-10`}>
                    <activity.icon size={14} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">
                      {activity.title}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Bởi <span className="font-medium text-gray-700">{activity.user}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                      <Clock size={10} />
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 text-center">
              <button className="text-xs text-blue-500 font-medium hover:underline">
                Xem tất cả hoạt động
              </button>
            </div>
          </div>

          {/* Announcement Card (Optional) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-sm p-4 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:scale-110 transition-transform">
              <Package size={100} />
            </div>
            <h3 className="text-sm font-bold mb-2">Thông báo hệ thống</h3>
            <p className="text-[11px] opacity-90 leading-relaxed mb-4">
              Hệ thống sẽ bảo trì định kỳ vào lúc 2:00 sáng Chủ Nhật tuần này. Vui lòng hoàn tất các giao dịch trước thời gian này.
            </p>
            <button className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-sm transition-colors backdrop-blur-sm">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
