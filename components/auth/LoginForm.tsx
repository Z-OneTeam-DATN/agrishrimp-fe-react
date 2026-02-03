"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Turnstile from "react-turnstile";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { RegisterSchema, RegisterFormValues } from "@/app/types/auth.schema";
import { AuthService } from "@/app/services/auth.service";

/**
 * SignupForm Component
 * Handles:
 * - Form validation (Zod + React Hook Form)
 * - Captcha verification (Cloudflare Turnstile)
 * - API registration request
 */
export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Cloudflare test site key
  const SITE_KEY = "0x4AAAAAACWEfiexADEyMozt";

  /**
   * React Hook Form setup
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
      contact: "",
      password: "",
      terms: false,
      captchaToken: "",
    },
  });

  /**
   * Register API mutation
   */
  const mutation = useMutation({
    mutationFn: (data: RegisterFormValues) => AuthService.register(data),

    onSuccess: () => {
      alert("Đăng ký thành công!");
      router.push("/login");
    },

    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Lỗi không xác định";

      // Nếu tài khoản đã tồn tại → show lỗi ngay field
      if (msg.toLowerCase().includes("tồn tại") || msg.toLowerCase().includes("exists")) {
        setError("contact", { message: msg });
      } else {
        alert("Lỗi đăng ký: " + msg);
      }

      // Reset captcha để user verify lại
      setValue("captchaToken", "");
    },
  });

  /**
   * Submit form handler
   */
  const onSubmit = (data: RegisterFormValues) => {
    if (!data.captchaToken) return; // bảo vệ thêm tầng FE
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">

      {/* CONTACT FIELD */}
      <div className="mb-3">
         <label className="text-sm font-medium text-gray-700">Email hoặc SĐT</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-gray-400">
            <Mail size={20} />
          </span>
          <input
            type="text"
            placeholder="Email hoặc Số điện thoại"
            className="w-full bg-[#f4f6f8] py-3 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-[#009688]/25 focus:bg-white transition-all"
            disabled={mutation.isPending}
            {...register("contact")}
          />
        </div>
        {errors.contact && (
          <small className="text-red-500 mt-1 block">{errors.contact.message}</small>
        )}
      </div>

      {/* PASSWORD FIELD */}
      <div className="mb-3">
         <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-gray-400">
            <Lock size={20} />
          </span>

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            className="w-full bg-[#f4f6f8] py-3 pl-10 pr-10 rounded-lg focus:ring-2 focus:ring-[#009688]/25 focus:bg-white transition-all"
            disabled={mutation.isPending}
            {...register("password")}
          />

          {/* Toggle password visibility */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {errors.password && (
          <small className="text-red-500 mt-1 block">{errors.password.message}</small>
        )}
      </div>

      {/* CAPTCHA */}
      <div className="mb-3">
        <input type="hidden" {...register("captchaToken")} />

        <div className="flex justify-center md:justify-start">
          <Turnstile
            sitekey={SITE_KEY}
            onVerify={(token) =>
              setValue("captchaToken", token, { shouldValidate: true })
            }
            onExpire={() =>
              setValue("captchaToken", "", { shouldValidate: true })
            }
          />
        </div>

        {errors.captchaToken && (
          <small className="text-red-500 mt-1 block text-center md:text-left">
            Vui lòng xác thực Captcha
          </small>
        )}
      </div>

      {/* TERMS */}
      <div className="mb-4 flex items-start gap-2">
        <input
          type="checkbox"
          id="terms"
          className="mt-1 w-4 h-4 accent-[#009688]"
          {...register("terms")}
        />
        <label htmlFor="terms" className="text-xs text-gray-500 leading-snug">
          Tôi đồng ý với{" "}
          <Link href="#" className="font-semibold text-[#009688] hover:underline">
            Điều khoản dịch vụ
          </Link>{" "}
          và{" "}
          <Link href="#" className="font-semibold text-[#009688] hover:underline">
            Chính sách bảo mật
          </Link>.
        </label>
      </div>
      {errors.terms && (
        <small className="text-red-500 mt-1 block">{errors.terms.message}</small>
      )}

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        className={`w-full py-3 font-bold rounded-lg transition-all ${
          mutation.isPending 
            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
            : "bg-[#009688] hover:bg-[#00796b] text-white hover:-translate-y-0.5"
        }`}
      >
        {mutation.isPending ? "ĐANG XỬ LÝ..." : "ĐĂNG NHẬP"}
      </button>

      {/* LOGIN LINK */}
      <div className="text-center text-sm text-gray-600 mt-4">
        Bạn đã có tài khoản?{" "}
        <Link href="/login" className="font-bold text-[#009688] hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </form>
  );
}
