import { apiJava } from "@/lib/axios";

// Sửa lại đường dẫn khớp với @RequestMapping("/api/v1/inventory") của Java
// Lưu ý: Nếu trong lib/axios bạn đã có sẵn tiền tố "/api" rồi thì chỉ cần thêm "/v1/inventory"
const BASE_URL = "/inventory";

export const InventoryApiService = {

  getAllReceipts: async () => {
    // Browser đi qua /be-api, còn SSR dùng JAVA_API_URL tới Spring Boot
    const response = await apiJava.get(`${BASE_URL}/receipts`);
    return response.data;
  },

  getReceiptDetail: async (id: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/receipts/${id}`);
    return response.data;
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
};
export const InventoryExportApiService = {
  // Lấy danh sách lệnh xuất
  getAllExportCommands: async () => {
    const response = await apiJava.get(`${BASE_URL}/export-commands`);
    return response.data;
  },

  // Lấy danh sách phiếu xuất (lịch sử)
  getAllExportReceipts: async () => {
    const response = await apiJava.get(`${BASE_URL}/export-receipts`);
    return response.data;
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
// Hàm chốt phiếu xuất (trừ kho)
  completeExportCommand: async (id: number | string) => {
    const response = await apiJava.post(`${BASE_URL}/export-commands/${id}/complete`);
    return response.data;
  },
getExportCommandDetail: async (id: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/export-commands/${id}`);
    return response.data;
  },
updateExportCommand: async (id: number | string, payload: any) => {
    const response = await apiJava.put(`${BASE_URL}/export-commands/${id}`, payload);
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
    const response = await apiJava.post("/inventory-checks", payload);
    return response.data;
  },

  // C. Lấy chi tiết phiếu theo ID hoặc Mã (Code)
  getDetail: async (codeOrId: string | number) => {
    const response = await apiJava.get(`/inventory-checks/${codeOrId}`);
    return response.data;
  },

  // D. Chốt phiếu - Cập nhật kho
  completeCheck: async (id: number | string) => {
    const response = await apiJava.post(`/inventory-checks/${id}/complete`);
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
