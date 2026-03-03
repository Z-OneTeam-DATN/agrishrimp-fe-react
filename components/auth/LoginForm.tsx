"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Turnstile from "react-turnstile";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { LoginSchema, LoginFormValues } from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { getErrorMessage } from "@/lib/axios";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    defaultValues: {
      contact: "",
      password: "",
      captchaToken: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormValues) => {
      console.log("Submitting Login Payload:", data);
      return AuthService.loginNext(data);
    },
    onSuccess: (res) => {
      const setAccessAndRefreshToken = useAuthStore.getState().setAccessAndRefreshToken;
      setAccessAndRefreshToken(res);
      toast.success("Đăng nhập thành công!");
      const role = (res.role || "").toUpperCase().replace("ROLE_", "");
      window.location.href = (role === "ADMIN" || role === "MANAGER") ? "/admin" : "/";
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message = getErrorMessage(error);

      if (status === 401) {
        toast.error("Tài khoản hoặc mật khẩu không chính xác.");
      } else if (status === 400 && message.toLowerCase().includes("captcha")) {
        toast.error("Xác thực Captcha không hợp lệ.");
        resetCaptcha();
      } else {
        toast.error(message || "Đăng nhập thất bại.");
        resetCaptcha();
      }
    },
  });

  const resetCaptcha = () => {
    setValue("captchaToken", "", { shouldValidate: true });
    if (typeof window !== "undefined" && (window as any).turnstile) {
      (window as any).turnstile.reset();
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    if (!data.captchaToken) {
      setError("captchaToken", {
        type: "manual",
        message: "Vui lòng xác thực bạn không phải robot",
      });
      return;
    }
    mutation.mutate(data);
  };

  const getInputClass = (hasError: boolean) =>
    `group flex items-center bg-[#f4f6f8] rounded-lg transition-all border ${
      hasError
        ? "border-red-500 focus-within:ring-2 focus-within:ring-red-200"
        : "border-transparent focus-within:ring-2 focus-within:ring-[#009688]/25"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
      {/* CONTACT FIELD */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">Email hoặc SĐT</label>
        <div className={getInputClass(!!errors.contact)}>
          <span className="pl-3 text-slate-400">
            <Mail size={18} />
          </span>
          <input
            type="text"
            placeholder="example@gmail.com"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            disabled={mutation.isPending}
            {...register("contact")}
          />
        </div>
        {errors.contact && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {errors.contact.message}
          </p>
        )}
      </div>

      {/* PASSWORD FIELD */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700">Mật khẩu</label>
          <Link
            href="/reset-password"
            className="text-xs font-bold text-[#009688] hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <div className={getInputClass(!!errors.password)}>
          <span className="pl-3 text-slate-400">
            <Lock size={18} />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            disabled={mutation.isPending}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="pr-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* CAPTCHA */}
      <div className="flex flex-col items-center lg:items-start gap-2">
        <input type="hidden" {...register("captchaToken")} />
        <Turnstile
          sitekey={SITE_KEY}
          onVerify={(token) => {
            setValue("captchaToken", token, { shouldValidate: true });
            clearErrors("captchaToken");
          }}
          onExpire={() => setValue("captchaToken", "", { shouldValidate: true })}
          onError={() => {
            setValue("captchaToken", "", { shouldValidate: true });
            setError("captchaToken", {
              type: "server",
              message: "Xác thực CAPTCHA thất bại. Vui lòng tải lại trang.",
            });
          }}
        />
        {errors.captchaToken && (
          <p className="text-xs text-red-500 font-medium">
            {errors.captchaToken.message}
          </p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className={`w-full py-3.5 font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] ${
          mutation.isPending
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-[#009688] hover:bg-[#00796b] text-white shadow-[#009688]/20"
        }`}
      >
        {mutation.isPending ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>ĐANG XỬ LÝ...</span>
          </div>
        ) : (
          "ĐĂNG NHẬP"
        )}
      </button>

      {/* FOOTER */}
      <div className="text-center text-sm text-slate-500 pt-2">
        Chưa có tài khoản?{" "}
        <Link
          href="/signup"
          className="text-[#009688] font-bold hover:underline"
        >
          Đăng ký ngay
        </Link>
      </div>
    </form>
  );
}
