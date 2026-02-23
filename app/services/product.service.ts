import { apiJava } from "@/lib/axios";

// Interface mẫu để bạn quản lý kiểu dữ liệu (tùy chỉnh theo ApiResponse của bạn)
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const ProductService = {
  PREFIX: "/products",

  getAll: async () => {
    const response = await apiJava.get<ApiResponse<any[]>>(`${ProductService.PREFIX}`);
    return response.data.data;
  },

  getById: async (id: string | number) => {
    const response = await apiJava.get<ApiResponse<any>>(`${ProductService.PREFIX}/${id}`);
    return response.data.data;
  },

  create: async (formData: FormData) => {
    const response = await apiJava.post<ApiResponse<any>>(`${ProductService.PREFIX}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // Thường create trả về cả ApiResponse để hiển thị Toast message
  },

  update: async (id: string | number, data: any) => {
    const response = await apiJava.put<ApiResponse<any>>(`${ProductService.PREFIX}/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await apiJava.delete<ApiResponse<void>>(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // DATA GỢI Ý
  getCategories: async () => {
    const response = await apiJava.get<ApiResponse<any[]>>(`${ProductService.PREFIX}/categories`);
    return response.data.data;
  },

  getBrands: async () => {
    const response = await apiJava.get<ApiResponse<any[]>>(`${ProductService.PREFIX}/brands`);
    return response.data.data;
  },

  getAttributes: async () => {
    const response = await apiJava.get<ApiResponse<any[]>>(`${ProductService.PREFIX}/attributes`);
    return response.data.data;
  }
};