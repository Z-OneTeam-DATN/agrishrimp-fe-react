import { z } from "zod";

export const IdSchema = z.string().min(1, "ID không hợp lệ");

export const AdminCustomSpecSchema = z.object({
    id: z.number().optional(),
    key: z
        .string()
        .min(1, "Tên thông số không được để trống")
        .max(100, "Tên thông số quá dài"),
    value: z
        .string()
        .min(1, "Giá trị thông số không được để trống")
        .max(255, "Giá trị thông số quá dài"),
});

export type AdminCustomSpec = z.infer<typeof AdminCustomSpecSchema>;

export const UnitConversionSchema = z.object({
    fromUnit: z.string().min(1, "Đơn vị nguồn không được để trống"),
    toUnit: z.string().min(1, "Đơn vị đích không được để trống"),
    rate: z.coerce.number().min(1, "Tỷ lệ quy đổi phải ít nhất là 1"),
});

export type UnitConversion = z.infer<typeof UnitConversionSchema>;

export const AdminProductVariantSchema = z.object({
    sku: z.string().min(1, "Vui lòng nhập mã SKU cho biến thể"),
    barcode: z.string().optional(),
    attributeValueIds: z.array(z.number()).optional().default([]),
    imageUrl: z.string().optional().nullable(),
});

export type AdminProductVariant = z.infer<typeof AdminProductVariantSchema>;

export const AdminProductSchema = z
    .object({
        name: z.string().min(5, "Tên sản phẩm phải có ít nhất 5 ký tự").max(200, "Tên sản phẩm quá dài"),
        categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
        supplierId: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
        baseSku: z.string().min(1, "Mã SKU gốc không được để trống"),
        description: z.string().optional().nullable(),
        status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).default("ACTIVE"),
        variants: z.array(AdminProductVariantSchema).min(1, "Cần ít nhất một biến thể"),
    })
    .refine(
        (data) => {
            const barcodes = data.variants.map((v) => v.barcode?.trim()).filter(Boolean);
            return new Set(barcodes).size === barcodes.length;
        },
        { message: "Mã vạch (Barcode) giữa các biến thể không được trùng nhau", path: ["variants"] }
    )
    .refine(
        (data) => {
            // Chặn trùng lặp thuộc tính (VD: Không được có 2 biến thể cùng chọn Đỏ + XL)
            const attrCombos = data.variants.map((v) => {
                return v.attributeValueIds ? [...v.attributeValueIds].sort().join("-") : "";
            });
            return new Set(attrCombos).size === attrCombos.length;
        },
        { message: "Phát hiện 2 biến thể có cùng thuộc tính (bị trùng lặp thông tin)", path: ["variants"] }
    );

export type AdminProductForm = z.infer<typeof AdminProductSchema>;

export type ProductFormData = z.infer<typeof AdminProductSchema>;
export const AdminAttributeSchema = z.object({
    name: z
        .string()
        .min(1, "Tên thuộc tính không được để trống")
        .max(100, "Tên thuộc tính quá dài"),

    code: z
        .string()
        .min(1, "Mã định danh không được để trống")
        .regex(
            /^[A-Z0-9_]+$/,
            "Mã định danh chỉ gồm chữ HOA, số và dấu gạch dưới (_)",
        )
        .max(50, "Mã định danh quá dài"),

    description: z
        .string()
        .min(1, "Vui lòng nhập mô tả cho thuộc tính này")
        .max(500, "Mô tả tối đa 500 ký tự"),

    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),

    values: z
        .array(z.string())
        .min(1, "Phải có ít nhất 1 giá trị cho thuộc tính này"),
});

export type AdminAttributeForm = z.infer<typeof AdminAttributeSchema>;

//bắt lỗi category form
export const AdminCategorySchema = z.object({
    name: z
        .string()
        .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
        .max(100, "Tên danh mục quá dài"),

    parentId: z.string().optional().or(z.literal("none")),

    description: z
        .string()
        .min(1, "Vui lòng nhập mô tả cho danh mục")
        .max(1000, "Mô tả tối đa 1000 ký tự"),

    image: z.string().min(1, "Vui lòng tải ảnh đại diện cho danh mục"),

    status: z.enum(["show", "hide"]).default("show"),
});

