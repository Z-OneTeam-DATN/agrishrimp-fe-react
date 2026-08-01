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
  "PENDING_PAYMENT",
  "PENDING_AUTO_APPROVAL",
  "PENDING_SHORTAGE_REVIEW",
  "PENDING_TRANSFER",
  "AWAITING_PAYMENT",
  "AWAITING_REPLENISHMENT",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
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

export const CancelReasonCodeEnum = z.enum([
  "CHANGE_PRODUCT",
  "CHANGE_ADDRESS",
  "FOUND_CHEAPER",
  "OTHER",
]);

export const CancelReasonSchema = z.object({
  reasonCode: CancelReasonCodeEnum,
  otherReasonText: z.string().optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.reasonCode === "OTHER" && !value.otherReasonText?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["otherReasonText"],
      message: "Vui long nhap ly do huy chi tiet",
    });
  }
});

export type CancelReasonFormValues = z.infer<typeof CancelReasonSchema>;
