"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Turnstile from "react-turnstile";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { RegisterSchema, RegisterFormValues } from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";
import { useAuthStore } from "@/stores/useAuthStore";

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onSubmit",
    defaultValues: {
      fullName: "",
      contact: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      captchaToken: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) => {
      console.log("Submitting Register Payload:", data);
      return AuthService.register(data);
    },
    onSuccess: async () => {
      // Spring set httpOnly auth cookies on signup. Read them via the Next.js
      // me-token route so the Zustand store has an accessToken immediately —
      // otherwise apiJava sends no Authorization header and cart calls 401.
      try {
        const authData = await AuthService.meTokenNext();
        useAuthStore.getState().setAccessAndRefreshToken(authData);
      } catch {
        // If hydration fails, middleware will repair the hasSession desync
        // on the next page load and the auth flow will recover.
      }
      router.refresh();
      router.push("/");
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const detail: string =
        error?.response?.data?.detail || error?.response?.data?.message || "";

      console.log("Signup error:", status, detail);

      const message = detail.toLowerCase();

      if (status === 400 && message.includes("email")) {
        setError("contact", {
          type: "server",
          message: "Email này đã tồn tại",
        });
        return;
      }

      if (status === 400 && message.includes("captcha")) {
        setError("captchaToken", {
          type: "server",
          message: "Vui lòng xác thực bạn không phải robot",
        });
        resetCaptcha();
        return;
      }

      if (status === 400) {
        toast.error(detail || "Dữ liệu không hợp lệ.");
        resetCaptcha();
        return;
      }

      if (status >= 500) {
        toast.error("Lỗi hệ thống, vui lòng thử lại.");
        resetCaptcha();
        return;
      }

      toast.error("Đăng ký thất bại.");
      resetCaptcha();
    },
  });

  const resetCaptcha = () => {
    setValue("captchaToken", "", { shouldValidate: true });
    if (typeof window !== "undefined" && (window as any).turnstile) {
      (window as any).turnstile.reset();
    }
  };

  const onSubmit = (data: RegisterFormValues) => {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* FULL NAME */}
      <InputField
        label="Họ và tên"
        icon={<User className="w-5 h-5" />}
        error={errors.fullName?.message}
        inputProps={register("fullName")}
        placeholder="Nhập họ và tên"
        getInputClass={getInputClass}
      />

      {/* CONTACT */}
      <InputField
        label="Email hoặc SĐT"
        icon={<Mail className="w-5 h-5" />}
        error={errors.contact?.message}
        inputProps={register("contact")}
        placeholder="Email hoặc Số điện thoại"
        getInputClass={getInputClass}
      />

      {/* PASSWORD */}
      <PasswordField
        label="Mật khẩu"
        show={showPassword}
        toggle={() => setShowPassword((p) => !p)}
        error={errors.password?.message}
        inputProps={register("password")}
        getInputClass={getInputClass}
      />

      {/* CONFIRM PASSWORD */}
      <PasswordField
        label="Xác nhận mật khẩu"
        show={showConfirmPassword}
        toggle={() => setShowConfirmPassword((p) => !p)}
        error={errors.confirmPassword?.message}
        inputProps={register("confirmPassword")}
        getInputClass={getInputClass}
      />

      {/* CAPTCHA */}
      <div>
        <input type="hidden" {...register("captchaToken")} />
        <Turnstile
          sitekey={SITE_KEY}
          onVerify={(token) => {
            setValue("captchaToken", token, { shouldValidate: true });
            clearErrors("captchaToken");
          }}
          onExpire={() =>
            setValue("captchaToken", "", { shouldValidate: true })
          }
          onError={() => {
            setValue("captchaToken", "", { shouldValidate: true });
            setError("captchaToken", {
              type: "server",
              message: "Xác thực CAPTCHA thất bại. Vui lòng tải lại trang.",
            });
          }}
        />
        {errors.captchaToken && (
          <p className="text-xs text-red-500 font-medium mt-1">
            {errors.captchaToken.message}
          </p>
        )}
      </div>

      {/* TERMS */}
      <div className="flex items-start gap-2 pt-2">
        <input type="checkbox" {...register("termsAccepted")} />
        <label className="text-xs text-gray-600">
          Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật
        </label>
      </div>
      {errors.termsAccepted && (
        <p className="text-xs text-red-500 font-medium">
          {errors.termsAccepted.message}
        </p>
      )}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className={`w-full py-3 font-bold rounded-lg ${
          mutation.isPending
            ? "bg-slate-300 text-slate-500"
            : "bg-[#009688] hover:bg-[#00796b] text-white"
        }`}
      >
        {mutation.isPending ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
      </button>

      <div className="text-center text-sm text-gray-600 pt-2">
        Bạn đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-[#009688] font-bold hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

function InputField({
  label,
  icon,
  error,
  inputProps,
  placeholder,
  getInputClass,
}: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className={getInputClass(!!error)}>
        <div className={`pl-3 ${error ? "text-red-400" : "text-gray-400"}`}>
          {icon}
        </div>
        <input
          placeholder={placeholder}
          className="w-full bg-transparent p-3 text-sm focus:outline-none"
          {...inputProps}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  show,
  toggle,
  error,
  inputProps,
  getInputClass,
}: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className={getInputClass(!!error)}>
        <div className={`pl-3 ${error ? "text-red-400" : "text-gray-400"}`}>
          <Lock className="w-5 h-5" />
        </div>
        <input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="w-full bg-transparent p-3 text-sm focus:outline-none"
          {...inputProps}
        />
        <button type="button" onClick={toggle} className="pr-3 text-gray-400">
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