export type AdminCategoryForm = z.infer<typeof AdminCategorySchema>;
// BẮT LỖI SUPPLIER FORM (ĐÃ XÓA TÀI CHÍNH, GHI CHÚ & NHÓM HÀNG)
export const SupplierSchema = z.object({
    id: z.number().optional(),

    // 1. Thông tin pháp nhân
    name: z
        .string()
        .min(3, "Tên nhà cung cấp phải có ít nhất 3 ký tự")
        .max(200, "Tên nhà cung cấp quá dài"),

    taxCode: z
        .string()
        .min(10, "Mã số thuế không hợp lệ (tối thiểu 10 số)")
        .max(15, "Mã số thuế không hợp lệ (tối đa 15 số)")
        .regex(/^[0-9-]+$/, "Mã số thuế chỉ bao gồm số và dấu gạch nối"),

    // 2. Thông tin liên hệ
    contactName: z
        .string()
        .min(2, "Tên người liên hệ không được để trống")
        .max(100, "Tên quá dài"),

    phone: z
        .string()
        .min(9, "Số điện thoại phải có ít nhất 9 ký tự")
        .max(20, "Số điện thoại quá dài (tối đa 20 ký tự)")
        .regex(
            /^(0|84)(3|5|7|8|9)[0-9]{8}$|^0[\d\s\-]{8,19}$/,
            "Số điện thoại không hợp lệ (di động: 0[3|5|7|8|9]xxxxxxxx hoặc số bàn: 0xxx xxxxxx)",
        ),

    email: z
        .string()
        .min(1, "Email không được để trống")
        .max(100, "Email quá dài")
        .email("Định dạng email không hợp lệ"),

    // 3. Địa chỉ
    provinceId: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),

    addressDetail: z
        .string()
        .min(5, "Vui lòng nhập địa chỉ chi tiết rõ ràng")
        .max(255, "Địa chỉ quá dài"),

    status: z.enum(["active", "inactive"]).default("active"),

    issueDate: z.string().min(1, "Vui lòng chọn Ngày thành lập"),
    taxAuthority: z.string().min(1, "Vui lòng nhập Cơ quan thuế quản lý"),
    mainBusinessSector: z.string().min(1, "Vui lòng nhập Ngành nghề kinh doanh chính"),
});

export const AddSupplierSchema = SupplierSchema;

export type SupplierFormValues = z.infer<typeof SupplierSchema>;
// Bắt lỗi Employee Form
export const EmployeeSchema = z.object({
    id: z.number().optional(),

    // 1. Thông tin cá nhân
    fullName: z
        .string()
        .min(2, "Họ tên phải có ít nhất 2 ký tự")
        .max(100, "Họ tên quá dài"),

    employeeCode: z
        .string()
        .min(1, "Mã nhân viên không được để trống")
        .regex(
            /^[a-zA-Z0-9-]+$/,
            "Mã nhân viên chỉ chứa chữ, số và dấu gạch ngang",
        ),

    email: z
        .string()
        .min(1, "Email không được để trống")
        .email("Định dạng email không hợp lệ"),

    phone: z
        .string()
        .min(10, "Số điện thoại phải có ít nhất 10 số")
        .max(11, "Số điện thoại không hợp lệ")
        .regex(
            /^(0|84)(3|5|7|8|9)([0-9]{8})$/,
            "Định dạng số điện thoại Việt Nam không đúng",
        ),

    address: z.string().max(255, "Địa chỉ quá dài").optional().or(z.literal("")),

    // 2. Thông tin công tác
    branchId: z.string().min(1, "Vui lòng chọn chi nhánh làm việc"),

    role: z.string().min(1, "Vui lòng phân quyền cho nhân viên"),

    startDate: z.string().min(1, "Vui lòng chọn ngày vào làm"),

    // Sidebar
    avatar: z.string().optional(),

    status: z.enum(["active", "locked"]).default("active"),
});

export type EmployeeFormValues = z.infer<typeof EmployeeSchema>;

