import { z } from "zod";

export const OrderItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  imageUrl: z.string().url(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  displayUnitPrice: z.string().optional(),
  variant: z.string().optional(),
});

export const OrderStatusEnum = z.enum([
  "ALL",
  "AWAITING_PAYMENT",
  "AWAITING_REPLENISHMENT",
  "PENDING",
  "READY_FOR_PICKUP",
  "SHIPPING",
  "RECEIVED",
  "COMPLETED",
  "RETURNED",
  "CANCELLED",
]);

export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderSchema = z.object({
  id: z.string(),
  shopName: z.string(),
  status: OrderStatusEnum,
  items: z.array(OrderItemSchema),
  totalAmount: z.number().positive(),
  displayTotalAmount: z.string(),
  canCancel: z.boolean().optional(),
  canReturn: z.boolean().optional(),
  canReview: z.boolean().optional(),
  canRepurchase: z.boolean().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const CancelReasonSchema = z.object({
  orderId: z.string(),
  reasonCode: z.string().min(1, { message: "Vui long chon ly do huy" }),
  otherReasonText: z.string().optional().nullable(),
});

export type CancelReasonFormValues = z.infer<typeof CancelReasonSchema>;
