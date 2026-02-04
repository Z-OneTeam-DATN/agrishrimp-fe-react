'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
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
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>
          <div className="lg:col-span-9">
            <div className="max-w-xl mx-auto">
              <VoucherForm onSubmit={handleAddVoucher} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}