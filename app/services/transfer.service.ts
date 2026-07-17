import { apiJava } from "@/lib/axios"; // Đổi sang apiJava của team Huy

export const transferService = {
  PREFIX: "/transfers",

  // 1. Lấy danh sách phiếu điều chuyển
  getAll: async (keyword: string = "", status: string = "all", page: number = 0, size: number = 10) => {
    const response = await apiJava.get(`${transferService.PREFIX}`, {
      params: {
        keyword: keyword || undefined,
        status: status !== "all" ? status : undefined,
        page,
        size,
      },
    });
    return response.data;
  },

  // 2. Tạo phiếu điều chuyển mới
  create: async (data: any) => {
    const response = await apiJava.post(`${transferService.PREFIX}`, data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}`, data);
    return response.data;
  },

  // 3. Lấy chi tiết phiếu
  getById: async (id: string) => {
    const response = await apiJava.get(`${transferService.PREFIX}/${id}`);
    return response.data;
  },

  // 4. Duyệt yêu cầu (Đổi sang APPROVED)
  approve: async (id: string) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/approve`);
    return response.data;
  },

  // 5. Xác nhận Xuất kho (Đổi sang SHIPPING)
  ship: async (id: string) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/ship`);
    return response.data;
  },

  // 6. Kiểm nhận hàng (gửi danh sách số lượng thực nhận lên) (Đổi sang COMPLETED)
  receive: async (id: string, items: any[]) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/receive`, items);
    return response.data;
  },

  settlePayment: async (id: string, amount: number) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/settle-payment`, {
      amount,
    });
    return response.data;
  },

  // 7. Chi nhánh nguồn xác nhận có hàng & giá (PENDING → SOURCE_CONFIRMED, chỉ cho INTERNAL_SALE)
  sourceConfirm: async (id: string) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/source-confirm`);
    return response.data;
  },

  // 8. Bên nhận bắt đầu kiểm đếm hàng (SHIPPING → INSPECTING)
  startInspection: async (id: string) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/start-inspection`);
    return response.data;
  },

  // 9. Từ chối phiếu (Đổi sang REJECTED)
  reject: async (id: string) => {
    const response = await apiJava.post(`${transferService.PREFIX}/${id}/reject`);
    return response.data;
  },

  // 8. Hủy phiếu (Đổi sang CANCELLED)
  cancel: async (id: string) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/cancel`);
    return response.data;
  },

  // 9. Đổi chi nhánh nhận
  changeDestination: async (id: string, branchId: string) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/change-destination?newBranchId=${branchId}`);
    return response.data;
  },

  // 10. Xóa phiếu
  delete: async (id: string) => {
    const response = await apiJava.delete(`${transferService.PREFIX}/${id}`);
    return response.data;
  },
};
