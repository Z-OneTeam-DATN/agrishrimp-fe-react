"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { ChevronRight, FileText } from "lucide-react";

export default function TermsOfUsePage() {
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
        <span className="text-[#329965] font-bold">Điều khoản sử dụng</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        {/* Tiêu đề trang */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#329965] uppercase flex items-center">
            <FileText className="mr-3" size={28} />
            Điều khoản sử dụng
          </h2>
        </div>

        {/* Nội dung chính sách */}
        <div className="text-gray-700 leading-relaxed text-sm md:text-base">
          <p className="mb-6 text-lg font-medium text-gray-600">
            Chào mừng quý khách đến với AgriShrimp. Bằng việc truy cập và sử
            dụng trang web của chúng tôi, quý khách đồng ý tuân thủ các điều
            khoản và điều kiện dưới đây.
          </p>

          <div className="space-y-8">
            {/* Mục 1 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                1. Chấp nhận Điều khoản
              </h3>
              <p>
                Bằng cách truy cập hoặc sử dụng Dịch vụ, bạn đồng ý bị ràng buộc
                bởi các Điều khoản này. Nếu bạn không đồng ý với bất kỳ phần nào
                của điều khoản thì bạn không được phép truy cập Dịch vụ.
              </p>
            </section>

            {/* Mục 2 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                2. Tài khoản người dùng
              </h3>
              <p className="mb-3">
                Khi bạn tạo một tài khoản với chúng tôi, bạn phải cung cấp cho
                chúng tôi thông tin chính xác, đầy đủ và hiện tại tại mọi thời
                điểm. Việc không làm như vậy sẽ cấu thành hành vi vi phạm Điều
                khoản, có thể dẫn đến việc chấm dứt ngay lập tức tài khoản của
                bạn trên Dịch vụ của chúng tôi.
              </p>
              <p>
                Bạn có trách nhiệm bảo vệ mật khẩu mà bạn sử dụng để truy cập
                Dịch vụ và cho bất kỳ hoạt động hoặc hành động nào dưới mật khẩu
                của bạn.
              </p>
            </section>

            {/* Mục 3 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                3. Quyền sở hữu trí tuệ
              </h3>
              <p>
                Dịch vụ và nội dung gốc, các tính năng và chức năng của nó là và
                sẽ vẫn là tài sản độc quyền của AgriShrimp và các bên cấp phép
                của nó. Dịch vụ được bảo vệ bởi bản quyền, nhãn hiệu và các luật
                khác của cả Việt Nam và các nước ngoài.
              </p>
            </section>

            {/* Mục 4 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                4. Giới hạn trách nhiệm
              </h3>
              <p>
                Trong mọi trường hợp, AgriShrimp, cũng như các giám đốc, nhân
                viên, đối tác, đại lý, nhà cung cấp hoặc chi nhánh của mình, sẽ
                không chịu trách nhiệm pháp lý cho bất kỳ thiệt hại gián tiếp,
                ngẫu nhiên, đặc biệt, do hậu quả hoặc trừng phạt nào, bao gồm
                nhưng không giới hạn ở việc mất lợi nhuận, dữ liệu, việc sử
                dụng, thiện chí hoặc các tổn thất vô hình khác.
              </p>
            </section>

            {/* Mục 5 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                5. Thay đổi Điều khoản
              </h3>
              <p>
                Chúng tôi có quyền, theo quyết định riêng của mình, sửa đổi hoặc
                thay thế các Điều khoản này vào bất kỳ lúc nào. Nếu một bản sửa
                đổi là quan trọng, chúng tôi sẽ cố gắng cung cấp thông báo trước
                ít nhất 30 ngày trước khi bất kỳ điều khoản mới nào có hiệu lực.
                Những gì cấu thành một thay đổi quan trọng sẽ được xác định theo
                quyết định riêng của chúng tôi.
              </p>
            </section>

            {/* Mục 6 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                6. Liên hệ với chúng tôi
              </h3>
              <p>
                Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng
                liên hệ với chúng tôi qua email:{" "}
                <a
                  href="mailto:support@arishrimp.com"
                  className="text-[#329965] hover:underline font-medium"
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
