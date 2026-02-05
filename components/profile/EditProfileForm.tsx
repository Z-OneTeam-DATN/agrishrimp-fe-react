'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save, User, Calendar, Camera, Mail, Phone } from 'lucide-react';
import Image from 'next/image';

interface UserData {
  fullname: string;
  email: string;
  phone: string;
  gender: 'female' | 'male' | 'other';
  birthday: Date;
  avatarUrl: string;
}

export default function EditProfileForm({ initialValues }: { initialValues: UserData }) {
  const { register, handleSubmit } = useForm<UserData>({
    defaultValues: initialValues
  });

  const onSubmit = (data: UserData) => {
    console.log('Update profile:', data);
    toast.success('Cập nhật thông tin thành công!');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      
      {/* Avatar Upload */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-3">
          <Image 
            src={initialValues.avatarUrl} 
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
          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#329965] focus:ring-1 focus:ring-[#329965]"
        />
      </div>

      {/* 2. Email (Thường là Read-only để tránh lỗi đăng nhập) */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Mail size={14} /> Email đăng nhập
        </label>
        <input 
          {...register('email')}
          disabled // Khóa không cho sửa
          className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed focus:outline-none"
        />
      </div>

      {/* 3. Số điện thoại */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Phone size={14} /> Số điện thoại
        </label>
        <input 
          {...register('phone')}
          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#329965] focus:ring-1 focus:ring-[#329965]"
        />
      </div>

      {/* 4. Giới tính */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700">Giới tính</label>
        <div className="flex gap-6 mt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              value="male" 
              {...register('gender')}
              className="w-4 h-4 cursor-pointer accent-[#329965] bg-white border-gray-300"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#329965]">Nam</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              value="female" 
              {...register('gender')}
              className="w-4 h-4 cursor-pointer accent-[#329965] bg-white border-gray-300"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#329965]">Nữ</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              value="other" 
              {...register('gender')}
              className="w-4 h-4 cursor-pointer accent-[#329965] bg-white border-gray-300"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#329965]">Khác</span>
          </label>
        </div>
      </div>

      {/* 5. Ngày sinh */}
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Calendar size={14} /> Ngày sinh
        </label>
        {/* Chuyển Date sang chuỗi YYYY-MM-DD để hiển thị đúng trong input type="date" */}
        <input 
          type="date"
          {...register('birthday', {
            valueAsDate: true,
          })}
          defaultValue={initialValues.birthday ? new Date(initialValues.birthday).toISOString().split('T')[0] : ''}
          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#329965] focus:ring-1 focus:ring-[#329965]"
        />
      </div>

      <div className="pt-2">
        <button 
          type="submit"
          className="w-full bg-[#329965] hover:bg-[#2a8556] text-white font-bold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Save size={18} /> Lưu thay đổi
        </button>
      </div>

    </form>
  );
}