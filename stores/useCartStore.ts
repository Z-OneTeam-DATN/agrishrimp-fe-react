// stores/useCartStore.ts
import { create } from "zustand";
import { cartService } from "@/app/services/cart.service";

interface CartStore {
  itemCount: number;
  fetchCartCount: () => Promise<void>;
  updateCountLocal: (delta: number) => void; // Dùng để cộng/trừ ảo cho UI mượt
}

export const useCartStore = create<CartStore>((set, get) => ({
  itemCount: 0,
  
  // Gọi API lấy tổng số lượng trong giỏ
  fetchCartCount: async () => {
    try {
      const data = await cartService.getMyCart();
      // Tính tổng số lượng của tất cả sản phẩm (Có thể đổi thành data.length nếu chỉ muốn đếm số đầu mục sản phẩm)
      const total = data.reduce((sum: number, item: any) => sum + item.quantity, 0);
      set({ itemCount: total });
    } catch (error) {
      set({ itemCount: 0 });
    }
  },

  // Cập nhật local ngay lập tức khi bấm nút (không cần chờ API load lại)
  updateCountLocal: (delta: number) => {
    const current = get().itemCount;
    set({ itemCount: Math.max(0, current + delta) });
  }
}));