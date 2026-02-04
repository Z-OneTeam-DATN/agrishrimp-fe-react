'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editProfileSchema, EditProfileFormValues } from '@/app/types/user.schema';
import { Camera } from 'lucide-react';

interface EditProfileFormProps {
  initialValues: {
    fullname: string;
    email: string;
    gender: 'male' | 'female' | 'other';
    birthday: Date;
    avatarUrl: string;
  };
}

export function EditProfileForm({ initialValues }: EditProfileFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullname: initialValues.fullname,
      gender: initialValues.gender,
      // Định dạng ngày thành chuỗi YYYY-MM-DD để input date hiển thị đúng
      birthday: initialValues.birthday ? initialValues.birthday.toISOString().split('T')[0] as any : undefined,
    }
  });

  const onSubmit = (data: EditProfileFormValues) => {
    console.log("Profile Data:", data);
    alert("Lưu hồ sơ thành công!");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Avatar Upload */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-3 group cursor-pointer">
          <img 
            src={initialValues.avatarUrl} 
            alt="Avatar" 
            className="w-full h-full rounded-full object-cover border-4 border-gray-50 shadow-sm"
          />
          <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera className="text-white" size={24} />
            <input type="file" hidden accept="image/*" />
          </label>
        </div>
        <button type="button" className="text-sm text-[#329965] font-bold hover:underline flex items-center">
           <Camera size={14} className="mr-1"/> Chọn ảnh
        </button>
      </div>

      <div className="space-y-4">
        {/* Fullname */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Họ tên</label>
          <input 
            {...register('fullname')}
            type="text" 
            // 👇 Thêm !bg-white !text-gray-900 để ép nền trắng chữ đen
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] focus:ring-1 focus:ring-[#329965] !bg-white !text-gray-900"
            placeholder="Nhập họ tên của bạn"
          />
          {errors.fullname && <span className="text-xs text-red-500 mt-1">{errors.fullname.message}</span>}
        </div>

        {/* Email Readonly */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email đăng nhập</label>
          <input 
            type="email" 
            value={initialValues.email}
            readOnly
            // 👇 Input readonly thì nền xám nhạt
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm !bg-gray-100 !text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Giới tính</label>
          <div className="flex gap-6">
            {['male', 'female', 'other'].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input 
                  {...register('gender')}
                  type="radio" 
                  value={g}
                  className="accent-[#329965] w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-gray-700 capitalize font-medium">
                  {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                </span>
              </label>
            ))}
          </div>
          {errors.gender && <span className="text-xs text-red-500 mt-1">{errors.gender.message}</span>}
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Ngày sinh <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('birthday')}
            type="date"
            // 👇 Thêm [color-scheme:light] để icon lịch không bị đen
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900 [color-scheme:light]"
          />
           {errors.birthday && <span className="text-xs text-red-500 mt-1">{errors.birthday.message}</span>}
        </div>

        <button type="submit" className="w-full md:w-auto mt-6 bg-[#329965] text-white px-6 py-2.5 rounded-md text-sm font-bold flex items-center justify-center hover:bg-[#268050] transition-colors shadow-sm uppercase tracking-wide">
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}