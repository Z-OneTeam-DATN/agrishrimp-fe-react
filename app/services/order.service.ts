import { apiJava } from "@/lib/axios";
import {
  Order,
  OrderStatus,
  CancelReasonFormValues,
} from "@/app/types/order.schema";

// 1. Định nghĩa Interface cho Đơn đổi trả (Return Order)
export interface ReturnOrder {
  id: string;
  orderId: string;
  productName: string;
  productImg: string;
  reason: string;
  amount: string;
  status: "PROCESSING" | "COMPLETED" | "REJECTED";
  quantity: number;
  shopResponse?: string;
}

// Interface cho Form gửi yêu cầu trả hàng
export interface ReturnRequestData {
  orderId: string;
  productId: string;
  reason: string;
  description: string;
  images: File[];
}

// Interface cho payload Đặt hàng (Checkout)
export interface CheckoutPayload {
  shippingAddress: string;
  phone: string;
  fullName: string;
  note: string;
  voucherCode?: string | null;
  branchId: number | null; // ✅ THÊM DÒNG NÀY ĐỂ TRUYỀN ID KHO XUẤT HÀNG
  items: { variantId: number; quantity: number }[];
}

// ✅ SỬA LẠI THÀNH CONST OBJECT ĐỂ ĐỒNG BỘ VỚI CÁC SERVICE KHÁC
export const orderService = {
  PREFIX: "/orders", // ✅ ĐÃ XÓA CHỮ /api ĐỂ KHÔNG BỊ LẶP LẠI THÀNH /api/api/...

  // ==========================================
  // LẤY DANH SÁCH ĐƠN HÀNG (CỦA USER)
  // ==========================================
  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    const params = status && status !== "ALL" ? { status } : {};
    const response = await apiJava.get<Order[]>(orderService.PREFIX, {
      params,
    });
    return response.data;
  },

  // ==========================================
  // LẤY DANH SÁCH YÊU CẦU TRẢ HÀNG (CỦA USER)
  // ==========================================
  getReturnOrders: async (): Promise<ReturnOrder[]> => {
    const response = await apiJava.get<ReturnOrder[]>(`${orderService.PREFIX}/returns`);
    return response.data;
  },

  // ==========================================
  // GỬI YÊU CẦU TRẢ HÀNG
  // ==========================================
  submitReturnRequest: async (data: ReturnRequestData): Promise<void> => {
    const formData = new FormData();
    formData.append("orderId", data.orderId);
    formData.append("productId", data.productId);
    formData.append("reason", data.reason);
    formData.append("description", data.description);
    
    if (data.images) {
      data.images.forEach((file) => formData.append("images", file));
    }

    await apiJava.post(`${orderService.PREFIX}/return/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ==========================================
  // HỦY ĐƠN HÀNG
  // ==========================================
  cancelOrder: async (orderId: string, data: CancelReasonFormValues): Promise<void> => {
    await apiJava.post(`${orderService.PREFIX}/${orderId}/cancel`, data);
  },

  // ==========================================
  // ĐẶT HÀNG (CHECKOUT)
  // ==========================================
  checkout: async (payload: CheckoutPayload): Promise<any> => {

    const response = await apiJava.post(`${orderService.PREFIX}/checkout`, payload);
    
    return response.data;
  }
};