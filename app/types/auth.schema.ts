import { z } from "zod";


const phoneRegex = /^(84|0)(3|5|7|8|9)[0-9]{8}$/;

/* =========================================================
   REGISTER — FORM VALIDATION SCHEMA (CHỈ DÙNG CHO UI)
========================================================= */
export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(5, { message: "Họ tên phải có ít nhất 5 ký tự" })
      .max(50, { message: "Họ tên không được quá 50 ký tự" }),

    contact: z
      .string()
      .min(1, { message: "Vui lòng nhập Email hoặc SĐT" })
      .refine(
        (value) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || phoneRegex.test(value),
        { message: "Email hoặc Số điện thoại không hợp lệ" }
      ),

    password: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),

    // Chỉ dùng để so sánh ở FE
    confirmPassword: z.string(),

    terms: z.boolean().refine(val => val === true, {
      message: "Bạn phải đồng ý với điều khoản sử dụng",
    }),


    captchaToken: z.string().min(1, {
      message: "Vui lòng xác thực Captcha",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Mật khẩu nhập lại không khớp",
      });
    }
  });

/**
 * Type dùng cho FORM
 */
export type RegisterFormValues = z.infer<typeof RegisterSchema>;

/* =========================================================
   REGISTER — API DTO 
========================================================= */
export type RegisterRequest = {
  fullName: string;
  contact: string;
  password: string;
  captchaToken: string;
};

/* =========================================================
   AUTH RESPONSES
========================================================= */
export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserResponse = {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  role: {
    id: number;
    displayName: string;
  };
  status: string;
};

/* =========================================================
   LOGIN
========================================================= */
export const LoginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(1, { message: "Vui lòng nhập Email hoặc Số điện thoại" }),

  password: z
    .string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;
