import { apiJava } from "@/lib/axios";
import { repairVietnameseData } from "@/lib/utils";

// Sửa lại đường dẫn khớp với @RequestMapping("/api/v1/inventory") của Java
// Lưu ý: Nếu trong lib/axios bạn đã có sẵn tiền tố "/api" rồi thì chỉ cần thêm "/v1/inventory"
const BASE_URL = "/inventory";

export const InventoryApiService = {

  getAllReceipts: async () => {
    // Browser đi qua /be-api, còn SSR dùng JAVA_API_URL tới Spring Boot
    const response = await apiJava.get(`${BASE_URL}/receipts`);
    return repairVietnameseData(response.data);
  },

  getReceiptDetail: async (id: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/receipts/${id}`);
    return repairVietnameseData(response.data);
  },

  createReceipt: async (payload: any) => {
    // Browser đi qua /be-api, còn SSR dùng JAVA_API_URL tới Spring Boot
    const response = await apiJava.post(`${BASE_URL}/receipts`, payload);
    return response.data;
  },

  updateReceipt: async (id: number | string, payload: any) => {
    const response = await apiJava.put(`${BASE_URL}/receipts/${id}`, payload);
    return response.data;
  },

  deleteReceipt: async (id: number | string) => {
    const response = await apiJava.delete(`${BASE_URL}/receipts/${id}`);
    return response.data;
  },

  // Duyệt phiếu nhập (Chuyển sang APPROVED)
  approveReceipt: async (id: number | string) => {
    const response = await apiJava.post(`${BASE_URL}/receipts/${id}/approve`);
    return response.data;
  },

  // Từ chối phiếu nhập (Chuyển sang REJECTED)
  rejectReceipt: async (id: number | string) => {
    const response = await apiJava.post(`${BASE_URL}/receipts/${id}/reject`);
    return response.data;
  },

  // 3. Xác nhận hoàn tất nhập kho - QC (Chuyển sang COMPLETED)
  completeReceipt: async (id: number | string, payload: { items: any[] }) => {
    // Gửi items theo yêu cầu lưu vết người chốt (người chốt lấy từ token)
    const response = await apiJava.post(`${BASE_URL}/receipts/${id}/complete`, payload);
    return response.data;
  },

  getReceiptPayments: async (id: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/receipts/${id}/payments`);
    return response.data;
  },

  createReceiptPayment: async (id: number | string, payload: any) => {
    const response = await apiJava.post(`${BASE_URL}/receipts/${id}/payments`, payload);
    return response.data;
  },
};
export const InventoryExportApiService = {
  // Lấy danh sách lệnh xuất
  getAllExportCommands: async () => {
    const response = await apiJava.get(`${BASE_URL}/export-commands`);
    return repairVietnameseData(response.data);
  },

  // Lấy danh sách phiếu xuất (lịch sử)
  getAllExportReceipts: async () => {
    const response = await apiJava.get(`${BASE_URL}/export-receipts`);
    return repairVietnameseData(response.data);
  },

  // Xóa lệnh xuất
  deleteExportCommand: async (id: number | string) => {
    const response = await apiJava.delete(`${BASE_URL}/export-commands/${id}`);
    return response.data;
  },
createExportCommand: async (payload: any) => {
    const response = await apiJava.post(`${BASE_URL}/export-commands`, payload);
    return response.data;
  },
getAllProductsForExport: async () => {
    const response = await apiJava.get(`/products`);
    return response.data;
  },
  
  // Lấy danh sách hàng lỗi theo NCC và Chi nhánh (Dùng cho Xuất Trả NCC)
  getDefectiveItems: async (supplierId: number | string, branchId?: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/defective-items`, {
      params: { supplierId, branchId }
    });
    return repairVietnameseData(response.data);
  },

  // Duyệt lệnh xuất (Chuyển sang APPROVED)
  approveExportCommand: async (id: number | string) => {
    const response = await apiJava.post(`${BASE_URL}/export-commands/${id}/approve`);
    return response.data;
  },

  // Hàm chốt phiếu xuất (trừ kho - Chuyển sang COMPLETED)
  completeExportCommand: async (id: number | string) => {
    const response = await apiJava.post(`${BASE_URL}/export-commands/${id}/complete`);
    return response.data;
  },
getExportCommandDetail: async (id: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/export-commands/${id}`);
    return repairVietnameseData(response.data);
  },
