"use client";

import { Bell, Search, User, CircleHelp } from "lucide-react";

export default function AdminTopHeader() {
  return (
    // sticky top-0 và bg-white/80 với backdrop-blur để trông hiện đại hơn
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white/95 backdrop-blur-sm px-8 border-b border-gray-100 shadow-sm">
      {/* Search Bar */}
      <div className="relative w-80">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-full bg-gray-100 border-none pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#139a7e]/20 outline-none transition text-gray-700"
          placeholder="Tìm kiếm..."
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
          <CircleHelp size={20} />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-800">Admin Agri</p>
            <p className="text-[10px] text-gray-400 font-medium">Quản trị viên</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
             <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}