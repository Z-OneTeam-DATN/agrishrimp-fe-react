"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Turnstile from "react-turnstile";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import { LoginSchema, LoginFormValues } from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { getPostLoginDestination } from "@/lib/workspace-permissions";
import {
  AUTH_ACCENT_RING,
  AUTH_ACCENT_SOLID,
  AUTH_ACCENT_TEXT,
} from "@/components/auth/auth-theme";

const LOCKED_ACCOUNT_MESSAGE =
  "Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.";

const getLoginInlineErrorMessage = (message: string, status?: number) => {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("đã bị khóa") ||
    normalized.includes("bi khoa") ||
    normalized.includes("vô hiệu hóa") ||
    normalized.includes("vo hieu hoa") ||
    normalized.includes("inactive")
  ) {
    return LOCKED_ACCOUNT_MESSAGE;
  }

  if (status === 401) {
    return "Tài khoản hoặc mật khẩu không chính xác.";
  }

  return message || "Đăng nhập thất bại.";
};

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

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
    mutationFn: (data: LoginFormValues) => AuthService.loginNext(data),
    onSuccess: async (res) => {
      const setAccessAndRefreshToken = useAuthStore.getState().setAccessAndRefreshToken;
      const setPermissions = useAuthStore.getState().setPermissions;
      try {
        sessionStorage.removeItem("_u");
        sessionStorage.removeItem("_p");
      } catch {}
      setPermissions([]);
      setAccessAndRefreshToken(res);

      let permissions: string[] = [];
      try {
        permissions = await AuthService.getMyPermissionsNext();
        setPermissions(permissions);
      } catch {}

      window.location.href = getPostLoginDestination(permissions);
    },
    onError: (error: unknown) => {
      const status =
        typeof error === "object" &&
        error !== null &&
        "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      const message = getErrorMessage(error as AxiosError);

      if (status === 400 && message.toLowerCase().includes("captcha")) {
        setError("captchaToken", {
          type: "server",
          message: "Xác thực Captcha không hợp lệ.",
        });
        resetCaptcha();
      } else if (status === 400 || status === 401 || status === 403) {
        setError("password", {
          type: "server",
          message: getLoginInlineErrorMessage(message, status),
        });
      } else {
        setError("password", {
          type: "server",
          message: "Đăng nhập thất bại. Vui lòng thử lại sau.",
        });
        resetCaptcha();
      }
    },
  });

  const resetCaptcha = () => {
    setValue("captchaToken", "", { shouldValidate: true });
    const turnstile = (window as Window & { turnstile?: { reset(): void } }).turnstile;
    if (typeof window !== "undefined" && turnstile) {
      turnstile.reset();
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    if (!data.captchaToken) {
      if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        data.captchaToken = "test";
      } else {
        setError("captchaToken", {
          type: "manual",
          message: "Vui lòng xác thực bạn không phải robot",
        });
        return;
      }
    }
    mutation.mutate(data);
  };

  const getInputClass = (hasError: boolean) =>
    `group flex items-center bg-[#f4f6f8] rounded-lg transition-all border ${
      hasError
        ? "border-red-500 focus-within:ring-2 focus-within:ring-red-200"
        : `border-transparent ${AUTH_ACCENT_RING}`
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
            {...register("contact", {
              onChange: () => clearErrors("password"),
            })}
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
            className={`text-xs font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
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
            {...register("password", {
              onChange: () => clearErrors("password"),
            })}
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
            : `${AUTH_ACCENT_SOLID}`
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
          className={`font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
        >
          Đăng ký ngay
        </Link>
      </div>
    </form>
  );
}

