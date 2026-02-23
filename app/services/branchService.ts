import { apiJava } from '@/lib/axios';

const PREFIX = '/chi-nhanh';

export const BranchService = {
  getAll: () => apiJava.get(`${PREFIX}/danh-sach-chi-nhanh`),

  getById: (id: string | number) => apiJava.get(`${PREFIX}/chi-tiet-danh-sach-/${id}`),

  create: (data: any) => apiJava.post(`${PREFIX}`, data),

  update: (id: string | number, data: any) => apiJava.put(`${PREFIX}/${id}`, data),

  delete: (id: number | string) => apiJava.delete(`${PREFIX}/${id}`),

  getAllStaff: () => apiJava.get(`/users/all-staff`)
};