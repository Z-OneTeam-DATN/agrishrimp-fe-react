import { apiJava, buildJavaApiUrl, type ApiPath } from "@/lib/axios";
import { BrandDTO } from "@/app/types/brand.type";

export const getPublicBrands = async (): Promise<BrandDTO[]> => {
  try {
    const response = await apiJava.get(
      buildJavaApiUrl("/public/brands"),
      {
        isPublic: true,
      } as any,
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thương hiệu:", error);
    return [];
  }
};

export const getProductsByBrand = async (brandId: number): Promise<any[]> => {
  try {
    const response = await apiJava.get(
      buildJavaApiUrl(`/public/brands/${brandId}/products` as ApiPath),
      {
        isPublic: true,
      } as any,
    );
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy sản phẩm của thương hiệu ${brandId}:`, error);
    return [];
  }
};

export const getAdminBrands = async (keyword?: string): Promise<BrandDTO[]> => {
  try {
    const queryParams = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    const response = await apiJava.get(
      buildJavaApiUrl(`/brands${queryParams}` as ApiPath)
    );
    // Backend API response is wrapped in ApiResponse success structure: { code: 200, data: [...] }
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thương hiệu admin:", error);
    throw error;
  }
};

export const getAdminBrandById = async (id: number): Promise<BrandDTO | null> => {
  try {
    const response = await apiJava.get(
      buildJavaApiUrl(`/brands/${id}` as ApiPath)
    );
    return response.data?.data || response.data || null;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết thương hiệu ${id}:`, error);
    return null;
  }
};

export const createBrand = async (data: Omit<BrandDTO, "id">): Promise<BrandDTO | null> => {
  try {
    const response = await apiJava.post(
      buildJavaApiUrl("/brands"),
      data
    );
    return response.data?.data || response.data || null;
  } catch (error) {
    console.error("Lỗi khi tạo thương hiệu:", error);
    throw error;
  }
};

export const updateBrand = async (id: number, data: Omit<BrandDTO, "id">): Promise<BrandDTO | null> => {
  try {
    const response = await apiJava.put(
      buildJavaApiUrl(`/brands/${id}` as ApiPath),
      data
    );
    return response.data?.data || response.data || null;
  } catch (error) {
    console.error(`Lỗi khi cập nhật thương hiệu ${id}:`, error);
    throw error;
  }
};

export const deleteBrand = async (id: number): Promise<boolean> => {
  try {
    await apiJava.delete(
      buildJavaApiUrl(`/brands/${id}` as ApiPath)
    );
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa thương hiệu ${id}:`, error);
    throw error;
  }
};

