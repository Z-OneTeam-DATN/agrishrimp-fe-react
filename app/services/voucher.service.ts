import { apiJava } from "@/lib/axios";

export interface Voucher {
  id?: number;
  code: string;
  title: string;
  description: string;
  discountType: "FIXED" | "PERCENT";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  quantity: number;     // Tổng số lượng phát hành
  usageLimit: number;   // Số lần dùng tối đa mỗi người
  usedCount?: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
}

export const voucherService = {
  // --- ADMIN API ---
  getAllAdmin: async (params?: any) => {
    const response = await apiJava.get("/vouchers", { params });
    return response.data;
  },

  create: async (data: Voucher) => {
    const payload = {
      code: data.code,
      discountType: data.discountType,
      value: data.discountValue,
      maxUsagePerUser: data.usageLimit,
      minOrderValue: data.minOrderValue,
      startDate: data.startDate,
      endDate: data.endDate,
      quantity: data.quantity, // Đã lấy từ form, không còn hardcode 100
      status: data.status,
    };
    // Sửa đúng đường dẫn /vouchers để không bị lỗi 500
    const response = await apiJava.post("/vouchers", payload);
    return response.data;
  },

  update: async (id: number, data: Voucher) => {
    const payload = {
      code: data.code,
      discountType: data.discountType,
      value: data.discountValue,
      maxUsagePerUser: data.usageLimit,
      minOrderValue: data.minOrderValue,
      startDate: data.startDate,
      endDate: data.endDate,
      quantity: data.quantity,
      status: data.status,
    };
    const response = await apiJava.put(`/vouchers/${id}`, payload);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiJava.delete(`/vouchers/${id}`);
    return response.data;
  },

  // --- USER API ---
  getPublicVouchers: async () => {
    const response = await apiJava.get("/vouchers/public");
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await apiJava.get(`/vouchers/${code}`);
    return response.data;
  }
};