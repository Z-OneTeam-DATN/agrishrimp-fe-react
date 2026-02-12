'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CancelReasonSchema, CancelReasonFormValues } from '@/app/types/order.schema';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { OrderService } from '@/app/services/order.service';
import { useRouter } from 'next/navigation';

interface CancelOrderModalProps {
  orderId: string;
  onClose: () => void;
  onOrderCancelled?: () => void;
}

export function CancelOrderModal({ orderId, onClose, onOrderCancelled }: CancelOrderModalProps) {
  const router = useRouter();
  const [showOtherReason, setShowOtherReason] = useState(false);

  const form = useForm<CancelReasonFormValues>({
    resolver: zodResolver(CancelReasonSchema),
    defaultValues: {
      orderId: orderId,
      reasonCode: '',
      otherReasonText: '',
    },
  });

  const reasons = [
    { code: 'change_product', label: 'Muốn thay đổi sản phẩm' },
    { code: 'change_address', label: 'Muốn thay đổi địa chỉ nhận hàng' },
    { code: 'found_cheaper', label: 'Tìm thấy giá rẻ hơn' },
    { code: 'other', label: 'Lý do khác' },
  ];

  const handleReasonChange = (value: string) => {
    form.setValue('reasonCode', value);
    setShowOtherReason(value === 'other');
    if (value !== 'other') {
      form.setValue('otherReasonText', ''); // Clear other reason if not selected
    }
  };

  const onSubmit = async (values: CancelReasonFormValues) => {
    if (!values.reasonCode) {
      toast.error('Vui lòng chọn lý do hủy đơn hàng.');
      return;
    }
    if (values.reasonCode === 'other' && !values.otherReasonText?.trim()) {
        toast.error('Vui lòng nhập lý do hủy chi tiết.');
        return;
    }

    try {
      await OrderService.cancelOrder(orderId, values);
      toast.success('Yêu cầu hủy đơn hàng đã được gửi.');
      onOrderCancelled?.();
      onClose();
      router.refresh(); // Refresh the page to update order list
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Hủy đơn hàng thất bại. Vui lòng thử lại.');
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
                    onValueChange={handleReasonChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    {reasons.map((reason) => (
                      <FormItem key={reason.code} className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer has-[:checked]:border-green-600 has-[:checked]:bg-green-50">
                        <FormControl>
                          <RadioGroupItem value={reason.code} id={reason.code} />
                        </FormControl>
                        <FormLabel htmlFor={reason.code} className="flex-1 font-normal cursor-pointer">
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

          {showOtherReason && (
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
                      value={field.value ?? ''} 
                      rows={3} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <DialogFooter className="flex justify-end gap-2 mt-4">
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
