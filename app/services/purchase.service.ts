import { apiJava } from "@/lib/axios";
import { repairVietnameseData } from "@/lib/utils";
import type { PurchaseRequestForm, PurchaseRequestResponse, PurchaseRequestItemResponse } from "@/app/types/purchase.schema";

const BASE = "/purchase-requests";

export const PurchaseRequestApiService = {

  // ── ĐỌC ──────────────────────────────────────────────────────────────────

  getAll: async (): Promise<PurchaseRequestResponse[]> => {
    const res = await apiJava.get(BASE);
    return repairVietnameseData(res.data);
  },

  getById: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.get(`${BASE}/${id}`);
    return repairVietnameseData(res.data);
  },

  /** Lấy danh sách items còn thiếu (remainingQty > 0) để tạo phiếu nhập mới */
  getRemainingItems: async (id: number | string): Promise<PurchaseRequestItemResponse[]> => {
    const res = await apiJava.get(`${BASE}/${id}/remaining-items`);
    return repairVietnameseData(res.data);
  },

  // ── GHI ──────────────────────────────────────────────────────────────────

  create: async (payload: PurchaseRequestForm): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(BASE, payload);
    return repairVietnameseData(res.data);
  },

  update: async (id: number | string, payload: PurchaseRequestForm): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.put(`${BASE}/${id}`, payload);
    return repairVietnameseData(res.data);
  },

  // ── CHUYỂN TRẠNG THÁI ─────────────────────────────────────────────────────

  /** DRAFT → PENDING_APPROVAL */
  submit: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/submit`);
    return repairVietnameseData(res.data);
  },

  /** PENDING_APPROVAL → APPROVED */
  approve: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/approve`);
    return repairVietnameseData(res.data);
  },

  /** PENDING_APPROVAL → DRAFT */
  reject: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/reject`);
    return repairVietnameseData(res.data);
  },

  /** APPROVED → SENT_TO_SUPPLIER */
  sendToSupplier: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/send-to-supplier`);
    return repairVietnameseData(res.data);
  },

  /** SENT_TO_SUPPLIER -> SENT_TO_SUPPLIER */
  resendToSupplier: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/resend-to-supplier`);
    return repairVietnameseData(res.data);
  },

  /** SENT_TO_SUPPLIER -> SUPPLIER_CONFIRMED */
  confirmSupplier: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/confirm-supplier`);
    return repairVietnameseData(res.data);
  },

  /** SUPPLIER_CONFIRMED -> DELIVERING */
  markDelivering: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/mark-delivering`);
    return repairVietnameseData(res.data);
  },

  /** → CANCELLED */
  cancel: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/cancel`);
    return repairVietnameseData(res.data);
  },

  /** Force close → CLOSED */
  close: async (id: number | string): Promise<PurchaseRequestResponse> => {
    const res = await apiJava.post(`${BASE}/${id}/close`);
    return repairVietnameseData(res.data);
  },
};
