"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  ChevronRight,
  Briefcase,
  MapPin,
  Clock,
  ChevronRight as Arrow,
} from "lucide-react";

const JOB_LISTINGS = [
  {
    title: "Kỹ sư Thủy sản (Tư vấn kỹ thuật)",
    department: "Kỹ thuật & Tư vấn",
    location: "TP. Hồ Chí Minh",
    type: "Toàn thời gian",
    description:
      "Hỗ trợ tư vấn kỹ thuật nuôi tôm, phân tích nước ao, lập phác đồ điều trị bệnh cho khách hàng. Yêu cầu tốt nghiệp Đại học chuyên ngành Thủy sản hoặc liên quan.",
  },
  {
    title: "Nhân viên Kinh doanh Online",
    department: "Kinh doanh",
    location: "TP. Hồ Chí Minh",
    type: "Toàn thời gian",
    description:
      "Tiếp nhận đơn hàng, tư vấn sản phẩm qua điện thoại/chat, chăm sóc khách hàng hiện tại và phát triển khách hàng mới. Ưu tiên có kinh nghiệm bán hàng nông nghiệp.",
  },
  {
    title: "Lập trình viên Backend (Java Spring Boot)",
    department: "Công nghệ",
    location: "TP. Hồ Chí Minh / Remote",
    type: "Toàn thời gian",
    description:
      "Phát triển và bảo trì hệ thống backend nền tảng e-commerce AgriShrimp. Yêu cầu tối thiểu 1 năm kinh nghiệm Java Spring Boot, MySQL, Redis.",
  },
  {
    title: "Nhân viên Kho & Logistics",
    department: "Vận hành",
    location: "TP. Thủ Đức, TP. Hồ Chí Minh",
    type: "Toàn thời gian",
    description:
      "Quản lý kho hàng, kiểm soát xuất nhập tồn, phối hợp đơn vị vận chuyển đảm bảo giao hàng đúng hạn. Ưu tiên có kinh nghiệm làm việc tại kho hàng FMCG hoặc nông nghiệp.",
  },
  {
    title: "Thực tập sinh Marketing",
    department: "Marketing",
    location: "TP. Hồ Chí Minh",
    type: "Thực tập (3–6 tháng)",
    description:
      "Hỗ trợ sản xuất nội dung mạng xã hội, chạy quảng cáo Facebook/Google, phân tích hiệu quả chiến dịch. Sinh viên năm 3–4 ngành Marketing/Truyền thông.",
  },
];

const PERKS = [
  "Lương cạnh tranh + thưởng hiệu suất",
  "Bảo hiểm xã hội & sức khỏe đầy đủ",
  "Môi trường startup năng động, nhiều cơ hội phát triển",
  "Đào tạo chuyên môn kỹ thuật nuôi trồng thủy sản",
  "Team building & các hoạt động ngoại khóa hàng quý",
];

export default function CareersPage() {
  return (
    <>
      <StoreBanner />

      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center container mx-auto px-4">
        <Link href="/" className="hover:text-[#1965a2] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#1965a2] font-bold">Tuyển dụng</span>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="border-b border-gray-200 pb-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#1965a2] uppercase flex items-center">
              <Briefcase className="mr-3" size={28} />
              Tuyển dụng
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Gia nhập đội ngũ AgriShrimp — cùng chúng tôi xây dựng nền tảng
              công nghệ nông nghiệp hàng đầu Việt Nam.
            </p>
          </div>

          {/* Perks */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-8">
            <h3 className="font-bold text-[#1965a2] mb-3 uppercase text-sm">
              Tại sao gia nhập AgriShrimp?
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PERKS.map((perk) => (
                <li
                  key={perk}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <Arrow
                    size={14}
                    className="text-[#1965a2] mt-0.5 shrink-0"
                  />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          {/* Job listings */}
          <h3 className="text-base font-bold text-[#1965a2] uppercase border-l-4 border-[#1965a2] pl-3 mb-5">
            Vị trí đang tuyển ({JOB_LISTINGS.length})
          </h3>

          <div className="space-y-4">
            {JOB_LISTINGS.map((job) => (
              <div
                key={job.title}
                className="border border-gray-200 rounded-lg p-5 hover:border-[#1965a2] hover:shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-base mb-1">
                      {job.title}
                    </h4>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} /> {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {job.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href="/support"
                      className="inline-flex items-center px-4 py-2 border border-[#1965a2] text-[#1965a2] rounded-md text-sm font-semibold hover:bg-[#1965a2] hover:text-white transition-colors"
                    >
                      Ứng tuyển
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-600">
            Không tìm thấy vị trí phù hợp?{" "}
            <Link href="/support" className="text-[#1965a2] font-semibold hover:underline">
              Gửi CV tự ứng tuyển
            </Link>{" "}
            — chúng tôi luôn chào đón nhân tài.
          </div>
        </div>
      </div>
    </>
  );
}

