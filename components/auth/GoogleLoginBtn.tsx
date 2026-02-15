"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthService } from "@/app/services/auth.service";

export default function GoogleLoginBtn() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const googleToken = tokenResponse.access_token;

        const data = await AuthService.loginWithGoogle(googleToken);

        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);

          toast.success("Đăng nhập Google thành công!");
          router.push("/");
        }
      } catch (error: any) {
        const status = error?.response?.status;
        const detail: string =
          error?.response?.data?.detail || error?.response?.data?.message || "";

        const message = detail.toLowerCase();

        console.log("Google login error:", status, detail);

        if (status === 401 && message.includes("google")) {
          toast.error("Phiên Google hết hạn. Vui lòng thử lại.");
          return;
        }

        if (status === 400 && message.includes("email")) {
          toast.error("Email này đã được đăng ký bằng phương thức khác.");
          return;
        }

        if (status === 403) {
          toast.error("Tài khoản của bạn đã bị khóa.");
          return;
        }

        if (status >= 500) {
          toast.error("Lỗi hệ thống máy chủ. Vui lòng thử lại.");
          return;
        }

        toast.error("Đăng nhập Google thất bại.");
      } finally {
        setIsLoading(false);
      }
    },

    onError: () => {
      toast.error("Không thể kết nối đến Google.");
    },
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="w-full bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 text-slate-700 font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-all duration-300 shadow-sm hover:shadow-md mb-5 group text-sm disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5 object-contain"
        />
      )}
      <span>{isLoading ? "Đang xử lý..." : "Đăng ký với Google"}</span>
    </button>
  );
}
