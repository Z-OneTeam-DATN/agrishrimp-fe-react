import { apiJava } from "@/lib/axios";
import {
  Order,
  OrderStatus,
  CancelReasonFormValues,
} from "@/app/types/order.schema";

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

export interface ReturnRequestData {
  orderId: string;
  productId: string;
  reason: string;
  description: string;
  images: File[];
}

export interface CheckoutPayload {
  shippingAddress: string;
  phone: string;
  fullName: string;
  note: string;
  voucherCode?: string | null;
  branchId: number | null;
  items: { variantId: number; quantity: number }[];
  paymentMethod: string; // ✅ THÊM DÒNG NÀY ĐỂ CHỌN PT THANH TOÁN
}

export const orderService = {
  PREFIX: "/orders",

  // 1. LẤY DANH SÁCH ĐƠN HÀNG (CỦA USER)
  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    const params = status && status !== "ALL" ? { status } : {};
    const response = await apiJava.get<Order[]>(orderService.PREFIX, {
      params,
    });
    return response.data;
  },

  // 2. LẤY DANH SÁCH YÊU CẦU TRẢ HÀNG (CỦA USER)
  getReturnOrders: async (): Promise<ReturnOrder[]> => {
    const response = await apiJava.get<ReturnOrder[]>(`${orderService.PREFIX}/returns`);
    return response.data;
  },

  // 3. GỬI YÊU CẦU TRẢ HÀNG
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

  // 4. HỦY ĐƠN HÀNG
  cancelOrder: async (orderId: string, data: CancelReasonFormValues): Promise<void> => {
    await apiJava.post(`${orderService.PREFIX}/${orderId}/cancel`, data);
  },

  // 5. ĐẶT HÀNG (CHECKOUT)
  checkout: async (payload: CheckoutPayload): Promise<any> => {
    const response = await apiJava.post(`${orderService.PREFIX}/checkout`, payload);
    return response.data;
  },

  // ==========================================
  // MODULE 2: CÁC API DÀNH CHO ADMIN BÊN DƯỚI
  // ==========================================

  // 6. LẤY TOÀN BỘ ĐƠN HÀNG (ADMIN)
  getAdminOrders: async (): Promise<any[]> => {
    const response = await apiJava.get(`${orderService.PREFIX}/admin/all`);
    return response.data;
  },

 // 7. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ADMIN)
   updateOrderStatus: async (orderId: string | number, status: string): Promise<void> => {
     // Sửa chữ null thành {} ở dòng bên dưới:
     await apiJava.put(`${orderService.PREFIX}/admin/${orderId}/status`, {}, {
       params: { status }
     });

  }
};