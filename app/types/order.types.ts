export interface CartItem {
  productVariantId: number;
  quantity: number;
  // Dùng cho hiển thị UI — lấy từ cart store
  productName?: string;
  variantName?: string;
  unitPrice?: number;
  imageUrl?: string;
  weightGram?: number;
}

export interface DeliveryInfo {
  address: string;
  districtId: number;
  wardCode: string;
  districtName?: string;
  wardName?: string;
  receiverName?: string;
  receiverPhone?: string;
  userAddressId?: number;
}

/** Item trong mỗi sub-order — khớp response BE */
export interface OrderItemDetail {
  productVariantId: number;
  variantName: string;
  variantSku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface MissingItemReport {
  productVariantId: number;
  sku: string;
  productName: string;
  variantName?: string | null;
  totalMissingQuantity: number;
  affectedSubOrders: number;
}

/** Đơn con theo chi nhánh — khớp response /orders/prepare */
export interface SubOrderDraft {
  branchId: number;
  branchName: string;
  branchAddress: string;
  distanceKm: number;
  durationMinutes: number;
  items: OrderItemDetail[];
  subtotal: number;
  shippingFee: number;
  /** true = phí ship là ước tính (GHN lỗi, fallback 30.000đ) */
  shippingEstimate: boolean;
  estimatedDays: string;
  carrier: string;
}

export interface OutOfStockItem {
  productVariantId: number;
  variantSku: string;
  variantName?: string;
  requestedQty: number;
  availableQty: number;
}

export interface PrepareOrderPayload {
  userAddressId: number;
  /** GPS tùy chọn — nếu có thì phí ship chính xác hơn */
  userLat?: number;
  userLng?: number;
  voucherCode?: string;
  /** Không gửi / gửi null → BE lấy toàn bộ giỏ hàng từ DB */
  cart?: Array<{ productVariantId: number; quantity: number }>;
}

/** Response từ POST /api/orders/prepare */
export interface PrepareOrderResponse {
  /** Token dùng ở bước confirm — hết hạn sau 30 phút */
  prepareToken: string;
  canFulfill: boolean;
  voucherCode?: string | null;
  subOrders: SubOrderDraft[];
  totalSubtotal: number;
  discountAmount: number;
  totalShippingFee: number;
  totalAmount: number;
  outOfStockItems: OutOfStockItem[];
}

export interface ConfirmOrderPayload {
  prepareToken: string;
  paymentMethod: PaymentMethod;
  note?: string;
}

/** Response từ POST /api/orders/confirm */
export interface ConfirmOrderResponse {
  orderId: number;
  orderCode: string;
  status: OrderStatus;
  voucherCode?: string | null;
  totalAmount: number;
  discountAmount: number;
  totalShippingFee: number;
  /** Có giá trị khi paymentMethod = PAYOS, null với COD/CASH/TRANSFER */
  checkoutUrl: string | null;
  subOrders: Array<{
    subOrderId: number;
    branchId: number;
    branchName: string;
    status: string;
    subtotal: number;
    shippingFee: number;
    estimatedDays: string;
    carrier: string;
  }>;
}

/** COD: tiền mặt khi nhận | CASH: tiền mặt tại cửa hàng | TRANSFER: chuyển khoản | PAYOS: thanh toán online */
export type PaymentMethod = "COD" | "CASH" | "TRANSFER" | "PAYOS";

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "AWAITING_REPLENISHMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED";

export interface SubOrderSummary {
  subOrderId: number;
  branchId: number | null;
  branchName: string | null;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  estimatedDays: string | null;
  carrier: string | null;
  carrierOrderId?: string | null;
}

export interface MyOrder {
  id: number;
  code: string;
  orderCode?: string;
  customerName: string;
  customerPhone: string;
  receiverName?: string | null;
  receiverPhone: string;
  shippingAddress: string;
  totalAmount: number;
  shippingFee: number;
  totalShippingFee?: number;
  finalAmount: number;
  branchName: string;
  branchPhone: string | null;
  branchAddress: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: "PAID" | "UNPAID";
  status: OrderStatus;
  createdAt: string;
  note?: string | null;
  checkoutUrl: string | null;
  items: MyOrderItem[];
  subOrders?: SubOrderSummary[];
  canReview?: boolean;
}

export interface MyOrderItem {
  id: number;
  productId?: number;
  productSlug?: string;
  productName: string;
  sku: string;
  image: string | null;
  quantity: number;
  allocatedQuantity?: number;
  missingQuantity?: number;
  price: number;
  totalPrice: number;
  canReview?: boolean;
}

// ============================================
// BRANCH ORDER MANAGEMENT (API /branch/orders)
// ============================================

export interface BranchOrderItem {
  id: number;
  productId?: number;
  productSlug?: string;
  productName: string;
  sku: string;
  image: string | null;
  quantity: number;
  allocatedQuantity?: number;
  missingQuantity?: number;
  price: number;
  totalPrice: number;
}

export interface BranchOrder {
  orderId: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: string;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID";
  orderStatus: OrderStatus;
  subOrderId: number;
  subOrderStatus: OrderStatus;
  subtotal: number;
  shippingFee: number;
  estimatedDays: string | null;
  carrier: string | null;
  items: BranchOrderItem[];
}
