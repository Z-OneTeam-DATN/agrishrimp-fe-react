"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Turnstile from "react-turnstile";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { RegisterSchema, RegisterFormValues } from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";

/**
 * SignupForm
 * Handles user registration with:
 * - Schema validation (Zod)
 * - Turnstile captcha verification
 * - API mutation via React Query
 */
export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const SITE_KEY = "0x4AAAAAACWEfiexADEyMozt";

  /**
   * React Hook Form configuration
   */
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    mode: "all",
    defaultValues: {
      fullName: "",
      contact: "",
      password: "",
      confirmPassword: "",
      terms: false,
      captchaToken: "",
    },
  });

  /**
   * Registration API mutation
   * confirmPassword is removed before sending to backend
   */
  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) => {
      const { confirmPassword,terms, ...payload } = data;
      return AuthService.register(payload);
    },

    onSuccess: () => {
      alert("Đăng ký thành công!");
      router.push("/login");
    },

    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Lỗi không xác định";

      if (msg.toLowerCase().includes("tồn tại") || msg.toLowerCase().includes("exists")) {
        setError("contact", { message: msg });
      } else {
        alert("Lỗi đăng ký: " + msg);
      }

      // Force captcha re-verification
      setValue("captchaToken", "", { shouldValidate: true });
    },
  });

  /**
   * Submit handler
   * Extra FE safety: do not submit if captcha token is missing
   */
  const onSubmit = (data: RegisterFormValues) => {
    if (!data.captchaToken) return;
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* FULL NAME */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Họ và tên</label>
        <div className="group flex items-center bg-[#f4f6f8] rounded-lg focus-within:ring-2 focus-within:ring-[#009688]/25 transition-all">
          <div className="pl-3 text-gray-400">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Nhập họ và tên"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            {...register("fullName")}
          />
        </div>
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* CONTACT */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email hoặc SĐT</label>
        <div className="group flex items-center bg-[#f4f6f8] rounded-lg focus-within:ring-2 focus-within:ring-[#009688]/25 transition-all">
          <div className="pl-3 text-gray-400">
            <Mail className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Email hoặc Số điện thoại"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            {...register("contact")}
          />
        </div>
        {errors.contact && <p className="text-xs text-red-500">{errors.contact.message}</p>}
      </div>

      {/* PASSWORD */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
        <div className="group flex items-center bg-[#f4f6f8] rounded-lg focus-within:ring-2 focus-within:ring-[#009688]/25 transition-all">
          <div className="pl-3 text-gray-400">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="pr-3 text-gray-400 hover:text-[#009688]"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
        <div className="group flex items-center bg-[#f4f6f8] rounded-lg focus-within:ring-2 focus-within:ring-[#009688]/25 transition-all">
          <div className="pl-3 text-gray-400">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            className="w-full bg-transparent p-3 text-sm focus:outline-none"
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((p) => !p)}
            className="pr-3 text-gray-400 hover:text-[#009688]"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* CAPTCHA */}
      <input type="hidden" {...register("captchaToken")} />
      <Turnstile
        sitekey={SITE_KEY}
        onVerify={(token) => setValue("captchaToken", token, { shouldValidate: true })}
        onExpire={() => setValue("captchaToken", "", { shouldValidate: true })}
      />

      {/* TERMS */}
      <div className="flex items-start gap-2">
        <input type="checkbox" id="terms" className="mt-1 w-4 h-4 accent-[#009688]" {...register("terms")} />
        <label htmlFor="terms" className="text-xs text-gray-600">
          Tôi đồng ý với <Link href="#" className="text-[#009688] font-bold">Điều khoản</Link> và{" "}
          <Link href="#" className="text-[#009688] font-bold">Chính sách</Link>
        </label>
      </div>
      {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}

      {/* SUBMIT */}
     <button
        type="submit"
        disabled={mutation.isPending} 
        className={`w-full py-3 px-4 font-bold rounded-lg shadow-md transition-all 
          ${
            mutation.isPending
              ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
              : "bg-[#009688] hover:bg-[#00796b] text-white shadow-lg transform hover:-translate-y-0.5" 
          }
        `}
      >
        {mutation.isPending ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
      </button>

      <div className="text-center text-sm text-gray-600">
        Bạn đã có tài khoản?{" "}
        <Link href="/login" className="text-[#009688] font-bold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
