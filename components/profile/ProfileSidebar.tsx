'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Pencil, 
  User, 
  Settings, 
  MapPin, 
  ClipboardList, 
  Bot, 
  Waves, 
  Ticket, 
  LogOut 
} from 'lucide-react';

export default function ProfileSidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  // Hàm kiểm tra active link đơn giản
  const isActive = (path: string) => pathname === path;

  // Class chung cho các item
  const itemClass = (path: string) => `
    flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-medium mb-1
    ${isActive(path) 
      ? 'bg-[#e6f4ea] text-[#329965]'  // Active: Nền xanh nhạt, chữ xanh lá
      : 'text-gray-600 hover:bg-gray-50 hover:text-[#329965]' // Bình thường
    }
  `;

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-20">
      
      {/* --- User Brief (Avatar + Tên) --- */}
      <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4">
        <div className="w-12 h-12 relative flex-shrink-0">
          <img 
            src="https://hinhcute.net/wp-content/uploads/2025/06/httpswww.didongmy.comvnt_uploadnews05_2024anh-26-meme-dang-yeu-didongmy.jpg" 
            alt="Avatar" 
            className="w-full h-full object-cover rounded-full border border-gray-200"
          />
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-gray-800 truncate text-sm mb-0.5">User</div>
          <Link href="/edit-profile" onClick={handleLinkClick} className="text-xs text-gray-500 hover:text-[#329965] flex items-center transition-colors">
            <Pencil size={10} className="mr-1" /> Sửa hồ sơ
          </Link>
        </div>
      </div>

      {/* --- MENU TÀI KHOẢN --- */}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Tài khoản</div>
      <nav className="flex flex-col">
        <Link href="/profile" onClick={handleLinkClick} className={itemClass('/profile')}>
          <User size={18} className="mr-2.5" /> Hồ sơ của tôi
        </Link>
        <Link href="/edit-profile" onClick={handleLinkClick} className={itemClass('/edit-profile')}>
          <Settings size={18} className="mr-2.5" /> Thiết lập tài khoản
        </Link>
        <Link href="/address" onClick={handleLinkClick} className={itemClass('/address')}>
          <MapPin size={18} className="mr-2.5" /> Sổ địa chỉ
        </Link>
      </nav>

      {/* --- MENU ĐƠN HÀNG --- */}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-5">Đơn hàng</div>
      <nav className="flex flex-col">
        <Link href="/orders/list" onClick={handleLinkClick} className={itemClass('/orders/list')}>
          <ClipboardList size={18} className="mr-2.5" /> Đơn hàng của tôi
        </Link>
      </nav>

      {/* --- MENU TIỆN ÍCH --- */}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-5">Tiện ích</div>
      <nav className="flex flex-col">
        <Link href="/ai-doctor/history" onClick={handleLinkClick} className={itemClass('/ai-doctor/history')}>
          <Bot size={18} className="mr-2.5" /> Lịch sử chẩn đoán AI
        </Link>
        <Link href="/ponds" onClick={handleLinkClick} className={itemClass('/ponds')}>
          <Waves size={18} className="mr-2.5" /> Quản lý ao nuôi
        </Link>
        <Link href="/voucher" onClick={handleLinkClick} className={itemClass('/voucher')}>
          <Ticket size={18} className="mr-2.5" /> Kho Voucher
        </Link>
        
        {/* Đăng xuất */}
        <div className="border-t border-gray-100 mt-3 pt-3">
          <Link href="/logout" onClick={handleLinkClick} className="flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut size={18} className="mr-2.5" /> Đăng xuất
          </Link>
        </div>
      </nav>

    </div>
  );
}