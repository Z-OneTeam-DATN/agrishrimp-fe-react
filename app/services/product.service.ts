import { apiJava } from "@/lib/axios";
import {
  Attribute,
  ProductListItem,
  ProductDetail,
  UpdateProductRequest,
  ApiResponse,
} from "@/app/types/product.schema";

export const ProductService = {
  PREFIX: "/products",

  // 2.1 Lấy danh sách sản phẩm
  getAll: async (params?: {
    keyword?: string;
    categoryId?: number | string | null;
    status?: string;
  }): Promise<ProductListItem[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}`, { params });
    return response.data;
  },

  // 2.2 Xem chi tiết sản phẩm (Bao gồm SKUs)
  getById: async (id: string | number): Promise<ProductDetail> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // 2.3 Cập nhật sản phẩm & Biến thể
  update: async (id: string | number, data: UpdateProductRequest): Promise<ApiResponse> => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}`, data);
    return response.data;
  },

  // 2.4 Xóa sản phẩm
  delete: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.delete(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // 2.5 Ngừng kinh doanh
  disable: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}/disable`);
    return response.data;
  },

  // 3. API Hỗ trợ (Metadata cho Dropdowns)
  getCategories: async () => {
    const response = await apiJava.get(`${ProductService.PREFIX}/categories`);
    return response.data;
  },

  getBrands: async () => {
    const response = await apiJava.get(`${ProductService.PREFIX}/brands`);
    return response.data;
  },

  getAttributes: async (): Promise<Attribute[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/attributes`);
    return response.data;
  },

  // 2. Chi tiết API Tạo sản phẩm — POST /products, Content-Type: application/json
  create: async (payload: Record<string, any>): Promise<ProductDetail> => {
    const response = await apiJava.post(`${ProductService.PREFIX}`, { data: payload });
    return response.data;
  },
};
