import { orderService } from "@/app/services/order.service"
import type {
  PrepareOrderPayload,
  PrepareOrderResponse,
  ConfirmOrderPayload,
  ConfirmOrderResponse,
  MyOrder,
} from "@/app/types/order.types"

/** Chuẩn bị đơn — KHÔNG lưu DB, lưu bản nháp vào Redis TTL 30 phút */
export async function prepareOrder(
  payload: PrepareOrderPayload
): Promise<PrepareOrderResponse> {
  return orderService.prepareOrder(payload)
}

/** Xác nhận đơn — LƯU DB, trừ kho (pessimistic lock)
 *  Nếu paymentMethod = PAYOS → response.checkoutUrl có giá trị, redirect đến đó
 */
export async function confirmOrder(
  payload: ConfirmOrderPayload
): Promise<ConfirmOrderResponse> {
  return orderService.confirmOrder(payload)
}

export async function getPreparedOrder(
  prepareToken: string
): Promise<PrepareOrderResponse> {
  return orderService.getPreparedOrder(prepareToken)
}

export async function finalizePayosSession(
  sessionCode: string
): Promise<ConfirmOrderResponse> {
  return orderService.finalizePayosSession(sessionCode)
}

export async function cancelPayosSession(sessionCode: string): Promise<void> {
  return orderService.cancelPayosSession(sessionCode)
}

/** Lấy lại link thanh toán payOS khi user cần mở lại
 *  GET /api/orders/{orderId}/payment-link
 */
export async function getPaymentLink(orderId: number | string): Promise<string> {
  return orderService.getPaymentLink(orderId)
}

export async function retryPendingPayment(
  orderId: number | string,
  paymentMethod: ConfirmOrderPayload["paymentMethod"]
): Promise<ConfirmOrderResponse> {
  return orderService.retryPendingPayment(orderId, paymentMethod)
}

/** Lấy chi tiết đơn hàng đã đặt */
export async function getOrderById(orderId: number | string): Promise<MyOrder> {
  return orderService.getOrderById(orderId)
}

/** Đặt hàng trực tiếp (Old Flow) */
