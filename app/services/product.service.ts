import { apiJava } from "@/lib/axios";

export const ProductService = {
  PREFIX: "/products",

  // CRUD
  getAll: async () => {
    const response = await apiJava.get(`${ProductService.PREFIX}`);
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await apiJava.get(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await apiJava.post(`${ProductService.PREFIX}`, data);
    return response.data;
  },

  update: async (id: string | number, data: any) => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await apiJava.delete(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // DATA GỢI Ý (DROPDOWNS)
  getCategories: async () => {
    const response = await apiJava.get(`${ProductService.PREFIX}/categories`);
    return response.data;
  },

  getBrands: async () => {
    const response = await apiJava.get(`${ProductService.PREFIX}/brands`);
    return response.data;
  },

  getAttributes: async () => {
    const response = await apiJava.get(`${ProductService.PREFIX}/attributes`);
    return response.data;
  }
};