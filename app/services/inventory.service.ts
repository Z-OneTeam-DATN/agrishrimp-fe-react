import { apiJava } from "@/lib/axios";

// Sửa lại đường dẫn khớp với @RequestMapping("/api/v1/inventory") của Java
// Lưu ý: Nếu trong lib/axios bạn đã có sẵn tiền tố "/api" rồi thì chỉ cần thêm "/v1/inventory"
const BASE_URL = "/v1/inventory";

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