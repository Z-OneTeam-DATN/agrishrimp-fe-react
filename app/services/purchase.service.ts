import { apiJava } from "@/lib/axios";
import type { PurchaseRequestForm, PurchaseRequestResponse, PurchaseRequestItemResponse } from "@/app/types/purchase.schema";

const BASE = "/purchase-requests";

export const PurchaseRequestApiService = {

  // ── ĐỌC ──────────────────────────────────────────────────────────────────

  getAll: async (): Promise<PurchaseRequestResponse[]> => {
    const res = await apiJava.get(BASE);
    return res.data;
  },

  getById: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.get(`${BASE}/${id}`);
    return res.data;
  },

  /** Lấy danh sách items còn thiếu (remainingQty > 0) để tạo phiếu nhập mới */
  getRemainingItems: async (id: number | string): Promise<PurchaseRequestItemResponse[]> => {
    const res = await apiJava.get(`${BASE}/${id}/remaining-items`);
    return res.data;
  },

  // ── GHI ──────────────────────────────────────────────────────────────────

  create: async (payload: PurchaseRequestForm): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(BASE, payload);
    return res.data;
  },

  update: async (id: number | string, payload: PurchaseRequestForm): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.put(`${BASE}/${id}`, payload);
    return res.data;
  },

  // ── CHUYỂN TRẠNG THÁI ─────────────────────────────────────────────────────

  /** DRAFT → PENDING_APPROVAL */
  submit: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/submit`);
    return res.data;
  },

  /** PENDING_APPROVAL → APPROVED */
  approve: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/approve`);
    return res.data;
  },

  /** PENDING_APPROVAL → DRAFT */
  reject: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/reject`);
    return res.data;
  },

  /** APPROVED → SENT_TO_SUPPLIER */
  sendToSupplier: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/send-to-supplier`);
    return res.data;
  },

  /** → CANCELLED */
  cancel: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/cancel`);
    return res.data;
  },

  /** Force close → CLOSED */
  close: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/close`);
    return res.data;
  },
};
