"use client";

import { OrderTabs } from "@/components/orders/OrderTabs";
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function ReturnListPage() {
  // Mock Data (Data tĩnh để test giao diện)
  const returnOrders = [
    {
      id: "RE-99231",
      orderCode: "ORD-123456",
      status: "PROCESSING",
      productName: "Florfenicol kết hợp Oxytetracycline",
      productImg:
        "https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png",
      variant: "500g/túi",
      quantity: 1,
      reason: "Sản phẩm bị lỗi/hư hỏng",
      refundAmount: "250.000₫",
    },
    {
      id: "RE-88120",
      orderCode: "ORD-99812",
      status: "COMPLETED",
      productName: "Khoáng tạt APA Miner Pox giúp cứng vỏ",
      productImg:
        "https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg",
      variant: "Chai 1 lít",
      quantity: 2,
      reason: "Giao sai hàng",
      refundAmount: "240.000₫",
    },
    {
      id: "RE-77102",
      orderCode: "ORD-77615",
      status: "REJECTED",
      productName: "Men vi sinh xử lý đáy Super Clean",
      productImg:
        "https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png",
      variant: "1kg/gói",
      quantity: 1,
      reason: "Sản phẩm khác với mô tả",
      refundAmount: "320.000₫",
      shopResponse:
        "Hình ảnh bằng chứng không rõ ràng, bao bì sản phẩm đã bị xé rách không còn nguyên vẹn.",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PROCESSING":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#fff8e1] text-[#f5a623] border border-[#ffe082] text-[10px] font-bold uppercase">
            <Clock size={12} /> Đang xử lý
          </span>
        );
      case "COMPLETED":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] text-[10px] font-bold uppercase">
            <CheckCircle2 size={12} /> Đã hoàn tiền
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#ffebee] text-[#c62828] border border-[#ffcdd2] text-[10px] font-bold uppercase">
            <XCircle size={12} /> Bị từ chối
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <OrderTabs />
      <div className="mt-4 space-y-4">
        {returnOrders.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 bg-gray-50/30">
              <div className="font-bold text-gray-800 flex items-center text-sm">
                <ArrowLeftRight size={16} className="mr-2 text-gray-500" /> Mã
                yêu cầu: #{item.id}
              </div>
              {getStatusBadge(item.status)}
            </div>
            <div className="p-4 cursor-pointer">
              <div className="flex gap-4">
                <img
                  src={item.productImg}
                  alt={item.productName}
                  className="w-14 h-14 rounded border border-gray-100 object-cover bg-white"
                />
                <div className="flex-1">
                  <div className="font-bold text-sm text-gray-900 line-clamp-1">
                    {item.productName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Số lượng: {item.quantity} | Đơn hàng: #{item.orderCode}
                  </div>
                  <div className="mt-2 inline-flex items-center bg-red-50 text-red-600 text-[11px] px-2 py-0.5 rounded border border-red-100 font-medium">
                    Lý do: {item.reason}
                  </div>
                </div>
              </div>
              {item.status === "REJECTED" && (
                <div className="mt-3 p-3 bg-red-50 rounded-md text-xs text-red-700 border border-red-100 flex gap-2 items-start">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <strong>Phản hồi từ shop:</strong> {item.shopResponse}
                  </div>
                </div>
              )}
              {item.status === "COMPLETED" && (
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Tiền đã được hoàn vào ví AgriShrimp
                  của bạn.
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
              <div className="text-sm text-gray-600">
                Hoàn lại dự kiến:{" "}
                <span className="text-red-600 font-bold text-base ml-1">
                  {item.refundAmount}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-[#1965a2] text-[#1965a2] rounded text-xs font-bold hover:bg-[#eafef9] transition-colors">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

