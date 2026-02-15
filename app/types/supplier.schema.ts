import { z } from "zod";

export const SupplierSchema = z.object({
  name: z.string().min(5, "Tên nhà cung cấp phải có ít nhất 5 ký tự"),
  taxCode: z
    .string()
    .min(10, "Mã số thuế không hợp lệ")
    .max(13, "Mã số thuế không hợp lệ"),
  category: z.string().min(1, "Vui lòng chọn nhóm hàng"),
  brand: z.string().optional(),
  origin: z.string().optional(),
  sku: z.string().optional(),
  contactName: z.string().min(2, "Vui lòng nhập tên người liên hệ"),
  phone: z
    .string()
    .regex(/^(84|0)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  provinceId: z.string().optional(),
  districtId: z.string().optional(),
  wardId: z.string().optional(),
  addressDetail: z.string().optional(),
  discount: z.coerce.number().min(0).max(100).default(0),
  bankAccount: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  note: z.string().optional(),
});

export type SupplierFormValues = z.infer<typeof SupplierSchema>;
