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

export interface UserVoucher extends Voucher {
  saved?: boolean;
  usageCount?: number;
  remainingUsageCount?: number;
  canApply?: boolean;
  availabilityReason?: string | null;
  previewDiscountAmount?: number | string | null;
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

const unwrapApiData = <T>(responseData: unknown): T | null => {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData
  ) {
    return ((responseData as { data?: unknown }).data as T | undefined) ?? null;
  }

  return (responseData as T | undefined) ?? null;
};

const normalizeVoucherList = <T extends Voucher>(responseData: unknown): T[] => {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  const data = unwrapApiData<unknown>(responseData);
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object" && "content" in data) {
    const content = (data as { content?: unknown }).content;
    if (Array.isArray(content)) return content as T[];
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "content" in responseData
  ) {
    const content = (responseData as { content?: unknown }).content;
    if (Array.isArray(content)) return content as T[];
  }

  return [];
};

const normalizeVoucherItem = <T>(responseData: unknown): T | null =>
  unwrapApiData<T>(responseData);

type VoucherListParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export const voucherService = {
  getAllAdmin: async (params?: VoucherListParams) => {
    const response = await apiJava.get("/vouchers", { params });
    return normalizeVoucherList(response.data);
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
    return normalizeVoucherList(response.data);
  },

  getAvailableForMe: async (orderSubtotal?: number) => {
    const response = await apiJava.get("/vouchers/me/available", {
      params:
        typeof orderSubtotal === "number"
          ? { orderSubtotal }
          : undefined,
    });
    return normalizeVoucherList<UserVoucher>(response.data);
  },

  getSavedForMe: async (orderSubtotal?: number) => {
    const response = await apiJava.get("/vouchers/me/saved", {
      params:
        typeof orderSubtotal === "number"
          ? { orderSubtotal }
          : undefined,
    });
    return normalizeVoucherList<UserVoucher>(response.data);
  },

  saveToWallet: async (code: string) => {
    const response = await apiJava.post(
      `/vouchers/me/saved/${encodeURIComponent(code)}`,
    );
    return normalizeVoucherItem<UserVoucher>(response.data);
  },

  removeFromWallet: async (code: string) => {
    const response = await apiJava.delete(
      `/vouchers/me/saved/${encodeURIComponent(code)}`,
    );
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await apiJava.get(
      `/vouchers/public/code/${encodeURIComponent(code)}`,
    );
    return normalizeVoucherItem<Voucher>(response.data);
  },
};
