import Link from "next/link";
import Image from "next/image";
import { Facebook, Youtube, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { SITE_CONFIG } from "@/lib/Constant";

const SUPPORT_LINKS = [
  { label: "Hướng dẫn mua hàng",   href: "/ordering" },
  { label: "Chính sách thanh toán", href: "/terms-of-use" },
  { label: "Chính sách giao hàng",  href: "/shipping-fee" },
  { label: "Chính sách đổi trả",    href: "/return" },
  { label: "Chính sách bảo mật",    href: "/privacy-policy" },
];

const ABOUT_LINKS = [
  { label: "Giới thiệu công ty", href: "/about" },
  { label: "Tin tức & Blog",     href: "/blog" },
  { label: "Hệ thống đại lý",   href: "/store-locator" },
  { label: "Tuyển dụng",         href: "/careers" },
  { label: "Liên hệ",           href: "/contact" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 text-sm text-gray-600 hidden md:block">
      {/* Main grid */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1 — Brand + contact */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
              </div>
              <div className="leading-[1.1]">
                <p className="text-[15px] font-extrabold tracking-tight text-gray-900">
                  AGRI<span className="text-primary">SHRIMP</span>
                </p>
                <p className="text-[9px] tracking-[0.18em] text-gray-400 font-medium">& STORE</p>
              </div>
            </div>

            <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
              Hệ thống phân phối vật tư nuôi tôm hàng đầu, mang đến giải pháp toàn diện cho bà con nuôi trồng thủy sản.
            </p>

            <ul className="space-y-2 text-[13px]">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                <span>{SITE_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-primary shrink-0" />
                <span className="font-semibold text-gray-800">{SITE_CONFIG.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-primary shrink-0" />
                <span>support@agrishrimp.vn</span>
              </li>
            </ul>
          </div>

          {/* Col 2 — Hỗ trợ khách hàng */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-900 mb-4">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-gray-500 hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Về AgriShrimp */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-900 mb-4">
              Về AgriShrimp
            </h4>
            <ul className="space-y-2.5">
              {ABOUT_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-gray-500 hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Newsletter + Social */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-900 mb-2">
              Đăng ký nhận tin
            </h4>
            <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
              Nhận ngay thông tin sản phẩm mới và các ưu đãi đặc biệt dành riêng cho bạn.
            </p>

            <div className="flex mb-6">
              <input
                type="email"
                placeholder="Email của bạn..."
                className="flex-1 min-w-0 px-3 py-2 text-[13px] border border-gray-300 border-r-0 rounded-l outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-semibold rounded-r transition-colors shrink-0"
              >
                Gửi
              </button>
            </div>

            <h4 className="text-[12px] font-bold uppercase tracking-wider text-gray-900 mb-3">
              Kết nối với chúng tôi
            </h4>
            <div className="flex gap-3">
              <Link href="#" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <Facebook size={16} />
              </Link>
              <Link href="#" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <Instagram size={16} />
              </Link>
              <Link href="#" className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <Youtube size={16} />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between">
          <p className="text-[12px] text-gray-400">
            © 2026 AgriShrimp. Tất cả các quyền được bảo lưu.
          </p>
          {/* Payment icons (text placeholder) */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 border border-gray-200 rounded text-[10px] font-bold text-blue-900 italic tracking-tighter">VISA</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-[10px] font-bold text-red-600">MC</span>
            <span className="px-2 py-1 border border-gray-200 rounded text-[10px] font-bold text-blue-500">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
