"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiJava, getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { AUTH_ACCENT_SOLID, AUTH_CARD, AUTH_PAGE_SURFACE } from "@/components/auth/auth-theme";

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export default function MustChangePasswordPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      setLoading(true);
      await apiJava.post("/auth/change-password-first-time", {
        newPassword: data.newPassword,
      });
      
      setSuccess(true);
      toast.success("Đổi mật khẩu thành công!");
      
      // Update local state
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      toast.error(getErrorMessage(error as any) || "Lỗi khi đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${AUTH_PAGE_SURFACE}`}>
        <div className={`max-w-md w-full p-8 text-center space-y-6 ${AUTH_CARD}`}>
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đổi mật khẩu thành công!</h1>
          <p className="text-slate-500 font-medium">Hệ thống đang chuyển hướng bạn về trang chủ...</p>
          <Loader2 className="animate-spin mx-auto text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${AUTH_PAGE_SURFACE}`}>
      <div className={`max-w-md w-full p-8 space-y-8 ${AUTH_CARD}`}>
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <ShieldAlert size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Yêu cầu đổi mật khẩu</h1>
          <p className="text-sm text-slate-500">Đây là lần đầu bạn đăng nhập. Vui lòng đổi mật khẩu mới để tiếp tục sử dụng hệ thống.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Mật khẩu mới</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <Input 
                type="password" 
                {...register("newPassword")} 
                className="pl-10 h-11 rounded-xl"
                placeholder="Nhập mật khẩu mạnh..."
              />
            </div>
            {errors.newPassword && <p className="text-[11px] text-red-500 font-bold leading-tight">{errors.newPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <Input 
                type="password" 
                {...register("confirmPassword")} 
                className="pl-10 h-11 rounded-xl"
                placeholder="Nhập lại mật khẩu..."
              />
            </div>
            {errors.confirmPassword && <p className="text-[11px] text-red-500 font-bold leading-tight">{errors.confirmPassword.message}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className={`w-full h-12 rounded-xl text-base font-bold shadow-lg ${AUTH_ACCENT_SOLID}`}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "XÁC NHẬN ĐỔI MẬT KHẨU"}
          </Button>
        </form>
      </div>
    </div>
  );
}

