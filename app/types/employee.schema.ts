import { z } from "zod";

const requiredSelectNumber = (message: string) =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;

    const parsed = Number(val);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, z.number({
    required_error: message,
    invalid_type_error: message,
  }).min(1, message));

const requiredText = (message: string) =>
  z.string({
    required_error: message,
    invalid_type_error: message,
  }).trim().min(1, message);

const requiredDate = (message: string) =>
  requiredText(message).refine((date) => !Number.isNaN(new Date(date).getTime()), {
    message: "Ngày không hợp lệ",
  });

export const EmployeeCreateSchema = z.object({
  fullName: requiredText("Vui lòng nhập họ và tên")
    .min(2, "Họ tên từ 2-100 ký tự")
    .max(100, "Họ tên không quá 100 ký tự")
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, "Họ tên không được chứa số hoặc ký tự đặc biệt"),
  employeeCode: z.string().optional(), // Server tự sinh nếu trống
  email: requiredText("Vui lòng nhập email đăng nhập")
    .email("Email không đúng định dạng")
    .max(100, "Email không quá 100 ký tự"),
  password: z.string()
    .min(6, "Mật khẩu phải từ 6-100 ký tự")
    .max(100, "Mật khẩu không quá 100 ký tự")
    .optional(),
  phoneNumber: requiredText("Vui lòng nhập số điện thoại")
    .regex(/^0\d{9}$/, "Số điện thoại phải đúng 10 chữ số và bắt đầu bằng 0"),
  addressDetail: requiredText("Vui lòng nhập địa chỉ liên hệ"),
  dateOfBirth: requiredDate("Vui lòng chọn ngày sinh").refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate())) age--;
    return age >= 18;
  }, { message: "Nhân viên phải từ 18 tuổi trở lên" }),
  avatarUrl: z.string().nullable().optional(),
  status: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["ACTIVE", "INACTIVE"], {
      required_error: "Vui lòng chọn trạng thái",
      invalid_type_error: "Vui lòng chọn trạng thái"
    })
  ),
  startDate: requiredDate("Vui lòng chọn ngày vào làm").refine((date) => {
    const d = new Date(date);
    const minDate = new Date("2000-01-01");
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return d >= minDate && d <= maxDate;
  }, { message: "Ngày vào làm không hợp lệ (từ năm 2000 đến +30 ngày tới)" }),
  branchId: requiredSelectNumber("Vui lòng chọn chi nhánh"),
  roleId: requiredSelectNumber("Vui lòng chọn vai trò"),
  citizenId: requiredText("Vui lòng nhập số CCCD")
    .regex(/^\d{12}$/, "Số CCCD phải đúng 12 chữ số"),
  gender: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.enum(["MALE", "FEMALE", "OTHER"], {
      required_error: "Vui lòng chọn giới tính",
      invalid_type_error: "Vui lòng chọn giới tính"
    })
  ),
});

export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>;

export const EmployeeUpdateSchema = EmployeeCreateSchema.omit({ 
    password: true, 
    email: true, 
    citizenId: true // CitizenId bị lock sau khi tạo theo đặc tả 5.4
}).extend({
    // Giữ field này ở dạng optional để form edit có thể bind input disabled mà không submit thay đổi.
    citizenId: z.string().regex(/^\d{12}$/, "Số CCCD phải đúng 12 chữ số").optional(),
});

export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;

export interface UserRequest extends EmployeeCreateInput {}

export interface EmployeeCitizenIdOcrResponse {
  citizenId?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  addressDetail?: string | null;
  homeTown?: string | null;
  nationality?: string | null;
  cardType?: string | null;
  confidence?: number | null;
}

export interface UserResponse {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  citizenId: string;
  dateOfBirth: string;
  gender: string;
  startDate: string;
  addressDetail: string;
  avatarUrl: string | null;
  branch: {
    id: number;
    name: string;
  };
  role: {
    id: number;
    displayName: string;
    slug: string;
  };
  status: "ACTIVE" | "INACTIVE";
  mustChangePassword: boolean;
  emailSent: boolean;
  createdAt: string;
  createdByUserId: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface BranchType {
  id: number;
  name: string;
}
