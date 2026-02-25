import { apiJava } from "@/lib/axios";
import { BrandDTO } from "@/app/types/brand.type";

export const getPublicBrands = async (): Promise<BrandDTO[]> => {
  try {
    const response = await apiJava.get("/public/brands", {
      isPublic: true,
    } as any);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thương hiệu:", error);
    return [];
  }
};

export const getProductsByBrand = async (brandId: number): Promise<any[]> => {
  try {
    const response = await apiJava.get(`/public/brands/${brandId}/products`, {
      isPublic: true,
    } as any);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy sản phẩm của thương hiệu ${brandId}:`, error);
    return [];
  }
};
