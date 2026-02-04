'use client';

import { useQuery } from '@tanstack/react-query';
import { OrderTabs } from '@/components/orders/OrderTabs';
import ProfileSidebar from '@/components/profile/ProfileSidebar'; // Lưu ý import default
import { OrderService } from '@/app/services/order.service';
import { ArrowLeftRight, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function ReturnListPage() {
  const { data: returns, isLoading } = useQuery({
    queryKey: ['returnOrders'],
    queryFn: OrderService.getReturnOrders,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 text-[10px] font-bold uppercase"><Clock size={12}/> Đang xử lý</span>;
      case 'COMPLETED':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold uppercase"><CheckCircle2 size={12}/> Đã hoàn tiền</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold uppercase"><XCircle size={12}/> Bị từ chối</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans">
        <div className="container py-4 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 hidden lg:block">
            <ProfileSidebar />
            </div>

            <div className="lg:col-span-3">
            <OrderTabs />

            {isLoading ? (
                <div className="text-center py-10 text-gray-500">Đang tải danh sách hoàn trả...</div>
            ) : (
                <div className="mt-4 space-y-4">
                    {returns?.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                        {/* Header */}
                        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50 bg-gray-50/30">
                        <div className="font-bold text-gray-800 flex items-center text-sm">
                            <ArrowLeftRight size={16} className="mr-2 text-gray-500" /> 
                            Mã yêu cầu: #{item.id}
                        </div>
                        {getStatusBadge(item.status)}
                        </div>

                        {/* Body */}
                        <div className="p-4 cursor-pointer">
                        <div className="flex gap-4">
                            <img src={item.productImg} alt={item.productName} className="w-16 h-16 rounded border border-gray-200 object-cover bg-white" />
                            <div className="flex-1">
                            <div className="font-bold text-sm text-gray-900 line-clamp-1">{item.productName}</div>
                            <div className="text-xs text-gray-500 mt-1">Số lượng: {item.quantity} | Đơn hàng: #{item.orderId}</div>
                            <div className="mt-2 inline-flex items-center bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-100 font-medium">
                                Lý do: {item.reason}
                            </div>
                            </div>
                        </div>

                        {item.status === 'REJECTED' && (
                            <div className="mt-3 p-3 bg-red-50 rounded text-xs text-red-700 border border-red-100 flex gap-2 items-start">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <div><strong>Shop phản hồi:</strong> {item.shopResponse}</div>
                            </div>
                        )}
                        
                        {item.status === 'COMPLETED' && (
                             <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                                <i className="bi bi-info-circle"></i> Tiền đã được hoàn vào ví AgriShrimp của bạn.
                             </div>
                        )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-white">
                        <div className="text-sm text-gray-600">
                            Hoàn lại dự kiến: <span className="text-red-600 font-bold text-base ml-1">{item.amount}</span>
                        </div>
                        <div className="flex gap-2">
                            {item.status === 'REJECTED' && (
                                <button className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-bold hover:bg-gray-50">Khiếu nại</button>
                            )}
                            <button className="px-3 py-1.5 border border-[#2d9f8d] text-[#2d9f8d] rounded text-xs font-bold hover:bg-[#eafef9]">
                                Xem chi tiết
                            </button>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
            </div>
        </div>
        </div>
    </div>
  );
}