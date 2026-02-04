import { z } from 'zod'

export const StoreContactSchema = z.object({
  title: z.string().min(5, { message: "Tiêu đề phải có ít nhất 5 ký tự" }),
  content: z.string().min(10, { message: "Nội dung phải có ít nhất 10 ký tự" }),
  fullname: z.string().min(2, { message: "Họ tên không được để trống" }),
  phone: z.string().regex(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/, { message: "Số điện thoại không hợp lệ" }),
  email: z.string().email({ message: "Email không đúng định dạng" }),
})

export type StoreContactType = z.TypeOf<typeof StoreContactSchema>

export const StoreContactRes = z.object({
  data: StoreContactSchema,
  message: z.string()
})

export type StoreContactResType = z.TypeOf<typeof StoreContactRes>

export const StoreContactListRes = z.object({
  data: z.array(StoreContactSchema),
  message: z.string()
})

export type StoreContactListResType = z.TypeOf<typeof StoreContactListRes>