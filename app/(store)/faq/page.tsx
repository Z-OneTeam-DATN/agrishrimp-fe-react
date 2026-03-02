"use client";

import { useState } from "react";
import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import { ChevronRight, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const FAQ_ITEMS = [
  {
    category: "Đặt hàng & Thanh toán",
    questions: [
      {
        q: "Tôi có thể đặt hàng bằng những hình thức nào?",
        a: "Quý khách có thể đặt hàng trực tiếp trên website AgriShrimp, gọi hotline 1800 6324 hoặc đến trực tiếp tại các chi nhánh của chúng tôi.",
      },
      {
        q: "AgriShrimp chấp nhận những phương thức thanh toán nào?",
        a: "Chúng tôi chấp nhận: Thanh toán khi nhận hàng (COD), thẻ Visa/Mastercard, thẻ ATM nội địa và chuyển khoản ngân hàng.",
      },
      {
        q: "Đơn hàng của tôi có thể hủy sau khi đặt không?",
        a: "Quý khách có thể hủy đơn hàng trước khi đơn được xác nhận giao cho đơn vị vận chuyển. Vui lòng liên hệ hotline 1800 6324 ngay sau khi đặt hàng.",
      },
    ],
  },
  {
    category: "Vận chuyển & Giao hàng",
    questions: [
      {
        q: "Thời gian giao hàng mất bao lâu?",
        a: "Với dịch vụ giao hàng hỏa tốc 2H áp dụng tại TP. HCM. Các tỉnh thành khác từ 1–3 ngày làm việc tùy khu vực.",
      },
      {
        q: "Phí vận chuyển được tính như thế nào?",
        a: "Đơn hàng từ 299.000đ được miễn phí vận chuyển. Đơn dưới mức này tính phí theo khoảng cách và đơn vị vận chuyển.",
      },
      {
        q: "Tôi có thể theo dõi đơn hàng không?",
        a: "Có. Sau khi đơn hàng được giao cho đơn vị vận chuyển, quý khách sẽ nhận được mã vận đơn qua SMS/email để tra cứu trên website GHN.",
      },
    ],
  },
  {
    category: "Đổi trả & Bảo hành",
    questions: [
      {
        q: "Chính sách đổi trả hàng của AgriShrimp như thế nào?",
        a: "AgriShrimp hỗ trợ đổi trả trong vòng 14 ngày kể từ ngày nhận hàng với điều kiện: sản phẩm còn nguyên vẹn, chưa qua sử dụng, còn tem/nhãn nguyên bản.",
      },
      {
        q: "Tôi nhận được hàng bị lỗi hoặc hỏng, phải làm gì?",
        a: "Quý khách vui lòng chụp ảnh sản phẩm lỗi và liên hệ hotline 1800 6324 hoặc gửi yêu cầu hỗ trợ. Chúng tôi sẽ xử lý đổi/hoàn tiền trong 24–48 giờ làm việc.",
      },
    ],
  },
  {
    category: "Sản phẩm & Kỹ thuật",
    questions: [
      {
        q: "Làm thế nào để biết sản phẩm phù hợp với ao nuôi của tôi?",
        a: "Quý khách có thể sử dụng tính năng tư vấn kỹ thuật miễn phí của AgriShrimp. Đội ngũ kỹ sư sẽ hỗ trợ chọn đúng sản phẩm theo tình trạng ao nuôi.",
      },
      {
        q: "Sản phẩm trên AgriShrimp có đảm bảo chính hãng không?",
        a: "100% sản phẩm trên AgriShrimp được nhập khẩu và phân phối chính hãng từ các thương hiệu uy tín như Bayer, CP, Thăng Long... Chúng tôi cam kết không bán hàng giả, hàng nhái.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-green-50 transition-colors"
      >
        <span>{q}</span>
        {open ? (
          <ChevronUp size={18} className="text-[#329965] shrink-0 ml-3" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 shrink-0 ml-3" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <StoreBanner />

      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center container mx-auto px-4">
        <Link href="/" className="hover:text-[#329965] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#329965] font-bold">Câu hỏi thường gặp</span>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="border-b border-gray-200 pb-4 mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#329965] uppercase flex items-center">
              <HelpCircle className="mr-3" size={28} />
              Câu hỏi thường gặp
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Tổng hợp các câu hỏi phổ biến về dịch vụ và sản phẩm của AgriShrimp.
            </p>
          </div>

          <div className="space-y-8">
            {FAQ_ITEMS.map((section) => (
              <div key={section.category}>
                <h3 className="text-base font-bold text-[#329965] uppercase mb-3 border-l-4 border-[#329965] pl-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.questions.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-gray-700 text-sm mb-3">
              Không tìm thấy câu trả lời bạn cần?
            </p>
            <Link
              href="/support"
              className="inline-block px-6 py-2.5 bg-[#329965] text-white font-bold rounded-md hover:bg-[#268050] transition-colors text-sm"
            >
              Gửi yêu cầu hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
