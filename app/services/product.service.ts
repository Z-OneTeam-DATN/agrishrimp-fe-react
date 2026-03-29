import { apiJava } from "@/lib/axios";
import {
  Attribute,
  ProductListItem,
  ProductDetail,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse,
} from "@/app/types/product.schema";

export const ProductService = {
  PREFIX: "/products",

  // 1. Lấy danh sách sản phẩm (Giữ lại params lọc từ branch local)
  getAll: async (params?: {
    keyword?: string;
    categoryId?: number | string | null;
    status?: string;
  }): Promise<ProductListItem[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}`, { 
      params,
    } as any);
    return response.data;
  },

  // 2. Xem chi tiết sản phẩm (Bao gồm SKUs)
  getById: async (id: string | number, isPublic: boolean = false): Promise<ProductDetail> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/${id}`, { 
      isPublic 
    } as any);
    return response.data;
  },

  // 3. Tạo sản phẩm mới (Sử dụng multipart/form-data)
  create: async (formData: FormData): Promise<ApiResponse> => {
    const response = await apiJava.post(`${ProductService.PREFIX}/multipart`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 4. Cập nhật sản phẩm & Biến thể
    update: async (id: string | number, data: FormData | any) => {
        const response = await apiJava.put(`/products/${id}`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

  // 5. Xóa sản phẩm
  delete: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.delete(`${ProductService.PREFIX}/${id}`);
    return response.data;
  },

  // 6. Ngừng kinh doanh
  disable: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}/disable`, {});
    return response.data;
  },

  // 7. Kinh doanh lại
  enable: async (id: string | number): Promise<ApiResponse> => {
    const response = await apiJava.put(`${ProductService.PREFIX}/${id}/enable`, {});
    return response.data;
  },

  getCategories: async (): Promise<any[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/categories`);
    return response.data;
  },

  getBrands: async (): Promise<any[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/brands`);
    return response.data;
  },

  getAttributes: async (): Promise<Attribute[]> => {
    const response = await apiJava.get(`${ProductService.PREFIX}/attributes`);
    return response.data;
  },



  // Tìm kiếm theo tên, SKU, hoặc Barcode
  searchVariants: async (keyword: string, branchId?: string | number) => {
      const params: any = { keyword: keyword || "" };

      // NẾU CÓ TRUYỀN CHI NHÁNH TỪ GIAO DIỆN XUỐNG, ĐƯA VÀO PARAMS
      if (branchId) {
        params.branchId = branchId;
      }

      const response = await apiJava.get(`/product-variants/search`, {
        params: params
      });
      return response.data;
    },

};
