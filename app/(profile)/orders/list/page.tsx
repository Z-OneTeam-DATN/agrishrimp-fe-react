'use client';

import { useSearchParams } from 'next/navigation';
import { OrderTabs } from '@/components/orders/OrderTabs';
import { OrderCard } from '@/components/orders/OrderCard';
import { Order, OrderStatus } from '@/app/types/order.schema';
import { PackageX } from 'lucide-react';
import Link from 'next/link';

// Định nghĩa Mock Data bên ngoài component để code gọn hơn
const getMockOrders = (status: OrderStatus): Order[] => {
  const baseOrder = {
      id: 'ORD-123456',
      shopName: 'AgriShrimp Official',
      items: [{ id: '1', name: 'Florfenicol kết hợp Oxytetracycline', imageUrl: 'https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png', quantity: 1, unitPrice: 250000, displayUnitPrice: '250.000₫', variant: '500g/túi' }],
      totalAmount: 250000,
      displayTotalAmount: '250.000₫',
      createdAt: '2026-01-01T12:00:00Z', // Thêm trường này nếu schema yêu cầu
      paymentStatus: 'PENDING' // Thêm trường này nếu schema yêu cầu
  };

  // Ép kiểu về Order[] thay vì any
  switch (status) {
      case 'PENDING':
          return [{ ...baseOrder, status: 'PENDING', id: 'ORD-PENDING-01' }] as Order[];
      case 'SHIPPING':
          return [{ ...baseOrder, status: 'SHIPPING', id: 'ORD-SHIP-01', displayTotalAmount: '640.000₫', items: [...baseOrder.items, { id: '2', name: 'Men vi sinh xử lý đáy cao cấp Super Clean', imageUrl: 'https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png', quantity: 2, unitPrice: 320000, displayUnitPrice: '320.000₫', variant: '1kg/gói' }] }] as Order[];
      case 'COMPLETED':
          return [{ ...baseOrder, status: 'COMPLETED', id: 'ORD-DONE-01', items: [{...baseOrder.items[0], name: 'Khoáng tạt APA Miner Pox giúp cứng vỏ', imageUrl: 'https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg', quantity: 5, unitPrice: 120000, displayUnitPrice: '120.000₫', variant: 'Chai 1 lít' }], displayTotalAmount: '600.000₫' }] as Order[];
      case 'CANCELLED':
          return [
              { ...baseOrder, status: 'CANCELLED', id: 'ORD-CANCEL-01', displayTotalAmount: '250.000₫' }, 
              { ...baseOrder, status: 'CANCELLED', id: 'ORD-CANCEL-02', displayTotalAmount: '120.000₫', items: [{...baseOrder.items[0], name: 'Khoáng tạt APA Miner Pox', imageUrl: 'https://apanano.com/wp-content/uploads/APA-MINER-POX_Shrimp.jpg'}] } 
          ] as Order[];
      case 'RETURN_REQUESTED':
           return [];
      case 'ALL':
          return [
              { ...baseOrder, status: 'PENDING', id: 'ORD-PENDING-01' },
              { ...baseOrder, status: 'SHIPPING', id: 'ORD-SHIP-01', displayTotalAmount: '640.000₫' },
              { ...baseOrder, status: 'CANCELLED', id: 'ORD-CANCEL-01' }
          ] as Order[];
      default:
          return [];
  }
};

export default function OrderingPage() {
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get('status') || 'ALL') as OrderStatus;

  // Sử dụng mock data
  const orders = getMockOrders(statusFilter);
  const isLoading = false;
  const isError = false;

  return (
    <>
      <OrderTabs />

      <div className="mt-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Đang tải đơn hàng...</div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500">Có lỗi xảy ra khi tải đơn hàng.</div>
        ) : orders && orders.length > 0 ? (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} onOrderCancelled={() => console.log("Reload list")} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg p-10 border border-gray-100 shadow-sm min-h-[300px]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <PackageX size={40} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Chưa có đơn hàng nào.</p>
            <Link href="/" className="mt-4 px-6 py-2 bg-[#2d9f8d] text-white rounded-full font-bold text-sm hover:bg-[#248273] transition-colors">
              Mua sắm ngay
            </Link>
          </div>
        )}
      </div>
    </>
  );
}