"use client";

import Image from "next/image";
import {
  Printer,
  Share2,
  AlertTriangle,
  ShieldAlert,
  Thermometer,
  Droplets,
  ShoppingCart,
} from "lucide-react";

export default function TreatmentResultPage() {
  return (
    <div className="bg-[#f5f7f9] min-h-screen py-6 font-sans text-slate-800">
      <div className="container mx-auto px-4 max-w-[1400px]">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 pb-4 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1 uppercase tracking-tight">
              Báo cáo phác đồ điều trị
            </h1>
            <div className="text-slate-500 text-xs font-mono flex items-center gap-2">
              <span className="bg-slate-200 px-2 py-0.5 rounded">
                ID: #WSSV-2026-OCT
              </span>
              <span>•</span>
              <span>Ngày lập: 25/10/2026</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm">
              <Share2 size={16} /> Chia sẻ
            </button>
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors shadow-sm">
              <Printer size={16} /> Xuất PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* --- LEFT COLUMN: DIAGNOSIS & CART (Sticky) --- */}
          <div className="lg:col-span-4 space-y-4">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Diagnosis Card */}
              <div className="bg-white border-2 border-red-500 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-red-700 font-bold text-xs uppercase flex items-center gap-2">
                    <ShieldAlert size={16} /> Kết quả chẩn đoán
                  </span>
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                    Nguy hiểm cao
                  </span>
                </div>

                <div className="relative h-[180px] w-full bg-gray-100">
                  <Image
                    src="https://nguoinuoitom.vn/wp-content/uploads/2024/03/tom-benh-dom-trang_1703128806.jpg"
                    alt="WSSV Shrimp"
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="p-4">
                  <h2 className="text-lg font-extrabold text-red-700 leading-tight mb-0.5">
                    HỘI CHỨNG ĐỐM TRẮNG (WSSV)
                  </h2>
                  <div className="text-slate-400 text-xs italic mb-4 font-serif">
                    White Spot Syndrome Virus
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 bg-slate-50 border border-slate-100 rounded-md p-3 mb-4">
                    <div className="border-r border-slate-200 pr-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Tỷ lệ chết
                      </div>
                      <div className="text-red-600 font-bold text-sm">
                        80% - 100%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        trong 3-5 ngày
                      </div>
                    </div>
                    <div className="pl-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Lây nhiễm
                      </div>
                      <div className="text-slate-800 font-bold text-sm">
                        Cực nhanh
                      </div>
                      <div className="text-[10px] text-slate-400">
                        qua nước & vật chủ
                      </div>
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                      Triệu chứng lâm sàng:
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-red-400">
                      <li>Đốm trắng tròn (0.5-2mm) dưới vỏ đầu ngực.</li>
                      <li>Thân chuyển màu hồng tím.</li>
                      <li>Bơi lờ đờ mặt nước, giảm ăn đột ngột.</li>
                    </ul>
                  </div>

                  {/* Environment */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                      Thông số môi trường:
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs border-b border-dashed border-gray-100 pb-1">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Droplets size={12} /> pH
                        </span>
                        <span className="font-mono font-bold text-red-600">
                          7.2 (Thấp)
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Thermometer size={12} /> Nhiệt độ
                        </span>
                        <span className="font-mono font-bold text-red-600">
                          26°C (Lạnh)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Card */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">
                    Tổng sản phẩm:
                  </span>
                  <span className="font-mono font-bold text-slate-900">06</span>
                </div>
                <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500">
                    Chi phí dự kiến:
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    1.850.000đ
                  </span>
                </div>
                <button className="w-full bg-[#376E60] hover:bg-[#2a554a] text-white font-bold py-3 rounded-md uppercase text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2">
                  <ShoppingCart size={18} /> Mua toàn bộ phác đồ
                </button>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: TREATMENT STAGES --- */}
          <div className="lg:col-span-8 space-y-6">
            {/* GIAI ĐOẠN 1 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white text-xs font-extrabold px-2 py-1 rounded">
                    GĐ 1
                  </span>
                  <span className="font-bold text-sm text-slate-800 uppercase">
                    Cấp cứu & Xử lý môi trường
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Ngày 1 - 2
                </span>
              </div>

              <div className="p-4">
                <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs px-3 py-2 rounded mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">[QUAN TRỌNG]</span> Cắt 100%
                    thức ăn. Chạy quạt 24/24h đảm bảo Oxy &gt; 5ppm.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Table */}
                  <div className="md:col-span-7">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2">
                            Hành động
                          </th>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2">
                            Liều lượng / Cách dùng
                          </th>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2 text-right">
                            Giờ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        <tr>
                          <td className="py-3 border-b border-slate-50 font-bold text-slate-800 align-top">
                            Diệt khuẩn
                          </td>
                          <td className="py-3 border-b border-slate-50 align-top">
                            <div className="text-red-600 font-bold">
                              Iodine Complex: 1 Lít / 3.000m³
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Hoặc BKC 80%: 1 Lít / 2.000m³
                            </div>
                          </td>
                          <td className="py-3 border-b border-slate-50 font-mono text-right align-top text-slate-500">
                            19:00
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 border-b border-slate-50 font-bold text-slate-800 align-top">
                            Hạ sốt
                          </td>
                          <td className="py-3 border-b border-slate-50 align-top">
                            Đánh Vitamin C tạt (1kg/1.000m³) + Yucca
                          </td>
                          <td className="py-3 border-b border-slate-50 font-mono text-right align-top text-slate-500">
                            08:00
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-800 align-top">
                            Ổn định pH
                          </td>
                          <td className="py-3 align-top">
                            Vôi nóng CaO (10kg/1.000m³) hòa tan lấy nước trong
                          </td>
                          <td className="py-3 font-mono text-right align-top text-slate-500">
                            22:00
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Product Grid */}
                  <div className="md:col-span-5 md:border-l border-slate-100 md:pl-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase text-center mb-3">
                      Thuốc đặc trị GĐ 1
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Product 1 */}
                      <div className="border border-slate-100 rounded p-2 text-center hover:border-slate-300 transition-colors bg-white">
                        <div className="relative h-16 w-full mb-1">
                          <Image
                            src="https://web-api.vemedim.vn/vmd-web-mediafile/file/03b20e14-8800-40a9-bec2-8ce5ee9ac00f?size=720"
                            alt="Iodine"
                            fill
                            className="object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          Vime-Iodine 1L
                        </div>
                        <div className="text-red-600 font-mono font-bold text-[11px]">
                          185.000đ
                        </div>
                      </div>
                      {/* Product 2 */}
                      <div className="border border-slate-100 rounded p-2 text-center hover:border-slate-300 transition-colors bg-white">
                        <div className="relative h-16 w-full mb-1">
                          <Image
                            src="https://navetco.com.vn/upload/products/211-bka-to%CC%82m-1l-5NVB1678441328.png"
                            alt="BKA"
                            fill
                            className="object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          BKA Tôm
                        </div>
                        <div className="text-red-600 font-mono font-bold text-[11px]">
                          210.000đ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GIAI ĐOẠN 2 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-500 text-white text-xs font-extrabold px-2 py-1 rounded">
                    GĐ 2
                  </span>
                  <span className="font-bold text-sm text-slate-800 uppercase">
                    Tăng đề kháng & Nội tạng
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Ngày 3 - 6
                </span>
              </div>

              <div className="p-4">
                <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2 rounded">
                  <span className="font-bold text-slate-900">Chỉ định:</span>{" "}
                  Bắt đầu cho ăn lại 30-50% lượng thức ăn. Tập trung trộn thuốc
                  vào thức ăn.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Table */}
                  <div className="md:col-span-7">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2">
                            Loại thuốc
                          </th>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2">
                            Hoạt chất / Liều lượng
                          </th>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2 text-right">
                            Cữ ăn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        <tr>
                          <td className="py-3 border-b border-slate-50 font-bold text-slate-800 align-top">
                            Kích thích MD
                          </td>
                          <td className="py-3 border-b border-slate-50 align-top">
                            <div className="font-bold text-slate-700">
                              Beta-Glucan 1.3-1.6
                            </div>
                            <div className="font-mono text-red-600 text-xs">
                              Liều: 5g / kg thức ăn
                            </div>
                          </td>
                          <td className="py-3 border-b border-slate-50 font-mono text-right align-top text-slate-500">
                            Sáng
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 border-b border-slate-50 font-bold text-slate-800 align-top">
                            Bổ gan
                          </td>
                          <td className="py-3 border-b border-slate-50 align-top">
                            <div className="text-slate-700">
                              Sorbitol + Methionine
                            </div>
                            <div className="font-mono text-slate-500 text-xs">
                              Liều: 10ml / kg thức ăn
                            </div>
                          </td>
                          <td className="py-3 border-b border-slate-50 font-mono text-right align-top text-slate-500">
                            Chiều
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-800 align-top">
                            Áo bọc
                          </td>
                          <td className="py-3 align-top text-slate-600">
                            Sử dụng dịch trùn quế hoặc dầu mực để thuốc bám dính
                            tốt
                          </td>
                          <td className="py-3 font-mono text-right align-top text-slate-500">
                            Tất cả
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Product Grid */}
                  <div className="md:col-span-5 md:border-l border-slate-100 md:pl-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase text-center mb-3">
                      Combo Tăng lực GĐ 2
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-slate-100 rounded p-2 text-center hover:border-slate-300 transition-colors bg-white">
                        <div className="relative h-16 w-full mb-1">
                          <Image
                            src="https://tuvanthuysan.net/image/420x420/app/user/12/12/admin/file/VN%20BKC%2080/IMG_6754.png"
                            alt="Beta"
                            fill
                            className="object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          Beta-Glucan 500
                        </div>
                        <div className="text-red-600 font-mono font-bold text-[11px]">
                          320.000đ
                        </div>
                      </div>
                      <div className="border border-slate-100 rounded p-2 text-center hover:border-slate-300 transition-colors bg-white">
                        <div className="relative h-16 w-full mb-1">
                          <Image
                            src="https://web-api.vemedim.vn/vmd-web-mediafile/file/03b20e14-8800-40a9-bec2-8ce5ee9ac00f?size=720"
                            alt="C-Complex"
                            fill
                            className="object-contain mix-blend-multiply"
                            style={{ filter: "hue-rotate(45deg)" }}
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          C-Complex Tạt
                        </div>
                        <div className="text-red-600 font-mono font-bold text-[11px]">
                          150.000đ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GIAI ĐOẠN 3 */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-green-600 text-white text-xs font-extrabold px-2 py-1 rounded">
                    GĐ 3
                  </span>
                  <span className="font-bold text-sm text-slate-800 uppercase">
                    Phục hồi & Cấy vi sinh
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Ngày 7+
                </span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Table */}
                  <div className="md:col-span-7">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2">
                            Mục tiêu
                          </th>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2">
                            Thông số / Hành động
                          </th>
                          <th className="text-[10px] font-bold text-slate-400 uppercase border-b-2 border-slate-100 pb-2 text-right">
                            Chu kỳ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        <tr>
                          <td className="py-3 border-b border-slate-50 font-bold text-slate-800 align-top">
                            Cấy hệ vi sinh
                          </td>
                          <td className="py-3 border-b border-slate-50 align-top text-slate-600">
                            Sử dụng{" "}
                            <span className="font-bold">Bacillus spp.</span>{" "}
                            liều cao gấp đôi để phân hủy xác tảo tàn và mùn bã.
                          </td>
                          <td className="py-3 border-b border-slate-50 font-mono text-right align-top text-slate-500">
                            3 ngày/lần
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 font-bold text-slate-800 align-top">
                            Khoáng chất
                          </td>
                          <td className="py-3 align-top text-slate-600">
                            Đánh khoáng Ca, Mg, K.
                            <br />
                            <span className="text-red-600 font-mono text-xs font-bold">
                              Kiềm &gt; 120mg/L
                            </span>
                          </td>
                          <td className="py-3 font-mono text-right align-top text-slate-500">
                            Đêm
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Product Grid */}
                  <div className="md:col-span-5 md:border-l border-slate-100 md:pl-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase text-center mb-3">
                      Sản phẩm GĐ 3
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-slate-100 rounded p-2 text-center hover:border-slate-300 transition-colors bg-white">
                        <div className="relative h-16 w-full mb-1">
                          <Image
                            src="https://navetco.com.vn/upload/products/211-bka-to%CC%82m-1l-5NVB1678441328.png"
                            alt="Vi sinh"
                            fill
                            className="object-contain mix-blend-multiply grayscale"
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          Vi sinh Xử lý đáy
                        </div>
                        <div className="text-red-600 font-mono font-bold text-[11px]">
                          190.000đ
                        </div>
                      </div>
                      <div className="border border-slate-100 rounded p-2 text-center hover:border-slate-300 transition-colors bg-white">
                        <div className="relative h-16 w-full mb-1">
                          <Image
                            src="https://tuvanthuysan.net/image/420x420/app/user/12/12/admin/file/VN%20BKC%2080/IMG_6754.png"
                            alt="Khoáng"
                            fill
                            className="object-contain mix-blend-multiply sepia-[.5]"
                          />
                        </div>
                        <div className="text-xs font-bold text-slate-800 truncate">
                          Khoáng Đa vi lượng
                        </div>
                        <div className="text-red-600 font-mono font-bold text-[11px]">
                          95.000đ
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
