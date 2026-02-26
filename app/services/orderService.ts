import { apiJava } from "@/lib/axios"
import type {
  PrepareOrderPayload,
  PrepareOrderResponse,
  ConfirmOrderPayload,
  ConfirmOrderResponse,
} from "@/app/types/order.types"

/** Chuẩn bị đơn — KHÔNG lưu DB, lưu bản nháp vào Redis TTL 30 phút */
export async function prepareOrder(
  payload: PrepareOrderPayload
): Promise<PrepareOrderResponse> {
  const res = await apiJava.post("/orders/prepare", payload)
  return res.data
}

/** Xác nhận đơn — LƯU DB, trừ kho (pessimistic lock)
 *  Nếu paymentMethod = PAYOS → response.checkoutUrl có giá trị, redirect đến đó
 */
export async function confirmOrder(
  payload: ConfirmOrderPayload
): Promise<ConfirmOrderResponse> {
  const res = await apiJava.post("/orders/confirm", payload)
  return res.data
}

/** Lấy lại link thanh toán payOS khi user cần mở lại
 *  GET /api/orders/{orderId}/payment-link
 */
export async function getPaymentLink(orderId: number | string): Promise<string> {
  const res = await apiJava.get(`/orders/${orderId}/payment-link`)
  return res.data.checkoutUrl
}

/** Lấy chi tiết đơn hàng đã đặt */
export async function getOrderById(orderId: number | string) {
  const res = await apiJava.get(`/orders/${orderId}`)
  return res.data
}

/** Đặt hàng trực tiếp (Old Flow) */
export async function checkout(payload: any) {
  const res = await apiJava.post("/orders/checkout", payload)
  return res.data
}
