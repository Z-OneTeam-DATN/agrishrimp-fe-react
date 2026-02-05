'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { Ticket, Percent, Truck, Clock, Tag, Copy, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// --- MOCK DATA ---
const initialVouchers = [
  {
    id: 1,
    title: 'Giảm 50K cho đơn từ 500K',
    code: 'AGRI50',
    expiry: '31/12/2025',
    description: 'Áp dụng cho các sản phẩm thuốc thủy sản.',
    type: 'discount', 
    status: 'ACTIVE'
  },
  {
    id: 2,
    title: 'Miễn phí vận chuyển',
    code: 'FREESHIP',
    expiry: '15/06/2025',
    description: 'Tối đa 30K. Áp dụng toàn quốc.',
    type: 'freeship',
    status: 'ACTIVE'
  },
  {
    id: 3,
    title: 'Giảm 10% tối đa 100K',
    code: 'SALE10',
    expiry: '01/01/2024',
    description: '',
    type: 'expired',
    status: 'EXPIRED'
  }
];

export default function VoucherWalletPage() {
  const [vouchers, setVouchers] = useState(initialVouchers);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bạn có chắc muốn xóa voucher này?')) {
      setVouchers(vouchers.filter(v => v.id !== id));
      toast.success('Đã xóa voucher khỏi ví.');
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans text-gray-800">
      <div className="container mx-auto px-4 py-6">
        
        <nav className="mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#2d9f8d]">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/profile" className="hover:text-[#2d9f8d]">Tài khoản</Link>
          <span className="mx-2">/</span>
          <span className="font-bold text-gray-800">Kho Voucher</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <div>
                  <h5 className="font-bold text-lg text-gray-800 m-0">Ví Voucher & Ưu đãi</h5>
                  <small className="text-gray-500 text-xs">Quản lý mã giảm giá của bạn</small>
                </div>
                
                {/* NÚT CHUYỂN TRANG */}
                <Link href="/voucher/create">
                  <button className="bg-[#2d9f8d] hover:bg-[#248273] text-white text-sm font-bold px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Ticket size={18} /> Nhập mã Voucher
                  </button>
                </Link>
              </div>

              {/* Voucher List */}
              <div className="p-6 space-y-6">
                {vouchers.map((voucher) => (
                  <div key={voucher.id} className="relative group">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      
                      <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 
                        ${voucher.type === 'freeship' ? 'bg-blue-50 text-blue-500' : 
                          voucher.type === 'expired' ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-500'}`}>
                        {voucher.type === 'freeship' ? <Truck size={32} /> : <Percent size={32} />}
                      </div>

                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`text-base font-bold mb-1 ${voucher.status === 'EXPIRED' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {voucher.title}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                              <span className="flex items-center gap-1"><Clock size={12}/> {voucher.status === 'EXPIRED' ? 'Hết hạn:' : 'HSD:'} {voucher.expiry}</span>
                              {voucher.status !== 'EXPIRED' && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <span className="flex items-center gap-1"><Tag size={12}/> Mã: <span className="font-bold text-red-500">{voucher.code}</span></span>
                                </>
                              )}
                            </div>

                            {voucher.description && (
                              <div className="text-xs text-gray-400 italic mb-2">{voucher.description}</div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded border ${
                              voucher.status === 'EXPIRED' 
                                ? 'bg-gray-100 text-gray-500 border-gray-200' 
                                : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                              {voucher.status === 'EXPIRED' ? 'Đã hết hạn' : 'Chưa dùng'}
                            </span>

                            <div className="flex gap-3 mt-1">
                              {voucher.status !== 'EXPIRED' ? (
                                <>
                                  <button onClick={() => handleCopy(voucher.code)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                                    <Copy size={12} /> Sao chép
                                  </button>
                                  <Link href="/store" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1">
                                    <ShoppingCart size={12} /> Dùng ngay
                                  </Link>
                                </>
                              ) : (
                                <button onClick={() => handleDelete(voucher.id)} className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1">
                                  <Trash2 size={12} /> Xóa bỏ
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-3 left-0 right-0 border-b border-dashed border-gray-100 last:hidden"></div>
                  </div>
                ))}

                {vouchers.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <Ticket size={48} className="mx-auto text-gray-300 mb-3"/>
                        <p>Ví voucher của bạn đang trống.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}