import { apiJava, buildJavaApiUrl, type ApiPath } from "@/lib/axios";
import {
  PageResponse,
  PublicProductListItem,
  PublicProductDetail,
  FrequentlyBoughtTogetherItem,
} from "@/app/types/product.schema";

const PUBLIC_CONTENT_TIMEOUT_MS = 10_000;

const withPublicRequest = <T extends Record<string, unknown>>(config?: T) => ({
  ...config,
  isPublic: true as const,
  timeout: PUBLIC_CONTENT_TIMEOUT_MS,
});

const createEmptyPage = (
  page = 0,
  size = 18,
): PageResponse<PublicProductListItem> => ({
  content: [],
  totalPages: 0,
  totalElements: 0,
  number: page,
  size,
});

const isTimeoutError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const typedError = error as {
    code?: string;
    message?: string;
  };

  return (
    typedError.code === "ECONNABORTED" ||
    typedError.message?.toLowerCase().includes("timeout")
  );
};

export const PublicProductService = {
  PREFIX: "/public/products" as const,

  getList: async (params?: {
    keyword?: string;
    categoryId?: number | string | null;
    brandId?: number | string | null;
    minPrice?: number | string | null;
    maxPrice?: number | string | null;
    packaging?: string | null;
    packagingValueIds?: string | null;
    sort?: string | null;
    page?: number;
    size?: number;
  }): Promise<PageResponse<PublicProductListItem>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params ?? {}).filter(
        ([, value]) => value !== null && value !== undefined && value !== "",
      ),
    );

    try {
      const response = await apiJava.get(
        buildJavaApiUrl(PublicProductService.PREFIX),
        withPublicRequest({
          params: cleanParams,
        }),
      );
      return response.data;
    } catch (error) {
      if (!isTimeoutError(error)) {
        console.error("Failed to load public products:", error);
      }
      return createEmptyPage(params?.page ?? 0, params?.size ?? 18);
    }
  },

  getBySlug: async (slug: string): Promise<PublicProductDetail> => {
    const response = await apiJava.get(
      buildJavaApiUrl(`${PublicProductService.PREFIX}/slug/${slug}` as ApiPath),
      withPublicRequest(),
    );
    return response.data;
  },

  getById: async (id: number | string): Promise<PublicProductDetail> => {
    const response = await apiJava.get(
      buildJavaApiUrl(`${PublicProductService.PREFIX}/${id}` as ApiPath),
      withPublicRequest(),
    );
    return response.data;
  },

  getFrequentlyBoughtTogether: async (
    id: number | string,
    limit = 4,
  ): Promise<FrequentlyBoughtTogetherItem[]> => {
    const response = await apiJava.get(
      buildJavaApiUrl(
        `${PublicProductService.PREFIX}/${id}/frequently-bought-together` as ApiPath,
      ),
      withPublicRequest({
        params: { limit },
      }),
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
      withPublicRequest(),
    );
  },

  getByCategory: async (
    categoryId: number | string,
  ): Promise<PublicProductListItem[]> => {
    try {
      const response = await apiJava.get(
        buildJavaApiUrl(`/public/categories/${categoryId}/products` as ApiPath),
        withPublicRequest(),
      );
      return response.data || [];
    } catch (error) {
      if (!isTimeoutError(error)) {
        console.error("Failed to load public products by category:", error);
      }
      return [];
    }
  },

  getByBrand: async (
    brandId: number | string,
  ): Promise<PublicProductListItem[]> => {
    try {
      const response = await apiJava.get(
        buildJavaApiUrl(`/public/brands/${brandId}/products` as ApiPath),
        withPublicRequest(),
      );
      return response.data || [];
    } catch (error) {
      if (!isTimeoutError(error)) {
        console.error("Failed to load public products by brand:", error);
      }
      return [];
    }
  },
};
