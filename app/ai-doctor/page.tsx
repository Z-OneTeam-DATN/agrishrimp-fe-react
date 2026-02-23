"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  MoreVertical,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  ImageIcon,
  Send,
  AlertTriangle,
} from "lucide-react";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AiDoctorChatPage() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: user } = useCurrentUser();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    /* FIX: Thêm fixed inset-0 và z-[9999] 
       Điều này giúp trang Chat đè lên toàn bộ Header/Footer của web mà không cần sửa layout
    */
    <div className="fixed inset-0 z-[9999] flex flex-col h-screen bg-[#E5E5E5] font-sans overflow-hidden">
      {/* --- HEADER CHAT --- */}
      <div className="bg-[#376E60] px-4 py-3 flex items-center gap-3 shadow-sm z-50 shrink-0">
        <Link href="/" className="text-white hover:opacity-80">
          <ChevronLeft size={28} />
        </Link>

        <div className="relative w-[42px] h-[42px] border-2 border-white rounded-full overflow-hidden bg-white shrink-0">
          <Image
            src="/images/logo_arishrimp.jpg"
            alt="AI Avatar"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base m-0 truncate">
            Bác sĩ AI AriShrimp
          </h1>
          <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-green-400 block"></span>
            Đang hoạt động
          </div>
        </div>

        <button className="text-white" suppressHydrationWarning={true}>
          <MoreVertical size={24} />
        </button>
      </div>

      {/* --- NỘI DUNG CHAT --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        {/* Time */}
        <div className="text-center">
          <span className="text-[11px] text-gray-500 bg-black/5 px-3 py-1 rounded-full">
            Hôm nay, 09:30
          </span>
        </div>

        {/* AI Message */}
        <div className="flex gap-2.5 items-end max-w-full">
          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mb-1">
            <Image
              src="/images/logo_arishrimp.jpg"
              alt="AI"
              fill
              className="object-cover"
            />
          </div>
          <div className="bg-white text-gray-800 px-3.5 py-2.5 rounded-[18px] rounded-bl-md text-sm shadow-sm max-w-[85%] leading-relaxed">
            Xin chào {user?.displayName || "bạn"}! Tôi là bác sĩ AI. Hãy gửi ảnh tôm để tôi kiểm tra
            nhé.
          </div>
        </div>

        {/* User Image */}
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[220px] rounded-xl border-[3px] border-[#d1fae5] shadow-sm overflow-hidden">
            <Image
              src="https://nguoinuoitom.vn/wp-content/uploads/2024/03/tom-benh-dom-trang_1703128806.jpg"
              alt="Shrimp"
              width={300}
              height={200}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* AI Result Card */}
        <div className="flex gap-2.5 items-start max-w-full">
          <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mt-2">
            <Image
              src="/images/logo_arishrimp.jpg"
              alt="AI"
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-col gap-2 max-w-[85%]">
            <div className="bg-white rounded-xl overflow-hidden border border-red-100 shadow-lg w-[280px]">
              <div className="bg-red-50 px-4 py-2.5 flex justify-between items-center border-b border-red-100">
                <span className="text-red-600 font-bold text-[13px] flex items-center gap-1.5">
                  <ShieldAlert size={14} /> KẾT QUẢ CHẨN ĐOÁN
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-[15px] font-extrabold text-red-600 uppercase mb-1.5">
                  Hội chứng đốm trắng
                </h3>
                <p className="text-[13px] text-gray-600 mb-2.5">
                  Hệ thống phát hiện tôm có dấu hiệu đốm trắng trên vỏ.
                </p>
                <div className="text-red-600 text-[13px] italic flex items-start gap-1.5">
                  <AlertTriangle size={14} className="mt-0.5" /> Nguy hiểm, cần
                  xử lý ngay!
                </div>
              </div>
              <div className="p-3 bg-white border-t border-gray-100">
                <Link
                  href="/ai-doctor/result"
                  className="bg-[#376E60] text-white text-[13px] font-bold h-12 rounded-lg w-full flex justify-center items-center gap-1 uppercase"
                >
                  Xem phác đồ <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* --- THANH NHẬP LIỆU --- */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center gap-3 shrink-0">
        <button className="text-[#376E60]">
          <PlusCircle size={26} />
        </button>
        <button className="text-[#376E60]">
          <ImageIcon size={26} />
        </button>
        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 h-12 flex items-center">
          {" "}
          {/* Added flex items-center and h-12 */}
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            className="w-full bg-transparent outline-none text-sm text-gray-800"
          />
        </div>
        <button className="text-[#376E60]">
          <Send size={26} />
        </button>
      </div>
    </div>
  );
}
