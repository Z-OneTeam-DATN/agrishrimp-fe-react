"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Bot,
  LogIn,
  Store,
  UserPlus,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogout } from "@/hooks/use-logout";
import { useCartStore } from "@/stores/useCartStore"; // ✅ IMPORT STORE GIỎ HÀNG
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { data: user, isAuthenticated, isLoading } = useCurrentUser();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    const trimmedKeyword = keyword.trim();
    
    if (!trimmedKeyword) {
      // Nếu xóa hết chữ, quay về trang chủ
      router.push("/");
      return;
    }

    const params = new URLSearchParams();
    params.set("keyword", trimmedKeyword);
    
    // Sử dụng replace để tránh làm đầy lịch sử trình duyệt khi gõ nhanh
    router.replace(`/san-pham?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchKeyword.trim()) {
        router.push(`/san-pham?keyword=${encodeURIComponent(searchKeyword.trim())}`);
      }
    }
  };

  // ✅ LẤY STATE SỐ LƯỢNG GIỎ HÀNG
  const { itemCount, fetchCartCount } = useCartStore();

  const isLoggedIn = isAuthenticated && !!user;

  // ✅ TỰ ĐỘNG FETCH GIỎ HÀNG KHI ĐĂNG NHẬP THÀNH CÔNG
  useEffect(() => {
    if (isLoggedIn) {
      fetchCartCount();
    }
  }, [isLoggedIn, fetchCartCount]);

  // Helper function to pick the best display name
  const getUserDisplayName = () => {
    if (!user) return "";
    return (
      user.fullName || user.displayName || user.phoneNumber || user.email || "Người dùng"
    );
  };

  // Prevent UI Flicker by not rendering the auth section until hydration completes
  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 min-w-[100px] justify-end animate-pulse">
          <div className="w-8 h-8 rounded-full bg-white/20" />
          <div className="hidden xl:flex flex-col gap-1.5 w-16">
            <div className="h-2 bg-white/20 rounded-full w-full" />
            <div className="h-2 bg-white/20 rounded-full w-2/3" />
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return (
        <div className="hidden lg:flex items-center mx-1">
          <Link
            href="/signup"
            className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]"
          >
            <UserPlus size={22} className="mb-0.5" />
            <span>Đăng ký</span>
          </Link>

          <div className="h-6 w-[1px] bg-white/30 mx-1"></div>

          <Link
            href="/login"
            className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]"
          >
            <LogIn size={22} className="mb-0.5" />
            <span>Đăng nhập</span>
          </Link>
        </div>
      );
    }

    return (
      <div
        className="relative flex items-center"
        onMouseEnter={() => setIsDropdownOpen(true)}
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors outline-none">
              <Avatar className="h-8 w-8 border-2 border-white/20 shadow-sm">
                <AvatarImage
                  src={user?.avatar?.imageUrl ?? ""}
                  alt={user?.displayName ?? "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-brand-primary text-white font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:flex flex-col items-start leading-none gap-1">
                <span className="text-[10px] opacity-80 font-medium">
                  Xin chào,
                </span>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[110px] font-bold">
                    {getUserDisplayName()}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 mt-2 p-1.5 bg-white dark:bg-slate-900 border-none shadow-2xl rounded-xl z-[100]"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <DropdownMenuLabel className="p-3 font-normal border-b border-gray-100 dark:border-gray-800 mb-1">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-bold leading-none text-gray-900 dark:text-white">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs leading-none text-gray-500 truncate italic">
                  {user?.email || user?.phoneNumber}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="p-0">
              <Link
                href="/profile"
                className="flex items-center w-full px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                  <User size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Hồ sơ cá nhân
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="p-0">
              <Link
                href="/orders"
                className="flex items-center w-full px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mr-3 group-hover:bg-orange-100 transition-colors">
                  <ShoppingCart
                    size={16}
                    className="text-orange-600 dark:text-orange-400"
                  />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Đơn hàng của tôi
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1" />
            <DropdownMenuItem
              className="flex items-center px-3 py-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-all group focus:bg-red-50 disabled:opacity-50"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
                <LogOut size={16} className="text-red-600" />
              </div>
              <span className="font-bold">
                {isLoggingOut ? "Đang xử lý..." : "Đăng xuất"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <header className="bg-brand-gradient text-white py-2 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-2 md:gap-4">
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
                <span className="font-semibold">Agri</span>
                <span className="font-extrabold">Shrimp</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest opacity-85 font-light">
                Smart Aqua Solution
              </span>
            </div>
          </Link>
          <div className="hidden md:flex flex-1 max-w-2xl items-center gap-3 px-4 lg:px-8">
            <div className="flex-1 bg-glass rounded-full p-[3px] flex items-center">
              <div className="flex-1 relative h-[34px]">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm, bệnh..."
                  value={searchKeyword}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full pl-4 pr-4 rounded-l-full bg-white text-gray-800 text-sm focus:outline-none border-none"
                  suppressHydrationWarning={true}
                />
              </div>
              <button
                onClick={() => {
                  if (searchKeyword.trim()) {
                    router.push(`/san-pham?keyword=${encodeURIComponent(searchKeyword.trim())}`);
                  }
                }}
                className="h-[34px] px-5 bg-secondary hover:bg-orange-600 rounded-r-full text-white transition-colors flex items-center justify-center"
                suppressHydrationWarning={true}
              >
                <Search size={16} strokeWidth={3} />
              </button>
            </div>

            <Link
              href="/ai-doctor"
              className="hidden xl:flex items-center bg-gradient-to-br from-yellow-100 to-yellow-300 text-amber-900 pr-4 pl-1 py-1 rounded-full border-2 border-white/20 shadow-md hover:-translate-y-0.5 transition-transform group"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-500 shadow-sm mr-2 relative">
                <Bot size={20} className="relative z-10" />
                <span className="absolute inset-0 rounded-full bg-amber-400 opacity-20 animate-ping"></span>
              </div>
              <span className="font-extrabold text-sm whitespace-nowrap">
                Bác sĩ AI
              </span>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-2 text-[13px] font-semibold">
            <Link
              href="/account"
              className="hidden lg:flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-colors min-w-[60px]"
            >
              <Store size={22} className="mb-0.5" />
              <span>Cửa hàng</span>
            </Link>

            <Link
                href="/user/cart"
                id="cart-icon-target" // ✅ THÊM ID NÀY ĐỂ LÀM ĐÍCH ĐẾN
                className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-white/10 transition-all duration-300 relative min-w-[60px]" // Thêm transition-all duration-300
              >
                <div className="relative">
                  <ShoppingCart size={22} className="mb-0.5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[10px] h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border border-white font-bold shadow-sm animate-in zoom-in">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:inline">Giỏ hàng</span>
              </Link>

            {renderAuthSection()}

            <button className="md:hidden p-2" suppressHydrationWarning={true}>
              <Search size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}