import { apiJava, buildJavaApiUrl, type ApiPath } from "@/lib/axios";
import {
  PageResponse,
  PublicProductListItem,
  PublicProductDetail,
  FrequentlyBoughtTogetherItem,
} from "@/app/types/product.schema";

export const PublicProductService = {
  PREFIX: "/public/products" as const,

  /**
   * Lấy danh sách sản phẩm (Public)
   * Endpoint: GET /api/public/products
   */
  getList: async (params?: {
    keyword?: string;
    categoryId?: number | string | null;
    brandId?: number | string | null;
    page?: number;
    size?: number;
  }): Promise<PageResponse<PublicProductListItem>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    );
    const response = await apiJava.get(
      buildJavaApiUrl(PublicProductService.PREFIX),
      {
        params: cleanParams,
        isPublic: true,
      } as any,
    );
    return response.data;
  },

  /**
   * Lấy chi tiết sản phẩm theo Slug (Public)
   * Endpoint: GET /api/public/products/slug/{slug}
   */
  getBySlug: async (slug: string): Promise<PublicProductDetail> => {
    const response = await apiJava.get(
      buildJavaApiUrl(
        `${PublicProductService.PREFIX}/slug/${slug}` as ApiPath,
      ),
      { isPublic: true } as any
    );
    return response.data;
  },

  /**
   * Lấy thông tin sản phẩm theo ID (Public)
   * Endpoint: GET /api/public/products/{id}
   */
  getById: async (id: number | string): Promise<PublicProductDetail> => {
    const response = await apiJava.get(
      buildJavaApiUrl(`${PublicProductService.PREFIX}/${id}` as ApiPath),
      { isPublic: true } as any
    );
    return response.data;
  },

  /**
   * Lấy danh sách "Khách hàng thường mua kèm" đã được backend precompute.
   * Endpoint: GET /api/public/products/{id}/frequently-bought-together
   */
  getFrequentlyBoughtTogether: async (
    id: number | string,
    limit = 4,
  ): Promise<FrequentlyBoughtTogetherItem[]> => {
    const response = await apiJava.get(
      buildJavaApiUrl(
        `${PublicProductService.PREFIX}/${id}/frequently-bought-together` as ApiPath,
      ),
      {
        params: { limit },
        isPublic: true,
      } as any,
    );
    return response.data || [];
  },

  trackRecommendationClick: async (
    productId: number | string,
    recommendedProductId: number | string,
    source = "product_detail",
  ): Promise<void> => {
    await apiJava.post(
      buildJavaApiUrl(
        `${PublicProductService.PREFIX}/${productId}/frequently-bought-together/clicks` as ApiPath,
      ),
      {
        recommendedProductId,
        source,
      },
      { isPublic: true } as any,
    );
  },

  getByCategory: async (categoryId: number | string): Promise<PublicProductListItem[]> => {
    try {
      const response = await apiJava.get(
        buildJavaApiUrl(`/public/categories/${categoryId}/products` as ApiPath),
        {
          isPublic: true,
        } as any,
      );
      return response.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo danh mục:", error);
      return [];
    }
  },

  getByBrand: async (brandId: number | string): Promise<PublicProductListItem[]> => {
    try {
      const response = await apiJava.get(
        buildJavaApiUrl(`/public/brands/${brandId}/products` as ApiPath),
        {
          isPublic: true,
        } as any,
      );
      return response.data || [];
    } catch (error) {
      console.error("Lỗi khi lấy sản phẩm theo thương hiệu:", error);
      return [];
    }
  },
};
