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

  getBySlug: async (slug: string): Promise<PublicProductDetail> => {
    const response = await apiJava.get(
      `${PublicProductService.PREFIX}/slug/${slug}`,
      { isPublic: true } as any
    );
    return response.data;
  },
};
