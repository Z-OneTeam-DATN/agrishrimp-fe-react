'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import AddressForm from '@/components/profile/AddressForm';
import { AddressFormValues } from '@/app/types/address.schema';

// Mock function lấy data
const getAddressById = (id: string): AddressFormValues => {
console.log('Đang lấy dữ liệu cho địa chỉ ID:', id);
  return {
    fullName: 'Võ Thị Mỹ Thanh',
    phone: '0909123456',
    provinceId: 'CT',
    districtId: 'NK',
    wardId: 'XK',
    specificAddress: '123 Đường 3/2',
    addressType: 'Home',
    isDefault: true
  };
};

export default function EditAddressPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const addressData = getAddressById(params.id); // Thực tế bạn sẽ fetch API tại đây

  const handleUpdate = (data: AddressFormValues) => {
    console.log('Update Address:', data);
    toast.success('Cập nhật địa chỉ thành công!');
    router.push('/address');
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
              title="Cập nhật địa chỉ" 
              initialValues={addressData}
              onSubmit={handleUpdate} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}