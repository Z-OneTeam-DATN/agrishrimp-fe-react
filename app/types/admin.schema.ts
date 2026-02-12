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


// thêm bắt lỗi thuộc tính form
export const AdminAttributeSchema = z.object({
  name: z.string()
    .min(1, "Tên thuộc tính không được để trống")
    .max(100, "Tên thuộc tính quá dài"),

  code: z.string()
    .min(1, "Mã định danh không được để trống")
    .regex(/^[A-Z0-9_]+$/, "Mã định danh chỉ gồm chữ HOA, số và dấu gạch dưới (_)")
    .max(50, "Mã định danh quá dài"),

  description: z.string()
      .min(1, "Vui lòng nhập mô tả cho thuộc tính này")
      .max(500, "Mô tả tối đa 500 ký tự"),

  status: z.enum(["active", "inactive"])
    .default("active"),

  values: z.array(z.string())
    .min(1, "Phải có ít nhất 1 giá trị cho thuộc tính này"),
});

export type AdminAttributeForm = z.infer<typeof AdminAttributeSchema>;

//bắt lỗi category form
export const AdminCategorySchema = z.object({
  name: z.string()
    .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
    .max(100, "Tên danh mục quá dài"),

  parentId: z.string().optional().or(z.literal("none")),

  description: z.string()
    .min(1, "Vui lòng nhập mô tả cho danh mục")
    .max(1000, "Mô tả tối đa 1000 ký tự"),

  image: z.string().min(1, "Vui lòng tải ảnh đại diện cho danh mục"),

  status: z.enum(["show", "hide"]).default("show"),
});

export type AdminCategoryForm = z.infer<typeof AdminCategorySchema>;

//thêm bắt lỗi supplier form
export const SupplierSchema = z.object({
  id: z.number().optional(),

  // 1. Thông tin pháp nhân
  name: z.string()
    .min(3, "Tên nhà cung cấp phải có ít nhất 3 ký tự")
    .max(200, "Tên nhà cung cấp quá dài"),

  taxCode: z.string()
    .min(10, "Mã số thuế không hợp lệ (tối thiểu 10 số)")
    .max(15, "Mã số thuế không hợp lệ (tối đa 15 số)")
    .regex(/^[0-9-]+$/, "Mã số thuế chỉ bao gồm số và dấu gạch nối"),

  category: z.enum(["feed", "med", "tool"], {
    errorMap: () => ({ message: "Vui lòng chọn nhóm hàng hóa chính" }),
  }),

  // 2. Thông tin liên hệ
  contactName: z.string()
    .min(2, "Tên người liên hệ không được để trống")
    .max(100, "Tên quá dài"),

  phone: z.string()
    .min(10, "Số điện thoại phải có ít nhất 10 số")
    .max(11, "Số điện thoại không quá 11 số")
    .regex(/^(0|84)(3|5|7|8|9)([0-9]{8})$/, "Định dạng số điện thoại Việt Nam không đúng"),

  email: z.string()
    .min(1, "Email không được để trống")
    .max(100, "Email quá dài")
    .email("Định dạng email không hợp lệ"),

  // 3. Địa chỉ
  provinceId: z.string()
    .min(1, "Vui lòng chọn Tỉnh/Thành phố"),

  addressDetail: z.string()
    .min(5, "Vui lòng nhập địa chỉ chi tiết rõ ràng")
    .max(255, "Địa chỉ quá dài"),

  // 4. Tài chính & Khác
  discount: z.coerce.number()
    .min(0, "Chiết khấu không được âm")
    .max(100, "Chiết khấu tối đa 100%"),

  bankAccount: z.string()
    .min(5, "Thông tin tài khoản không được để trống")
    .max(100, "Thông tin tài khoản quá dài"),

  status: z.enum(["active", "inactive"])
    .default("active"),

  note: z.string()
    .max(1000, "Ghi chú tối đa 1000 ký tự")
    .optional()
    .or(z.literal("")),
});

export type SupplierFormValues = z.infer<typeof SupplierSchema>;

// Bắt lỗi Employee Form
export const EmployeeSchema = z.object({
  id: z.number().optional(),

  // 1. Thông tin cá nhân
  fullName: z.string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên quá dài"),

  employeeCode: z.string()
    .min(1, "Mã nhân viên không được để trống")
    .regex(/^[a-zA-Z0-9-]+$/, "Mã nhân viên chỉ chứa chữ, số và dấu gạch ngang"),

  email: z.string()
    .min(1, "Email không được để trống")
    .email("Định dạng email không hợp lệ"),

  phone: z.string()
    .min(10, "Số điện thoại phải có ít nhất 10 số")
    .max(11, "Số điện thoại không hợp lệ")
    .regex(/^(0|84)(3|5|7|8|9)([0-9]{8})$/, "Định dạng số điện thoại Việt Nam không đúng"),

  address: z.string()
    .max(255, "Địa chỉ quá dài")
    .optional()
    .or(z.literal("")),

  // 2. Thông tin công tác
  branchId: z.string()
    .min(1, "Vui lòng chọn chi nhánh làm việc"),

  role: z.string()
    .min(1, "Vui lòng phân quyền cho nhân viên"),

  startDate: z.string()
    .min(1, "Vui lòng chọn ngày vào làm"),

  // Sidebar
  avatar: z.string().optional(),

  status: z.enum(["active", "locked"])
    .default("active"),
});

export type EmployeeFormValues = z.infer<typeof EmployeeSchema>;

// viết bắt lỗi chi nhánh form
export const AdminBranchSchema = z.object({
  id: z.string()
    .min(1, "Mã chi nhánh không được để trống")
    .regex(/^[a-zA-Z0-9-]+$/, "Mã chi nhánh chỉ chứa chữ, số và dấu gạch ngang")
    .max(20, "Mã chi nhánh quá dài"),

  name: z.string()
    .min(5, "Tên chi nhánh phải có ít nhất 5 ký tự")
    .max(100, "Tên chi nhánh quá dài"),

  managerId: z.string()
    .min(1, "Vui lòng chọn người phụ trách chi nhánh"),

  phone: z.string()
    .min(10, "Số điện thoại phải có ít nhất 10 số")
    .max(11, "Số điện thoại không hợp lệ")
    .regex(/^(0|84)(3|5|7|8|9)([0-9]{8})$/, "Định dạng số điện thoại không đúng"),

  email: z.string()
    .min(1, "Email liên hệ không được để trống")
    .email("Định dạng email không hợp lệ"),

  // Địa chỉ hành chính
  province: z.string()
    .min(1, "Vui lòng chọn Tỉnh/Thành phố"),

  district: z.string()
    .min(1, "Vui lòng chọn Quận/Huyện"),

  ward: z.string()
    .min(1, "Vui lòng chọn Phường/Xã"),

  addressDetail: z.string()
    .min(5, "Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)")
    .max(255, "Địa chỉ quá dài"),

  status: z.enum(["active", "maint", "inactive"], {
    errorMap: () => ({ message: "Trạng thái vận hành không hợp lệ" }),
  }).default("active"),

  area: z.string()
    .min(1, "Vui lòng chọn khu vực quản lý (Miền Tây/Miền Đông...)"),
});

export type AdminBranchForm = z.infer<typeof AdminBranchSchema>;