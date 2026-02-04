'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addressSchema, AddressFormValues } from '@/app/types/address.schema';
import { Save, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface AddressFormProps {
  initialValues?: AddressFormValues;
  onSubmit: (data: AddressFormValues) => void;
  title: string;
  isSubmitting?: boolean;
}

export default function AddressForm({ initialValues, onSubmit, title, isSubmitting = false }: AddressFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues || {
      fullName: '',
      phone: '',
      provinceId: '',
      districtId: '',
      wardId: '',
      specificAddress: '',
      addressType: 'Home',
      isDefault: false
    }
  });

  // Helper class để input luôn trắng đẹp
  const getInputClass = (hasError: boolean) => `
    w-full px-3 py-2.5 border rounded-lg text-sm outline-none transition-all
    bg-white text-gray-900 placeholder:text-gray-400
    ${hasError 
      ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
      : 'border-gray-300 focus:border-[#329965] focus:ring-2 focus:ring-[#329965]/20' 
    }
  `;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
        <Link href="/address" className="text-gray-500 hover:text-[#329965] transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-800 text-lg">{title}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        
        {/* Họ tên & SĐT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input 
              {...register('fullName')}
              className={getInputClass(!!errors.fullName)}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
            {errors.fullName && <span className="text-xs text-red-500 mt-1 block">{errors.fullName.message}</span>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input 
              {...register('phone')}
              className={getInputClass(!!errors.phone)}
              placeholder="Ví dụ: 0909..."
            />
            {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone.message}</span>}
          </div>
        </div>

        {/* Địa chính (Tỉnh/Huyện/Xã) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Tỉnh/Thành <span className="text-red-500">*</span></label>
             <select {...register('provinceId')} className={getInputClass(!!errors.provinceId)}>
                <option value="">Chọn Tỉnh/Thành</option>
                <option value="CT">Cần Thơ</option>
                <option value="HCM">Hồ Chí Minh</option>
             </select>
             {errors.provinceId && <span className="text-xs text-red-500 mt-1 block">{errors.provinceId.message}</span>}
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Quận/Huyện <span className="text-red-500">*</span></label>
             <select {...register('districtId')} className={getInputClass(!!errors.districtId)}>
                <option value="">Chọn Quận/Huyện</option>
                <option value="NK">Ninh Kiều</option>
                <option value="CR">Cái Răng</option>
             </select>
             {errors.districtId && <span className="text-xs text-red-500 mt-1 block">{errors.districtId.message}</span>}
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Phường/Xã <span className="text-red-500">*</span></label>
             <select {...register('wardId')} className={getInputClass(!!errors.wardId)}>
                <option value="">Chọn Phường/Xã</option>
                <option value="XK">Xuân Khánh</option>
                <option value="HL">Hưng Lợi</option>
             </select>
             {errors.wardId && <span className="text-xs text-red-500 mt-1 block">{errors.wardId.message}</span>}
          </div>
        </div>

        {/* Địa chỉ cụ thể */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
             Địa chỉ cụ thể <span className="text-red-500">*</span>
          </label>
          <textarea 
             {...register('specificAddress')}
             rows={2}
             className={getInputClass(!!errors.specificAddress)}
             placeholder="Số nhà, tên đường, tòa nhà..."
          ></textarea>
          {errors.specificAddress && <span className="text-xs text-red-500 mt-1 block">{errors.specificAddress.message}</span>}
        </div>

        {/* Loại địa chỉ & Mặc định */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Cài đặt địa chỉ:</label>
          <div className="flex flex-col md:flex-row gap-6">
             <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                   <input type="radio" value="Home" {...register('addressType')} className="w-4 h-4 cursor-pointer accent-[#329965]" />
                   <span className="text-sm text-gray-700">Nhà riêng</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                   <input type="radio" value="Office" {...register('addressType')} className="w-4 h-4 cursor-pointer accent-[#329965]" />
                   <span className="text-sm text-gray-700">Văn phòng</span>
                </label>
             </div>
             <label className="flex items-center gap-2 cursor-pointer select-none">
                 <input type="checkbox" {...register('isDefault')} className="w-4 h-4 cursor-pointer accent-[#329965] rounded" />
                 <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
             </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/address">
            <button type="button" className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              Hủy bỏ
            </button>
          </Link>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#329965] hover:bg-[#268050] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
          >
            <Save size={18} /> {isSubmitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
          </button>
        </div>

      </form>
    </div>
  );
}