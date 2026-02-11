import Link from "next/link"
import { 
  Facebook, 
  Youtube, 
  Instagram, 
  Music2, // Dùng làm icon Tiktok
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  RefreshCw,
  HandCoins,
  CreditCard
} from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="flex flex-col w-full">
      
      {/* 1. BENEFITS SECTION (Phần Lợi ích - Màu trắng ở trên) */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Item 1 */}
            <div className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-full border-2 border-teal-600 flex items-center justify-center text-teal-600 shrink-0">
                 <HandCoins size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm uppercase">Thanh toán khi nhận hàng</h4>
                <p className="text-xs text-gray-500 mt-1">(COD) - Kiểm tra hàng trước</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-full border-2 border-teal-600 flex items-center justify-center text-teal-600 shrink-0">
                 <Truck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm uppercase">Giao hàng thần tốc 2H</h4>
                <p className="text-xs text-gray-500 mt-1">Miễn phí đơn từ 299K</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 p-2">
               <div className="w-12 h-12 rounded-full border-2 border-teal-600 flex items-center justify-center text-teal-600 shrink-0">
                 <RefreshCw size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm uppercase">14 ngày đổi trả miễn phí</h4>
                <p className="text-xs text-gray-500 mt-1">Thủ tục đơn giản, nhanh chóng</p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-4 p-2">
               <div className="w-12 h-12 rounded-full border-2 border-teal-600 flex items-center justify-center text-teal-600 shrink-0">
                 <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm uppercase">Thương hiệu uy tín</h4>
                <p className="text-xs text-gray-500 mt-1">Sản phẩm chính hãng 100%</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER (Phần chính - Màu xanh đậm) */}
      <div className="bg-[#003d2e] text-gray-200 text-sm pt-14 pb-6">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Cột 1: Hỗ trợ */}
          <div>
            <h3 className="text-white font-bold uppercase mb-5 flex items-center gap-2">
               <Phone size={18} /> Hỗ trợ khách hàng
            </h3>

            <p className="text-gray-400 mb-1 text-xs">Hotline miễn phí:</p>
            <p className="text-2xl font-extrabold text-[#ffb74d] mb-1 tracking-wide">1800 6324</p>
            <p className="text-xs text-gray-400 mb-5">(08h - 22h, kể cả T7, CN)</p>

            <ul className="space-y-2.5 text-gray-300 text-[13px]">
              <li><Link href="#" className="hover:text-white hover:underline">Các câu hỏi thường gặp</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Gửi yêu cầu hỗ trợ</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Hướng dẫn đặt hàng</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Phương thức vận chuyển</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Chính sách đổi trả</Link></li>
            </ul>
          </div>

          {/* Cột 2: Về AgriShrimp */}
          <div>
            <h3 className="text-white font-bold uppercase mb-5 flex items-center gap-2">
              <ShieldCheck size={18} /> Về AgriShrimp
            </h3>
            <ul className="space-y-2.5 text-gray-300 text-[13px]">
              <li><Link href="#" className="hover:text-white hover:underline">Giới thiệu công ty</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Tuyển dụng</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Chính sách bảo mật</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Điều khoản sử dụng</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">Liên hệ hợp tác</Link></li>
            </ul>
          </div>

          {/* Cột 3: Hợp tác & Thanh toán */}
          <div>
            <h3 className="text-white font-bold uppercase mb-5 flex items-center gap-2">
               <Truck size={18} /> Hợp tác & Liên kết
            </h3>
            <ul className="space-y-2.5 text-gray-300 mb-8 text-[13px]">
              <li><Link href="#" className="hover:text-white hover:underline">AgriShrimp Clinic (Chẩn đoán)</Link></li>
              <li><Link href="#" className="hover:text-white hover:underline">AgriShrimp Farm (Mô hình)</Link></li>
            </ul>

            <h3 className="text-white font-bold uppercase mb-3 flex items-center gap-2 text-xs">
               <CreditCard size={16} /> Thanh toán
            </h3>
            <div className="bg-white rounded p-2 w-fit flex gap-3 items-center shadow-sm">
               {/* Sử dụng text thay thế hình ảnh để tránh lỗi load ảnh */}
              <span className="text-blue-900 font-extrabold italic text-lg tracking-tighter">Visa</span>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-red-600 font-extrabold text-sm">MasterCard</span>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-green-600 font-bold text-xs">ATM/Banking</span>
            </div>
          </div>

          {/* Cột 4: Newsletter & Social & App */}
          <div>
            <h3 className="text-white font-bold uppercase mb-5 flex items-center gap-2">
               <Mail size={18} /> Nhận tin khuyến mãi
            </h3>
            <div className="flex mb-8">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="flex-1 px-4 py-2 rounded-l-md text-gray-900 text-sm outline-none focus:ring-1 focus:ring-orange-400"
                suppressHydrationWarning={true}
              />
              <button className="bg-[#f4a742] hover:bg-orange-600 text-white px-4 rounded-r-md font-bold text-sm transition-colors" suppressHydrationWarning={true}>
            
                ĐĂNG KÝ
              </button>
            </div>

            <h3 className="text-white font-bold uppercase mb-4 text-xs">KẾT NỐI MẠNG XÃ HỘI</h3>
            <div className="flex gap-4 mb-8">
              <Link href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#1877F2] transition-colors"><Facebook size={20} /></Link>
              <Link href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#FF0000] transition-colors"><Youtube size={20} /></Link>
              <Link href="#" className="bg-white/10 p-2 rounded-full hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 transition-colors"><Instagram size={20} /></Link>
              <Link href="#" className="bg-white/10 p-2 rounded-full hover:bg-black transition-colors"><Music2 size={20} /></Link>
            </div>

            <h3 className="text-white font-bold uppercase mb-3 text-xs">TẢI ỨNG DỤNG NGAY</h3>
            <div className="flex gap-3 items-center">
               {/* QR Code giả lập */}
              <div className="w-20 h-20 bg-white rounded p-1">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR" className="w-full h-full object-contain"/>
              </div> 
              <div className="flex flex-col gap-2">
                <Link href="#" className="bg-black border border-gray-600 hover:border-white text-white text-[10px] px-3 py-1.5 rounded flex items-center gap-1 w-32 justify-center transition-colors">
                   <span className="font-bold text-base">App Store</span>
                </Link>
                <Link href="#" className="bg-black border border-gray-600 hover:border-white text-white text-[10px] px-3 py-1.5 rounded flex items-center gap-1 w-32 justify-center transition-colors">
                   <span className="font-bold text-base">Google Play</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-gray-400 text-xs leading-relaxed">
          <p className="font-medium">© 2026 Công ty Cổ Phần AgriShrimp Việt Nam. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1 mt-1">
             <MapPin size={12} /> Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh.
          </p>
        </div>
      </div>
    </footer>
  )
}