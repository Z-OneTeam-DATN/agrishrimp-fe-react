import { apiJava } from '@/lib/axios';
import { Order, OrderStatus } from '@/app/types/order.schema';

// Interface cho yêu cầu trả hàng
export interface ReturnRequestData {
  orderId: string;
  productId: string;
  reason: string;
  description: string;
  images: File[]; 
}

export class OrderService {
  private static readonly PREFIX = '/user/orders';

  static async getOrders(status?: OrderStatus): Promise<Order[]> {
    const params = status && status !== 'ALL' ? { status } : {};
    // Mock data để test giao diện ngay (khi chưa có API thật)
    // Bạn có thể xóa đoạn này khi API Java đã sẵn sàng
    if (status === 'RETURN_REQUESTED') {
        return [
            {
                id: 'ORD-123456',
                shopName: 'AgriShrimp Official',
                status: 'RETURN_REQUESTED',
                items: [{ id: '1', name: 'Florfenicol kết hợp Oxytetracycline', imageUrl: 'https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png', quantity: 1, unitPrice: 250000, displayUnitPrice: '250.000₫', variant: '500g/túi' }],
                totalAmount: 250000,
                displayTotalAmount: '250.000₫',
            }
        ] as any;
    }
    
    const response = await apiJava.get<Order[]>(`${this.PREFIX}/list`, { params });
    return response.data;
  }

  // Lấy danh sách đơn đổi trả riêng biệt (như mẫu HTML return-list)
  static async getReturnOrders(): Promise<any[]> {
    // Mock data giống HTML cũ
    return [
      {
        id: 'RE-99231',
        orderId: 'ORD-123456',
        productName: 'Florfenicol kết hợp Oxytetracycline',
        productImg: 'https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png',
        reason: 'Sản phẩm bị lỗi/hư hỏng',
        amount: '250.000₫',
        status: 'PROCESSING',
        quantity: 1
      },
      {
        id: 'RE-88120',
        orderId: 'ORD-99812',
        productName: 'Khoáng tạt APA Miner Pox giúp cứng vỏ',
        productImg: 'https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg',
        reason: 'Giao sai hàng',
        amount: '240.000₫',
        status: 'COMPLETED',
        quantity: 2
      },
      {
        id: 'RE-77102',
        orderId: 'ORD-77615',
        productName: 'Men vi sinh xử lý đáy Super Clean',
        productImg: 'https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png',
        reason: 'Sản phẩm khác với mô tả',
        amount: '320.000₫',
        status: 'REJECTED',
        quantity: 1,
        shopResponse: 'Hình ảnh bằng chứng không rõ ràng, bao bì đã bị xé rách.'
      }
    ];
  }

  static async submitReturnRequest(data: ReturnRequestData): Promise<void> {
    const formData = new FormData();
    formData.append('orderId', data.orderId);
    formData.append('productId', data.productId);
    formData.append('reason', data.reason);
    formData.append('description', data.description);
    if (data.images) data.images.forEach((file) => formData.append('images', file));

    await apiJava.post(`${this.PREFIX}/return/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}