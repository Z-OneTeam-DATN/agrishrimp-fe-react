'use client';

import React, { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CreditCard, FileText, Package, Truck, CheckCircle2, Clock } from 'lucide-react';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Mock data - Thay bằng API call lấy chi tiết đơn hàng
  const order = {
        id: id,
        shopName: 'AgriShrimp Official',
        status: 'PENDING',
        createdAt: '23/01/2026 14:30',
        items: [
            { id: '1', name: 'Florfenicol kết hợp Oxytetracycline', imageUrl: 'https://vagen.com.vn/app/user/12/12/admin/file/UPHINHTAM/thiet-ke-chua-co-ten.png', quantity: 1, unitPrice: '250.000₫', variant: '500g/túi' }
        ],
        finalTotal: '215.000₫'
  };

  // Cấu hình các bước Stepper
  const steps = [
    { icon: FileText, label: 'Đơn hàng đã đặt', time: '14:30 23/01' },
    { icon: CreditCard, label: 'Chờ xác nhận', time: '14:32 23/01' },
    { icon: Package, label: 'Đã giao ĐVVC', time: '' },
    { icon: Truck, label: 'Đang giao hàng', time: '' },
    { icon: CheckCircle2, label: 'Hoàn thành', time: '' },
  ];
  
  const activeStep = 1; // Giả sử đang ở bước Chờ xác nhận

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        
        <nav className="mb-4 text-sm flex items-center text-gray-500">
            <Link href="/" className="hover:text-[#2d9f8d]">Trang chủ</Link>
            <span className="mx-2">/</span>
            <Link href="/orders/list" className="hover:text-[#2d9f8d]">Đơn hàng</Link>
            <span className="mx-2">/</span>
            <span className="font-bold text-gray-800">Chi tiết đơn hàng</span>
        </nav>

        <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Đơn hàng #{order.id}</h1>
            <span className="text-orange-500 font-bold uppercase text-sm flex items-center">
                <Clock size={16} className="mr-1" /> Chờ xác nhận
            </span>
        </div>

        {/* STEPPER */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-4">
            <div className="relative flex justify-between w-full px-4 mb-6">
                <div className="absolute top-[15px] left-10 right-10 h-1 bg-gray-200 -z-0"></div>
                <div className="absolute top-[15px] left-10 h-1 bg-[#2d9f8d] -z-0 transition-all duration-500" style={{ width: '25%' }}></div>

                {steps.map((step, idx) => {
                    const isActive = idx === activeStep;
                    const isFinished = idx < activeStep;
                    return (
                        <div key={idx} className="flex flex-col items-center relative z-10 w-1/5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-all ${isActive || isFinished ? 'bg-[#2d9f8d]' : 'bg-gray-300'} ${isActive ? 'shadow-[0_0_0_4px_rgba(45,159,141,0.2)]' : ''}`}>
                                <step.icon size={16} />
                            </div>
                            <div className={`mt-2 text-xs font-bold ${isActive || isFinished ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</div>
                            {step.time && <div className="text-[10px] text-gray-500 mt-0.5">{step.time}</div>}
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded p-3 flex items-start gap-3">
                <Clock className="text-orange-500 mt-0.5" size={18} />
                <div className="text-sm text-gray-700">Đơn hàng đang chờ người bán xác nhận. Vui lòng chờ trong giây lát.</div>
            </div>
        </div>

        {/* INFO CARD */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">Địa chỉ nhận hàng</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex"><span className="w-32">Người nhận</span> <span className="font-medium text-gray-900">Võ Thị Mỹ Thanh</span></div>
                        <div className="flex"><span className="w-32">Số điện thoại</span> <span className="font-medium text-gray-900">(+84) 909 123 456</span></div>
                        <div className="flex"><span className="w-32">Địa chỉ</span> <span className="font-medium text-gray-900 flex-1">123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, TP Cần Thơ</span></div>
                    </div>
                </div>
                <div className="md:border-l md:pl-8 border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm">Hình thức thanh toán</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex"><span className="w-32 text-gray-500">Phương thức</span> <span className="font-medium text-gray-900">Chuyển khoản (Banking)</span></div>
                        <div className="flex"><span className="w-32 text-gray-500">Trạng thái</span> <span className="font-bold text-orange-500">Chưa thanh toán</span></div>
                    </div>
                    <button className="mt-4 px-4 h-12 bg-[#2d9f8d] text-white text-sm font-bold rounded hover:bg-[#248273]">Thanh toán ngay</button>
                </div>
            </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-sm text-gray-700">Sản phẩm</div>
            <div className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-4 items-center">
                        <div className="relative w-16 h-16 border rounded border-gray-200">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover rounded" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-sm text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-1">Phân loại: {item.variant}</div>
                        </div>
                        <div className="text-center w-24 text-sm text-gray-600">{item.unitPrice}</div>
                        <div className="text-center w-16 text-sm text-gray-600">x{item.quantity}</div>
                        <div className="text-right w-24 font-bold text-sm text-gray-900">{item.unitPrice}</div>
                    </div>
                ))}
            </div>
            {/* Summary */}
            <div className="bg-gray-50 p-4 space-y-2 border-t border-gray-100">
                <div className="flex justify-end text-base pt-2 border-t border-gray-200 mt-2">
                    <span className="text-gray-800 font-bold w-40 text-right mr-4">Tổng thanh toán</span> 
                    <span className="font-bold text-red-600 w-24 text-right">{order.finalTotal}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}