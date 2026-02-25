import { apiJava } from "@/lib/axios";
import {
  PageResponse,
  PublicProductListItem,
  PublicProductDetail,
} from "@/app/types/product.schema";

export const PublicProductService = {
  PREFIX: "/public/products",

  getList: async (params?: {
    keyword?: string;
    categoryId?: number | string | null;
    brandId?: number | string | null;
    page?: number;
    size?: number;
  }): Promise<PageResponse<PublicProductListItem>> => {
    // Remove null/undefined params
    const cleanParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );
    const response = await apiJava.get(PublicProductService.PREFIX, {
      params: cleanParams,
      isPublic: true,
    } as any);
    return response.data;
  },

  getByCategory: async (categoryId: number | string): Promise<PublicProductListItem[]> => {
    try {
      const response = await apiJava.get(`/public/categories/${categoryId}/products`, {
        isPublic: true,
      } as any);
      return response.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
      return [];
    }
  },

  getByBrand: async (brandId: number | string): Promise<PublicProductListItem[]> => {
    try {
      const response = await apiJava.get(`/public/brands/${brandId}/products`, {
        isPublic: true,
      } as any);
      return response.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo thương hiệu:", error);
      return [];
    }
  },

  getBySlug: async (slug: string): Promise<PublicProductDetail> => {
    const response = await apiJava.get(
      `${PublicProductService.PREFIX}/slug/${slug}`,
      { isPublic: true } as any
    );
    return response.data;
  },
};
