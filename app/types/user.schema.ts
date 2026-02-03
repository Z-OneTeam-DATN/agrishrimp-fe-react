import { z } from 'zod'

const AvatarImageSchema = z.object({
  id: z.number().nullable().optional(),
  fileName: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional()
})

const BaseUserSchema = z.object({
  id: z.number().optional(),
  email: z.string().email({ message: 'Email không hợp lệ.' }),
  password: z.string().min(6, {
    message: 'Mật khẩu phải có ít nhất 6 ký tự.'
  }),
  gender: z.string().optional(),
  displayName: z
    .string()
    .min(2, {
      message: 'Tên hiển thị phải có ít nhất 2 ký tự.'
    })
    .max(50, {
      message: 'Tên hiển thị không được dài quá 50 ký tự.'
    }),
  bio: z
    .string()
    .max(160, {
      message: 'Tiểu sử không được dài quá 160 ký tự.'
    })
    .optional(),
  avatar: AvatarImageSchema.optional(),
  onlineStatus: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  lockedAt: z.coerce.date().optional(),
  blockFlag: z.string().optional()
})

export type UserType = z.infer<typeof BaseUserSchema>

export const loginSchema = BaseUserSchema.pick({
  email: true,
  password: true
})

export const signupSchema = BaseUserSchema.pick({
  email: true,
  password: true,
  displayName: true,
  gender: true
})
  .extend({
    email: z.string().min(1, { message: 'Email là bắt buộc.' }),
    password: z.string().min(1, { message: 'Mật khẩu là bắt buộc.' }),
    displayName: z.string().min(1, { message: 'Tên hiển thị là bắt buộc.' }),
    gender: z.string().min(1, { message: 'Giới tính là bắt buộc.' }),
    confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu.' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp.',
    path: ['confirmPassword']
  })

export const profileSchema = BaseUserSchema.pick({
  id: true,
  displayName: true,
  email: true,
  gender: true,
  avatar: true,
  bio: true
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
export type AvatarImage = z.infer<typeof AvatarImageSchema>
