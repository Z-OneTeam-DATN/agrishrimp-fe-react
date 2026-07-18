import { z } from "zod";

export const DriverSchema = z.object({
  id: z.number().optional(),
  code: z.string().optional().nullable(),
  fullName: z.string().min(2, "Họ tên tài xế phải có ít nhất 2 ký tự").max(100, "Họ tên quá dài"),
  phone: z.string()
    .min(9, "Số điện thoại phải có ít nhất 9 ký tự")
    .max(20, "Số điện thoại quá dài")
    .regex(/^(0|84)(3|5|7|8|9)[0-9]{8}$|^0[\d\s\-]{8,19}$/, "Số điện thoại không hợp lệ"),
  email: z.string()
    .max(100, "Email quá dài")
    .email("Định dạng email không hợp lệ")
    .optional()
    .or(z.literal("")),
  idCard: z.string().min(9, "Số CCCD/CMND không hợp lệ").max(20, "Số CCCD/CMND quá dài"),
  licenseNumber: z.string().min(5, "Số bằng lái không hợp lệ").max(30, "Số bằng lái quá dài"),
  licenseClass: z.string().min(1, "Vui lòng chọn hoặc nhập hạng bằng lái").max(10, "Hạng bằng lái quá dài"),
  avatarUrl: z.string().optional().nullable(),
  licenseImageUrl: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "BUSY"]).default("ACTIVE"),
  vehicleNumber: z.string().optional().or(z.literal("")),
  vehicleType: z.string().max(100, "Loại xe quá dài").optional().or(z.literal("")),
});

export type DriverFormValues = z.infer<typeof DriverSchema>;

export interface Driver {
  id: number;
  code: string;
  fullName: string;
  phone: string;
  email?: string;
  idCard: string;
  licenseNumber: string;
  licenseClass: string;
  avatarUrl?: string;
  licenseImageUrl?: string;
  status: "ACTIVE" | "INACTIVE" | "BUSY";
  vehicleNumber?: string;
  vehicleType?: string;
  createdAt: string;
  updatedAt?: string;
  createdByUserId?: number;
  updatedByUserId?: number;
  createdByName?: string;
  updatedByName?: string;
}
