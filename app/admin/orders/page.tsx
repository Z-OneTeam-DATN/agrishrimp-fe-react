"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminOrderTable } from "@/components/admin/AdminOrderTable";
import { toast } from "sonner";

// Hàm dịch ENUM Trạng thái đơn
const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    SHIPPING: "Đang giao",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    RETURNED: "Trả hàng",
  };
  return map[status] || status;
};

// Hàm dịch ENUM Thanh toán
const translatePaymentStatus = (status: string) => {
  return status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán";
};

// Hàm format tiền tệ
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm gọi API lấy dữ liệu
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

      if (!token) {
        toast.error("Không tìm thấy Token! Vui lòng đăng nhập lại.");
        setIsLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:8080/api/orders/admin/all", {
        headers: {
            Authorization: `Bearer ${token}`
        }
      });

      // Format lại dữ liệu từ Backend
      const formattedData = response.data.map((item: any) => ({
        id: item.code,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        totalAmount: formatCurrency(item.finalAmount),
        status: translateStatus(item.status),
        paymentStatus: translatePaymentStatus(item.paymentStatus),
        branch: item.branchName,
        createdAt: new Date(item.createdAt).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }),
      }));

      setOrders(formattedData);
    } catch (error: any) {
      console.error("Lỗi khi tải đơn hàng:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn hoặc không có quyền (401). Vui lòng đăng nhập lại hệ thống!");
      } else {
        toast.error("Không thể tải danh sách đơn hàng.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        title="Quản lý đơn hàng bán"
        addBtnLabel="Tạo đơn hàng mới"
        addBtnHref="/admin/orders/add"
      />

      <div className="bg-white border border-[#dcdcdc] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden mb-8">
        {isLoading ? (
          <div className="p-20 text-center text-[12px] font-bold text-slate-400 uppercase animate-pulse flex justify-center items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tải dữ liệu đơn hàng...
          </div>
        ) : (
          <AdminOrderTable orders={orders} onRefresh={fetchOrders} />
        )}
      </div>
    </div>
  );
}