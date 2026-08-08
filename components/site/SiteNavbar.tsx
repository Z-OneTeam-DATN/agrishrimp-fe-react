"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MegaMenuDropdown from "./MegaMenuDropdown";

export default function Navbar() {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Trang chủ", type: "link" as const },
    { href: "#", label: "Danh mục", type: "mega" as const },
    { href: "/chan-doan-benh-tom-bang-ai", label: "Chẩn đoán bệnh", type: "link" as const },
    { href: "/user/cart", label: "Giỏ hàng", type: "link" as const },
    { href: "/blog", label: "Bài viết", type: "link" as const },
  ];
  const mobileNavItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/vat-tu-thuy-san", label: "Vật tư" },
    { href: "/chan-doan-benh-tom-bang-ai", label: "Chẩn đoán bệnh" },
    { href: "/user/cart", label: "Giỏ hàng" },
    { href: "/blog", label: "Bài viết" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center px-1 py-4 text-[12px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap transition-colors ${
      isActive(href)
        ? "text-[#2f5f98]"
        : "text-[#1f1f1f] hover:text-[#2f5f98]"
    }`;

  return (
    <>
      <nav className="border-b border-gray-200 bg-white shadow-sm md:hidden">
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-center gap-6 px-4">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <nav className="hidden border-b border-gray-200 bg-white shadow-sm md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8">
            {navItems.map((item) => (
              <div key={item.label} className="flex items-center">
                {item.type === "mega" ? (
                  <div className="shrink-0">
                    <MegaMenuDropdown />
                  </div>
                ) : (
                  <Link href={item.href} className={linkClass(item.href)}>
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
