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
    w-full px-4 h-12 border rounded-lg text-sm outline-none transition-all
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

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 pb-20"> {/* Changed space-y-5 to space-y-6, added pb-20 */}
        
        {/* Họ tên & SĐT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed gap-5 to gap-4 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2"> {/* Changed mb-1 to mb-2 */}
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
            <label className="block text-sm font-bold text-gray-700 mb-2"> {/* Changed mb-1 to mb-2 */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Changed gap-5 to gap-4 */}
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Tỉnh/Thành <span className="text-red-500">*</span></label> {/* Changed mb-1 to mb-2 */}
             <select {...register('provinceId')} className={getInputClass(!!errors.provinceId)}>
                <option value="">Chọn Tỉnh/Thành</option>
                <option value="CT">Cần Thơ</option>
                <option value="HCM">Hồ Chí Minh</option>
             </select>
             {errors.provinceId && <span className="text-xs text-red-500 mt-1 block">{errors.provinceId.message}</span>}
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Quận/Huyện <span className="text-red-500">*</span></label> {/* Changed mb-1 to mb-2 */}
             <select {...register('districtId')} className={getInputClass(!!errors.districtId)}>
                <option value="">Chọn Quận/Huyện</option>
                <option value="NK">Ninh Kiều</option>
                <option value="CR">Cái Răng</option>
             </select>
             {errors.districtId && <span className="text-xs text-red-500 mt-1 block">{errors.districtId.message}</span>}
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2">Phường/Xã <span className="text-red-500">*</span></label> {/* Changed mb-1 to mb-2 */}
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
          <label className="block text-sm font-bold text-gray-700 mb-2"> {/* Changed mb-1 to mb-2 */}
             Địa chỉ cụ thể <span className="text-red-500">*</span>
          </label>
          <textarea 
             {...register('specificAddress')}
             rows={3} // Increased rows for better mobile input
             className={getInputClass(!!errors.specificAddress)}
             placeholder="Số nhà, tên đường, tòa nhà..."
          ></textarea>
          {errors.specificAddress && <span className="text-xs text-red-500 mt-1 block">{errors.specificAddress.message}</span>}
        </div>

        {/* Loại địa chỉ & Mặc định */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Cài đặt địa chỉ:</label>
          <div className="flex flex-wrap gap-3"> {/* Changed from flex-col md:flex-row gap-6 */}
             <div className="flex-1"> {/* Wrap address type radios in a div */}
                <div className="flex gap-3">
                    {['Home', 'Office'].map((type) => (
                        <label 
                            key={type} 
                            className={`
                                flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-colors h-12
                                ${initialValues?.addressType === type 
                                ? 'bg-[#eafef9] border-[#2d9f8d] text-[#2d9f8d] font-bold' 
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                }
                            `}
                        >
                            <input type="radio" value={type} {...register('addressType')} className="hidden" />
                            <span className="text-sm">{type === 'Home' ? 'Nhà riêng' : 'Văn phòng'}</span>
                        </label>
                    ))}
                </div>
             </div>
             <label className="flex items-center gap-2 cursor-pointer select-none h-12 px-4 bg-white border border-gray-300 rounded-lg flex-1 md:flex-none">
                 <input type="checkbox" {...register('isDefault')} className="w-4 h-4 cursor-pointer accent-[#329965] rounded" />
                 <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
             </label>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg lg:relative lg:p-0 lg:bg-transparent lg:shadow-none z-10">
          <div className="flex gap-3">
            <Link href="/address" className="flex-1">
              <button type="button" className="w-full h-12 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Hủy bỏ
              </button>
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-12 text-sm font-bold text-white bg-[#329965] hover:bg-[#268050] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Save size={18} /> {isSubmitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}