updateExportCommand: async (id: number | string, payload: any) => {
  const response = await apiJava.put(`${BASE_URL}/export-commands/${id}`, payload);
  return repairVietnameseData(response.data);
},

rejectExportCommand: async (id: number | string) => {
  const response = await apiJava.post(`${BASE_URL}/export-commands/${id}/reject`);
  return response.data;
},
};
export const InventoryCheckApiService = {
  // A. Lấy danh sách phiếu (Cả PENDING và COMPLETED)
  getAll: async () => {
    const response = await apiJava.get("/inventory-checks");
    return response.data;
  },

  // B. Tạo hoặc Cập nhật phiếu
  // Payload có 'id' -> Cập nhật, không 'id' -> Tạo mới
  saveCheck: async (payload: any) => {
    const checkId =
      payload?.id === null || payload?.id === undefined || payload?.id === ""
        ? null
        : Number(payload.id);
    const requestPayload =
      checkId == null ? payload : { ...payload, id: undefined };
    const response =
      checkId == null
        ? await apiJava.post("/inventory-checks", requestPayload)
        : await apiJava.put(`/inventory-checks/${checkId}`, requestPayload);
    return repairVietnameseData(response.data);
  },

  // C. Lấy chi tiết phiếu theo ID hoặc Mã (Code)
  getDetail: async (codeOrId: string | number) => {
    const response = await apiJava.get(`/inventory-checks/${codeOrId}`, {
      timeout: 60000,
    });
    return repairVietnameseData(response.data);
  },

  // D. Chốt phiếu - Cập nhật kho
  completeCheck: async (id: number | string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/complete`);
    return repairVietnameseData(response.data);
  },

  startCheck: async (id: number | string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/start`);
    return repairVietnameseData(response.data);
  },

  submitForApproval: async (id: number | string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/submit-for-approval`);
    return repairVietnameseData(response.data);
  },

  requestRecount: async (id: number | string, reason: string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/request-recount`, { reason });
    return repairVietnameseData(response.data);
  },

  approveAdjustment: async (id: number | string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/approve-adjustment`);
  return repairVietnameseData(response.data);
  },

  cancelCheck: async (id: number | string, reason?: string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/cancel`, { reason });
    return response.data;
  },

  // F. Xóa phiếu kiểm kê (PENDING)
  deleteCheck: async (id: number | string) => {
    const response = await apiJava.delete(`/inventory-checks/${id}`);
    return response.data;
  },

  // E. Tìm kiếm sản phẩm dành riêng cho kiểm kê
  searchProducts: async (keyword: string, branchId?: string | number) => {
    const response = await apiJava.get("/inventory-checks/search-products", {
      params: { keyword, branchId }
    });
    return response.data;
  },

  // Giữ lại các hàm cũ để tương thích ngược nếu cần, hoặc xóa nếu đã chuyển đổi hết
  createCheckCommand: async (payload: any) => {
    return InventoryCheckApiService.saveCheck(payload);
  },
  completeCheckCommand: async (id: number | string) => {
    return InventoryCheckApiService.completeCheck(id);
  },
  getAllCheckCommands: async () => {
    return InventoryCheckApiService.getAll();
  },
  getAllCheckReceipts: async () => {
    return InventoryCheckApiService.getAll(); // Backend gộp chung
  },
  getCheckCommandDetailByCode: async (code: string) => {
    return InventoryCheckApiService.getDetail(code);
  },
};
