import axios from "axios";
import { apiJava } from "@/lib/axios";

export const locationService = {
  // Lấy danh sách Tỉnh/Thành phố
  getProvinces: async () => {
    const res = await axios.get("https://provinces.open-api.vn/api/p/");
    return res.data.map((p: any) => ({ ...p, id: p.code }));
  },
  // Lấy danh sách Quận/Huyện dựa theo ID Tỉnh
  getDistricts: async (provinceId: number) => {
    const res = await axios.get(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`);
    return (res.data.districts || []).map((d: any) => ({ ...d, id: d.code }));
  },
  // Lấy danh sách Phường/Xã dựa theo ID Huyện
  getWards: async (districtId: number) => {
    const res = await axios.get(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`);
    return (res.data.wards || []).map((w: any) => ({ ...w, id: w.code, code: w.code.toString() }));
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