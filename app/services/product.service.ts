import { apiJava } from "@/lib/axios";
import { 
  ProductListItem, 
  ProductDetail, 
  UpdateProductRequest,
  ApiResponse // Sử dụng Type từ schema đã import
} from "@/app/types/product.schema";

export const ProductService = {
  PREFIX: "/products",

  // 1. Lấy danh sách sản phẩm
  getAll: async (): Promise<ProductListItem[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}`);
    // Lưu ý: Nếu backend trả về bọc trong .data.data thì dùng response.data.data
    return response.data;
  },

  // 2. Xem chi tiết sản phẩm (Bao gồm SKUs)
  getById: async (id: string | number): Promise<ProductDetail> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // 3. Tạo sản phẩm mới
  create: async (formData: FormData): Promise<ApiResponse> => {
    const response = await apiJava.post(`${ProductService.PREFIX}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 4. Cập nhật sản phẩm & Biến thể
  update: async (id: string | number, data: UpdateProductRequest): Promise<ApiResponse> => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}`, data);
    return response.data;
  },

  // 5. Xóa sản phẩm
  delete: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.delete(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // 6. Ngừng kinh doanh (Mới từ main)
  disable: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}/disable`);
    return response.data;
  },

  // 7. API Hỗ trợ (Metadata cho Dropdowns)
  getCategories: async (): Promise<any[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/categories`);
    return response.data;
  },

  getBrands: async (): Promise<any[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/brands`);
    return response.data;
  },

  getAttributes: async (): Promise<any[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/attributes`);
    return response.data;
  },
};