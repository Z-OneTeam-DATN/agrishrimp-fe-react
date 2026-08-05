"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  NewPasswordSchema,
  NewPasswordFormValues,
} from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";
import { getErrorMessage } from "@/lib/axios";
import {
  AUTH_ACCENT_RING,
  AUTH_ACCENT_SOLID,
  AUTH_ACCENT_TEXT,
} from "@/components/auth/auth-theme";

export function ResetPasswordConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewPasswordFormValues>({
    resolver: zodResolver(NewPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: NewPasswordFormValues) =>
      AuthService.resetPassword(token, data.newPassword, data.confirmPassword),
    onSuccess: () => {
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công!");
      setTimeout(() => router.push("/login"), 2000);
    },
    onError: (error: unknown) => {
      setError("confirmPassword", {
        type: "server",
        message: getErrorMessage(error) || "Không thể đặt lại mật khẩu.",
      });
    },
  });

  const getInputClass = (hasError: boolean) =>
    `group flex items-center bg-[#f4f6f8] rounded-lg transition-all border ${
      hasError
        ? "border-red-500 focus-within:ring-2 focus-within:ring-red-200"
        : `border-transparent ${AUTH_ACCENT_RING}`
    }`;

  if (!token) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
          <ShieldAlert className="h-7 w-7 text-rose-500" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            Liên kết không hợp lệ
          </h3>
          <p className="text-sm text-slate-500">
            Liên kết đặt lại mật khẩu bị thiếu hoặc không đúng định dạng.
          </p>
        </div>
        <Link
          href="/reset-password"
          className={`inline-block text-sm font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
        >
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            Đặt lại mật khẩu thành công
          </h3>
          <p className="text-sm text-slate-500">
            Đang chuyển đến trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-5 w-full"
    >
      {/* NEW PASSWORD */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Mật khẩu mới
        </label>
        <div className={getInputClass(!!errors.newPassword)}>
          <span className="pl-3 text-slate-400">
            <Lock size={18} />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            disabled={mutation.isPending}
            {...register("newPassword")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="pr-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700">
          Xác nhận mật khẩu mới
        </label>
        <div className={getInputClass(!!errors.confirmPassword)}>
          <span className="pl-3 text-slate-400">
            <Lock size={18} />
          </span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            disabled={mutation.isPending}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((p) => !p)}
            className="pr-3 text-slate-400 hover:text-slate-600"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {errors.confirmPassword.message}
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
            <span>ĐANG XỬ LÝ...</span>
          </div>
        ) : (
          "ĐẶT LẠI MẬT KHẨU"
        )}
      </button>

      <div className="text-center text-sm text-slate-500 pt-2">
        <Link
          href="/login"
          className={`font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </form>
  );
}
