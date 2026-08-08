import Link from "next/link";
import Image from "next/image";
import { Facebook, Youtube, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { SITE_CONFIG } from "@/lib/Constant";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SUPPORT_LINKS = [
  { label: "Hướng dẫn mua hàng",   href: "/ordering" },
  { label: "Chính sách thanh toán", href: "/terms-of-use" },
  { label: "Chính sách giao hàng",  href: "/shipping-fee" },
  { label: "Chính sách đổi trả",    href: "/return" },
  { label: "Chính sách bảo mật",    href: "/privacy-policy" },
];

const ABOUT_LINKS = [
  { label: "Giới thiệu công ty", href: "/gioi-thieu" },
  { label: "Vật tư thủy sản", href: "/vat-tu-thuy-san" },
  { label: "Tin tức & Blog",     href: "/blog" },
  { label: "Hệ thống đại lý",   href: "/store-locator" },
  { label: "Tuyển dụng",         href: "/careers" },
  { label: "Liên hệ",           href: "/contact" },
];

const ACCOUNT_LINKS = [
  { label: "Đăng nhập / Đăng ký", href: "/login" },
  { label: "Tài khoản của tôi", href: "/profile" },
  { label: "Đơn hàng của tôi", href: "/orders/list" },
  { label: "Giỏ hàng", href: "/user/cart" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 text-xs text-gray-600">
      <div className="md:hidden">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] px-5 py-3">
          <h3 className="text-center text-[16px] font-medium tracking-tight text-slate-900">
            Đăng ký nhận tin
          </h3>
          <div className="mt-2.5 flex overflow-hidden rounded-full border border-[#c8d7f1] bg-white shadow-sm">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 px-3">
              <Mail size={14} className="shrink-0 text-slate-400" />
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="h-9 min-w-0 flex-1 bg-transparent text-[11px] text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-primary px-3.5 text-[11px] font-medium uppercase tracking-wide text-white transition-colors hover:bg-primary/90"
            >
              Đăng ký
            </button>
          </div>
        </div>

        <div className="bg-white px-5 pb-3 pt-1">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="company" className="border-b border-dashed border-slate-200">
              <AccordionTrigger className="py-3.5 text-left text-[13px] font-medium leading-snug text-slate-900 hover:no-underline">
                AGRISHRIMP & STORE
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <div className="space-y-2.5 text-[11px] text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                    <span>{SITE_CONFIG.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="shrink-0 text-primary" />
                    <span className="font-normal text-slate-800">{SITE_CONFIG.phone}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail size={14} className="shrink-0 text-primary" />
                    <span>support@agrishrimp.vn</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="about" className="border-b border-dashed border-slate-200">
              <AccordionTrigger className="py-3.5 text-left text-[13px] font-medium text-slate-900 hover:no-underline">
                Kiến thức & Kinh nghiệm
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <div className="space-y-2">
                  {ABOUT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-[11px] font-normal text-slate-600 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="policy" className="border-b border-dashed border-slate-200">
              <AccordionTrigger className="py-3.5 text-left text-[13px] font-medium text-slate-900 hover:no-underline">
                Chính sách & Bảo mật
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <div className="space-y-2">
                  {SUPPORT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-[11px] font-normal text-slate-600 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account" className="border-b border-dashed border-slate-200">
              <AccordionTrigger className="py-3.5 text-left text-[13px] font-medium text-slate-900 hover:no-underline">
                Thông tin tài khoản
              </AccordionTrigger>
              <AccordionContent className="pb-3.5">
                <div className="space-y-2">
                  {ACCOUNT_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block text-[11px] font-normal text-slate-600 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-5 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-normal leading-relaxed text-slate-500">
              © 2026 AgriShrimp. Tất cả các quyền được bảo lưu.
            </p>
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-[#bfd1ee] bg-white p-1 shadow-[0_8px_24px_rgba(76,114,183,0.18)]">
              <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="rounded-xl object-cover" />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        {/* Main grid */}
        <div className="container mx-auto px-4 py-7">
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-4">

            {/* Col 1 — Brand + contact */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
                </div>
                <div className="leading-[1.1]">
                  <p className="text-[13px] font-medium tracking-tight text-gray-900">
                    AGRI<span className="text-primary">SHRIMP</span>
                  </p>
                  <p className="text-[9px] font-medium tracking-[0.18em] text-gray-400">& STORE</p>
                </div>
              </div>

              <p className="mb-4 text-[12px] leading-relaxed text-gray-500">
                Hệ thống phân phối vật tư nuôi tôm hàng đầu, mang đến giải pháp toàn diện cho bà con nuôi trồng thủy sản.
              </p>

              <ul className="space-y-2 text-[12px]">
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                  <span>{SITE_CONFIG.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-primary" />
                  <span className="font-normal text-gray-800">{SITE_CONFIG.phone}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="shrink-0 text-primary" />
                  <span>support@agrishrimp.vn</span>
                </li>
              </ul>
            </div>

            {/* Col 2 — Hỗ trợ khách hàng */}
            <div>
              <h4 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-gray-900">
                Hỗ trợ khách hàng
              </h4>
              <ul className="space-y-2">
                {SUPPORT_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[11px] text-gray-500 transition-colors hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Về AgriShrimp */}
            <div>
              <h4 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-gray-900">
                Về AgriShrimp
              </h4>
              <ul className="space-y-2">
                {ABOUT_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-[11px] text-gray-500 transition-colors hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Newsletter + Social */}
            <div>
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-900">
                Đăng ký nhận tin
              </h4>
              <p className="mb-3 text-[11px] leading-relaxed text-gray-500">
                Nhận ngay thông tin sản phẩm mới và các ưu đãi đặc biệt dành riêng cho bạn.
              </p>

              <div className="mb-5 flex">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="min-w-0 flex-1 rounded-l border border-gray-300 border-r-0 px-3 py-2 text-[11px] outline-none transition-colors focus:border-primary"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-r bg-primary px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Gửi
                </button>
              </div>

              <h4 className="mb-3 text-[10px] font-medium uppercase tracking-wider text-gray-900">
                Kết nối với chúng tôi
              </h4>
              <div className="flex gap-3">
                <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-primary hover:text-primary">
                  <Facebook size={16} />
                </Link>
                <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-primary hover:text-primary">
                  <Instagram size={16} />
                </Link>
                <Link href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-primary hover:text-primary">
                  <Youtube size={16} />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto flex flex-col items-center justify-center gap-3 px-4 py-4 text-center md:h-12 md:flex-row md:justify-between md:gap-0 md:py-0 md:text-left">
            <p className="text-[12px] text-gray-400">
              © 2026 AgriShrimp. Tất cả các quyền được bảo lưu.
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded border border-gray-200 px-2 py-1 text-[10px] font-medium italic tracking-tighter text-blue-900">VISA</span>
              <span className="rounded border border-gray-200 px-2 py-1 text-[10px] font-medium text-red-600">MC</span>
              <span className="rounded border border-gray-200 px-2 py-1 text-[10px] font-medium text-blue-500">PayPal</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
