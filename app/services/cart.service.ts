import { apiJava } from "@/lib/axios";

export const cartService = {
  PREFIX: "/cart",

  // 1. Lấy giỏ hàng hiện tại
  getMyCart: async () => {
    const response = await apiJava.get(`${cartService.PREFIX}`);
    return response.data; // Trả về mảng CartItemResponse
  },

  // 2. Thêm/Bớt số lượng (delta = 1 hoặc -1)
  updateQuantity: async (variantId: number, delta: number) => {
    const response = await apiJava.post(`${cartService.PREFIX}/update`, null, {
      params: { variantId, delta }
    });
    return response.data;
  },

  // 3. Xóa sản phẩm khỏi giỏ
  removeItem: async (cartItemId: number) => {
    const response = await apiJava.delete(`${cartService.PREFIX}/${cartItemId}`);
    return response.data;
  }
};