'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import VoucherForm from '@/components/voucher/VoucherForm';

export default function CreateVoucherPage() {
  const router = useRouter();

  const handleAddVoucher = (code: string) => {
    // Giả lập gọi API kiểm tra và lưu mã
    console.log('Adding voucher code:', code);
    
    // Simulate delay
    setTimeout(() => {
      toast.success(`Đã lưu mã ${code.toUpperCase()} vào ví!`);
      router.push('/voucher'); // Quay về trang danh sách
    }, 500);
  };

  return (
    <div className="max-w-xl mx-auto">
      <VoucherForm onSubmit={handleAddVoucher} />
    </div>
  );
}