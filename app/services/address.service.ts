import { apiJava } from "@/lib/axios";

export const locationService = {
  // Lấy danh sách Tỉnh/Thành phố
  getProvinces: async () => {
    const res = await apiJava.get("/api/locations/provinces");
    return res.data;
  },
  // Lấy danh sách Quận/Huyện dựa theo ID Tỉnh
  getDistricts: async (provinceId: number) => {
    const res = await apiJava.get(`/api/locations/districts/${provinceId}`);
    return res.data;
  },
  // Lấy danh sách Phường/Xã dựa theo ID Huyện
  getWards: async (districtId: number) => {
    const res = await apiJava.get(`/api/locations/wards/${districtId}`);
    return res.data;
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