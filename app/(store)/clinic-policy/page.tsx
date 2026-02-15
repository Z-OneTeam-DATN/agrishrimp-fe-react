"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { ChevronRight, HeartPulse } from "lucide-react";

export default function ClinicPolicyPage() {
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
        <span className="text-[#329965] font-bold">Chính sách khách hàng</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        {/* Tiêu đề trang */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#329965] uppercase flex items-center">
            <HeartPulse className="mr-3" size={28} />
            Chính sách khách hàng Clinic
          </h2>
        </div>

        {/* Nội dung chính sách */}
        <div className="text-gray-700 leading-relaxed text-sm md:text-base">
          <p className="mb-6 text-lg font-medium text-gray-600">
            AgriShrimp Clinic cam kết cung cấp dịch vụ chăm sóc sức khỏe tốt
            nhất cho quý khách. Chính sách này quy định quyền và trách nhiệm của
            khách hàng khi sử dụng dịch vụ tại Clinic.
          </p>

          <div className="space-y-6">
            {/* Mục 1 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                1. Quyền của Khách hàng
              </h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#329965]">
                <li>
                  Được tư vấn đầy đủ về tình trạng sức khỏe, phác đồ điều trị và
                  chi phí trước khi sử dụng dịch vụ.
                </li>
                <li>
                  Được bảo mật thông tin cá nhân và hồ sơ bệnh án theo quy định
                  pháp luật.
                </li>
                <li>
                  Có quyền từ chối hoặc ngừng sử dụng dịch vụ bất cứ lúc nào.
                </li>
                <li>
                  Được yêu cầu cung cấp hóa đơn, chứng từ liên quan đến dịch vụ
                  đã sử dụng.
                </li>
              </ul>
            </section>

            {/* Mục 2 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                2. Trách nhiệm của Khách hàng
              </h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#329965]">
                <li>
                  Cung cấp thông tin sức khỏe trung thực và đầy đủ cho bác sĩ.
                </li>
                <li>Tuân thủ hướng dẫn điều trị và các quy định của Clinic.</li>
                <li>Thanh toán đầy đủ chi phí dịch vụ theo thỏa thuận.</li>
                <li>Tôn trọng nhân viên và các khách hàng khác tại Clinic.</li>
              </ul>
            </section>

            {/* Mục 3 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                3. Chính sách đặt lịch và hủy lịch
              </h3>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#329965]">
                <li>
                  <strong>Đặt lịch:</strong> Khách hàng có thể đặt lịch hẹn trực
                  tuyến qua website, điện thoại hoặc trực tiếp tại Clinic.
                </li>
                <li>
                  <strong>Thay đổi/Hủy lịch:</strong> Vui lòng thông báo cho
                  Clinic ít nhất 24 giờ trước giờ hẹn nếu bạn muốn thay đổi hoặc
                  hủy lịch để chúng tôi có thể sắp xếp lại.
                </li>
              </ul>
            </section>

            {/* Mục 4 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                4. Chính sách thanh toán
              </h3>
              <p>
                Clinic chấp nhận thanh toán bằng tiền mặt, chuyển khoản ngân
                hàng và các hình thức thanh toán điện tử khác. Chi tiết về chi
                phí sẽ được thông báo rõ ràng trước khi thực hiện dịch vụ.
              </p>
            </section>

            {/* Mục 5 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                5. Bảo mật thông tin y tế
              </h3>
              <p>
                AgriShrimp Clinic cam kết bảo mật tuyệt đối thông tin y tế và hồ
                sơ bệnh án của khách hàng. Thông tin này sẽ không được tiết lộ
                cho bất kỳ bên thứ ba nào trừ khi có sự đồng ý của khách hàng
                hoặc theo yêu cầu của pháp luật.
              </p>
            </section>

            {/* Mục 6 */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                6. Liên hệ
              </h3>
              <p>
                Để biết thêm thông tin hoặc có bất kỳ câu hỏi nào về Chính sách
                khách hàng Clinic, vui lòng liên hệ với chúng tôi tại Clinic
                hoặc qua email:{" "}
                <a
                  href="mailto:clinic@arishrimp.com"
                  className="text-[#329965] hover:underline font-medium"
                >
                  clinic@arishrimp.com
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
