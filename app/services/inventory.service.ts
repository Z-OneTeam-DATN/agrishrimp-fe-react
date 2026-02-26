import { apiJava } from "@/lib/axios";

// Sửa lại đường dẫn khớp với @RequestMapping("/api/v1/inventory") của Java
// Lưu ý: Nếu trong lib/axios bạn đã có sẵn tiền tố "/api" rồi thì chỉ cần thêm "/v1/inventory"
const BASE_URL = "/inventory";

export const InventoryApiService = {

  getAllReceipts: async () => {
    // Sẽ gọi: http://localhost:8080/api/v1/inventory/receipts
    const response = await apiJava.get(`${BASE_URL}/receipts`);
    return response.data;
  },

  getReceiptDetail: async (id: number | string) => {
    const response = await apiJava.get(`${BASE_URL}/receipts/${id}`);
    return response.data;
  },

  createReceipt: async (payload: any) => {
    // Sẽ gọi: http://localhost:8080/api/v1/inventory/receipts
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