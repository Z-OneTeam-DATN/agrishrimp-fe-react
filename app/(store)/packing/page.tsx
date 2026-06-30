"use client";

import Link from "next/link";
import Image from "next/image";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  ChevronRight,
  Package,
  Truck,
  User,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

// Dữ liệu các bước đóng gói (Để code gọn hơn)
const PACKING_STEPS = [
  {
    title: "1. Đối với đơn hàng giao bởi Đơn vị vận chuyển",
    icon: Truck,
    // Lưu ý: Bạn cần đảm bảo file ảnh có trong thư mục public/images/
    image: "/images/donggoi1.png",
    description:
      "Áp dụng cho các đơn hàng đi tỉnh, sử dụng đối tác giao hàng (Viettel Post, GHN...).",
  },
  {
    title: "2. Đối với đơn hàng giao bởi Shipper AgriShrimp",
    icon: User,
    image: "/images/donggoi2.png",
    description:
      "Áp dụng cho giao hàng hỏa tốc nội ô hoặc các khu vực lân cận kho hàng.",
  },
  {
    title: "3. Tiêu chuẩn kiểm tra & Giao nhận",
    icon: ShieldCheck,
    image: "/images/donggoi3.png",
    description:
      "Cam kết minh bạch - Khách hàng luôn được đồng kiểm trước khi nhận.",
  },
];

export default function PackingPage() {
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
        <span className="text-[#1965a2] font-bold">Quy cách đóng gói</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        {/* Header */}
        <h3 className="text-xl font-bold text-[#1965a2] uppercase border-b border-gray-200 pb-4 mb-8 flex items-center">
          <Package className="mr-3" size={24} />
          Quy chuẩn đóng gói hàng hóa AgriShrimp
        </h3>

        <div className="space-y-10">
          {PACKING_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="group">
                {/* Tiêu đề bước */}
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center group-hover:text-[#1965a2] transition-colors">
                  <Icon className="mr-2 text-[#1965a2]" size={24} />
                  {step.title}
                </h4>

                {/* Ảnh minh họa */}
                <div className="mb-3 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Placeholder nếu ảnh lỗi hoặc chưa có */}
                  <div className="relative w-full h-[300px] md:h-[400px] bg-gray-50 flex items-center justify-center">
                    {/* Khi có ảnh thật, Next.js sẽ optimize */}
                    {/* Bạn nhớ copy ảnh vào public/images nhé */}
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                      <span className="text-sm">
                        Ảnh minh họa: {step.image}
                      </span>
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Mô tả */}
                <p className="text-gray-500 italic text-sm border-l-4 border-gray-300 pl-3">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Cảnh báo (Alert Box) */}
        <div className="mt-10 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r flex items-start">
          <AlertTriangle
            className="text-yellow-500 mr-3 flex-shrink-0"
            size={24}
          />
          <div className="text-yellow-800 text-sm md:text-base">
            <p>
              Quý khách vui lòng <strong>TỪ CHỐI NHẬN HÀNG</strong> hoặc{" "}
              <strong>ĐỒNG KIỂM VỚI SHIPPER</strong> nếu phát hiện gói hàng có
              dấu hiệu bất thường, móp méo nghiêm trọng hoặc đóng gói không đúng
              quy cách như hình trên.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

