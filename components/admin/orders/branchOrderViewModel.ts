"use client";

import type {
  BranchOrder,
  LegacyOrderStatus,
  MyOrder,
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
} from "@/app/types/order.types";

const toNumber = (value: unknown) => Number(value ?? 0);

export function mapBranchOrderToMyOrder(order: BranchOrder): MyOrder {
  const subtotal = toNumber(order.subtotal);
  const shippingFee = toNumber(order.shippingFee);
  const discountAmount = toNumber(order.discountAmount);
  const finalAmount = toNumber(order.finalAmount);
  const branchName = order.branchName?.trim() || "Chưa gán chi nhánh";

  return {
    id: order.orderId,
    code: order.orderCode,
    orderCode: order.orderCode,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    receiverName: order.receiverName ?? order.customerName,
    receiverPhone: order.receiverPhone ?? order.customerPhone,
    shippingAddress: order.shippingAddress,
    totalAmount: subtotal,
    shippingFee,
    totalShippingFee: shippingFee,
    voucherCode: null,
    discountAmount,
    finalAmount,
    branchName,
    branchPhone: order.branchPhone ?? null,
    branchAddress: order.branchAddress ?? null,
    paymentMethod: String(order.paymentMethod || "COD") as PaymentMethod,
    paymentStatus: String(order.paymentStatus || "UNPAID") as OrderPaymentStatus,
    status: String(order.subOrderStatus || order.orderStatus || "PENDING") as OrderStatus,
    legacyStatus: (order.orderLegacyStatus ?? null) as LegacyOrderStatus | null,
    fulfillmentStatus: order.fulfillmentStatus ?? null,
    stockStatus: order.stockStatus ?? null,
    autoApproveAt: order.autoApproveAt ?? null,
    autoApprovalPaused: null,
    statusUpdatedAt: order.statusUpdatedAt ?? null,
    canConfirmReceived: null,
    createdAt: order.createdAt,
    note: order.note ?? null,
    cancelReasonCode: null,
    cancelReasonLabel: null,
    cancelReasonText: null,
    cancelReasonDisplay: order.cancelReasonDisplay ?? null,
    checkoutUrl: null,
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      productSlug: item.productSlug,
      productName: item.productName,
      sku: item.sku,
      image: item.image,
      quantity: item.quantity,
      allocatedQuantity: item.allocatedQuantity,
      missingQuantity: item.missingQuantity,
      price: toNumber(item.price),
      totalPrice: toNumber(item.totalPrice),
    })),
    subOrders: [
      {
        subOrderId: order.subOrderId,
        branchId: order.branchId ?? null,
        branchName,
        status: String(order.subOrderStatus || order.orderStatus || "PENDING") as OrderStatus,
        subtotal,
        shippingFee,
        estimatedDays: order.estimatedDays ?? null,
        carrier: order.carrier ?? null,
        carrierOrderId: null,
      },
    ],
    replenishmentRequested:
      Boolean(order.replenishmentRequested) ||
      Boolean((order.replenishmentDocuments ?? []).length),
    replenishmentDocuments: order.replenishmentDocuments ?? [],
    canReview: false,
  };
}
