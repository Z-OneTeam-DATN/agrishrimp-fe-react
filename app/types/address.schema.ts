import { z } from 'zod';

// Regex đơn giản cho số điện thoại VN
const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;

export const addressSchema = z.object({
  id: z.any().optional(), // Để optional vì khi thêm mới chưa có ID
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  
  provinceId: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  districtId: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  wardId: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  
  specificAddress: z.string().min(5, 'Địa chỉ cụ thể phải chi tiết hơn'),
  
  addressType: z.enum(['Home', 'Office'], {
    errorMap: () => ({ message: 'Vui lòng chọn loại địa chỉ' })
  }),
  
  isDefault: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;