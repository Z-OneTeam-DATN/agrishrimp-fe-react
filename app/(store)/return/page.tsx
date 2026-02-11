'use client';

import Link from 'next/link';
import StoreBanner from '@/components/site/SiteBanner_Store';
import { 
  ChevronRight, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Wallet, 
  Headphones 
} from 'lucide-react';

export default function ReturnPolicyPage() {
  return (
    <>
      {/* Banner */}
      <StoreBanner />

      {/* Breadcrumb */}
      <div className="py-2 mb-6 text-sm text-gray-500 flex items-center">
        <Link href="/" className="hover:text-[#329965] transition-colors">Trang chủ</Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-[#329965] font-bold">Chính sách đổi trả</span>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">

        <h3 className="text-xl font-bold text-[#329965] uppercase border-b border-gray-200 pb-4 mb-6 flex items-center">
          <RotateCcw className="mr-3" size={24} />
          Chính sách Đổi trả Hàng hóa AgriShrimp
        </h3>

        {/* BẢNG CHÍNH SÁCH */}
        <div className="overflow-x-auto mb-8 border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white uppercase bg-[#329965]">
              <tr>
                <th scope="col" className="px-6 py-4 w-[30%] border-r border-green-600">Trường hợp</th>
                <th scope="col" className="px-6 py-4 w-[35%] border-r border-green-600 text-center">1 – 30 ngày</th>
                <th scope="col" className="px-6 py-4 w-[35%] text-center">31 ngày trở đi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-bold border-r border-gray-200">
                  Sản phẩm lỗi
                  <div className="font-normal text-xs text-gray-500 mt-1">(Do nhà sản xuất/vận chuyển)</div>
                </td>
                <td className="px-6 py-4 text-center font-bold text-[#329965] border-r border-gray-200">
                  Đổi mới - Trả không thu phí
                </td>
                <td className="px-6 py-4 text-center text-gray-400">
                  Không hỗ trợ đổi trả
                  <div className="text-xs mt-1">(Áp dụng bảo hành nếu là thiết bị)</div>
                </td>
              </tr>
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-bold border-r border-gray-200">
                  Sản phẩm lỗi
                  <div className="font-normal text-xs text-gray-500 mt-1">(Do người sử dụng)</div>
                </td>
                <td className="px-6 py-4 text-center font-bold text-red-500 border-r border-gray-200">
                  Không hỗ trợ đổi trả
                </td>
                <td className="px-6 py-4 text-center text-gray-400">
                  Không hỗ trợ đổi trả
                </td>
              </tr>
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-bold border-r border-gray-200">
                  Sản phẩm KHÔNG lỗi
                  <div className="font-normal text-xs text-gray-500 mt-1">(Khách đổi ý/dư dùng)</div>
                </td>
                <td className="px-6 py-4 text-center font-bold text-blue-600 border-r border-gray-200">
                  Đổi sang sản phẩm khác
                  <div className="font-normal text-xs text-gray-500 mt-1">(Hàng còn nguyên seal)</div>
                </td>
                <td className="px-6 py-4 text-center text-gray-400">
                  Không hỗ trợ
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ALERT INFO */}
        <div className="flex items-start p-4 mb-8 text-blue-800 border-l-4 border-blue-600 bg-blue-50 rounded-r-lg">
          <Info className="flex-shrink-0 w-5 h-5 mr-3" />
          <div className="text-sm">
            <strong>Lưu ý:</strong> Từ ngày 01/01/2026, AgriShrimp áp dụng chính sách đổi trả mới trong vòng <strong>30 ngày</strong>.
          </div>
        </div>

        {/* NỘI DUNG CHI TIẾT */}
        <div className="space-y-8 text-gray-700 text-sm md:text-base">
          
          {/* 1. Các trường hợp nhận đổi trả */}
          <section>
            <h5 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
              <CheckCircle2 className="text-[#329965] mr-2" size={20} />
              1. Các trường hợp nhận đổi trả
            </h5>
            <ul className="list-disc pl-9 space-y-2 text-gray-600 marker:text-[#329965]">
              <li>Sản phẩm mắc lỗi từ phía nhà sản xuất: Thuốc bị vón cục, biến đổi màu sắc, bao bì bị rách hở seal, thiết bị không hoạt động.</li>
              <li>Sản phẩm bị hư hỏng, trầy xước, đổ vỡ do quá trình vận chuyển của nhân viên giao hàng.</li>
              <li>Sản phẩm đã hết hoặc gần hết thời hạn sử dụng (Date).</li>
              <li>Sản phẩm không đúng yêu cầu: AgriShrimp soạn sai thuốc, giao nhầm loại, sai hàm lượng hoặc quy cách đóng gói.</li>
              <li>Sản phẩm còn nguyên vỏ hộp, tem nhãn và chưa qua sử dụng (đối với trường hợp khách đổi ý).</li>
            </ul>
          </section>

          {/* 2. Các trường hợp KHÔNG áp dụng */}
          <section>
            <h5 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
              <XCircle className="text-red-500 mr-2" size={20} />
              2. Các trường hợp KHÔNG áp dụng đổi trả
            </h5>
            <ul className="list-disc pl-9 space-y-2 text-gray-600 marker:text-red-500">
              <li>Sản phẩm quà tặng, hàng khuyến mãi tặng kèm.</li>
              <li>Sản phẩm đã quá hạn đổi trả (Từ 31 ngày trở đi).</li>
              <li>Sản phẩm thuốc/thức ăn đã bị xé bao bì, mở nắp hoặc đã sử dụng xuống ao nuôi (trừ khi phát hiện lỗi chất lượng bên trong).</li>
              <li>Bao bì, vỏ hộp sản phẩm bị rách, nứt, hư hỏng do lỗi bảo quản từ phía khách hàng (để ngấm nước, chuột cắn...).</li>
              <li>Sản phẩm không phải mua từ hệ thống AgriShrimp.</li>
            </ul>
          </section>

          {/* 3. Cách thức đổi trả */}
          <section>
            <h5 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
              <Truck className="text-blue-600 mr-2" size={20} />
              3. Cách thức đổi trả
            </h5>
            <div className="pl-5 border-l-4 border-green-200 ml-2 space-y-3">
              <p><strong>Bước 1:</strong> Khách hàng thông báo cho nhân viên AgriShrimp qua Hotline hoặc Zalo về lý do đổi trả.</p>
              <div>
                <p><strong>Bước 2:</strong> Gửi sản phẩm về AgriShrimp:</p>
                <ul className="list-disc pl-5 mt-1 text-gray-600">
                  <li><strong>Khách tại TP. Cần Thơ & lân cận:</strong> Khuyến khích mang trực tiếp ra Cửa hàng/Kho để nhân viên kiểm tra và đổi ngay sản phẩm mới.</li>
                  <li><strong>Khách ở tỉnh xa:</strong> Gửi hàng qua bưu điện/chành xe. Vui lòng liên hệ CSKH để lấy thông tin người nhận và mã bưu điện.</li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-xs italic text-gray-500 pl-2">
              * Lưu ý: Khi đổi trả, quý khách vui lòng đem theo/gửi kèm quà tặng (nếu có) để được hỗ trợ trọn vẹn quy trình.
            </p>
          </section>

          {/* 4. Phương thức hoàn tiền */}
          <section>
            <h5 className="font-bold text-gray-900 text-lg mb-3 flex items-center">
              <Wallet className="text-purple-600 mr-2" size={20} />
              4. Phương thức hoàn tiền
            </h5>

            <div className="mb-4 pl-2">
              <h6 className="font-bold text-gray-800 mb-2">a. Trả hàng trực tiếp tại Cửa hàng AgriShrimp</h6>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Đơn thanh toán tiền mặt: Hoàn tiền mặt tại quầy.</li>
                <li>Đơn thanh toán chuyển khoản/Thẻ: Hoàn tiền qua tài khoản ngân hàng sau 3-5 ngày làm việc.</li>
                <li>Đơn thanh toán qua VNPay/Ví điện tử: Hoàn về ví sau 3-8 ngày làm việc.</li>
              </ul>
            </div>

            <div className="pl-2">
              <h6 className="font-bold text-gray-800 mb-2">b. Trả hàng qua đường bưu điện (Online)</h6>
              <ul className="list-disc pl-6 text-gray-600 space-y-1">
                <li>Sau khi nhận được hàng trả về và kiểm tra đạt yêu cầu, AgriShrimp sẽ chuyển khoản lại vào số tài khoản quý khách cung cấp.</li>
                <li>Đối với đơn hàng mua bằng Điểm tích lũy/Voucher: AgriShrimp sẽ hoàn lại điểm hoặc cấp lại mã Voucher mới cho đơn hàng tiếp theo.</li>
              </ul>
            </div>
          </section>

          {/* Footer Contact Box */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-8 flex items-start gap-4">
            <div className="bg-white p-2 rounded-full shadow-sm text-[#329965]">
              <Headphones size={24} />
            </div>
            <div>
              <h6 className="font-bold text-[#329965] uppercase text-sm mb-1">Trung tâm dịch vụ khách hàng</h6>
              <p className="text-gray-600 text-sm mb-2">Mọi thắc mắc và khiếu nại về đổi trả, bà con vui lòng liên hệ:</p>
              <ul className="text-sm space-y-1">
                <li><strong>Hotline:</strong> <span className="font-mono font-bold text-red-500">1800 6324</span></li>
                <li><strong>Email:</strong> <span className="font-medium text-blue-600">hotro@agrishrimp.com</span></li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}