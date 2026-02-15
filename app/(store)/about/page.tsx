"use client";

import Link from "next/link";
import Image from "next/image";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  BadgeCheck,
  ShieldCheck,
  Users,
  Rocket,
  Store,
  Phone,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// 1. Dữ liệu tĩnh (Features)
const FEATURES = [
  {
    icon: BadgeCheck,
    title: "HÀNG CHÍNH HÃNG",
    description:
      "Cam kết 100% thuốc, vi sinh, thức ăn nhập khẩu và từ các thương hiệu lớn (Bayer, CP, Thăng Long...).",
  },
  {
    icon: ShieldCheck,
    title: "BẢO MẬT THÔNG TIN",
    description:
      "Cam kết bảo mật tuyệt đối thông tin trại nuôi và dữ liệu khách hàng.",
  },
  {
    icon: Users,
    title: "TƯ VẤN TẬN TÂM",
    description:
      "Đội ngũ kỹ sư hỗ trợ kỹ thuật, tư vấn phác đồ điều trị đúng chuẩn mực đạo đức nghề nghiệp.",
  },
  {
    icon: Rocket,
    title: "GIAO HÀNG HỎA TỐC",
    description:
      "Vận hành tốc độ giao hàng vượt trội để kịp thời xử lý các tình huống cấp bách tại ao nuôi.",
  },
];

// 2. Dữ liệu chi nhánh (Branches)
const BRANCHES = [
  {
    name: "CN Cần Thơ (Trụ sở)",
    address: "Số 123, Đường 30/4, Q. Ninh Kiều, TP. Cần Thơ",
  },
  {
    name: "CN Bạc Liêu",
    address: "Số 55, Đường Trần Phú, TP. Bạc Liêu",
  },
  {
    name: "CN Cà Mau",
    address: "Số 78, Đường Ngô Quyền, TP. Cà Mau",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Banner */}
      <StoreBanner />

      {/* Breadcrumb */}
      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center container mx-auto px-4">
        <Link href="/" className="hover:text-[#329965] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#329965] font-bold">Giới thiệu AgriShrimp</span>
      </div>

      {/* Nội dung chính */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
          {/* Phần 1: Giới thiệu chung */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#329965] border-b-4 border-[#329965] inline-block pb-2 mb-6">
              Tháng 6 / 2023
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Logo */}
              <div className="w-full md:w-1/4 flex justify-center md:justify-end">
                <div className="relative w-32 h-20">
                  <Image
                    src="/images/logo_arishrimp_tachnen.png"
                    alt="AgriShrimp Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="w-full md:w-3/4 text-left">
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle2
                      className="text-[#329965] mr-3 mt-1 flex-shrink-0"
                      size={20}
                    />
                    <span>
                      AgriShrimp được thành lập với mục tiêu đồng hành cùng bà
                      con nông dân trong việc quản lý và phát triển nghề nuôi
                      tôm bền vững tại Việt Nam.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2
                      className="text-[#329965] mr-3 mt-1 flex-shrink-0"
                      size={20}
                    />
                    <span>
                      Chúng tôi tạo ra trải nghiệm mua sắm vật tư trực tuyến
                      tiện lợi cùng dịch vụ{" "}
                      <strong>
                        Xét nghiệm nước & Chẩn đoán bệnh tôm (Lab)
                      </strong>{" "}
                      chuyên nghiệp với các thiết bị hiện đại hàng đầu.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Phần 2: 4 Tính năng nổi bật */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-10">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-[#329965] text-white rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-gray-200 shadow-sm transition-transform hover:scale-105">
                    <Icon size={36} />
                  </div>
                  <h6 className="font-bold text-gray-800 text-sm md:text-base mb-2 uppercase">
                    {feature.title}
                  </h6>
                  <p className="text-xs text-gray-500 leading-relaxed px-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Phần 3: Slogan Box */}
          <div className="bg-green-50 p-6 rounded-lg mb-10 border-l-4 border-[#329965]">
            <h4 className="text-lg font-bold text-[#329965] mb-2 uppercase">
              Chất lượng thật - Mùa vụ thắng
            </h4>
            <p className="text-gray-700 text-sm mb-2">
              Đến với AgriShrimp, bà con sẽ trải nghiệm việc mua sắm vật tư trực
              tuyến với các bước{" "}
              <strong>thanh toán an toàn, đơn giản, nhanh chóng</strong>.
            </p>
            <p className="text-gray-700 text-sm mb-0">
              Với phương châm <strong>“Chất lượng thật - Mùa vụ thắng”</strong>,
              AgriShrimp luôn nỗ lực không ngừng nhằm nâng cao chất lượng dịch
              vụ để bà con được hưởng các giải pháp chăm sóc tôm tốt nhất.
            </p>
          </div>

          {/* Phần 4: Hệ thống chi nhánh */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-[#329965] uppercase border-b border-gray-200 pb-3 inline-block w-full">
              Hệ thống Chi nhánh AgriShrimp
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BRANCHES.map((branch, index) => (
              <div
                key={index}
                className="h-full border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Placeholder Image cho chi nhánh */}
                <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-400">
                  <Store size={48} strokeWidth={1.5} />
                </div>

                <div className="p-4 text-center flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-[#329965] mb-2">
                      {branch.name}
                    </h5>
                    <p className="text-xs text-gray-500 mb-4">
                      {branch.address}
                    </p>
                  </div>

                  {/* --- CHỖ BỊ LỖI ĐÃ ĐƯỢC SỬA TẠI ĐÂY --- */}
                  <a
                    href="tel:18006324"
                    className="inline-flex items-center justify-center px-4 py-2 border border-[#329965] text-[#329965] rounded-full text-sm font-medium hover:bg-[#329965] hover:text-white transition-colors mx-auto"
                  >
                    <Phone size={14} className="mr-2" /> 1800 6324
                  </a>
                  {/* Đã sửa thẻ đóng </div> thành </a> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
