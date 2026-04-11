import { apiJava } from "@/lib/axios";
import { CustomerFormValues } from "@/app/types/admin.schema";

interface CustomerInternalNoteRequest {
  content: string;
}

export const customerService = {
  PREFIX: "/customers",

  getAll: async (
    keyword: string = "",
    status: string = "all",
    page: number = 0,
    size: number = 10,
  ) => {
    const response = await apiJava.get(`${customerService.PREFIX}`, {
      params: {
        keyword,
        status: status === "all" ? null : status,
        page,
        size,
      },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiJava.get(`${customerService.PREFIX}/${id}`);
    return response.data;
  },

  getDetailById: async (id: number) => {
    const response = await apiJava.get(`${customerService.PREFIX}/${id}/detail`);
    return response.data;
  },

  create: async (data: CustomerFormValues) => {
    const response = await apiJava.post(`${customerService.PREFIX}`, data);
    return response.data;
  },

  update: async (id: number, data: CustomerFormValues) => {
    const response = await apiJava.put(`${customerService.PREFIX}/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiJava.delete(`${customerService.PREFIX}/${id}`);
    return response.data;
  },

  toggleStatus: async (userId: number) => {
    const response = await apiJava.patch(`${customerService.PREFIX}/${userId}/toggle-status`);
    return response.data;
  },

  getCustomerOrders: async (userId: number) => {
    const response = await apiJava.get(`/admin/orders/user/${userId}`);
    return response.data; 
  },

  getInternalNotes: async (userId: number) => {
    const response = await apiJava.get(`${customerService.PREFIX}/${userId}/internal-notes`);
    return response.data;
  },

  addInternalNote: async (userId: number, payload: CustomerInternalNoteRequest) => {
    const response = await apiJava.post(`${customerService.PREFIX}/${userId}/internal-notes`, payload);
    return response.data;
  },

  deleteInternalNote: async (noteId: number) => {
    const response = await apiJava.delete(`${customerService.PREFIX}/internal-notes/${noteId}`);
    return response.data;
  },

  getStatusLogs: async (userId: number) => {
    const response = await apiJava.get(`${customerService.PREFIX}/${userId}/status-logs`);
    return response.data;
  },
};
