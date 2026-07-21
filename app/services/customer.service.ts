import { apiJava } from "@/lib/axios";
import { CustomerFormValues } from "@/app/types/admin.schema";

interface CustomerDuplicateCheck {
  emailExists: boolean;
  phoneExists: boolean;
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

  resendCredentials: async (userId: number) => {
    const response = await apiJava.post(`${customerService.PREFIX}/${userId}/resend-credentials`);
    return response.data;
  },

  getCustomerOrders: async (userId: number) => {
    const response = await apiJava.get(`/admin/orders/user/${userId}`);
    return response.data; 
  },

  checkDuplicate: async (email?: string, phone?: string): Promise<CustomerDuplicateCheck> => {
    const response = await apiJava.get(`${customerService.PREFIX}/check-duplicate`, {
      params: { email, phone },
    });
    return response.data;
  },

  // 🟢 Get all branches for dropdown
  getAllBranches: async () => {
    const response = await apiJava.get(`${customerService.PREFIX}/lookup/branches`);
    return response.data;
  },

  // 🟢 Get staff by branch for dropdown
  getStaffByBranch: async (branchId: string | number) => {
    const response = await apiJava.get(`${customerService.PREFIX}/lookup/staff-by-branch/${branchId}`);
    return response.data;
  },
};
