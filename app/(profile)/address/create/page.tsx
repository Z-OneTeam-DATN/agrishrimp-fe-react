'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import AddressForm from '@/components/profile/AddressForm';
import { AddressFormValues } from '@/app/types/address.schema';

export default function CreateAddressPage() {
  const router = useRouter();

  const handleCreate = (data: AddressFormValues) => {
    // Gọi API thêm mới ở đây
    console.log('New Address:', data);
    toast.success('Thêm địa chỉ thành công!');
    router.push('/address'); // Quay về danh sách
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>
          <div className="lg:col-span-9">
            <AddressForm 
              title="Thêm địa chỉ mới" 
              onSubmit={handleCreate} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}