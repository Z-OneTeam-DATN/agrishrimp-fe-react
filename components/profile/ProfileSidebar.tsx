"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Pencil,
  User,
  Settings,
  MapPin,
  ClipboardList,
  Bot,
  Waves,
  Ticket,
  LogOut,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser"; // ✅ Import useCurrentUser hook

export default function ProfileSidebar({
  onLinkClick,
}: {
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { data: userData } = useCurrentUser(); // ✅ Lấy dữ liệu user từ hook

  const isActive = (path: string) => pathname === path;

  const itemClass = (path: string) => `
    flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-bold mb-1
    ${
      isActive(path)
        ? "bg-[#e6f4ea] text-[#329965]"
        : "text-gray-600 hover:bg-gray-50 hover:text-[#329965]"
    }
  `;

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-20">
      {/* --- User Brief (Avatar + Tên động) --- */}
      <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
        <div className="w-12 h-12 relative flex-shrink-0">
          <img
            src={userData?.avatarUrl || "https://hinhcute.net/wp-content/uploads/2025/06/anh-26-meme-dang-yeu.jpg"} // ✅ Hiển thị ảnh từ API
            alt="Avatar"
            className="w-full h-full object-cover rounded-full border border-gray-100 shadow-sm"
            onError={(e) => {
              e.currentTarget.src = "https://hinhcute.net/wp-content/uploads/2025/06/anh-26-meme-dang-yeu.jpg";
            }}
          />
        </div>
        <div className="overflow-hidden">
          <div className="font-black text-gray-800 truncate text-[14px] mb-0.5 uppercase tracking-tighter">
            {userData?.fullName || "Khách hàng"} {/* ✅ Hiển thị tên từ API */}
          </div>
          <Link
            href="/edit-profile"
            onClick={handleLinkClick}
            className="text-[11px] font-bold text-gray-400 hover:text-[#329965] flex items-center transition-colors uppercase tracking-wider"
          >
            <Pencil size={10} className="mr-1" /> Sửa hồ sơ
          </Link>
        </div>
      </div>

      {/* --- MENU TÀI KHOẢN --- */}
      <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2 mt-4 px-1">
        Tài khoản
      </div>
      <nav className="flex flex-col">
        <Link href="/profile" onClick={handleLinkClick} className={itemClass("/profile")}>
          <User size={18} className="mr-2.5" /> Hồ sơ của tôi
        </Link>
        <Link href="/edit-profile" onClick={handleLinkClick} className={itemClass("/edit-profile")}>
          <Settings size={18} className="mr-2.5" /> Thiết lập tài khoản
        </Link>
        <Link href="/address" onClick={handleLinkClick} className={itemClass("/address")}>
          <MapPin size={18} className="mr-2.5" /> Sổ địa chỉ
        </Link>
      </nav>

      {/* --- MENU ĐƠN HÀNG --- */}
      <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2 mt-5 px-1">
        Đơn hàng
      </div>
      <nav className="flex flex-col">
        <Link href="/orders/list" onClick={handleLinkClick} className={itemClass("/orders/list")}>
          <ClipboardList size={18} className="mr-2.5" /> Đơn hàng của tôi
        </Link>
      </nav>

      {/* --- MENU TIỆN ÍCH --- */}
      <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2 mt-5 px-1">
        Tiện ích
      </div>
      <nav className="flex flex-col">
        <Link href="/ai-doctor/history" onClick={handleLinkClick} className={itemClass("/ai-doctor/history")}>
          <Bot size={18} className="mr-2.5" /> Chẩn đoán AI
        </Link>
        <Link href="/ponds" onClick={handleLinkClick} className={itemClass("/ponds")}>
          <Waves size={18} className="mr-2.5" /> Quản lý ao nuôi
        </Link>
        <Link href="/voucher" onClick={handleLinkClick} className={itemClass("/voucher")}>
          <Ticket size={18} className="mr-2.5" /> Kho Voucher
        </Link>

        {/* Đăng xuất */}
        <div className="border-t border-gray-100 mt-4 pt-4">
          <Link
            href="/logout"
            onClick={handleLinkClick}
            className="flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-bold text-rose-500 hover:bg-rose-50 uppercase tracking-tighter"
          >
            <LogOut size={18} className="mr-2.5" /> Đăng xuất
          </Link>
        </div>
      </nav>
    </div>
  );
}