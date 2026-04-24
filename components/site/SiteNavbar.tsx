"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, ShoppingCart, MapPin, BookOpen } from "lucide-react";
import MegaMenuDropdown from "./MegaMenuDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const cartHref = "https://agrishrimp.io.vn/user/cart";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `flex items-center gap-1.5 px-3 h-8 rounded text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
      isActive(href)
        ? "bg-primary/10 text-primary"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-[68px] z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-11 gap-1 overflow-x-auto overflow-y-visible scrollbar-hide lg:overflow-visible">

          <Link href="/" className={linkClass("/")}>
            <Home size={15} />
            <span>Trang chủ</span>
          </Link>

          <Link href="/profile" className={linkClass("/profile")}>
            <User size={15} />
            <span>Tài khoản</span>
          </Link>

          <Link href={cartHref} className={linkClass("/user/cart")}>
            <ShoppingCart size={15} />
            <span>Giỏ hàng</span>
          </Link>

          {/* Mega menu — sau Giỏ hàng */}
          <div className="shrink-0">
            <MegaMenuDropdown />
          </div>

          <Link href="/store-locator" className={linkClass("/store-locator")}>
            <MapPin size={15} />
            <span>Hệ thống cửa hàng</span>
          </Link>

          <Link href="/blog" className={linkClass("/blog")}>
            <BookOpen size={15} />
            <span>Blog</span>
          </Link>

        </div>
      </div>
    </nav>
  );
}
