import { z } from 'zod';

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  imageUrl: z.string().url(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  displayUnitPrice: z.string().optional(),
  variant: z.string().optional(),
});

// Update enum to match your tab requirements
export const OrderStatusEnum = z.enum([
  'ALL',
  'PENDING',          // Chờ xác nhận
  'SHIPPING',         // Đang giao
  'COMPLETED',        // Đã giao
  'RETURN_REQUESTED', // Trả hàng/Hoàn tiền
  'CANCELLED',        // Đã hủy
]);

export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderSchema = z.object({
  id: z.string(),
  shopName: z.string(),
  status: OrderStatusEnum,
  items: z.array(OrderItemSchema),
  totalAmount: z.number().positive(),
  displayTotalAmount: z.string(),
  // Add these for UI logic
  canCancel: z.boolean().optional(),
  canReturn: z.boolean().optional(),
  canReview: z.boolean().optional(),
  canRepurchase: z.boolean().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CancelReasonSchema = z.object({
  orderId: z.string(),
  reasonCode: z.string().min(1, { message: 'Vui lòng chọn lý do hủy' }),
  otherReasonText: z.string().optional().nullable(),
});

export type CancelReasonFormValues = z.infer<typeof CancelReasonSchema>;