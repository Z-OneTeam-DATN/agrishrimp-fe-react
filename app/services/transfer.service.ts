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

  // 3. Xác nhận Xuất kho (Đổi sang SHIPPING)
  ship: async (id: number) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/ship`);
    return response.data;
  },

  // 4. Xác nhận Nhận hàng (Đổi sang COMPLETED)
//   receive: async (id: number, receivedItems: any[]) => {
//     const response = await apiJava.put(`${transferService.PREFIX}/${id}/receive`, receivedItems);
//     return response.data;
//   },

  // 1. Lấy chi tiết phiếu (API vừa thêm ở trên)
  getById: async (id: string) => {
    const response = await apiJava.get(`${transferService.PREFIX}/${id}`);
    return response.data;
  },

  // 2. Duyệt và xuất kho (Huy đang để là PUT và đuôi /ship)
  approve: async (id: string) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/ship`); // <--- Sửa post thành put và thêm /ship
    return response.data;
  },

  // Hủy phiếu
  cancel: async (id: string) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/cancel`);
    return response.data;
  },

  // Đổi chi nhánh nhận
  changeDestination: async (id: string, branchId: string) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/change-destination?newBranchId=${branchId}`);
    return response.data;
  },

  // Kiểm nhận hàng (gửi danh sách số lượng thực nhận lên)
  receive: async (id: string, items: any[]) => {
    const response = await apiJava.put(`${transferService.PREFIX}/${id}/receive`, items);
    return response.data;
  },
};