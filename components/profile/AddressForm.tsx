'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// 👇 Ensure this import path is correct for your project
import { addressSchema, AddressFormValues } from '@/app/types/user.schema';
import { toast } from 'sonner';

interface AddressFormProps {
  initialValues?: AddressFormValues;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddressForm({ initialValues, onSuccess, onCancel }: AddressFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues || {
      fullName: '',
      phone: '',
      provinceId: '', // Note: Changed to match schema key 'provinceId'
      districtId: '', // Note: Changed to match schema key 'districtId'
      wardId: '',     // Note: Changed to match schema key 'wardId'
      specificAddress: '',
      addressType: 'Home', // Note: Changed to match schema enum 'Home'
      isDefault: false
    }
  });

  const onSubmit = async (data: AddressFormValues) => {
    // This is where you will call your API later
    console.log("Submitting Address Data:", data);
    
    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Lưu địa chỉ thành công!');
    onSuccess();
  };

  // Helper function for dynamic input classes
  const getInputClass = (hasError: boolean) => `
    w-full px-3 py-2 border rounded-md text-sm outline-none transition-all
    !bg-white !text-gray-900 placeholder:text-gray-400
    ${hasError 
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200' 
      : 'border-gray-300 focus:border-[#329965] focus:ring-1 focus:ring-[#329965]' 
    }
  `;

  // Styles for radio/checkbox to ensure light theme
  const checkStyle = { colorScheme: 'light' };
  const checkClass = "w-4 h-4 cursor-pointer accent-[#329965] !bg-white border-gray-300";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      
      {/* Full Name & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('fullName')}
            type="text" 
            className={getInputClass(!!errors.fullName)}
            placeholder="Nhập họ tên"
          />
          {errors.fullName && <span className="text-xs text-red-500 mt-1 block">{errors.fullName.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('phone')}
            type="text" 
            className={getInputClass(!!errors.phone)}
            placeholder="Nhập số điện thoại"
          />
          {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone.message}</span>}
        </div>
      </div>

      {/* Location Selects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
                Tỉnh/Thành <span className="text-red-500">*</span>
            </label>
            <select 
                {...register('provinceId')} 
                className={getInputClass(!!errors.provinceId)}
            >
                <option value="">Chọn Tỉnh/Thành</option>
                <option value="CT">Cần Thơ</option>
                <option value="HCM">Hồ Chí Minh</option>
                <option value="HN">Hà Nội</option>
            </select>
            {errors.provinceId && <span className="text-xs text-red-500 mt-1 block">{errors.provinceId.message}</span>}
        </div>

        {/* District */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
                Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <select 
                {...register('districtId')} 
                className={getInputClass(!!errors.districtId)}
            >
                <option value="">Chọn Quận/Huyện</option>
                <option value="NK">Ninh Kiều</option>
                <option value="CR">Cái Răng</option>
                {/* Add logic to filter districts based on province if needed */}
            </select>
            {errors.districtId && <span className="text-xs text-red-500 mt-1 block">{errors.districtId.message}</span>}
        </div>

        {/* Ward */}
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
                Phường/Xã <span className="text-red-500">*</span>
            </label>
            <select 
                {...register('wardId')} 
                className={getInputClass(!!errors.wardId)}
            >
                <option value="">Chọn Phường/Xã</option>
                <option value="XK">Xuân Khánh</option>
                <option value="HL">Hưng Lợi</option>
                 {/* Add logic to filter wards based on district if needed */}
            </select>
            {errors.wardId && <span className="text-xs text-red-500 mt-1 block">{errors.wardId.message}</span>}
        </div>
      </div>

      {/* Specific Address */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
            Địa chỉ cụ thể <span className="text-red-500">*</span>
        </label>
        <textarea 
            {...register('specificAddress')}
            rows={2}
            className={getInputClass(!!errors.specificAddress)}
            placeholder="Số nhà, tên đường..."
        ></textarea>
        {errors.specificAddress && <span className="text-xs text-red-500 mt-1 block">{errors.specificAddress.message}</span>}
      </div>

      {/* Address Type & Default */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Loại địa chỉ:</label>
        <div className="flex gap-6 mb-3">
            <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                    {...register('addressType')} 
                    type="radio" 
                    value="Home" // Matches schema enum
                    style={checkStyle} 
                    className={checkClass} 
                />
                <span className="text-sm text-gray-700 font-medium group-hover:text-[#329965]">Nhà riêng</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                    {...register('addressType')} 
                    type="radio" 
                    value="Office" // Matches schema enum
                    style={checkStyle} 
                    className={checkClass} 
                />
                <span className="text-sm text-gray-700 font-medium group-hover:text-[#329965]">Văn phòng</span>
            </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none group">
             <input 
                {...register('isDefault')} 
                type="checkbox" 
                style={checkStyle} 
                className={`${checkClass} rounded`} 
             />
             <span className="text-sm text-gray-700 font-medium group-hover:text-[#329965]">Đặt làm địa chỉ mặc định</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-5 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 font-medium transition-colors"
        >
          Trở lại
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-5 py-2 text-sm text-white bg-[#329965] rounded-md font-bold hover:bg-[#268050] disabled:opacity-70 flex items-center gap-2 transition-colors"
        >
          {isSubmitting ? 'Đang lưu...' : 'Hoàn thành'}
        </button>
      </div>
    </form>
  );
}