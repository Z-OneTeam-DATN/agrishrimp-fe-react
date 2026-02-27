export interface CartItem {
  productVariantId: number
  quantity: number
  // Dùng cho hiển thị UI — lấy từ cart store
  productName?: string
  variantName?: string
  unitPrice?: number
  imageUrl?: string
  weightGram?: number
}

export interface DeliveryInfo {
  address: string
  districtId: number
  wardCode: string
  districtName?: string
  wardName?: string
}

/** Item trong mỗi sub-order — khớp response BE */
export interface OrderItemDetail {
  productVariantId: number
  variantName: string
  variantSku?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

/** Đơn con theo chi nhánh — khớp response /orders/prepare */
export interface SubOrderDraft {
  branchId: number
  branchName: string
  branchAddress: string
  distanceKm: number
  durationMinutes: number
  items: OrderItemDetail[]
  subtotal: number
  shippingFee: number
  /** true = phí ship là ước tính (GHN lỗi, fallback 30.000đ) */
  shippingEstimate: boolean
  estimatedDays: string
  carrier: string
}

export interface OutOfStockItem {
  productVariantId: number
  variantName: string
  variantSku?: string
  requestedQty: number
  availableQty: number
}

export interface PrepareOrderPayload {
  userLat: number
  userLng: number
  deliveryAddress: string
  deliveryDistrictId: number
  deliveryWardCode: string
  cart: CartItem[]
}

/** Response từ POST /api/orders/prepare */
export interface PrepareOrderResponse {
  /** Token dùng ở bước confirm — hết hạn sau 30 phút */
  prepareToken: string
  canFulfill: boolean
  subOrders: SubOrderDraft[]
  totalSubtotal: number
  totalShippingFee: number
  totalAmount: number
  outOfStockItems: OutOfStockItem[]
}

export interface ConfirmOrderPayload {
  prepareToken: string
  paymentMethod: PaymentMethod
  note?: string
}

/** Response từ POST /api/orders/confirm */
export interface ConfirmOrderResponse {
  orderId: number
  orderCode: string
  status: 'PENDING' | 'CONFIRMED'
  totalAmount: number
  totalShippingFee: number
  /** Có giá trị khi paymentMethod = PAYOS, null với COD/CASH/TRANSFER */
  checkoutUrl: string | null
  subOrders: Array<{
    subOrderId: number
    branchId: number
    branchName: string
    status: string
    subtotal: number
    shippingFee: number
    estimatedDays: string
    carrier: string
  }>
}

/** COD: tiền mặt khi nhận | CASH: tiền mặt tại cửa hàng | TRANSFER: chuyển khoản | PAYOS: thanh toán online */
export type PaymentMethod = 'COD' | 'CASH' | 'TRANSFER' | 'PAYOS'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED'

export interface MyOrder {
  id: number;
  code: string;
  customerName: string;
  customerPhone: string;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'UNPAID';
  status: OrderStatus;
  branchName: string;
  createdAt: string;
  shippingAddress: string;
  checkoutUrl: string | null;
  items: MyOrderItem[];
}

export interface MyOrderItem {
  id: number;
  productName: string;
  sku: string;
  image: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

// ============================================
// BRANCH ORDER MANAGEMENT (API /branch/orders)
// ============================================

export interface BranchOrderItem {
  id: number;
  productName: string;
  sku: string;
  image: string | null;
  quantity: number;
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
  paymentStatus: 'PAID' | 'UNPAID';
  orderStatus: OrderStatus;
  subOrderId: number;
  subOrderStatus: OrderStatus;
  subtotal: number;
  shippingFee: number;
  estimatedDays: string | null;
  carrier: string | null;
  items: BranchOrderItem[];
}
