"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  ChevronRight,
  ShoppingBag,
  Phone,
  AlertCircle,
  FileText,
  XCircle,
  LucideIcon,
} from "lucide-react";

// Component Accordion tái sử dụng
const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: LucideIcon;
}) => (
  <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden shadow-sm transition-all hover:shadow-md">
    <details className="group" open={defaultOpen}>
      <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-gray-50 text-gray-800 hover:text-[#329965] hover:bg-green-50 transition-colors">
        <span className="flex items-center gap-3">
          {Icon ? (
            <Icon size={20} className="text-[#329965]" />
          ) : (
            <ShoppingBag size={20} className="text-[#329965]" />
          )}
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

export default function OrderingPage() {
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
        <span className="text-[#329965] font-bold">Hướng dẫn đặt hàng</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#329965] uppercase border-b border-gray-200 pb-4 mb-6 flex items-center">
          <ShoppingBag className="mr-3" size={24} />
          Câu hỏi thường gặp về Đặt hàng
        </h3>

        <div className="space-y-2">
          {/* Câu 1 */}
          <AccordionItem
            title="1. Tôi có thể đặt hàng vật tư qua điện thoại được không?"
            defaultOpen={true}
            icon={Phone}
          >
            <p className="mb-3">
              Bà con có thể liên hệ trực tiếp qua Hotline{" "}
              <strong className="text-red-600 text-base">1800 6324</strong> để
              được nhân viên AgriShrimp hỗ trợ lên đơn hàng.
            </p>
            <p className="mb-3">
              Tuy nhiên, AgriShrimp luôn khuyến khích bà con tạo tài khoản và
              đặt hàng trên Website/App để được hưởng các chính sách ưu đãi
              thành viên tốt hơn và dễ dàng theo dõi lịch sử nhập hàng.
            </p>
            <p>
              Hoặc bà con có thể kiểm tra lại email AgriShrimp thông báo đặt
              hàng thành công.
            </p>
          </AccordionItem>

          {/* Câu 2 */}
          <AccordionItem
            title="2. Có giới hạn về số lượng vật tư khi đặt hàng không?"
            icon={AlertCircle}
          >
            <p className="mb-3">
              Bà con có thể đặt hàng với số lượng tùy ý. AgriShrimp sẽ cảnh báo
              giới hạn số lượng sản phẩm trong giỏ hàng nếu có.
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-3 text-orange-800 text-xs italic">
              <p className="font-bold mb-1">Lưu ý quan trọng:</p>
              Đối với các sản phẩm thuốc đặc trị có giới hạn số lượng, nếu hệ
              thống ghi nhận đơn hàng vượt quá số lượng cho phép, hệ thống sẽ tự
              động hủy các đơn hàng trùng lặp và không gửi thông báo.
            </div>
            <p>
              Nhằm tạo điều kiện cho tất cả bà con đều có cơ hội mua hàng, những
              đơn hàng có dấu hiệu đầu cơ, mua đi bán lại, AgriShrimp xin phép
              toàn quyền quyết định xử lý.
            </p>
          </AccordionItem>

          {/* Câu 3 */}
          <AccordionItem
            title="3. Tôi muốn kiểm tra lại đơn hàng đã mua?"
            icon={FileText}
          >
            <p className="mb-3">
              Bà con bấm vào nút <strong>“Tài khoản”</strong> trên góc phải màn
              hình sau đó chọn mục <strong>“Đơn hàng của tôi”</strong> để kiểm
              tra lại các vật tư đã đặt mua.
            </p>
            <p>
              Hoặc bà con có thể kiểm tra lại email/SMS mà AgriShrimp đã gửi
              thông báo xác nhận đơn hàng.
            </p>
          </AccordionItem>

          {/* Câu 4 */}
          <AccordionItem
            title="4. Tôi muốn thay đổi hoặc hủy bỏ đơn hàng đã mua thì sao?"
            icon={XCircle}
          >
            <p className="mb-3">
              Việc thay đổi sản phẩm trong đơn hàng, bà con vui lòng liên hệ bộ
              phận CSKH qua Hotline{" "}
              <strong className="text-red-600">1800 6324</strong> để được hướng
              dẫn chi tiết.
            </p>
            <p className="font-medium text-gray-800">
              <span className="text-red-500">*</span> Lưu ý: Đơn hàng chỉ được
              hủy khi chưa chuyển trạng thái sang "Đang giao hàng" cho đơn vị
              vận chuyển.
            </p>
          </AccordionItem>
        </div>
      </div>
    </>
  );
}
