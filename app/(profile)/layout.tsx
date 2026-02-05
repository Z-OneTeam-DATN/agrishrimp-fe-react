'use client';

import ProfileSidebar from '@/components/profile/ProfileSidebar';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Map path to breadcrumb name
  const getBreadcrumbName = (path: string) => {
    if (path === '/profile') return 'Hồ sơ của tôi';
    if (path === '/edit-profile') return 'Thiết lập tài khoản';
    if (path === '/address') return 'Sổ địa chỉ';
    if (path === '/orders/list') return 'Đơn hàng của tôi';
    if (path === '/ponds') return 'Quản lý ao nuôi';
    if (path === '/voucher') return 'Kho Voucher';
    if (path.startsWith('/orders/')) return 'Chi tiết đơn hàng';
    if (path.startsWith('/address/')) return 'Quản lý địa chỉ';
    if (path.startsWith('/ponds/')) return 'Chi tiết ao nuôi';
    return 'Tài khoản của tôi';
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans">
      <div className="container mx-auto px-4 py-6">
        
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 flex items-center">
          <Link href="/" className="hover:text-[#329965] hover:underline transition-colors">Trang chủ</Link> 
          <ChevronRight size={14} className="mx-2" />
          <Link href="/profile" className="hover:text-[#329965] hover:underline transition-colors">Tài khoản</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">{getBreadcrumbName(pathname)}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: SIDEBAR */}
          <div className="lg:col-span-3 hidden lg:block">
            <ProfileSidebar />
          </div>

          {/* CỘT PHẢI: NỘI DUNG CHÍNH */}
          <div className="lg:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
