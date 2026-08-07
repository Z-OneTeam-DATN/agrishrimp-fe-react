"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import Turnstile from "react-turnstile";
import { Mail, Loader2, MailCheck } from "lucide-react";

import {
  ResetPasswordSchema,
  ResetPasswordFormValues,
} from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";
import { getErrorMessage } from "@/lib/axios";
import {
  AUTH_ACCENT_RING,
  AUTH_ACCENT_SOLID,
  AUTH_ACCENT_TEXT,
} from "@/components/auth/auth-theme";

export function ResetPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      captchaToken: isLocalhost ? "test" : "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormValues) =>
      AuthService.forgotPassword(data.email, data.captchaToken),
    onSuccess: (_res, variables) => {
      setSentTo(variables.email);
    },
    onError: (error: unknown) => {
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      const message = getErrorMessage(error);

      if (status === 400 && message.toLowerCase().includes("captcha")) {
        setError("captchaToken", {
          type: "server",
          message: "Xác thực Captcha không hợp lệ.",
        });
        resetCaptcha();
        return;
      }

      setError("email", {
        type: "server",
        message: message || "Không thể gửi yêu cầu. Vui lòng thử lại.",
      });
      resetCaptcha();
    },
  });

  const resetCaptcha = () => {
    if (isLocalhost) {
      setValue("captchaToken", "test", { shouldValidate: true });
      return;
    }
    setValue("captchaToken", "", { shouldValidate: true });
    const turnstile = (window as Window & { turnstile?: { reset(): void } })
      .turnstile;
    if (typeof window !== "undefined" && turnstile) {
      turnstile.reset();
    }
  };

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (isLocalhost) {
      mutation.mutate({ ...data, captchaToken: "test" });
      return;
    }

    mutation.mutate(data);
  };

  const getInputClass = (hasError: boolean) =>
    `group flex items-center bg-[#f4f6f8] rounded-lg transition-all border ${
      hasError
        ? "border-red-500 focus-within:ring-2 focus-within:ring-red-200"
        : `border-transparent ${AUTH_ACCENT_RING}`
    }`;

  if (sentTo) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <MailCheck className="h-7 w-7 text-blue-600" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            Kiểm tra email của bạn
          </h3>
          <p className="text-sm text-slate-500">
            Nếu <span className="font-semibold text-slate-700">{sentTo}</span>{" "}
            tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu
            (hiệu lực 15 phút).
          </p>
        </div>
        <Link
          href="/login"
          className={`inline-block text-sm font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
        >
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
      {/* EMAIL FIELD */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">Email</label>
        <div className={getInputClass(!!errors.email)}>
          <span className="pl-3 text-slate-400">
            <Mail size={18} />
          </span>
          <input
            type="email"
            placeholder="example@gmail.com"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            disabled={mutation.isPending}
            {...register("email", {
              onChange: () => clearErrors("email"),
            })}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {errors.email.message}
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
          onExpire={() =>
            setValue("captchaToken", isLocalhost ? "test" : "", {
              shouldValidate: true,
            })
          }
          onError={() => {
            if (isLocalhost) {
              setValue("captchaToken", "test", { shouldValidate: true });
              return;
            }
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
            <span>ĐANG GỬI...</span>
          </div>
        ) : (
          "GỬI LIÊN KẾT ĐẶT LẠI"
        )}
      </button>

      <div className="text-center text-sm text-slate-500 pt-2">
        Nhớ mật khẩu của bạn?{" "}
        <Link
          href="/login"
          className={`font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
        >
          Đăng nhập
        </Link>
      </div>
    </form>
  );
}
