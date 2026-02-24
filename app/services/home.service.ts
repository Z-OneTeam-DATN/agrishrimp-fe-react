import { apiJava } from "@/lib/axios";
import { ProductListItem, ProductDetail } from "@/app/types/product.schema";

export const HomeService = {
  PREFIX: "/public/home",

  // Lấy danh sách sản phẩm đăng bán
  getProducts: async (): Promise<ProductListItem[]> => {
    const response = await apiJava.get(`${HomeService.PREFIX}/products`);
    return response.data;
  },

  // Lấy top bán chạy
  getBestSellers: async (limit: number = 5): Promise<ProductListItem[]> => {
    const response = await apiJava.get(`${HomeService.PREFIX}/best-sellers`, {
      params: { limit },
    });
    return response.data;
  },

  // Lấy chi tiết sản phẩm theo slug
  getProductBySlug: async (slug: string): Promise<ProductDetail> => {
    const response = await apiJava.get(`${HomeService.PREFIX}/product/${slug}`);
    return response.data;
  },
};