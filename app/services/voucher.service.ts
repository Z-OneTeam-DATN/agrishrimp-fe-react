import { apiJava } from "@/lib/axios";

export interface Voucher {
  id?: number;
  code: string;
  title: string;
  description?: string;
  discountType: "FIXED" | "PERCENT";
  value?: number | string | null;
  discountValue?: number | string | null;
  minOrderValue: number | string;
  maxDiscount?: number | string | null;
  startDate: string;
  endDate: string;
  quantity: number | string;
  maxUsagePerUser?: number | string | null;
  usageLimit?: number | string | null;
  usedCount?: number;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
}

export type VoucherUpsertPayload = {
  code: string;
  title: string;
  discountType: Voucher["discountType"];
  value?: number | string | null;
  discountValue?: number | string | null;
  minOrderValue: number | string;
  maxDiscount?: number | string | null;
  startDate: string;
  endDate: string;
  quantity: number | string;
  maxUsagePerUser?: number | string | null;
  usageLimit?: number | string | null;
  status: Voucher["status"];
};

const buildVoucherPayload = (data: VoucherUpsertPayload) => ({
  code: data.code,
  title: data.title,
  discountType: data.discountType,
  value: data.value ?? data.discountValue ?? null,
  maxUsagePerUser: data.maxUsagePerUser ?? data.usageLimit ?? null,
  minOrderValue: data.minOrderValue,
  maxDiscount: data.maxDiscount ?? null,
  startDate: data.startDate,
  endDate: data.endDate,
  quantity: data.quantity,
  status: data.status,
});

type VoucherListParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export const voucherService = {
  getAllAdmin: async (params?: VoucherListParams) => {
    const response = await apiJava.get("/vouchers", { params });
    return response.data;
  },

  create: async (data: VoucherUpsertPayload) => {
    const response = await apiJava.post("/vouchers", buildVoucherPayload(data));
    return response.data;
  },

  update: async (id: number, data: VoucherUpsertPayload) => {
    const response = await apiJava.put(
      `/vouchers/${id}`,
      buildVoucherPayload(data),
    );
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiJava.delete(`/vouchers/${id}`);
    return response.data;
  },

  getPublicVouchers: async () => {
    const response = await apiJava.get("/vouchers/public");
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await apiJava.get(`/vouchers/${code}`);
    return response.data;
  },
};
