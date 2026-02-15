import { apiJava } from "@/lib/axios";
import { CustomerFormValues } from "@/app/types/admin.schema";

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
};
