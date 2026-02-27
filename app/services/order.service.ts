import { apiJava } from "@/lib/axios";
import {
  Order,
  OrderStatus,
  CancelReasonFormValues,
} from "@/app/types/order.schema";
import { MyOrder, OrderStatus as MyOrderStatus, BranchOrder } from "@/app/types/order.types";

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
  V1_PREFIX: "/v1/orders",

  // 1. LẤY DANH SÁCH ĐƠN HÀNG (CỦA USER) - CŨ
  getOrders: async (status?: OrderStatus): Promise<Order[]> => {
    const params = status && status !== "ALL" ? { status } : {};
    const response = await apiJava.get<Order[]>(orderService.PREFIX, {
      params,
    });
    return response.data;
  },

  // 1b. LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI (API V1 MỚI)
  getMyOrders: async (status?: MyOrderStatus | "ALL"): Promise<MyOrder[]> => {
    const params = status && status !== "ALL" ? { status } : {};
    const response = await apiJava.get<MyOrder[]>(`${orderService.V1_PREFIX}/my-orders`, {
      params,
    });
    return response.data;
  },

  // 1c. LẤY CHI TIẾT ĐƠN HÀNG (API V1 MỚI)
  getOrderById: async (id: number | string): Promise<MyOrder> => {
    const response = await apiJava.get<MyOrder>(`${orderService.V1_PREFIX}/${id}`);
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
  // Theo đặc tả: PENDING → CONFIRMED → PROCESSING → SHIPPING → COMPLETED
  // ==========================================

  // 6. LẤY TOÀN BỘ ĐƠN HÀNG (ADMIN)
  // Endpoint: GET /api/admin/all?status=...&search=...
  getAdminOrders: async (status?: string, search?: string): Promise<MyOrder[]> => {
    const params: any = {};
    if (status && status !== "ALL") params.status = status;
    if (search) params.search = search;
    
    const response = await apiJava.get("/admin/all", { params });
    return response.data;
  },

  // 7. LẤY CHI TIẾT ĐƠN HÀNG (ADMIN VIEW)
  // Endpoint: GET /api/admin/{id}
  getAdminOrderById: async (id: number | string): Promise<MyOrder> => {
    const response = await apiJava.get(`/admin/${id}`);
    return response.data;
  },

  // 8. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (DUYỆT ĐƠN)
  // Endpoint: PUT /api/admin/{id}/status?status=NEW_STATUS
  updateOrderStatus: async (orderId: string | number, status: string): Promise<void> => {
    await apiJava.put(`/admin/${orderId}/status`, {}, {
      params: { status }
    });
  },

  // ==========================================
  // MODULE 3: CÁC API DÀNH CHO CHI NHÁNH
  // Endpoint: /api/branch/orders
  // ==========================================

  // 9. LẤY DANH SÁCH ĐƠN HÀNG CỦA CHI NHÁNH
  getBranchOrders: async (status?: string, search?: string): Promise<BranchOrder[]> => {
    const params: any = {};
    if (status && status !== "ALL") params.status = status;
    if (search) params.search = search;
    const response = await apiJava.get<BranchOrder[]>("/branch/orders", { params });
    return response.data;
  },

  // 10. LẤY CHI TIẾT ĐƠN HÀNG CỦA CHI NHÁNH (có items)
  getBranchOrderById: async (orderId: number | string): Promise<BranchOrder> => {
    const response = await apiJava.get<BranchOrder>(`/branch/orders/${orderId}`);
    return response.data;
  },

  // 11. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG CHI NHÁNH
  // Endpoint: PUT /api/branch/orders/{orderId}/status?status=NEW_STATUS
  updateBranchOrderStatus: async (orderId: number | string, status: string): Promise<{ message: string }> => {
    const response = await apiJava.put(`/branch/orders/${orderId}/status`, {}, {
      params: { status }
    });
    return response.data;
  },
};