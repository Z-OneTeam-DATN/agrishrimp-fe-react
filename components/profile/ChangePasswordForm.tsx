'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, ChangePasswordFormValues } from '@/app/types/user.schema';
import { UserService } from '@/app/services/user.service';
import { toast } from 'sonner';
// Import AxiosError để lấy type cho lỗi trả về
import { AxiosError } from 'axios';

interface ChangePasswordFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function ChangePasswordForm({ onCancel, onSuccess }: ChangePasswordFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await UserService.changePassword(data);
      
      toast.success('Đổi mật khẩu thành công!');
      onSuccess();
    } catch (error: unknown) { // ✅ FIX: Dùng unknown thay vì any
      console.error(error);
      
      let message = 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
      
      // Kiểm tra nếu error là lỗi từ Axios để lấy message từ server
      if (error instanceof AxiosError && error.response?.data?.message) {
          message = error.response.data.message;
      } else if (error instanceof Error) {
          message = error.message;
      }

      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6"> {/* Changed from space-y-4 to space-y-6 */}
      {/* Mật khẩu hiện tại */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu hiện tại</label> {/* Changed mb-1 to mb-2 */}
        <input 
          {...register('currentPassword')}
          type="password" 
          placeholder="Nhập mật khẩu cũ..."
          className="w-full px-4 h-12 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900" // Changed px-3 py-2 to px-4 h-12
        />
        {errors.currentPassword && <span className="text-xs text-red-500 mt-1 block">{errors.currentPassword.message}</span>}
      </div>

      {/* Mật khẩu mới */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới</label> {/* Changed mb-1 to mb-2 */}
        <input 
          {...register('newPassword')}
          type="password" 
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
          className="w-full px-4 h-12 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900" // Changed px-3 py-2 to px-4 h-12
        />
        {errors.newPassword && <span className="text-xs text-red-500 mt-1 block">{errors.newPassword.message}</span>}
      </div>

      {/* Nhập lại mật khẩu mới */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Nhập lại mật khẩu mới</label> {/* Changed mb-1 to mb-2 */}
        <input 
          {...register('confirmPassword')}
          type="password" 
          placeholder="Xác nhận lại mật khẩu mới"
          className="w-full px-4 h-12 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#329965] !bg-white !text-gray-900" // Changed px-3 py-2 to px-4 h-12
        />
        {errors.confirmPassword && <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword.message}</span>}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="px-4 h-12 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium" // Changed py-2 to h-12
        >
          Hủy
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4 h-12 text-sm text-white bg-[#329965] rounded-md font-bold hover:bg-[#268050] transition-colors disabled:opacity-70 flex items-center gap-2" // Changed py-2 to h-12
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