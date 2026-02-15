import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // Điều chỉnh theo server của bạn

export const BranchService = {
  getAll: () => axios.get(`${API_BASE_URL}/chi-nhanh/danh-sach-chi-nhanh`),

  getById: (id: string | number) => axios.get(`${API_BASE_URL}/chi-nhanh/chi-tiet-danh-sach-/${id}`),

  create: (data: any) => axios.post(`${API_BASE_URL}/chi-nhanh`, data),

  update: (id: string | number, data: any) => axios.put(`${API_BASE_URL}/chi-nhanh/${id}`, data),

  delete: (id: number | string) => axios.delete(`${API_BASE_URL}/chi-nhanh/${id}`),

  getAllStaff: () => axios.get(`${API_BASE_URL}/users/all-staff`)
};