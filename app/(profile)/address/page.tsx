'use client';

import Link from 'next/link';
import { Plus, CheckCircle2 } from 'lucide-react';

// Mock Data
const MOCK_ADDRESSES = [
  { id: 1, fullName: 'Võ Thị Mỹ Thanh', phone: '0909123456', specificAddress: '123 Đường 3/2', addressType: 'Home', isDefault: true },
  { id: 2, fullName: 'Thanh Võ (Công ty)', phone: '0939888999', specificAddress: 'Tòa nhà FPT', addressType: 'Office', isDefault: false }
];

export default function AddressListPage() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
            <h5 className="font-bold text-gray-800 text-lg">Địa chỉ của tôi</h5>
            
            {/* NÚT THÊM MỚI: CHUYỂN TRANG */}
            <Link href="/address/create">
                <button className="bg-[#329965] hover:bg-[#268050] text-white px-4 py-2 rounded-md text-sm font-bold flex items-center transition-colors shadow-sm">
                    <Plus size={18} className="mr-1" /> Thêm địa chỉ mới
                </button>
            </Link>
        </div>

        <div className="p-5 space-y-4">
            {MOCK_ADDRESSES.map((addr) => (
                <div key={addr.id} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start hover:border-[#329965] transition-colors bg-white">
                    <div className="flex-1 mb-3 md:mb-0">
                        <div className="flex items-center mb-1">
                            <h6 className="font-bold text-gray-900 text-sm">{addr.fullName}</h6>
                            <span className="text-gray-300 mx-2 font-light">|</span>
                            <span className="text-gray-600 text-sm">{addr.phone}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 leading-relaxed">{addr.specificAddress}</div>
                        {addr.isDefault && (
                            <span className="inline-flex items-center text-xs font-bold text-[#329965] border border-[#329965] px-2 py-0.5 rounded bg-green-50">
                                <CheckCircle2 size={12} className="mr-1" /> Mặc định
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2 min-w-[140px]">
                        <div className="flex items-center gap-3 text-sm">
                            {/* NÚT SỬA: CHUYỂN TRANG */}
                            <Link href={`/address/${addr.id}`} className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                                Cập nhật
                            </Link>
                            {!addr.isDefault && (
                                <button className="text-red-500 hover:text-red-700 font-medium hover:underline">Xóa</button>
                            )}
                        </div>
                        <button 
                            className={`text-xs border px-3 py-1.5 rounded transition-colors ${addr.isDefault 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                : 'bg-white text-gray-600 border-gray-300 hover:border-[#329965] hover:text-[#329965]'}`}
                            disabled={addr.isDefault}
                        >
                            {addr.isDefault ? 'Đã là mặc định' : 'Thiết lập mặc định'}
                        </button>
                    </div>
                </div>
            ))}
        </div>

    </div>
  );
}