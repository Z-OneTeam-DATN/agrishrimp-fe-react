'use client';

import Link from 'next/link';
import StoreBanner from '@/components/site/SiteBanner_Store';
import { ChevronRight, Cookie } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <>
      {/* Banner */}
      <StoreBanner />

      {/* Breadcrumb */}
      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
        <Link href="/" className="hover:text-[#329965] transition-colors">Trang chủ</Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#329965] font-bold">Chính sách cookie</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">

        {/* Tiêu đề trang */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#329965] uppercase flex items-center">
            <Cookie className="mr-3" size={28} />
            Chính sách cookie
          </h2>
        </div>

        {/* Nội dung chính sách */}
        <div className="text-gray-700 leading-relaxed text-sm md:text-base">
          <p className="mb-6 text-lg font-medium text-gray-600">
            Trang web AgriShrimp sử dụng cookie để cải thiện trải nghiệm người dùng. Chính sách này giải thích cách chúng tôi sử dụng cookie và cách bạn có thể quản lý chúng.
          </p>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">1. Cookie là gì?</h3>
              <p>
                Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập một trang web. Chúng được sử dụng để ghi nhớ sở thích của bạn, theo dõi hoạt động duyệt web và cung cấp trải nghiệm cá nhân hóa.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">2. Cách chúng tôi sử dụng cookie</h3>
              <p className="mb-3">AgriShrimp sử dụng cookie cho các mục đích sau:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#329965]">
                <li>
                  <strong>Cookie cần thiết:</strong> Giúp trang web hoạt động bình thường, cho phép bạn điều hướng và sử dụng các tính năng cơ bản.
                </li>
                <li>
                  <strong>Cookie phân tích:</strong> Giúp chúng tôi hiểu cách khách truy cập tương tác với trang web, từ đó cải thiện hiệu suất và nội dung.
                </li>
                <li>
                  <strong>Cookie chức năng:</strong> Ghi nhớ các lựa chọn của bạn (ví dụ: ngôn ngữ, khu vực) để cung cấp trải nghiệm cá nhân hóa hơn.
                </li>
                <li>
                  <strong>Cookie quảng cáo:</strong> Hiển thị quảng cáo phù hợp với sở thích của bạn dựa trên lịch sử duyệt web.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">3. Quản lý cookie của bạn</h3>
              <p>
                Bạn có thể kiểm soát và/hoặc xóa cookie theo ý muốn. Bạn có thể xóa tất cả cookie đã có trên máy tính của mình và bạn có thể đặt hầu hết các trình duyệt để ngăn chặn chúng được đặt. Tuy nhiên, nếu bạn làm như vậy, bạn có thể phải điều chỉnh thủ công một số tùy chọn mỗi khi bạn truy cập một trang web và một số dịch vụ và chức năng có thể không hoạt động.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">4. Thay đổi chính sách cookie</h3>
              <p>
                Chúng tôi có thể cập nhật Chính sách cookie này theo thời gian để phản ánh những thay đổi trong thực tiễn của chúng tôi hoặc vì các lý do hoạt động, pháp lý hoặc quy định khác. Bất kỳ thay đổi nào sẽ có hiệu lực ngay khi được đăng trên trang web này.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">5. Liên hệ với chúng tôi</h3>
              <p>
                Nếu bạn có bất kỳ câu hỏi nào về Chính sách cookie này, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:support@arishrimp.com" className="text-[#329965] hover:underline font-medium">support@arishrimp.com</a>.
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