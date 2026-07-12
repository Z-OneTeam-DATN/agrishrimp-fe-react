// stores/useCartStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { cartService } from "@/app/services/cart.service"
import { useAuthStore } from "@/stores/useAuthStore"
import type { CartItem, DeliveryInfo, PrepareOrderResponse } from "@/app/types/order.types"

interface CartStore {
  // ─── Header badge (hiện có) ────────────────────────────────────
  itemCount: number
  fetchCartCount: () => Promise<void>
  updateCountLocal: (delta: number) => void

  // ─── Checkout state (thêm mới) ─────────────────────────────────
  items: CartItem[]
  deliveryInfo: DeliveryInfo | null
  prepareOrderResponse: PrepareOrderResponse | null
  prepareToken: string | null

  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  removeItem: (productVariantId: number) => void
  updateQuantity: (productVariantId: number, quantity: number) => void
  clearCart: () => void
  setDeliveryInfo: (info: DeliveryInfo) => void
  setPrepareResponse: (response: PrepareOrderResponse, token: string) => void
  clearPrepareResponse: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // ─── Header badge ──────────────────────────────────────────
      itemCount: 0,

      fetchCartCount: async () => {
        const { accessToken, isAuthenticated } = useAuthStore.getState()
        if (!accessToken || !isAuthenticated) {
          set({ itemCount: 0 })
          return
        }

        try {
          const data = await cartService.getMyCart()
          const total = Array.isArray(data)
            ? data.reduce(
                (sum: number, item: any) => sum + Number(item?.quantity ?? 0),
                0
              )
            : 0
          set({ itemCount: total })
        } catch {
          set({ itemCount: 0 })
        }
      },

      updateCountLocal: (delta: number) => {
        const current = get().itemCount
        set({ itemCount: Math.max(0, current + delta) })
      },

      // ─── Checkout state ────────────────────────────────────────
      items: [],
      deliveryInfo: null,
      prepareOrderResponse: null,
      prepareToken: null,

      setItems: (items) => set({ items }),

      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.productVariantId === item.productVariantId
        )
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productVariantId === item.productVariantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },

      removeItem: (productVariantId) =>
        set({
          items: get().items.filter(
            (i) => i.productVariantId !== productVariantId
          ),
        }),

      updateQuantity: (productVariantId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.productVariantId === productVariantId ? { ...i, quantity } : i
          ),
        }),

      clearCart: () =>
        set({ items: [], deliveryInfo: null, prepareOrderResponse: null, prepareToken: null }),

      setDeliveryInfo: (info) => set({ deliveryInfo: info }),

      setPrepareResponse: (response, token) =>
        set({ prepareOrderResponse: response, prepareToken: token }),

      clearPrepareResponse: () =>
        set({ prepareOrderResponse: null, prepareToken: null }),
    }),
    {
      name: "cart-storage",
      // Chỉ persist items và deliveryInfo — KHÔNG persist prepareOrderResponse
      partialize: (s) => ({ items: s.items, deliveryInfo: s.deliveryInfo }),
    }
  )
)
