"use client";

import Link from "next/link";
import StoreBanner from "@/components/site/SiteBanner_Store";
import {
  ChevronRight,
  Coins, // Icon tiền/phí
  Info,
  MapPin,
  Store,
} from "lucide-react";

export default function ShippingFeePage() {
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
        <span className="text-[#329965] font-bold">Phí vận chuyển</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-[#329965] uppercase border-b border-gray-200 pb-4 mb-6 flex items-center">
          <Coins className="mr-3" size={24} />
          Phí vận chuyển khi đặt hàng tại AgriShrimp
        </h3>

        <div className="space-y-6 text-gray-700 text-sm md:text-base leading-relaxed">
          {/* Đoạn giới thiệu */}
          <div>
            <p className="mb-4">
              AgriShrimp miễn phí vận chuyển tại{" "}
              <strong className="text-gray-900">
                các tỉnh/thành phố có kho hàng hoặc đại lý của AgriShrimp
              </strong>{" "}
              (Xem{" "}
              <Link
                href="/store-locator"
                className="text-[#329965] font-bold hover:underline"
              >
                Hệ thống cửa hàng AgriShrimp
              </Link>
              ) cho các đơn hàng vật tư từ{" "}
              <strong className="text-red-600">90.000đ</strong> trở lên. Các đơn
              hàng dưới 90.000đ Quý khách/Bà con chỉ mất 10.000đ phí vận chuyển.
            </p>
            <p>
              Đối với những khách hàng thuộc{" "}
              <strong className="text-gray-900">
                các tỉnh/thành phố KHÔNG có cửa hàng của AgriShrimp
              </strong>{" "}
              sẽ miễn phí vận chuyển đối với đơn hàng từ{" "}
              <strong className="text-red-600">249.000đ</strong> trở lên. Đơn
              hàng dưới 249.000đ có cước phí vận chuyển là 25.000đ.
            </p>
          </div>

          {/* BẢNG PHÍ VẬN CHUYỂN */}
          <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm mt-6">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3 border-b border-r border-gray-200 w-2/5">
                    Khu Vực
                  </th>
                  <th className="px-4 py-3 border-b border-r border-gray-200 w-1/3">
                    Điều kiện đơn hàng
                  </th>
                  <th className="px-4 py-3 border-b border-gray-200 w-1/4">
                    Phí vận chuyển
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200">
                {/* Nhóm 1: Có cửa hàng */}
                <tr className="bg-white hover:bg-green-50/50 transition-colors">
                  <td
                    rowSpan={2}
                    className="px-4 py-4 border-r border-gray-200 align-top"
                  >
                    <div className="font-bold text-[#329965] flex items-start gap-2 mb-1">
                      <Store size={18} className="mt-0.5 flex-shrink-0" />
                      Có cửa hàng/kho AgriShrimp
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      (Hồ Chí Minh, Cần Thơ, Cà Mau, Bạc Liêu...)
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 font-medium">
                    ≥ 90.000đ
                  </td>
                  <td className="px-4 py-3 font-bold text-[#329965]">
                    Miễn phí
                  </td>
                </tr>
                <tr className="bg-white hover:bg-green-50/50 transition-colors">
                  {/* Cột 1 bị merge bởi rowSpan */}
                  <td className="px-4 py-3 border-r border-gray-200 font-medium">
                    &lt; 90.000đ
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700">10.000đ</td>
                </tr>

                {/* Nhóm 2: Không có cửa hàng */}
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-200">
                  <td
                    rowSpan={2}
                    className="px-4 py-4 border-r border-gray-200 align-top"
                  >
                    <div className="font-bold text-gray-800 flex items-start gap-2 mb-1">
                      <MapPin
                        size={18}
                        className="mt-0.5 flex-shrink-0 text-gray-500"
                      />
                      KHÔNG có cửa hàng AgriShrimp
                    </div>
                  </td>
                  <td className="px-4 py-3 border-r border-gray-200 font-medium">
                    ≥ 249.000đ
                  </td>
                  <td className="px-4 py-3 font-bold text-[#329965]">
                    Miễn phí
                  </td>
                </tr>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  {/* Cột 1 bị merge bởi rowSpan */}
                  <td className="px-4 py-3 border-r border-gray-200 font-medium">
                    &lt; 249.000đ
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700">25.000đ</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ALERT BOX */}
          <div className="flex items-start p-4 mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-r text-blue-900 shadow-sm">
            <Info className="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 text-blue-600" />
            <div>
              <p className="font-bold mb-1">Lưu ý quan trọng:</p>
              <p className="text-sm opacity-90">
                Đối với các đơn hàng vật tư số lượng lớn (thức ăn bao, vôi,
                khoáng tạt...), phí vận chuyển có thể thay đổi tùy theo trọng
                lượng thực tế. Nhân viên sẽ liên hệ xác nhận cước phí trước khi
                giao hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
