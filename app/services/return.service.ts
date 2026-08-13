import { apiJava } from "@/lib/axios";
import {
  CreateReturnRequestPayload,
  ReturnOrderDraft,
  ReturnRequest,
  ReturnRequestApprovePayload,
  ReturnRequestReceivePayload,
  ReturnRequestRefundPayload,
  ReturnRequestRejectPayload,
  ReturnRequestStatus,
} from "@/app/types/return.types";

const RETURN_PREFIX = "/v1/returns";

const buildReturnAdminParams = (
  status?: ReturnRequestStatus | "ALL",
  search?: string,
) => {
  const params: Record<string, string> = {};

  if (status && status !== "ALL") {
    params.status = status;
  }

  if (search?.trim()) {
    params.search = search.trim();
  }

  return params;
};

export const returnService = {
  getReturnDraft: async (orderId: number | string): Promise<ReturnOrderDraft> => {
    const response = await apiJava.get<ReturnOrderDraft>(
      `${RETURN_PREFIX}/orders/${orderId}/draft`,
    );
    return response.data;
  },

  createReturnRequest: async (
    payload: CreateReturnRequestPayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.post<ReturnRequest>(RETURN_PREFIX, payload);
    return response.data;
  },

  getMyReturnRequests: async (): Promise<ReturnRequest[]> => {
    const response = await apiJava.get<ReturnRequest[]>(`${RETURN_PREFIX}/my`);
    return response.data;
  },

  getMyReturnRequestDetail: async (
    requestId: number | string,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.get<ReturnRequest>(
      `${RETURN_PREFIX}/my/${requestId}`,
    );
    return response.data;
  },

  getAdminReturnRequests: async (
    status?: ReturnRequestStatus | "ALL",
    search?: string,
  ): Promise<ReturnRequest[]> => {
    const response = await apiJava.get<ReturnRequest[]>("/admin/returns", {
      params: buildReturnAdminParams(status, search),
    });
    return response.data;
  },

  getAdminReturnRequestDetail: async (
    requestId: number | string,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.get<ReturnRequest>(
      `/admin/returns/${requestId}`,
    );
    return response.data;
  },

  approveAdminReturnRequest: async (
    requestId: number | string,
    payload?: ReturnRequestApprovePayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/admin/returns/${requestId}/approve`,
      payload ?? {},
    );
    return response.data;
  },

  rejectAdminReturnRequest: async (
    requestId: number | string,
    payload: ReturnRequestRejectPayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/admin/returns/${requestId}/reject`,
      payload,
    );
    return response.data;
  },

  receiveAdminReturnRequest: async (
    requestId: number | string,
    payload?: ReturnRequestReceivePayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/admin/returns/${requestId}/receive`,
      payload ?? {},
    );
    return response.data;
  },

  refundAdminReturnRequest: async (
    requestId: number | string,
    payload: ReturnRequestRefundPayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/admin/returns/${requestId}/refund`,
      payload,
    );
    return response.data;
  },

  getBranchReturnRequests: async (
    status?: ReturnRequestStatus | "ALL",
    search?: string,
  ): Promise<ReturnRequest[]> => {
    const response = await apiJava.get<ReturnRequest[]>("/branch/returns", {
      params: buildReturnAdminParams(status, search),
    });
    return response.data;
  },

  getBranchReturnRequestDetail: async (
    requestId: number | string,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.get<ReturnRequest>(
      `/branch/returns/${requestId}`,
    );
    return response.data;
  },

  approveBranchReturnRequest: async (
    requestId: number | string,
    payload?: ReturnRequestApprovePayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/branch/returns/${requestId}/approve`,
      payload ?? {},
    );
    return response.data;
  },

  rejectBranchReturnRequest: async (
    requestId: number | string,
    payload: ReturnRequestRejectPayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/branch/returns/${requestId}/reject`,
      payload,
    );
    return response.data;
  },

  receiveBranchReturnRequest: async (
    requestId: number | string,
    payload?: ReturnRequestReceivePayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/branch/returns/${requestId}/receive`,
      payload ?? {},
    );
    return response.data;
  },

  refundBranchReturnRequest: async (
    requestId: number | string,
    payload: ReturnRequestRefundPayload,
  ): Promise<ReturnRequest> => {
    const response = await apiJava.put<ReturnRequest>(
      `/branch/returns/${requestId}/refund`,
      payload,
    );
    return response.data;
  },
};
