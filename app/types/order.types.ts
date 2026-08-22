export interface CartItem {
  productVariantId: number
  quantity: number
  cartItemId?: number
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
  receiverName?: string
  receiverPhone?: string
  userAddressId?: number
}

export interface OrderItemDetail {
  productVariantId: number
  variantName: string
  variantSku?: string
  quantity: number
  allocatedQuantity?: number
  missingQuantity?: number
  unitPrice: number
  subtotal: number
}

export interface MissingItemReport {
  productVariantId: number
  sku: string
  productName: string
  variantName?: string | null
  imageUrl?: string | null
  totalMissingQuantity: number
  affectedSubOrders: number
}

export interface SubOrderDraft {
  branchId: number
  branchName: string
  branchAddress: string
  distanceKm: number
  durationMinutes: number
  items: OrderItemDetail[]
  subtotal: number
  shippingFee: number
  shippingWeightGram?: number
  shippingEstimate: boolean
  shippingEstimateReason?: string | null
  estimatedDays: string
  carrier: string
}

export interface OutOfStockItem {
  productVariantId: number
  variantSku: string
  variantName?: string
  requestedQty: number
  availableQty: number
}

export type PrepareStockStatus =
  | "FULLY_AVAILABLE"
  | "AVAILABLE_AFTER_TRANSFER"
  | "PARTIALLY_AVAILABLE"
  | "OUT_OF_STOCK"

export interface PreparePrimaryBranch {
  id: number
  name: string
  distanceKm: number
}

export interface SuggestedTransfer {
  fromBranchId: number
  fromBranchName: string
  toBranchId: number
  productVariantId: number
  quantity: number
}

export interface PrepareOrderPayload {
  userAddressId: number
  voucherCode?: string
  cart?: Array<{ productVariantId: number; quantity: number }>
}

export interface PrepareOrderResponse {
  prepareToken: string
  expiresAt?: string | null
  addressId?: number | null
  deliveryAddress?: string | null
  deliveryDistrictId?: number | null
  deliveryWardCode?: string | null
  receiverName?: string | null
  receiverPhone?: string | null
  canFulfill: boolean
  canPlaceOrder?: boolean
  requiresManualApproval?: boolean
  voucherCode?: string | null
  stockStatus?: PrepareStockStatus
  primaryBranch?: PreparePrimaryBranch | null
  suggestedTransfers?: SuggestedTransfer[]
  subOrders: SubOrderDraft[]
  totalSubtotal: number
  discountAmount: number
  totalShippingFee: number
  totalAmount: number
  outOfStockItems: OutOfStockItem[]
}

export interface ConfirmOrderPayload {
  prepareToken: string
  idempotencyKey: string
  paymentMethod: PaymentMethod
  note?: string
}

export interface ConfirmOrderResponse {
  orderId?: number | null
  orderCode?: string | null
  status: OrderStatus
  legacyStatus?: LegacyOrderStatus | null
  paymentStatus?: OrderPaymentStatus | null
  fulfillmentStatus?: FulfillmentStatus | null
  stockStatus?: PrepareStockStatus | null
  autoApproveAt?: string | null
  voucherCode?: string | null
  totalAmount: number
  discountAmount: number
  totalShippingFee: number
  checkoutUrl: string | null
  subOrders: Array<{
    subOrderId: number | null
    branchId: number | null
    branchName: string | null
    status: string
    subtotal: number
    shippingFee: number
    estimatedDays: string | null
    carrier: string | null
  }>
}

export type PaymentMethod = "COD" | "CASH" | "TRANSFER" | "PAYOS"

export type LegacyOrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "AWAITING_REPLENISHMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "SHIPPING"
  | "RECEIVED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED"

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PENDING_AUTO_APPROVAL"
  | "PENDING_SHORTAGE_REVIEW"
  | "PENDING_TRANSFER"
  | LegacyOrderStatus

export type FulfillmentStatus =
  | "NOT_STARTED"
  | "PREPARING"
  | "PACKED"
  | "READY_TO_SHIP"
  | "HANDED_TO_CARRIER"
  | "SHIPPING"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "RETURNING"
  | "RETURNED"

