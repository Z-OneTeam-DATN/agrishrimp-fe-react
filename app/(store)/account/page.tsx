"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { ChevronRight, HelpCircle } from "lucide-react";

// Component Accordion để tái sử dụng cho từng câu hỏi
const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => (
  <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden shadow-sm transition-all hover:shadow-md">
    <details className="group" open={defaultOpen}>
      <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-gray-50 text-gray-800 hover:text-[#329965] hover:bg-green-50 transition-colors">
        <span className="flex items-center gap-3">
          <HelpCircle size={18} className="text-[#329965]" />
          {title}
        </span>
        <span className="transition-transform duration-300 group-open:rotate-180 text-gray-400">
          <ChevronRight size={20} className="rotate-90" />
        </span>
      </summary>
      <div className="p-5 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100 animate-fadeIn">
        {children}
      </div>
    </details>
  </div>
);

export default function AccountPage() {
  return (
    <>
      {/* Banner */}
      <StoreBanner />

      {/* Breadcrumb */}
      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
        <Link href="/" className="hover:text-[#329965] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#329965] font-bold">Tài khoản</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#329965] uppercase border-b border-gray-200 pb-4 mb-6 flex items-center">
          Câu hỏi thường gặp về Tài khoản
        </h3>

        <div className="space-y-2">
          {/* Câu 1 */}
          <AccordionItem
            title="1. Đăng ký thành viên AgriShrimp như thế nào?"
            defaultOpen={true}
          >
            <p className="mb-3">
              Quý khách/Bà con vui lòng nhấn vào nút{" "}
              <strong>“Đăng nhập/Đăng ký”</strong> trên góc phải màn hình sau đó
              chọn <strong>“Đăng ký ngay”</strong> (Đối với Desktop) hoặc tại
              góc trái màn hình, chọn biểu tượng Menu rồi chọn{" "}
              <strong>“Đăng nhập/Đăng ký”</strong> (Đối với Mobile).
            </p>
            <p className="mb-3">
              Vui lòng điền đầy đủ các thông tin được yêu cầu (Họ tên, SĐT,
              Email, Tên trại nuôi...) và nhấn nút <strong>“Đăng ký”</strong>.
              Hệ thống sẽ tự động gửi email/SMS thông báo kích hoạt tài khoản.
              Quý khách vui lòng làm theo hướng dẫn để xác nhận tạo tài khoản
              thành công.
            </p>
            <p>
              Trường hợp không nhận được mã kích hoạt, vui lòng kiểm tra hộp thư
              rác (Spam) hoặc liên hệ trực tiếp qua Hotline{" "}
              <strong className="text-red-600">1800 6324</strong> để được nhân
              viên AgriShrimp hỗ trợ.
            </p>
          </AccordionItem>

          {/* Câu 2 */}
          <AccordionItem title="2. Tại sao tôi không thể đăng nhập vào tài khoản AgriShrimp?">
            <p className="mb-3">
              Quý khách vui lòng kiểm tra kỹ số điện thoại/email và mật khẩu
              (lưu ý phím Caps Lock/bộ gõ tiếng Việt).
            </p>
            <p>
              Trường hợp quên mật khẩu, quý khách vui lòng chọn nút{" "}
              <strong>“Quên mật khẩu”</strong> và nhập email hoặc số điện thoại
              đã đăng ký. Hệ thống AgriShrimp sẽ gửi đường dẫn đặt lại mật khẩu
              qua Email hoặc mã OTP qua SMS. Sau khi hoàn tất, quý khách có thể
              đăng nhập lại bình thường để quản lý vật tư.
            </p>
          </AccordionItem>

          {/* Câu 3 */}
          <AccordionItem title="3. Tôi muốn thay đổi thông tin trại nuôi/tài khoản cá nhân như thế nào?">
            <p>
              Để cập nhật thông tin (địa chỉ ao nuôi, số điện thoại, tên người
              đại diện...), quý khách vui lòng đăng nhập vào hệ thống, chọn mục{" "}
              <strong>“Tài khoản của bạn”</strong> (hoặc "Hồ sơ trại nuôi") rồi
              chọn nút <strong>“Sửa”</strong> để cập nhật dữ liệu mới nhất.
            </p>
          </AccordionItem>

          {/* Câu 4 */}
          <AccordionItem title="4. Tôi có thể sử dụng chung tài khoản với người khác được không?">
            <p className="mb-3">
              AgriShrimp khuyến khích mỗi trại nuôi/chủ hộ nên sử dụng tài khoản
              riêng để đảm bảo độ chính xác trong việc quản lý lịch sử nhập
              thuốc, thức ăn và theo dõi công nợ.
            </p>
            <p>
              Việc sử dụng chung tài khoản có thể dẫn đến sai sót trong việc
              thống kê chi phí vụ nuôi hoặc nhầm lẫn đơn hàng, ảnh hưởng trực
              tiếp đến quyền lợi của quý khách.
            </p>
          </AccordionItem>

          {/* Câu 5 */}
          <AccordionItem title="5. Đăng ký thành viên tại AgriShrimp sẽ giúp ích gì cho tôi?">
            <p className="mb-2">
              Việc đăng ký tài khoản giúp bà con trở thành khách hàng thân thiết
              của AgriShrimp. Bà con sẽ được:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Lưu trữ lịch sử mua hàng để dễ dàng truy xuất nguồn gốc vật tư.
              </li>
              <li>
                Tiếp cận nhanh nhất các chương trình khuyến mãi thuốc, thức ăn
                thủy sản.
              </li>
              <li>
                Nhận thông báo về lịch vụ mùa và các cảnh báo dịch bệnh từ
                chuyên gia.
              </li>
            </ul>
          </AccordionItem>

          {/* Câu 6 */}
          <AccordionItem title="6. AgriShrimp có chương trình ưu đãi nào cho khách hàng thân thiết?">
            <p>
              Chúng tôi có chương trình tích điểm dựa trên doanh số mua vật tư.
              Điểm tích lũy có thể dùng để đổi lấy các chế phẩm sinh học,
              vitamin, khoáng chất hoặc trừ trực tiếp vào đơn hàng tiếp theo.
              Xem thêm chi tiết chính sách đổi điểm tại đây.
            </p>
          </AccordionItem>
        </div>
      </div>
    </>
  );
}
