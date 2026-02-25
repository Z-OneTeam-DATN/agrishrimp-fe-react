"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { getErrorMessage } from "@/lib/axios";

export default function GoogleLoginBtn() {
  const setAccessAndRefreshToken = useAuthStore((state) => state.setAccessAndRefreshToken);
  const [isInternalLoading, setIsInternalLoading] = useState(false);

  /**
   * Mutation gọi API Next.js Route (/api/auth/google-login)
   * Để thiết lập HttpOnly Cookie sau khi Java Backend verify xong Google Token
   */
  const mutation = useMutation({
    mutationFn: (googleAccessToken: string) => {
      return AuthService.loginWithGoogleNext(googleAccessToken);
    },
    onSuccess: (res) => {
      // 1. Lưu token + user data vào zustand
      setAccessAndRefreshToken(res);

      // 2. Thông báo thành công
      toast.success("Đăng nhập với Google thành công!");

      // 3. Full page reload để layoutClient hydrate lại user đầy đủ từ API
      window.location.href = "/";
    },
    onError: (error: any) => {
      console.error("Google Login Backend Error:", error);
      const message = getErrorMessage(error);
      toast.error(message || "Đăng nhập Google thất bại. Vui lòng thử lại.");
      setIsInternalLoading(false);
    },
  });

  /**
   * Khởi tạo Popup Google Login (Implicit Flow)
   */
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log("Google Token Response:", tokenResponse);
      setIsInternalLoading(true);
      // Gửi Google access_token về Backend của chúng ta
      mutation.mutate(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      console.error("Google Login Failed:", errorResponse);
      toast.error("Không thể kết nối với tài khoản Google.");
      setIsInternalLoading(false);
    },
  });

  const isLoading = isInternalLoading || mutation.isPending;

  return (
    <button
      type="button"
      onClick={() => {
        setIsInternalLoading(true);
        googleLogin();
      }}
      disabled={isLoading}
      className={`w-full group relative flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl font-semibold text-slate-700 transition-all duration-300 shadow-sm hover:shadow-md hover:border-teal-500 hover:bg-teal-50/20 active:scale-[0.98] ${
        isLoading ? "opacity-70 cursor-not-allowed bg-slate-50" : "bg-white"
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
      ) : (
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5 object-contain"
        />
      )}
      <span className="text-sm">
        {isLoading ? "Đang xử lý..." : "Tiếp tục với Google"}
      </span>
      
      {/* Hiệu ứng tia sáng khi hover */}
      {!isLoading && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </button>
  );
}
