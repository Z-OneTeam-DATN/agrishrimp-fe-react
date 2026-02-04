import { z } from 'zod';

export const pondSchema = z.object({
  name: z.string().min(1, 'Tên ao không được để trống'),
  
  // z.coerce.number() giúp tự động chuyển string từ input HTML sang number
  // Nếu người dùng nhập chữ -> báo lỗi invalid_type_error
  area: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số hợp lệ' })
    .min(1, 'Diện tích phải lớn hơn 0'),
    
  depth: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số hợp lệ' })
    .min(0.5, 'Độ sâu tối thiểu 0.5m')
    .max(10, 'Độ sâu không hợp lý (tối đa 10m)'), // Thêm max cho chặt chẽ
    
  species: z.string().min(1, 'Vui lòng nhập loài vật nuôi (VD: Tôm thẻ...)'),
  
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

// Xuất kiểu dữ liệu TypeScript tự động từ Schema
export type PondFormValues = z.infer<typeof pondSchema>;