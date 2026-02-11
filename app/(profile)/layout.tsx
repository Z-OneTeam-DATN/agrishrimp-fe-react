'use client';

import { useState } from 'react'; // Import useState
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Menu } from 'lucide-react'; // Added Menu icon
import { usePathname, useRouter } from 'next/navigation';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility

  // Map path to breadcrumb name
  const getBreadcrumbName = (path: string) => {
    if (path === '/profile') return 'Hồ sơ của tôi';
    if (path.includes('/edit-profile')) return 'Thiết lập tài khoản';
    if (path.includes('/address/create')) return 'Thêm địa chỉ mới';
    if (path.includes('/address')) return 'Sổ địa chỉ';
    if (path.includes('/orders/list')) return 'Đơn hàng của tôi';
    if (path.includes('/ponds/create')) return 'Thêm ao nuôi mới';
    if (path.includes('/ponds')) return 'Quản lý ao nuôi';
    if (path.includes('/voucher/create')) return 'Nhập mã Voucher';
    if (path.includes('/voucher')) return 'Kho Voucher';
    if (path.includes('/orders/')) return 'Chi tiết đơn hàng';
    if (path.includes('/orders/return/request/')) return 'Yêu cầu hoàn tiền';
    if (path.includes('/address/')) return 'Cập nhật địa chỉ';
    if (path.includes('/ponds/')) return 'Cập nhật ao nuôi';
    return 'Tài khoản của tôi';
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans">
      {/* Mobile Header (visible on small screens, hidden on large) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-800 p-1 -ml-1"> {/* Button to open sidebar */}
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-lg text-gray-800 truncate flex-1 text-center">
          {getBreadcrumbName(pathname)}
        </h1>
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-800 p-1 -mr-1"> {/* Original back button, moved to right */}
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="lg:container lg:mx-auto px-4 py-4 lg:px-4 lg:py-6 relative"> {/* Added relative to container */}
        
        {/* Breadcrumb (hidden on small screens, visible on large) */}
        <nav className="hidden lg:flex mb-6 text-sm text-gray-500 items-center">
          <Link href="/" className="hover:text-[#329965] hover:underline transition-colors">Trang chủ</Link> 
          <ChevronRight size={14} className="mx-2" />
          <Link href="/profile" className="hover:text-[#329965] hover:underline transition-colors">Tài khoản</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">{getBreadcrumbName(pathname)}</span>
        </nav>

        {/* Sidebar as Navigation Drawer (Mobile Only) */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300
                       lg:hidden /* Hidden on large screens */
                       ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <ProfileSidebar onLinkClick={() => setIsSidebarOpen(false)} />
        </div>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Main content grid for Desktop and stacked on Mobile (without the mobile drawer here) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI: STATIC SIDEBAR (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-3"> {/* Hidden on small, block on large */}
            <ProfileSidebar onLinkClick={() => setIsSidebarOpen(false)} />
          </div>

          {/* CỘT PHẢI: NỘI DUNG CHÍNH */}
          <div className="col-span-12 lg:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
