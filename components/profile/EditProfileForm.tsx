'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, User, Calendar, Camera, Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { updateProfileSchema, UserData } from '@/app/types/user.schema';

export default function EditProfileForm({ initialValues }: { initialValues: UserData }) {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<UserData>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onTouched', 
    defaultValues: {
      ...initialValues,
      birthday: (initialValues.birthday 
        ? new Date(initialValues.birthday).toISOString().split('T')[0] 
        : "") as unknown as Date
    } as UserData 
  });

  const onSubmit = async (data: UserData) => {
    console.log('Update profile:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Cập nhật thông tin thành công!');
  };

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-gray-900 
    focus:outline-none transition-all
    ${hasError 
      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
      : 'border-gray-300 focus:border-[#329965] focus:ring-1 focus:ring-[#329965]'
    }
  `;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      
      {/* Avatar Upload */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-3">
          <Image 
            src={initialValues.avatarUrl || ''} 
            alt="Avatar"
            fill
            className="rounded-full object-cover border-4 border-white shadow-md"
          />
          <button type="button" className="absolute bottom-0 right-0 bg-white border border-gray-200 p-1.5 rounded-full text-gray-600 hover:text-[#329965] shadow-sm transition-colors">
            <Camera size={14} />
          </button>
        </div>
        <div className="text-center">
          <div className="font-bold text-gray-800">{initialValues.fullname}</div>
          <div className="text-xs text-gray-400">Thành viên thân thiết</div>
        </div>
      </div>

      {/* 1. Họ tên */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <User size={14} /> Họ và tên
        </label>
        <input 
          {...register('fullname')}
          className={inputClass(!!errors.fullname)}
        />
        {errors.fullname && <p className="text-xs text-red-500">{errors.fullname.message}</p>}
      </div>

      {/* 2. Email (Read-only) */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Mail size={14} /> Email đăng nhập
        </label>
        <input 
          {...register('email')}
          disabled 
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
        />
      </div>

      {/* 3. Số điện thoại */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Phone size={14} /> Số điện thoại
        </label>
        <input 
          {...register('phone')}
          className={inputClass(!!errors.phone)}
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      {/* 4. Giới tính */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700">Giới tính</label>
        <div className="flex gap-6 mt-1">
          {['male', 'female', 'other'].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                value={g} 
                {...register('gender')}
                className="w-4 h-4 cursor-pointer accent-[#329965] bg-white border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">
                {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
              </span>
            </label>
          ))}
        </div>
        {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
      </div>

      {/* 5. Ngày sinh */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Calendar size={14} /> Ngày sinh
        </label>
        <input 
          type="date"
          {...register('birthday')} 
          className={inputClass(!!errors.birthday)}
        />
        {errors.birthday && <p className="text-xs text-red-500 mt-1">{errors.birthday.message}</p>}
      </div>

      <div className="pt-2">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#329965] hover:bg-[#2a8556] text-white font-bold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Đang lưu...
            </>
          ) : (
            <><Save size={18} /> Lưu thay đổi</>
          )}
        </button>
      </div>

    </form>
  );
}