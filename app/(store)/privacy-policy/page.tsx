"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { ChevronRight, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Banner */}
      <StoreBanner />

      {/* Breadcrumb */}
      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
        <Link href="/" className="hover:text-[#1965a2] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#1965a2] font-bold">Chính sách bảo mật</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        {/* Tiêu đề trang */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#1965a2] uppercase flex items-center">
            <ShieldCheck className="mr-3" size={28} />
            Chính sách bảo mật
          </h2>
        </div>

        {/* Nội dung chính sách */}
        <div className="text-gray-700 leading-relaxed text-sm md:text-base">
          <p className="mb-6 text-lg font-medium text-gray-600">
            AgriShrimp cam kết bảo vệ thông tin cá nhân của quý khách. Chính
            sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo
            vệ thông tin của bạn.
          </p>

          <div className="space-y-6">
            {/* Mục 1 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                1. Thu thập thông tin
              </h3>
              <p>
                Chúng tôi thu thập thông tin cá nhân từ bạn khi bạn đăng ký tài
                khoản, đặt hàng, hoặc liên hệ với chúng tôi. Thông tin này có
                thể bao gồm tên, địa chỉ, email, và số điện thoại.
              </p>
            </section>

            {/* Mục 2 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                2. Mục đích sử dụng thông tin
              </h3>
              <p className="mb-3">Thông tin của bạn được sử dụng để:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#1965a2]">
                <li>Cung cấp và duy trì Dịch vụ của chúng tôi</li>
                <li>Xử lý đơn hàng và giao dịch</li>
                <li>
                  Thông báo cho bạn về những thay đổi đối với Dịch vụ của chúng
                  tôi
                </li>
                <li>Cung cấp hỗ trợ khách hàng</li>
                <li>
                  Gửi các thông tin tiếp thị và quảng cáo (nếu bạn đồng ý)
                </li>
              </ul>
            </section>

            {/* Mục 3 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                3. Chia sẻ thông tin
              </h3>
              <p>
                Chúng tôi không bán, trao đổi, hoặc cho thuê thông tin cá nhân
                của bạn cho bên thứ ba. Chúng tôi có thể chia sẻ thông tin với
                các đối tác vận chuyển và thanh toán để hoàn thành đơn hàng của
                bạn, hoặc khi được yêu cầu bởi pháp luật.
              </p>
            </section>

            {/* Mục 4 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                4. Bảo mật thông tin
              </h3>
              <p>
                Chúng tôi áp dụng nhiều biện pháp bảo mật khác nhau để bảo vệ
                thông tin cá nhân của bạn. Dữ liệu của bạn được lưu trữ trên các
                máy chủ an toàn và chỉ có thể được truy cập bởi một số nhân viên
                có quyền đặc biệt.
              </p>
            </section>

            {/* Mục 5 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                5. Quyền của bạn
              </h3>
              <p>
                Bạn có quyền truy cập, sửa đổi hoặc xóa thông tin cá nhân của
                mình bất kỳ lúc nào bằng cách đăng nhập vào tài khoản của bạn
                hoặc liên hệ với chúng tôi.
              </p>
            </section>

            {/* Mục 6 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                6. Liên hệ với chúng tôi
              </h3>
              <p>
                Nếu bạn có bất kỳ câu hỏi nào về Chính sách bảo mật này, vui
                lòng liên hệ với chúng tôi qua email:{" "}
                <a
                  href="mailto:support@arishrimp.com"
                  className="text-[#1965a2] hover:underline font-medium"
                >
                  support@arishrimp.com
                </a>
                .
              </p>
            </section>
          </div>

          <p className="mt-8 pt-4 border-t border-gray-100 text-sm text-gray-400 italic text-right">
            Cập nhật lần cuối: 25 tháng 1, 2026
          </p>
        </div>
      </div>
    </>
  );
}

