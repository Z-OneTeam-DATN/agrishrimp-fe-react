"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CancelReasonSchema,
  type CancelReasonFormValues,
} from "@/app/types/order.schema";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { orderService } from "@/app/services/order.service";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CancelOrderModalProps {
  orderId: string;
  onClose: () => void;
  onOrderCancelled?: () => void;
}

const CANCEL_REASONS: Array<{
  code: CancelReasonFormValues["reasonCode"];
  label: string;
}> = [
  { code: "CHANGE_PRODUCT", label: "Muốn thay đổi sản phẩm" },
  { code: "CHANGE_ADDRESS", label: "Muốn thay đổi địa chỉ nhận hàng" },
  { code: "FOUND_CHEAPER", label: "Tìm thấy giá rẻ hơn" },
  { code: "OTHER", label: "Lý do khác" },
];

export function CancelOrderModal({
  orderId,
  onClose,
  onOrderCancelled,
}: CancelOrderModalProps) {
  const router = useRouter();
  const [showOtherReason, setShowOtherReason] = useState(false);

  const form = useForm<CancelReasonFormValues>({
    resolver: zodResolver(CancelReasonSchema),
    defaultValues: {
      otherReasonText: "",
    },
  });

  const handleReasonChange = (value: CancelReasonFormValues["reasonCode"]) => {
    form.setValue("reasonCode", value, { shouldValidate: true });
    setShowOtherReason(value === "OTHER");
    if (value !== "OTHER") {
      form.setValue("otherReasonText", "", { shouldValidate: true });
    }
  };

  const onSubmit = async (values: CancelReasonFormValues) => {
    try {
      await orderService.cancelOrder(orderId, values);
      toast.success("Yêu cầu hủy đơn hàng đã được gửi.");
      onOrderCancelled?.();
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error("Hủy đơn hàng thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Chọn lý do hủy</DialogTitle>
        <DialogDescription>
          Vui lòng chọn lý do bạn muốn hủy đơn hàng này.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="reasonCode"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) =>
                      handleReasonChange(
                        value as CancelReasonFormValues["reasonCode"],
                      )
                    }
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    {CANCEL_REASONS.map((reason) => (
                      <FormItem
                        key={reason.code}
                        className="flex cursor-pointer items-center space-x-2 rounded-md border p-2 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
                      >
                        <FormControl>
                          <RadioGroupItem
                            value={reason.code}
                            id={reason.code}
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor={reason.code}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {reason.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showOtherReason ? (
            <FormField
              control={form.control}
              name="otherReasonText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do chi tiết</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập lý do hủy chi tiết..."
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button type="submit" variant="destructive">
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
