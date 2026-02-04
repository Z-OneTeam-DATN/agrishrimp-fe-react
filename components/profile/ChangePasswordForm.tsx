'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordFormValues } from '@/app/types/user.schema';
import { UserService } from '@/app/services/user.service';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function ChangePasswordForm({ onCancel, onSuccess }: ChangePasswordFormProps) {
  // Lấy thêm isSubmitting để disable nút khi đang gọi API
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      // Gọi API đổi mật khẩu từ UserService
      await UserService.changePassword(data);
      
      toast.success('Đổi mật khẩu thành công!');
      onSuccess(); // Đóng Modal sau khi thành công
    } catch (error: any) {
      console.error(error);
      // Hiển thị lỗi từ server trả về (nếu có) hoặc lỗi chung
      const message = error?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Mật khẩu hiện tại */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu hiện tại</label>
        <input 
          {...register('currentPassword')}
          type="password" 
          placeholder="Nhập mật khẩu cũ..."
          // 👇 Thêm !bg-white !text-gray-900 để fix lỗi nền đen
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900"
        />
        {errors.currentPassword && <span className="text-xs text-red-500 mt-1 block">{errors.currentPassword.message}</span>}
      </div>

      {/* Mật khẩu mới */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu mới</label>
        <input 
          {...register('newPassword')}
          type="password" 
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900"
        />
        {errors.newPassword && <span className="text-xs text-red-500 mt-1 block">{errors.newPassword.message}</span>}
      </div>

      {/* Nhập lại mật khẩu mới */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Nhập lại mật khẩu mới</label>
        <input 
          {...register('confirmPassword')}
          type="password" 
          placeholder="Xác nhận lại mật khẩu mới"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900"
        />
        {errors.confirmPassword && <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword.message}</span>}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
        >
          Hủy
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-white bg-[#329965] rounded-md font-bold hover:bg-[#268050] transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
               <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
               Đang lưu...
            </>
          ) : (
            'Lưu mật khẩu'
          )}
        </button>
      </div>
    </form>
  );
}