// viết bắt lỗi chi nhánh form
export const AdminBranchSchema = z.object({
    id: z
        .string()
        .min(1, "Mã chi nhánh không được để trống")
        .regex(/^[a-zA-Z0-9-_]+$/, "Mã chi nhánh chỉ chứa chữ, số và dấu gạch ngang")
        .max(20, "Mã chi nhánh quá dài"),

    name: z
        .string()
        .min(5, "Tên chi nhánh phải có ít nhất 5 ký tự")
        .max(100, "Tên chi nhánh quá dài"),

    managerId: z.string().optional().or(z.literal("")),

    phone: z
        .string()
        .min(10, "Số điện thoại phải có ít nhất 10 số")
        .max(11, "Số điện thoại không hợp lệ")
        .regex(
            /^(0|84)(3|5|7|8|9)([0-9]{8})$/,
            "Định dạng số điện thoại không đúng",
        ),

    email: z
        .string()
        .min(1, "Email liên hệ không được để trống")
        .email("Định dạng email không hợp lệ"),

    // Địa chỉ hành chính
    province: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),

    district: z.string().min(1, "Vui lòng chọn Quận/Huyện"),

    ward: z.string().min(1, "Vui lòng chọn Phường/Xã"),

    addressDetail: z
        .string()
        .min(5, "Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường)")
        .max(255, "Địa chỉ quá dài"),

    lat: z
        .number({ invalid_type_error: "Vĩ độ phải là số" })
        .min(-90, "Vĩ độ không hợp lệ")
        .max(90, "Vĩ độ không hợp lệ")
        .nullable()
        .optional(),

    lng: z
        .number({ invalid_type_error: "Kinh độ phải là số" })
        .min(-180, "Kinh độ không hợp lệ")
        .max(180, "Kinh độ không hợp lệ")
        .nullable()
        .optional(),

    status: z
        .enum(["ACTIVE", "MAINT", "INACTIVE", "active", "inactive"]) // Cho phép cả 2 để an toàn
        .transform(val => val.toUpperCase()) // Luôn chuyển về HOA khi submit
        .default("ACTIVE"),

    branchType: z.enum(["WAREHOUSE", "STORE", "hub", "store"], {
        errorMap: () => ({ message: "Vui lòng chọn loại hình chi nhánh" }),
    }).transform(val => (val === "hub" ? "WAREHOUSE" : val.toUpperCase())),

});

export type AdminBranchForm = z.infer<typeof AdminBranchSchema>;


// Bắt lỗi Customer Form (Hồ sơ khách hàng AgriShrimp)
export const CustomerSchema = z.object({
    id: z.number().optional(),

    // 1. Thông tin định danh
    name: z
        .string()
        .min(2, "Họ và tên phải có ít nhất 2 ký tự")
        .max(100, "Họ và tên quá dài"),

    phone: z
        .string()
        .min(10, "Số điện thoại phải có ít nhất 10 số")
        .regex(
            /^(0|84)(3|5|7|8|9)([0-9]{8})$/,
            "Định dạng số điện thoại Việt Nam không đúng"
        ),

    email: z
        .string()
        .min(1, "Email không được để trống")
        .email("Định dạng email không hợp lệ"),

    gender: z.enum(["MALE", "FEMALE", "OTHER"]).default("MALE"),

    // 2. Địa chỉ
    provinceId: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
    districtId: z.string().min(1, "Vui lòng chọn Quận/Huyện"),
    wardId: z.string().min(1, "Vui lòng chọn Phường/Xã"),
    addressDetail: z
        .string()
        .min(5, "Vui lòng nhập địa chỉ chi tiết")
        .max(255, "Địa chỉ quá dài"),

    // 3. Trạng thái & Ghi chú
    status: z.enum(["ACTIVE", "LOCKED"]).default("ACTIVE"),
    note: z.string().max(1000, "Ghi chú tối đa 1000 ký tự").optional().or(z.literal("")),

    // 🟢 Assignment & Internal Notes
    branchId: z.string().optional().or(z.literal("")),
    staffAssignedId: z.string().optional().or(z.literal("")),
    internalNotes: z.string().max(2000, "Ghi chú nội bộ tối đa 2000 ký tự").optional().or(z.literal("")),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;
