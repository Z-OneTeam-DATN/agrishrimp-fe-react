import { apiJava, buildJavaApiUrl, type ApiPath } from "@/lib/axios";
import { BrandDTO } from "@/app/types/brand.type";

const PUBLIC_CONTENT_TIMEOUT_MS = 10_000;

const withPublicRequest = <T extends Record<string, unknown>>(config?: T) => ({
  ...config,
  isPublic: true as const,
  timeout: PUBLIC_CONTENT_TIMEOUT_MS,
});

const isRequestAborted = (error: unknown) => {
  if (!error || typeof error !== "object") return false;

  const typedError = error as {
    code?: string;
    message?: string;
    name?: string;
  };

  return (
    typedError.code === "ERR_CANCELED" ||
    typedError.name === "CanceledError" ||
    typedError.message?.toLowerCase().includes("aborted") ||
    typedError.message?.toLowerCase().includes("canceled")
  );
};

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

export const getPublicBrands = async (): Promise<BrandDTO[]> => {
  try {

    const response = await apiJava.get(
      buildJavaApiUrl("/public/brands"),
      withPublicRequest(),
    );
    return response.data;
  } catch (error) {
    if (!isRequestAborted(error) && !isTimeoutError(error)) {
      console.error("Failed to load public brands:", error);
    }
    return [];
  }
};

export const getProductsByBrand = async (brandId: number): Promise<unknown[]> => {
  try {
    const response = await apiJava.get(
      buildJavaApiUrl(`/public/brands/${brandId}/products` as ApiPath),
      withPublicRequest(),
    );
    return response.data;
  } catch (error) {
    if (!isTimeoutError(error)) {
      console.error(`Failed to load products for brand ${brandId}:`, error);
    }
    return [];
  }
};

export const getAdminBrands = async (keyword?: string): Promise<BrandDTO[]> => {
  try {
    const queryParams = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
    const response = await apiJava.get(
      buildJavaApiUrl(`/brands${queryParams}` as ApiPath),
    );
    return response.data?.data || response.data || [];
  } catch (error) {
    if (isRequestAborted(error)) {
      return [];
    }
    console.error("Failed to load admin brands:", error);

    throw error;
  }
};

export const getAdminBrandById = async (
  id: number,
): Promise<BrandDTO | null> => {
  try {
    const response = await apiJava.get(
      buildJavaApiUrl(`/brands/${id}` as ApiPath),
    );
    return response.data?.data || response.data || null;
  } catch (error) {
    console.error(`Failed to load brand ${id}:`, error);
    return null;
  }
};

export const createBrand = async (
  data: Omit<BrandDTO, "id">,
): Promise<BrandDTO | null> => {
  try {
    const response = await apiJava.post(buildJavaApiUrl("/brands"), data);
    return response.data?.data || response.data || null;
  } catch (error) {
    console.error("Failed to create brand:", error);
    throw error;
  }
};

export const updateBrand = async (
  id: number,
  data: Omit<BrandDTO, "id">,
): Promise<BrandDTO | null> => {
  try {
    const response = await apiJava.put(
      buildJavaApiUrl(`/brands/${id}` as ApiPath),
      data,
    );
    return response.data?.data || response.data || null;
  } catch (error) {
    console.error(`Failed to update brand ${id}:`, error);
    throw error;
  }
};

export const deleteBrand = async (id: number): Promise<boolean> => {
  try {
    await apiJava.delete(buildJavaApiUrl(`/brands/${id}` as ApiPath));
    return true;
  } catch (error) {
    console.error(`Failed to delete brand ${id}:`, error);
    throw error;
  }
};
