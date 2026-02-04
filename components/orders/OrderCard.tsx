'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Order, OrderStatus } from '@/app/types/order.schema';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { CancelOrderModal } from './CancelOrderModal';
import { Store } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onOrderCancelled?: () => void;
}

export function OrderCard({ order, onOrderCancelled }: OrderCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return { label: 'Chờ xác nhận', className: 'text-orange-500 bg-orange-50' };
      case 'SHIPPING': return { label: 'Đang giao', className: 'text-blue-500 bg-blue-50' };
      case 'COMPLETED': return { label: 'Hoàn thành', className: 'text-[#2d9f8d] bg-green-50' };
      case 'RETURN_REQUESTED': return { label: 'Trả hàng/Hoàn tiền', className: 'text-purple-500 bg-purple-50' };
      case 'CANCELLED': return { label: 'Đã hủy', className: 'text-red-500 bg-red-50' };
      default: return { label: status, className: 'text-gray-500' };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="bg-white rounded-lg mb-3 shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 bg-gray-50/30">
        <div className="font-bold text-gray-800 flex items-center text-sm">
          <Store size={16} className="mr-2 text-gray-500" /> {order.shopName}
        </div>
        <div className={cn("uppercase text-xs font-bold px-2 py-1 rounded", statusInfo.className)}>
          {statusInfo.label}
        </div>
      </div>

      {/* Body - Link to Details */}
      <Link href={`/ordering/${order.id}`} className="block px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
        {order.items.map((item, index) => (
          <div key={index} className={cn("flex gap-3 py-2", { "border-b border-dashed border-gray-100": index < order.items.length - 1 })}>
            <div className="relative w-16 h-16 flex-shrink-0">
               <Image
                 src={item.imageUrl}
                 alt={item.name}
                 fill
                 className="rounded border border-gray-200 object-cover"
               />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm truncate">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">x{item.quantity} | {item.variant}</div>
            </div>
            <div className="text-right text-sm font-medium text-gray-900">{item.displayUnitPrice}</div>
          </div>
        ))}
      </Link>

      {/* Footer - Actions */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
        <div className="text-gray-600 text-sm">
          Tổng tiền: <span className="text-base font-bold text-red-600 ml-1">{order.displayTotalAmount}</span>
        </div>
        
        <div className="flex gap-2">
          {/* Cancel Button Logic */}
          {order.status === 'PENDING' && (
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-300 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                  Hủy đơn
                </Button>
              </DialogTrigger>
              <CancelOrderModal 
                orderId={order.id} 
                onClose={() => setIsCancelModalOpen(false)} 
                onOrderCancelled={onOrderCancelled} 
              />
            </Dialog>
          )}

          {/* Action Buttons for Completed Orders */}
          {order.status === 'COMPLETED' && (
            <>
              <Link href={`/ordering/return/request?orderId=${order.id}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-300 text-gray-600">Trả hàng</Button>
              </Link>
              <Button size="sm" className="h-8 text-xs bg-[#2d9f8d] hover:bg-[#248273] text-white">Mua lại</Button>
            </>
          )}

           {/* Action Buttons for Cancelled Orders */}
           {order.status === 'CANCELLED' && (
              <Button size="sm" className="h-8 text-xs bg-[#2d9f8d] hover:bg-[#248273] text-white">Mua lại</Button>
          )}

          <Link href={`/ordering/${order.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs border-[#2d9f8d] text-[#2d9f8d] hover:bg-[#eafef9]">
              Chi tiết
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}