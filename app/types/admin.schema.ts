import { z } from "zod";

export const IdSchema = z.string().min(1, "ID không hợp lệ");

export const AdminCustomSpecSchema = z.object({
  id: z.number().optional(),
  key: z.string()
    .min(1, "Tên thông số không được để trống")
    .max(100, "Tên thông số quá dài"),
  value: z.string()
    .min(1, "Giá trị thông số không được để trống")
    .max(255, "Giá trị thông số quá dài"),
});

export type AdminCustomSpec = z.infer<typeof AdminCustomSpecSchema>;

export const AdminProductVariantSchema = z.object({
  id: z.number().optional(),
  formulation: z.string()
    .min(1, "Vui lòng nhập dạng bào chế")
    .max(100, "Dạng bào chế quá dài"),
  packaging: z.string()
    .min(1, "Vui lòng nhập quy cách")
    .max(100, "Quy cách quá dài"),
  weight: z.coerce.number({
    invalid_type_error: "Trọng lượng phải là số",
    required_error: "Vui lòng nhập trọng lượng",
  }).min(0.0001, "Trọng lượng phải lớn hơn 0"),
  unit: z.enum(["ml", "l", "g", "kg"], {
    errorMap: () => ({ message: "Đơn vị không hợp lệ" }),
  }),
  price: z.coerce.number({
    invalid_type_error: "Giá bán phải là số",
    required_error: "Vui lòng nhập giá bán",
  }).min(1000, "Giá bán tối thiểu là 1,000đ"),
  barcode: z.string()
    .max(50, "Mã vạch tối đa 50 ký tự")
    .optional()
    .or(z.literal("")),
  image: z.string().min(1, "Vui lòng tải ảnh cho biến thể này"),
  customSpecs: z.array(AdminCustomSpecSchema)
    .optional()
    .default([]),
});

export type AdminProductVariant = z.infer<typeof AdminProductVariantSchema>;

export const AdminProductSchema = z.object({
  name: z.string()
    .min(2, "Tên sản phẩm phải có ít nhất 2 ký tự")
    .max(200, "Tên sản phẩm quá dài"),
  categoryId: z.string()
    .min(1, "Vui lòng chọn danh mục"),
  brand: z.string()
    .min(1, "Vui lòng nhập thương hiệu")
    .max(100, "Tên thương hiệu quá dài"),
  origin: z.string()
    .min(1, "Vui lòng nhập xuất xứ")
    .max(100, "Xuất xứ quá dài"),
  baseSku: z.string()
    .regex(/^[a-zA-Z0-9_-]*$/, "SKU chỉ chứa chữ, số, - và _")
    .max(50, "SKU quá dài")
    .optional()
    .or(z.literal("")),
  description: z.string()
    .min(10, "Mô tả sản phẩm phải có ít nhất 10 ký tự")
    .max(5000, "Mô tả tối đa 5000 ký tự"),
  status: z.enum(["active", "inactive"])
    .default("active"),
  images: z.array(z.string())
    .min(1, "Cần ít nhất 1 hình ảnh sản phẩm"),
  isVariantEnabled: z.boolean().default(true),
  variants: z.array(AdminProductVariantSchema)
    .min(1, "Cần ít nhất một biến thể"),
})
.refine((data) => {
  if (!data.isVariantEnabled) return true;
  return data.variants.length > 0;
}, {
  message: "Phải có ít nhất 1 biến thể khi bật phân loại",
  path: ["variants"],
})
.refine((data) => {
  const barcodes = data.variants
    .map(v => v.barcode?.trim())
    .filter(Boolean);
  return new Set(barcodes).size === barcodes.length;
}, {
  message: "Mã vạch các biến thể không được trùng nhau",
  path: ["variants"],
})
.refine((data) => {
  const keys = data.variants.map(v =>
    `${v.formulation}|${v.packaging}|${v.weight}|${v.unit}`
  );
  return new Set(keys).size === keys.length;
}, {
  message: "Các biến thể không được trùng thông tin",
  path: ["variants"],
});

export type AdminProductForm = z.infer<typeof AdminProductSchema>;