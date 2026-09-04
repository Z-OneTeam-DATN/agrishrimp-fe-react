import { apiJava } from "@/lib/axios";

/** Gọi GHN master-data qua Next.js proxy (token giữ server-side) */
type GhnProvinceOption = {
  id: number;
  name: string;
};

type GhnDistrictOption = {
  id: number;
  name: string;
};

type GhnWardOption = {
  wardId?: number;
  code: string;
  name: string;
};

export const locationService = {
  // { id: number, name: string }[]
  getProvinces: async (): Promise<GhnProvinceOption[]> => {
    const res = await fetch("/api/ghn/province");
    if (!res.ok) throw new Error("Không thể tải tỉnh/thành");
    return (await res.json()) as GhnProvinceOption[];
  },
  // { id: number, name: string }[]  — id = GHN DistrictID
  getDistricts: async (provinceId: number): Promise<GhnDistrictOption[]> => {
    const res = await fetch(`/api/ghn/district?province_id=${provinceId}`);
    if (!res.ok) throw new Error("Không thể tải quận/huyện");
    return (await res.json()) as GhnDistrictOption[];
  },
  // { code: string, name: string }[] — code = GHN WardCode (e.g. "550113")
  getWards: async (districtId: number): Promise<GhnWardOption[]> => {
    const res = await fetch(`/api/ghn/ward?district_id=${districtId}`);
    if (!res.ok) throw new Error("Không thể tải phường/xã");
    return (await res.json()) as GhnWardOption[];
  },
};

export const addressService = {
  PREFIX: "/addresses",
  
  // Lấy danh sách sổ địa chỉ của User
  getAll: async () => {
    const res = await apiJava.get(addressService.PREFIX);
    return res.data;
  },
  
  // Thêm địa chỉ mới
  create: async (data: any) => {
    const res = await apiJava.post(addressService.PREFIX, data);
    return res.data;
  },
  
  // Cập nhật địa chỉ
  update: async (id: number, data: any) => {
    const res = await apiJava.put(`${addressService.PREFIX}/${id}`, data);
    return res.data;
  },
  
  // Xóa địa chỉ
  delete: async (id: number) => {
    const res = await apiJava.delete(`${addressService.PREFIX}/${id}`);
    return res.data;
  },
  
  // Đặt làm địa chỉ mặc định
  setDefault: async (id: number) => {
    const res = await apiJava.patch(`${addressService.PREFIX}/${id}/default`);
    return res.data;
  }
};
