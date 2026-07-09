"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  ChevronRight,
  ShieldCheck,
  Wrench,
  AlertOctagon,
  QrCode,
  Headphones,
} from "lucide-react";

export default function WarrantyPolicyPage() {
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
        <span className="text-[#1965a2] font-bold">Chính sách bảo hành</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        {/* Header */}
        <h3 className="text-xl font-bold text-[#1965a2] uppercase border-b border-gray-200 pb-4 mb-8 flex items-center">
          <ShieldCheck className="mr-3" size={24} />
          Chính sách bảo hành Thiết bị AgriShrimp
        </h3>

        <div className="text-gray-700 text-sm md:text-base leading-relaxed space-y-10">
          {/* I. CHÍNH SÁCH BẢO HÀNH */}
          <section>
            <h5 className="text-lg font-bold text-gray-900 border-l-4 border-[#1965a2] pl-3 mb-4 uppercase">
              I. CHÍNH SÁCH BẢO HÀNH
            </h5>

            <div className="pl-0 md:pl-4 space-y-6">
              {/* 1. Điều kiện */}
              <div>
                <h6 className="font-bold text-gray-800 mb-2">
                  1. Điều kiện bảo hành
                </h6>
                <p className="mb-2">
                  Để được bảo hành, Quý khách/Bà con vui lòng điền{" "}
                  <strong>Yêu cầu bảo hành</strong> trên Website/App và gửi sản
                  phẩm lại cho AgriShrimp bằng cách:
                </p>
                <ul className="list-disc pl-5 space-y-1 mb-2 text-gray-600">
                  <li>
                    (1) Điền thông tin để Shipper AgriShrimp (hoặc đối tác vận
                    chuyển) đến thu hồi hàng.
                  </li>
                  <li>
                    (2) Đem sản phẩm đến trực tiếp các kho hàng/cửa hàng của
                    AgriShrimp trên toàn quốc.
                  </li>
                </ul>
                <p className="text-sm italic text-gray-500">
                  * Lưu ý: Cần cung cấp bằng chứng mua hàng (Hóa đơn, mã đơn
                  hàng trên App, hoặc số điện thoại mua hàng) để nhân viên đối
                  chiếu.
                </p>
              </div>

              {/* 2. Chính sách */}
              <div>
                <h6 className="font-bold text-gray-800 mb-2 flex items-center">
                  <Wrench className="w-4 h-4 mr-2 text-[#1965a2]" /> 2. Chính
                  sách bảo hành
                </h6>
                <p className="mb-2">
                  Áp dụng cho các thiết bị điện tử, máy đo môi trường, máy cho
                  ăn tự động mang thương hiệu AgriShrimp hoặc được phân phối
                  chính hãng:
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded p-3">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Bảo hành 1 đổi 1:</strong> Có hiệu lực trong vòng{" "}
                      <strong className="text-[#1965a2]">2 năm</strong> tính từ
                      ngày mua hàng (thể hiện trên hóa đơn) hoặc ngày nhận hàng
                      thành công.
                    </li>
                    <li>
                      Trong thời hạn bảo hành, sản phẩm sẽ được{" "}
                      <strong>đổi mới miễn phí</strong> nếu phát sinh lỗi kỹ
                      thuật từ nhà sản xuất.
                    </li>
                    <li>
                      Sau khi hết thời hạn bảo hành, AgriShrimp{" "}
                      <strong>không nhận</strong> sửa chữa miễn phí nhưng sẽ hỗ
                      trợ tư vấn kỹ thuật hoặc giới thiệu đơn vị sửa chữa dịch
                      vụ.
                    </li>
                  </ul>
                </div>
              </div>

              {/* 3. Từ chối bảo hành */}
              <div>
                <h6 className="font-bold text-gray-800 mb-2 flex items-center">
                  <AlertOctagon className="w-4 h-4 mr-2 text-red-500" /> 3. Các
                  trường hợp từ chối bảo hành
                </h6>
                <p className="mb-2">
                  AgriShrimp có quyền từ chối bảo hành đối với các trường hợp
                  sau:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 marker:text-red-400">
                  <li>
                    Sản phẩm không có bằng chứng mua hàng hoặc đã hết thời hạn
                    bảo hành.
                  </li>
                  <li>
                    Sản phẩm bị hư hỏng do lỗi người dùng: Rơi rớt, va đập mạnh,
                    vô nước (với bộ phận không chống nước), sai nguồn điện.
                  </li>
                  <li>
                    Lỗi ngoại quan (trầy xước, móp méo) không được báo trong
                    vòng <strong>48 giờ</strong> kể từ khi nhận hàng.
                  </li>
                  <li>
                    <strong>Hao mòn tự nhiên:</strong> Đầu dò pH, Cánh quạt máy
                    bơm, Pin, Dây dẫn...
                  </li>
                  <li>
                    Sản phẩm đã bị tự ý tháo dỡ, sửa chữa bởi bên thứ 3 không ủy
                    quyền.
                  </li>
                  <li>Hư hỏng do thiên tai, hỏa hoạn, lũ lụt tại ao nuôi.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* II. KÍCH HOẠT BẢO HÀNH */}
          <section>
            <h5 className="text-lg font-bold text-gray-900 border-l-4 border-[#1965a2] pl-3 mb-4 uppercase flex items-center">
              II. KÍCH HOẠT BẢO HÀNH ĐIỆN TỬ{" "}
              <QrCode className="ml-2 w-5 h-5 text-gray-400" />
            </h5>
            <div className="pl-0 md:pl-4">
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  Sau khi đơn hàng giao thành công, hệ thống AgriShrimp sẽ{" "}
                  <strong>tự động kích hoạt</strong> thời gian bảo hành dựa trên
                  mã seri sản phẩm.
                </li>
                <li>
                  Quý khách sẽ nhận được thông báo xác nhận qua App/Zalo. Ngoài
                  ra, Quý khách có thể quét mã QR dán trên thân máy để kiểm tra
                  thời hạn bảo hành bất cứ lúc nào.
                </li>
              </ul>
            </div>
          </section>

          {/* III. QUY TRÌNH THỰC HIỆN */}
          <section>
            <h5 className="text-lg font-bold text-gray-900 border-l-4 border-[#1965a2] pl-3 mb-4 uppercase">
              III. QUY TRÌNH THỰC HIỆN BẢO HÀNH
            </h5>
            <div className="pl-4 border-l-2 border-gray-200 ml-2 space-y-6">
              <div className="relative">
                <div className="absolute -left-[25px] bg-[#1965a2] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <h6 className="font-bold text-gray-800">
                  Bước 1: Tạo phiếu yêu cầu
                </h6>
                <p className="text-gray-600 text-sm mt-1">
                  Đăng nhập vào mục "Tài khoản" &gt; "Bảo hành" để tạo phiếu. Bộ
                  phận CSKH sẽ liên hệ trong vòng 1 giờ làm việc để xác nhận.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[25px] bg-[#1965a2] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <h6 className="font-bold text-gray-800">
                  Bước 2: Gửi hàng về trung tâm
                </h6>
                <p className="text-gray-600 text-sm mt-1">
                  Sau khi xác nhận, Quý khách vui lòng đóng gói sản phẩm cẩn
                  thận và gửi về AgriShrimp trong vòng 3-5 ngày.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[25px] bg-[#1965a2] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <h6 className="font-bold text-gray-800">
                  Bước 3: Kiểm tra & Phản hồi
                </h6>
                <p className="text-gray-600 text-sm mt-1">
                  Kỹ thuật viên AgriShrimp sẽ kiểm tra tình trạng lỗi trong vòng
                  24h và thông báo kết quả chấp nhận/từ chối bảo hành.
                </p>
              </div>

              <div className="relative">
                <div className="absolute -left-[25px] bg-[#1965a2] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <h6 className="font-bold text-gray-800">Bước 4: Hoàn tất</h6>
                <ul className="list-disc pl-5 mt-1 text-sm text-gray-600">
                  <li>
                    <span className="font-semibold text-blue-600">
                      Chấp nhận:
                    </span>{" "}
                    Gửi máy mới cho khách trong 5-7 ngày làm việc.
                  </li>
                  <li>
                    <span className="font-semibold text-red-500">Từ chối:</span>{" "}
                    Gửi trả lại máy cũ kèm lý do từ chối.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer Hotline */}
          <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="bg-white p-3 rounded-full shadow-sm text-[#1965a2] mr-4">
              <Headphones size={32} />
            </div>
            <div>
              <h5 className="font-bold text-[#1965a2] text-lg">
                TỔNG ĐÀI HỖ TRỢ
              </h5>
              <p className="text-gray-700">
                Hotline tư vấn kỹ thuật & Bảo hành:{" "}
                <strong className="text-xl">1800 6324</strong> (Miễn phí)
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

