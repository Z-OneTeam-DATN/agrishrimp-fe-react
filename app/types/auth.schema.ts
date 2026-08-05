import { z } from "zod";

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(5, { message: "Họ tên phải có ít nhất 5 ký tự" })
      .max(50, { message: "Họ tên không được quá 50 ký tự" }),

    contact: z
      .string()
      .min(1, { message: "Vui lòng nhập Email" })
      .email({ message: "Email không hợp lệ" }),

    password: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),

    confirmPassword: z.string(),

    termsAccepted: z.boolean().refine((val) => val === true, {
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
 * Type
 */
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
export type RegisterRequest = {
  fullName: string;
  contact: string;
  password: string;
  confirmPassword: string;
  captchaToken: string;
  termsAccepted: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  role: string;
  branch?: {
    id: number;
    name: string;
  };
  mustChangePassword?: boolean;
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

export const LoginSchema = z.object({
  contact: z
    .string()
    .min(1, { message: "Vui lòng nhập Email" })
    .email({ message: "Email không hợp lệ" }),

  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),

  captchaToken: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

export const ResetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập Email" })
    .email({ message: "Email không hợp lệ" }),

  captchaToken: z.string().min(1, {
    message: "Vui lòng xác thực Captcha",
  }),
});

export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

export const NewPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),

    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Mật khẩu nhập lại không khớp",
      });
    }
  });

export type NewPasswordFormValues = z.infer<typeof NewPasswordSchema>;
