"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  ChangePasswordFormValues,
} from "@/app/types/user.schema";
import { UserService } from "@/app/services/user.service";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";

interface ChangePasswordFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function ChangePasswordForm({
  onCancel,
  onSuccess,
}: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await UserService.changePassword(data);
      toast.success("Đổi mật khẩu thành công!");
      onSuccess();
    } catch (error: unknown) {


      if (error instanceof AxiosError) {
        const backendData = error.response?.data;

        // 1. Lấy message lỗi từ Java
        let errorMsg =
          backendData?.detail ||
          backendData?.message ||
          backendData?.error ||
          "Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.";

        // 2. Dọn dẹp chuỗi lỗi (Phòng trường hợp backend gửi về kèm chữ "Lỗi hệ thống: ")
        if (errorMsg.startsWith("Lỗi hệ thống: ")) {
          errorMsg = errorMsg.replace("Lỗi hệ thống: ", "");
        }

        // 3. ÉP BUỘC: Nhét thẳng thông báo lỗi vào ô "Mật khẩu hiện tại" để hiện viền đỏ
        setError("currentPassword", {
          type: "server",
          message: errorMsg,
        });
      } else {
        // Nếu không gọi được API (mất mạng, sập server...)
        toast.error("Không thể kết nối đến máy chủ, vui lòng thử lại sau!");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Mật khẩu hiện tại */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Mật khẩu hiện tại
        </label>
        <input
          {...register("currentPassword")}
          type="password"
          placeholder="Nhập mật khẩu cũ..."
          className={`w-full px-4 h-12 border rounded-md text-sm focus:outline-none !bg-white !text-gray-900 transition-colors ${
            errors.currentPassword
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-[#1965a2]"
          }`}
        />
        {errors.currentPassword && (
          <span className="text-xs text-red-500 mt-1 block">
            {errors.currentPassword.message}
          </span>
        )}
      </div>

      {/* Mật khẩu mới */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Mật khẩu mới
        </label>
        <input
          {...register("newPassword")}
          type="password"
          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
          className={`w-full px-4 h-12 border rounded-md text-sm focus:outline-none !bg-white !text-gray-900 transition-colors ${
            errors.newPassword
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-[#1965a2]"
          }`}
        />
        {errors.newPassword && (
          <span className="text-xs text-red-500 mt-1 block">
            {errors.newPassword.message}
          </span>
        )}
      </div>

      {/* Nhập lại mật khẩu mới */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Nhập lại mật khẩu mới
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          placeholder="Xác nhận lại mật khẩu mới"
          className={`w-full px-4 h-12 border rounded-md text-sm focus:outline-none !bg-white !text-gray-900 transition-colors ${
            errors.confirmPassword
              ? "border-red-500 focus:border-red-500"
              : "border-gray-300 focus:border-[#1965a2]"
          }`}
        />
        {errors.confirmPassword && (
          <span className="text-xs text-red-500 mt-1 block">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 h-12 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 h-12 text-sm text-white bg-[#1965a2] rounded-md font-bold hover:bg-[#268050] transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Đang lưu...
            </>
          ) : (
            "Lưu mật khẩu"
          )}
        </button>
      </div>
    </form>
  );
}
