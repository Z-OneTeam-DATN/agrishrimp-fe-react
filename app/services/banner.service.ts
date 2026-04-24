import { apiJava, buildJavaApiUrl } from "@/lib/axios";

export interface BannerDTO {
  id: number;
  title: string | null;
  imageUrl: string | null;
  publicId: string | null;
  linkUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const getPublicBanners = async (): Promise<BannerDTO[]> => {
  try {
    const res = await apiJava.get(buildJavaApiUrl("/v1/public/banners"), { isPublic: true } as any);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const adminGetBanners = async (): Promise<BannerDTO[]> => {
  const res = await apiJava.get(buildJavaApiUrl("/banners"));
  return res.data?.data ?? [];
};

export const adminCreateBanner = async (data: FormData): Promise<BannerDTO> => {
  const res = await apiJava.post(buildJavaApiUrl("/banners"), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
};

export const adminUpdateBanner = async (id: number, data: FormData): Promise<BannerDTO> => {
  const res = await apiJava.put(buildJavaApiUrl(`/banners/${id}` as any), data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
};

export const adminToggleBanner = async (id: number): Promise<void> => {
  await apiJava.patch(buildJavaApiUrl(`/banners/${id}/toggle` as any));
};

export const adminDeleteBanner = async (id: number): Promise<void> => {
  await apiJava.delete(buildJavaApiUrl(`/banners/${id}` as any));
};
