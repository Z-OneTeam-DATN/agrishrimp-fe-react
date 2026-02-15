import Link from "next/link";
import { LayoutGrid, Phone, MapPin } from "lucide-react";
import { MAIN_NAV } from "@/lib/Constant";

export default function Navbar() {
  return (
    <nav className="border-b border-primary-light bg-[#f5fffd] h-[46px] text-sm font-semibold text-gray-700 sticky top-[64px] z-40">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 border-r border-primary-light pr-6 h-full cursor-pointer hover:text-primary transition-colors">
          <LayoutGrid className="text-primary" size={20} />
          <span className="hidden lg:block uppercase tracking-wide">
            Danh mục
          </span>
        </div>

        <div className="flex-1 flex items-center gap-6 px-6 overflow-x-auto h-full scrollbar-hide">
          {MAIN_NAV.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap h-full uppercase border-b-2 border-transparent transition-all
                  ${item.highlight ? "text-secondary hover:text-secondary-hover" : "hover:text-primary hover:border-primary"}
                `}
              >
                {item.highlight && Icon && <Icon size={16} />}
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
