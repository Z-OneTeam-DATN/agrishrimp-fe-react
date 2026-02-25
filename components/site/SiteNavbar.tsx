import Link from "next/link";
import { Phone, MapPin } from "lucide-react";
import { MAIN_NAV } from "@/lib/Constant";
import HeaderCategoryDropdown from "./HeaderCategoryDropdown";
import HeaderBrandDropdown from "./HeaderBrandDropdown";

export default function Navbar() {
  return (
    <nav className="border-b border-primary-light bg-[#f5fffd] h-[46px] text-sm font-semibold text-gray-700 sticky top-[64px] z-40">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center h-full">
          {MAIN_NAV.filter(item => item.label === "Trang chủ").map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap h-full uppercase border-b-2 border-transparent transition-all
                  font-bold text-orange-600 hover:text-orange-700 hover:border-orange-600 text-sm px-4
                `}
              >
                {Icon && <Icon size={16} className="text-orange-500" />}
                {item.label}
              </Link>
            );
          })}
          <div className="w-px h-6 bg-gray-200 mx-2 hidden lg:block"></div>
          <HeaderCategoryDropdown />
          <div className="w-px h-6 bg-gray-200 mx-2 hidden lg:block"></div>
          <HeaderBrandDropdown />
        </div>

        <div className="flex-1 flex items-center gap-6 px-6 overflow-x-auto h-full scrollbar-hide">
          {MAIN_NAV.filter(item => item.label !== "Thương hiệu" && item.label !== "Trang chủ").map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap h-full uppercase border-b-2 border-transparent transition-all
                  font-bold text-orange-600 hover:text-orange-700 hover:border-orange-600 text-sm
                `}
              >
                {Icon && <Icon size={16} className="text-orange-500" />}
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="hidden lg:flex items-center gap-4 text-[13px] text-gray-500">
          <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
            <Phone size={14} className="text-primary" />
            <span>Tải ứng dụng</span>
          </div>
          <div className="w-px h-3 bg-gray-300"></div>
          <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
            <MapPin size={14} className="text-primary" />
            <span>Chọn khu vực</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