export type OrderPaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PENDING_VERIFICATION"
  | "PARTIALLY_PAID"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "REFUND_PENDING"
  | "REFUNDED"

export type OrderCancelReasonCode =
  | "CHANGE_PRODUCT"
  | "CHANGE_ADDRESS"
  | "FOUND_CHEAPER"
  | "OTHER"
  | "PAYMENT_EXPIRED"
  | "ADMIN_CANCELLED"
  | "SUB_ORDERS_CANCELLED"

export interface SubOrderSummary {
  subOrderId: number
  branchId: number | null
  branchName: string | null
  status: OrderStatus
  subtotal: number
  shippingFee: number
  estimatedDays: string | null
  carrier: string | null
  carrierOrderId?: string | null
}

export interface OrderReplenishmentDocument {
  sku?: string
  missingQuantity?: number
  sourceType?:
    | "BRANCH_TRANSFER"
    | "WAREHOUSE_TRANSFER"
    | "PURCHASE_REQUEST"
    | "BLOCKED"
    | string
  sourceBranchName?: string | null
  destinationBranchName?: string | null
  documentId?: number | string | null
  documentType?: "TRANSFER" | "PURCHASE_REQUEST" | "BLOCKED" | string | null
  documentCode?: string | null
  documentPath?: string | null
  documentLabel?: string | null
  message?: string | null
}

export interface MyOrder {
  id: number
  code: string
  orderCode?: string
  customerName: string
  customerPhone: string
  receiverName?: string | null
  receiverPhone: string
  shippingAddress: string
  totalAmount: number
  shippingFee: number
  totalShippingFee?: number
  voucherCode?: string | null
  discountAmount?: number
  finalAmount: number
  branchName: string
  branchPhone: string | null
  branchAddress: string | null
  paymentMethod: PaymentMethod
  paymentStatus: OrderPaymentStatus
  status: OrderStatus
  legacyStatus?: LegacyOrderStatus | null
  fulfillmentStatus?: FulfillmentStatus | null
  stockStatus?: PrepareStockStatus | null
  autoApproveAt?: string | null
  autoApprovalPaused?: boolean | null
  createdAt: string
  note?: string | null
  cancelReasonCode?: OrderCancelReasonCode | null
  cancelReasonLabel?: string | null
  cancelReasonText?: string | null
  cancelReasonDisplay?: string | null
  checkoutUrl: string | null
  items: MyOrderItem[]
  subOrders?: SubOrderSummary[]
  replenishmentRequested?: boolean | null
  replenishmentDocuments?: OrderReplenishmentDocument[] | null
  canReview?: boolean
}

export interface MyOrderItem {
  id: number
  productId?: number
  productSlug?: string
  productName: string
  sku: string
  image: string | null
  quantity: number
  allocatedQuantity?: number
  missingQuantity?: number
  price: number
  totalPrice: number
  canReview?: boolean
}

export interface BranchOrderItem {
  id: number
  productId?: number
  productSlug?: string
  productName: string
  sku: string
  image: string | null
  quantity: number
  allocatedQuantity?: number
  missingQuantity?: number
  price: number
  totalPrice: number
}

export interface BranchOrder {
  orderId: number
  orderCode: string
  customerName: string
  customerPhone: string
  shippingAddress: string
  createdAt: string
  paymentMethod: string
  paymentStatus: OrderPaymentStatus
  orderStatus: OrderStatus
  orderLegacyStatus?: LegacyOrderStatus | null
  fulfillmentStatus?: FulfillmentStatus | null
  stockStatus?: PrepareStockStatus | null
  autoApproveAt?: string | null
  subOrderId: number
  subOrderStatus: OrderStatus
  subtotal: number
  shippingFee: number
  estimatedDays: string | null
  carrier: string | null
  statusUpdatedAt?: string | null
  shippingOverdue?: boolean
  canMarkReceived?: boolean
  overdueShippingDays?: number
  items: BranchOrderItem[]
}
