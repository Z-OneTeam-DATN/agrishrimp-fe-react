
import Link from "next/link"
import { Facebook, Youtube, Instagram, Music2 } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#0f3f38] text-gray-200 text-sm">
      <div className="container mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

        <div>
          <h3 className="text-white font-bold uppercase mb-4">HỖ TRỢ KHÁCH HÀNG</h3>

          <p className="text-gray-400 mb-1">Hotline miễn phí:</p>
          <p className="text-2xl font-extrabold text-[#ffb74d] mb-1">1800 6324</p>
          <p className="text-xs text-gray-400 mb-4">(08h - 22h, kể cả T7, CN)</p>

          <ul className="space-y-2 text-gray-300">
            <li><Link href="#">Các câu hỏi thường gặp</Link></li>
            <li><Link href="#">Gửi yêu cầu hỗ trợ</Link></li>
            <li><Link href="#">Hướng dẫn đặt hàng</Link></li>
            <li><Link href="#">Phương thức vận chuyển</Link></li>
            <li><Link href="#">Chính sách đổi trả</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold uppercase mb-4">VỀ AGRISHRIMP</h3>
          <ul className="space-y-2 text-gray-300">
            <li><Link href="#">Giới thiệu công ty</Link></li>
            <li><Link href="#">Tuyển dụng</Link></li>
            <li><Link href="#">Chính sách bảo mật</Link></li>
            <li><Link href="#">Điều khoản sử dụng</Link></li>
            <li><Link href="#">Liên hệ hợp tác</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold uppercase mb-4">HỢP TÁC & LIÊN KẾT</h3>
          <ul className="space-y-2 text-gray-300 mb-6">
            <li><Link href="#">AgriShrimp Clinic (Chẩn đoán)</Link></li>
            <li><Link href="#">AgriShrimp Farm (Mô hình)</Link></li>
          </ul>

          <h3 className="text-white font-bold uppercase mb-3">THANH TOÁN</h3>
          <div className="bg-white rounded px-3 py-2 w-fit flex gap-3 items-center">
            <span className="text-black text-xs font-bold">VISA</span>
            <span className="text-black text-xs font-bold">MasterCard</span>
            <span className="text-green-700 text-xs font-bold">ATM</span>
          </div>
        </div>

        <div>
          <h3 className="text-white font-bold uppercase mb-4">NHẬN TIN KHUYẾN MÃI</h3>
          <div className="flex mb-6">
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="flex-1 px-3 py-2 rounded-l-full text-black text-sm outline-none"
            />
            <button className="bg-[#f4a742] text-white px-5 rounded-r-full font-semibold text-sm">
              ĐĂNG KÝ
            </button>
          </div>

          <h3 className="text-white font-bold uppercase mb-3">KẾT NỐI MẠNG XÃ HỘI</h3>
          <div className="flex gap-4 mb-6">
            <Facebook size={20} />
            <Youtube size={22} />
            <Instagram size={20} />
            <Music2 size={20} />
          </div>

          <h3 className="text-white font-bold uppercase mb-3">TẢI ỨNG DỤNG NGAY</h3>
          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 bg-white rounded" /> 
            <div className="flex flex-col gap-2">
              <div className="bg-black text-white text-xs px-3 py-2 rounded">App Store</div>
              <div className="bg-black text-white text-xs px-3 py-2 rounded">Google Play</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 text-center text-gray-400 text-xs py-5">
        © 2026 Công ty Cổ Phần AgriShrimp Việt Nam. All rights reserved. <br />
        Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh.
      </div>
    </footer>
  )
}
