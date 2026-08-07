"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { getPostLoginDestination } from "@/lib/workspace-permissions";
import { getErrorMessage } from "@/lib/axios";

export default function GoogleLoginBtn() {
  const setAccessAndRefreshToken = useAuthStore((state) => state.setAccessAndRefreshToken);
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  const hasGoogleClientId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  /**
   * Mutation gọi API Next.js Route (/api/auth/google-login)
   * Để thiết lập HttpOnly Cookie sau khi Java Backend verify xong Google Token
   */
  const mutation = useMutation({
    mutationFn: (googleAccessToken: string) => {
      return AuthService.loginWithGoogleNext(googleAccessToken);
    },
    onSuccess: async (res) => {
      // 1. Lưu token + user data vào zustand
      try {
        sessionStorage.removeItem("_u");
        sessionStorage.removeItem("_p");
      } catch {}
      useAuthStore.getState().setPermissions([]);
      setAccessAndRefreshToken(res);

      let permissions: string[] = [];
      try {
        permissions = await AuthService.getMyPermissionsNext();
        useAuthStore.getState().setPermissions(permissions);
      } catch {}

      // Full page reload để layoutClient hydrate lại user đầy đủ từ API
      window.location.href = getPostLoginDestination(permissions, res.role);
    },
    onError: (error: any) => {
      console.error("Google Login Backend Error:", error);
      const message = getErrorMessage(error);
      const normalized = message.toLowerCase();
      if (
        normalized.includes("đã đăng ký bằng") ||
        normalized.includes("phương thức khác") ||
        normalized.includes("vui lòng đăng nhập theo cách đó")
      ) {
        toast.error("Tài khoản này đã đăng nhập bằng phương thức khác");
      } else {
        toast.error(message || "Đăng nhập Google thất bại.");
      }
      setIsInternalLoading(false);
    },
  });

  /**
   * Khởi tạo Popup Google Login (Implicit Flow)
   */
  const googleLogin = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: (tokenResponse) => {
      console.log("Google Token Response:", tokenResponse);
      setIsInternalLoading(true);
      // Gửi Google access_token về Backend của chúng ta
      mutation.mutate(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      console.error("Google Login Failed:", errorResponse);
      toast.error("Đăng nhập Google thất bại.");
      setIsInternalLoading(false);
    },
  });

  const isLoading = isInternalLoading || mutation.isPending;

  if (!hasGoogleClientId) return null;

  return (
    <button
      type="button"
      onClick={() => {
        setIsInternalLoading(true);
        googleLogin();
      }}
      disabled={isLoading}
      className={`w-full group relative flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl font-semibold text-slate-700 transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-500 hover:bg-blue-50/20 active:scale-[0.98] ${
        isLoading ? "opacity-70 cursor-not-allowed bg-slate-50" : "bg-white"
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
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
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </button>
  );
}

