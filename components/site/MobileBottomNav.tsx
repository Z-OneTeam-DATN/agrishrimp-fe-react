"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, ShoppingCart, User, Bot } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCartStore();
  const { isAuthenticated, data: user } = useCurrentUser();
  const isLoggedIn = isAuthenticated && !!user;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Trang chủ",
    },
    {
      href: "/san-pham",
      icon: Search,
      label: "Tìm kiếm",
    },
    {
      href: "/user/cart",
      icon: ShoppingCart,
      label: "Giỏ hàng",
      badge: itemCount > 0 ? (itemCount > 99 ? "99+" : String(itemCount)) : null,
    },
    {
      href: "/ai-doctor",
      icon: Bot,
      label: "Bác sĩ AI",
    },
    {
      href: isLoggedIn ? "/profile" : "/login",
      icon: User,
      label: isLoggedIn ? "Tài khoản" : "Đăng nhập",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch h-[60px]">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                active ? "text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 inset-x-3 h-0.5 bg-primary rounded-b-full" />
              )}

              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {badge && (
                  <span className="absolute -top-2 -right-2.5 bg-red-500 text-white text-[9px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border-2 border-white font-bold">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? "text-primary" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area for phones with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}
