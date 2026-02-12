'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, User, Bot, LogIn, Store, UserPlus } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-brand-gradient text-white py-2 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4">
        
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-[42px] h-[42px] bg-white rounded-full p-0.5 shadow-md overflow-hidden relative">
               <Image 
                 src="/images/logo_arishrimp.jpg" 
                 alt="AgriShrimp Logo" 
                 fill
                 className="object-cover rounded-full"
               />
            </div>
            <div className="flex flex-col leading-none">
              <div className="text-xl tracking-wide">
                <span className="font-semibold">Agri</span><span className="font-extrabold">Shrimp</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest opacity-85 font-light">Smart Aqua Solution</span>
            </div>
          </Link>
          <div className="hidden md:flex flex-1 max-w-2xl items-center gap-3 px-4 lg:px-8">
            
            <div className="flex-1 bg-glass rounded-full p-[3px] flex items-center">
              <div className="flex-1 relative h-[34px]">
                <input 
                  type="text" 
                  placeholder="Tìm sản phẩm, bệnh..." 
                  className="w-full h-full pl-4 pr-4 rounded-l-full bg-white text-gray-800 text-sm focus:outline-none border-none"
                />
              </div>
              <button className="h-[34px] px-5 bg-secondary hover:bg-orange-600 rounded-r-full text-white transition-colors flex items-center justify-center">
                <Search size={16} strokeWidth={3} />
              </button>
            </div>

            <Link href="/ai-doctor" className="hidden xl:flex items-center bg-gradient-to-br from-yellow-100 to-yellow-300 text-amber-900 pr-4 pl-1 py-1 rounded-full border-2 border-white/20 shadow-md hover:-translate-y-0.5 transition-transform group">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm mr-2 relative">
                <Bot size={20} className="relative z-10" />
                <span className="absolute inset-0 rounded-full bg-amber-400 opacity-20 animate-ping"></span>
              </div>
              <span className="font-extrabold text-sm whitespace-nowrap">Bác sĩ AI</span>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 text-[13px] font-semibold">

            <Link href="/store" className="hidden lg:flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]">
              <Store size={22} className="mb-0.5" />
              <span>Cửa hàng</span>
            </Link>

            <div className="hidden lg:flex items-center mx-1">
                <Link href="/signup" className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]">
                    <UserPlus size={22} className="mb-0.5" />
                    <span>Đăng ký</span>
                </Link>
                
                <div className="h-6 w-[1px] bg-white/30 mx-1"></div>

                <Link href="/login" className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]">
                    <LogIn size={22} className="mb-0.5" />
                    <span>Đăng nhập</span>
                </Link>
            </div>
            <Link href="/profile" className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]">
              <User size={22} className="mb-0.5" />
              <span className="hidden xl:inline">Tài khoản</span>
            </Link>

            <Link href="/user/cart" className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors relative min-w-[60px]">
              <div className="relative">
                <ShoppingCart size={22} className="mb-0.5" />
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border border-white font-bold shadow-sm">2</span>
              </div>
              <span className="hidden xl:inline">Giỏ hàng</span>
            </Link>

            <button className="md:hidden p-2">
                <Search size={24} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}