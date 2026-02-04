'use client';

import { AddressFormValues } from '@/app/types/user.schema';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserService } from '@/app/services/user.service';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react'; // Using Lucide icon for consistency

interface AddressItemProps {
  address: AddressFormValues;
  onEdit: (address: AddressFormValues) => void;
  onRefresh: () => void; // To refresh the list after delete/set default
}

export function AddressItem({ address, onEdit, onRefresh }: AddressItemProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!address.id) return;
    try {
      await UserService.deleteAddress(address.id);
      toast.success('Xóa địa chỉ thành công!');
      onRefresh();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Xóa địa chỉ thất bại. Vui lòng thử lại.');
    }
  };

  const handleSetDefault = async () => {
    if (!address.id) return;
    try {
      await UserService.setDefaultAddress(address.id);
      toast.success('Đặt địa chỉ mặc định thành công!');
      onRefresh();
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Đặt địa chỉ mặc định thất bại. Vui lòng thử lại.');
    }
  };

  // Helper to get descriptive names for IDs (mock for now)
  const getProvinceName = (id: string) => {
    switch (id) {
      case '1': return 'Cần Thơ';
      case '2': return 'Hồ Chí Minh';
      case '3': return 'Hà Nội';
      default: return id;
    }
  };
  const getDistrictName = (id: string) => {
    switch (id) {
      case '1': return 'Ninh Kiều';
      case '2': return 'Cái Răng';
      default: return id;
    }
  };
  const getWardName = (id: string) => {
    switch (id) {
      case '1': return 'Xuân Khánh';
      case '2': return 'Hưng Lợi';
      default: return id;
    }
  };

  return (
    <div className="address-item flex justify-between items-start py-5 border-b border-gray-200 last:border-b-0">
      <div className="addr-info flex-1">
        <h6 className="font-bold text-gray-800 text-base mb-1">
          {address.fullName} <span className="text-gray-400 font-light mx-2">|</span> <span className="font-medium text-gray-600">{address.phone}</span>
        </h6>
        <div className="text-sm text-gray-700 mt-1 leading-relaxed">
          {address.specificAddress}, {getWardName(address.wardId)}, {getDistrictName(address.districtId)}, {getProvinceName(address.provinceId)}
        </div>
        {address.isDefault && (
          <span className="inline-flex items-center mt-2 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 border border-green-700 rounded-md">
            <CheckCircle size={14} className="mr-1" /> Mặc định
          </span>
        )}
      </div>
      <div className="addr-actions flex flex-col items-end gap-2">
        <div className="action-group flex gap-3 text-sm">
          <button
            type="button"
            onClick={() => onEdit(address)}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Cập nhật
          </button>
          {!address.isDefault && ( // Only show delete if not default address
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-600 hover:underline cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>
        {address.isDefault ? (
          <Button disabled className="btn-set-default px-3 py-1 text-xs bg-gray-100 text-gray-500 border border-gray-200 cursor-default">
            Đã là mặc định
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSetDefault}
            className="btn-set-default px-3 py-1 text-xs border border-gray-300 bg-white text-gray-600 hover:border-green-600 hover:text-green-600"
          >
            Thiết lập mặc định
          </Button>
        )}
      </div>
    </div>
  );
}
