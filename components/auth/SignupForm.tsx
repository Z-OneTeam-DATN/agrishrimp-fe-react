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
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { getPostLoginDestination } from "@/lib/workspace-permissions";
import {
  AUTH_ACCENT_RING,
  AUTH_ACCENT_SOLID,
  AUTH_ACCENT_TEXT,
} from "@/components/auth/auth-theme";

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "onSubmit",
    defaultValues: {
      fullName: "",
      contact: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      captchaToken: isLocalhost ? "test" : "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) => {
      console.log("Submitting Register Payload:", data);
      return AuthService.registerNext(data);
    },
    onSuccess: async (res) => {
      const setAccessAndRefreshToken = useAuthStore.getState().setAccessAndRefreshToken;
      const setPermissions = useAuthStore.getState().setPermissions;

      try {
        sessionStorage.removeItem("_u");
        sessionStorage.removeItem("_p");
      } catch {
        // Ignore storage access issues in restricted browsers.
      }

      setPermissions([]);
      setAccessAndRefreshToken(res);

      let permissions: string[] = [];
      try {
        permissions = await AuthService.getMyPermissionsNext();
        setPermissions(permissions);
      } catch {
        // A new customer account can continue with an empty permission list.
      }

      toast.success("Đăng ký thành công!");
      router.refresh();
      router.push(getPostLoginDestination(permissions, res.role));
    },
    onError: (error: unknown) => {
      const status =
        typeof error === "object" &&
        error !== null &&
        "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      const detail = getErrorMessage(error);

      console.log("Signup error:", status, detail);

      const message = detail.toLowerCase();

      if (
        (status === 409 && message.includes("email")) ||
        message.includes("email này đã được sử dụng")
      ) {
        setError("contact", {
          type: "server",
          message: "Email này đã được sử dụng",
        });
        resetCaptcha();
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

      if (typeof status === "number" && status >= 500) {
        toast.error("Lỗi hệ thống, vui lòng thử lại.");
        resetCaptcha();
        return;
      }

      toast.error("Đăng ký thất bại.");
      resetCaptcha();
    },
  });

  const resetCaptcha = () => {
    if (isLocalhost) {
      setValue("captchaToken", "test", { shouldValidate: true });
      return;
    }
    setValue("captchaToken", "", { shouldValidate: true });
    if (typeof window !== "undefined" && (window as any).turnstile) {
      (window as any).turnstile.reset();
    }
  };

  const onSubmit = (data: RegisterFormValues) => {
    if (isLocalhost) {
      mutation.mutate({ ...data, captchaToken: "test" });
      return;
    }

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
        : `border-transparent ${AUTH_ACCENT_RING}`
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
        label="Email"
        icon={<Mail className="w-5 h-5" />}
        error={errors.contact?.message}
        inputProps={register("contact")}
        placeholder="example@gmail.com"
        type="email"
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
            : AUTH_ACCENT_SOLID
        }`}
      >
        {mutation.isPending ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
      </button>

      <div className="text-center text-sm text-gray-600 pt-2">
        Bạn đã có tài khoản?{" "}
        <Link
          href="/login"
          className={`font-bold hover:underline ${AUTH_ACCENT_TEXT}`}
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
  type = "text",
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
          type={type}
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

