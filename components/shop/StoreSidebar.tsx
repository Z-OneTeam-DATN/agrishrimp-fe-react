'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User,           // Tài khoản
  ShoppingBag,    // Đặt hàng
  Package,        // Đóng gói
  Coins,          // Phí vận chuyển (bi-cash-coin)
  ShieldCheck,    // Bảo hành
  RotateCcw,      // Đổi trả
  Dot,            // Dấu chấm (bi-dot)
  MapPin          // Hệ thống cửa hàng
} from 'lucide-react';

// 1. Danh sách Menu Chính (Icon lớn)
const mainMenuItems = [
  { href: '/account', label: 'Tài khoản', icon: User },
  { href: '/ordering', label: 'Đặt hàng', icon: ShoppingBag },
  { href: '/packing', label: 'Quy cách đóng gói', icon: Package },
  { href: '/shipping-fee', label: 'Phí vận chuyển', icon: Coins },
  { href: '/warranty-policy', label: 'Chính sách bảo hành', icon: ShieldCheck },
  { href: '/return', label: 'Đổi trả, hoàn tiền', icon: RotateCcw },
];

// 2. Danh sách Thông tin hỗ trợ (Dấu chấm)
const supportMenuItems = [
  { href: '/about', label: 'Giới thiệu AgriShrimp' },
  { href: '/contact', label: 'Liên hệ' },
  { href: '/terms-of-use', label: 'Điều khoản sử dụng' },
  { href: '/privacy-policy', label: 'Chính sách bảo mật' },
  { href: '/cookie-policy', label: 'Chính sách cookie' },
  { href: '/clinic-policy', label: 'Chính sách khách hàng Clinic' },
  { href: '/store-locator', label: 'Hệ thống cửa hàng', icon: MapPin }, // Mục này có thể dùng icon khác hoặc dot tùy ý
];

export default function StoreSidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hidden lg:block">
      
      {/* --- PHẦN 1: MENU CHÍNH --- */}
      <div className="mb-4">
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-3 py-2.5 mb-1 rounded-md text-sm transition-all
                ${isActive 
                  ? 'bg-green-50 text-[#329965] font-bold' 
                  : 'text-gray-800 hover:bg-gray-50 hover:text-[#329965]'
                }
              `}
            >
              <Icon 
                size={20} 
                className={`mr-3 ${isActive ? 'text-[#329965]' : 'text-[#329965]'}`} 
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Đường kẻ ngang */}
      <hr className="my-4 border-gray-200 opacity-60" />

      {/* --- PHẦN 2: THÔNG TIN HỖ TRỢ --- */}
      <div>
        <h5 className="font-bold text-gray-900 mb-3 px-2 text-[1.1rem]">
          Thông tin hỗ trợ
        </h5>

        <ul className="space-y-1 pl-1">
          {supportMenuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-2 py-2 rounded-md text-sm transition-all
                    ${isActive 
                      ? 'bg-green-50 text-[#329965] font-bold' 
                      : 'text-gray-500 hover:text-[#329965] hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Nếu là mục Hệ thống cửa hàng thì dùng Icon MapPin, còn lại dùng Dot */}
                  {item.icon ? (
                    <MapPin size={24} className={`mr-1 ${isActive ? 'text-[#329965]' : 'text-gray-400'}`} />
                  ) : (
                    <Dot size={32} strokeWidth={3} className={`mr-0 -ml-1 ${isActive ? 'text-[#329965]' : 'text-gray-300'}`} />
                  )}
                  
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}