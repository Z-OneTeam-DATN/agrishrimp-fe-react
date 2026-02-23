
import { apiJava } from "@/lib/axios";

export const branchService = {
  PREFIX: "/branches",

  getAll: async () => {
    const response = await apiJava.get(`${branchService.PREFIX}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await apiJava.get(`${branchService.PREFIX}/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiJava.post(`${branchService.PREFIX}`, data);
    return response.data;
  },

  update: async (id: string | number, data: any) => {
    const response = await apiJava.put(`${branchService.PREFIX}/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await apiJava.delete(`${branchService.PREFIX}/${id}`);
    return response.data;
  },

  getAllStaff: async () => {
    const response = await apiJava.get(`/users`);
    return response.data;
  }
};