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

export const updateProfileSchema = z.object({
  fullname: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email().optional(),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g, 'Số điện thoại không đúng định dạng'),
  gender: z.enum(['male', 'female', 'other']),

  birthday: z.preprocess((arg) => {
    if (!arg || arg === "") return undefined; 
    return new Date(arg as string | number | Date);
  }, z.date({ 
    required_error: "Vui lòng chọn ngày sinh", 
    invalid_type_error: "Ngày sinh không hợp lệ" 
  })),
  
  avatarUrl: z.string().optional(),
});

export type UserData = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Mật khẩu hiện tại không được để trống' }),
    newPassword: z.string().min(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }),
    confirmPassword: z.string().min(1, { message: 'Vui lòng xác nhận mật khẩu mới' })
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu mới không khớp',
    path: ['confirmPassword']
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

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

export const addressSchema = z.object({
  id: z.number().optional(), // For existing addresses
  fullName: z.string().min(1, { message: 'Họ và tên không được để trống' }),
  phone: z.string().regex(
    /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/,
    { message: 'Số điện thoại không hợp lệ' }
  ),
  provinceId: z.string().min(1, { message: 'Vui lòng chọn Tỉnh/Thành phố' }),
  districtId: z.string().min(1, { message: 'Vui lòng chọn Quận/Huyện' }),
  wardId: z.string().min(1, { message: 'Vui lòng chọn Phường/Xã' }),
  specificAddress: z.string().min(1, { message: 'Địa chỉ cụ thể không được để trống' }),
  addressType: z.enum(['Home', 'Office']).default('Home'),
  isDefault: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

