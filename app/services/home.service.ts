import { apiJava, buildJavaApiUrl } from "@/lib/axios";
import { PublicProductListItem, PublicProductDetail, ProductDetail } from "@/app/types/product.schema";

export const HomeService = {
  PRODUCTS_PATH: "/public/home/products" as const,
  BEST_SELLERS_PATH: "/public/home/best-sellers" as const,
  PRODUCT_BY_SLUG_PATH: "/public/home/product" as const,

  // Lấy danh sách sản phẩm đăng bán
  getProducts: async (): Promise<PublicProductListItem[]> => {
    const response = await apiJava.get(
      buildJavaApiUrl(HomeService.PRODUCTS_PATH),
      { isPublic: true } as any,
    );
    return response.data;
  },

  // Lấy top bán chạy
  getBestSellers: async (limit: number = 5): Promise<PublicProductListItem[]> => {
    const response = await apiJava.get(
      buildJavaApiUrl(HomeService.BEST_SELLERS_PATH),
      {
        params: { limit },
        isPublic: true,
      } as any,
    );
    return response.data;
  },

  // Lấy chi tiết sản phẩm theo slug
  getProductBySlug: async (slug: string): Promise<ProductDetail> => {
    const response = await apiJava.get(
      buildJavaApiUrl(`${HomeService.PRODUCT_BY_SLUG_PATH}/${slug}` as const),
      { isPublic: true } as any,
    );
    return response.data;
  },
};
