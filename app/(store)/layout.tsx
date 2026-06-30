"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import StoreSidebar from "@/components/shop/StoreSidebar";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileSiteHeaderHeight, setMobileSiteHeaderHeight] = useState(156);

  // Map path to breadcrumb name
  const getBreadcrumbName = (path: string) => {
    if (path === "/store" || path === "/account") return "Tài khoản";
    if (path.includes("/about")) return "Giới thiệu AgriShrimp";
    if (path.includes("/account")) return "Tài khoản";
    if (path.includes("/contact")) return "Liên hệ";
    if (path.includes("/cookie-policy")) return "Chính sách cookie";
    if (path.includes("/ordering")) return "Hướng dẫn đặt hàng";
    if (path.includes("/packing")) return "Quy cách đóng gói";
    if (path.includes("/privacy-policy")) return "Chính sách bảo mật";
    if (path.includes("/return")) return "Chính sách đổi trả";
    if (path.includes("/shipping-fee")) return "Phí vận chuyển";
    if (path.includes("/store-locator")) return "Hệ thống cửa hàng";
    if (path.includes("/terms-of-use")) return "Điều khoản sử dụng";
    if (path.includes("/warranty-policy")) return "Chính sách bảo hành";
    return "Cửa hàng";
  };

  useEffect(() => {
    const syncHeaderHeight = () => {
      const mobileHeader = document.querySelector<HTMLElement>("[data-mobile-site-header]");
      if (!mobileHeader) return;
      setMobileSiteHeaderHeight(mobileHeader.offsetHeight);
    };

    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-10 font-sans">
      {/* Mobile Header (visible on small screens, hidden on large) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="text-gray-600 hover:text-gray-800 p-1 -ml-1"
        >
          <Menu size={24} />
        </button>
        <h1 className="font-bold text-lg text-gray-800 truncate flex-1 text-center">
          {getBreadcrumbName(pathname)}
        </h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800 p-1 -mr-1"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="lg:container lg:mx-auto px-4 py-4 lg:px-4 lg:py-6 relative">
        {/* Breadcrumb (hidden on small screens, visible on large) */}
        <nav className="hidden lg:flex mb-6 text-sm text-gray-500 items-center">
          <Link
            href="/"
            className="hover:text-[#1965a2] hover:underline transition-colors"
          >
            Trang chủ
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <Link
            href="/account"
            className="hover:text-[#1965a2] hover:underline transition-colors"
          >
            Tài khoản
          </Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="font-bold text-gray-800">
            {getBreadcrumbName(pathname)}
          </span>
        </nav>

        {/* Sidebar as Navigation Drawer (Mobile Only) */}
        <div
          className={`fixed bottom-0 left-0 z-50 w-64 overflow-y-auto bg-white shadow-xl transform transition-transform duration-300
                       lg:hidden /* Hidden on large screens */
                       ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{
            top: `${mobileSiteHeaderHeight}px`,
            height: `calc(100dvh - ${mobileSiteHeaderHeight}px)`,
          }}
        >
          <StoreSidebar onLinkClick={() => setIsSidebarOpen(false)} />
        </div>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-x-0 bottom-0 bg-black/50 z-40 lg:hidden"
            style={{ top: `${mobileSiteHeaderHeight}px` }}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI: STATIC SIDEBAR (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-3">
            <StoreSidebar onLinkClick={() => setIsSidebarOpen(false)} />
          </div>

          {/* CỘT PHẢI: NỘI DUNG CHÍNH */}
          <div className="col-span-12 lg:col-span-9">{children}</div>
        </div>
      </div>
    </div>
  );
}

