"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Mic,
  MicOff,
  Camera,
  Phone,
  MapPin,
  Bell,
} from "lucide-react";
import ImageSearchModal from "@/components/site/ImageSearchModal";
import { useRouter } from "next/navigation";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogout } from "@/hooks/use-logout";
import { useCartStore } from "@/stores/useCartStore";
import { SITE_CONFIG } from "@/lib/Constant";
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
  const { data: user, isAuthenticated, isLoading } = useCurrentUser();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const { transcript, listening, browserSupportsSpeechRecognition, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript) handleSearch(transcript);
  }, [transcript]);

  const handleVoiceSearch = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ language: "vi-VN", continuous: false });
    }
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    const trimmed = keyword.trim();
    if (!trimmed) { router.push("/"); return; }
    router.replace(`/san-pham?keyword=${encodeURIComponent(trimmed)}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch(searchKeyword);
  };

  const { itemCount, fetchCartCount } = useCartStore();
  const isLoggedIn = isAuthenticated && !!user;

  useEffect(() => {
    if (isLoggedIn) fetchCartCount();
  }, [isLoggedIn, fetchCartCount]);

  const getUserDisplayName = () =>
    user?.fullName || user?.displayName || user?.phoneNumber || user?.email || "Người dùng";

  const getUserRole = () =>
    (user as any)?.role === "ADMIN" ? "Quản trị viên" : "Khách hàng";

  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="hidden md:flex items-center gap-2 px-2 py-1 animate-pulse min-w-[130px]">
          <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-2 bg-gray-200 rounded w-full" />
            <div className="h-2 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return (
        <>
          <Link
            href="/login"
            className="hidden md:flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            <User size={20} className="text-gray-500 shrink-0" />
            <div className="leading-none">
              <p className="text-[11px] text-gray-400">Tài khoản</p>
              <p className="text-[13px] font-semibold text-gray-800 mt-0.5">Đăng nhập</p>
            </div>
          </Link>
          <Link
            href="/login"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 transition-colors text-gray-600"
          >
            <User size={19} />
          </Link>
        </>
      );
    }

    return (
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors outline-none cursor-pointer">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.avatar?.imageUrl ?? ""} alt={getUserDisplayName()} className="object-cover" />
              <AvatarFallback className="bg-primary text-white text-sm font-bold">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start leading-none">
              <span className="text-[13px] font-semibold text-gray-800 truncate max-w-[110px]">
                {getUserDisplayName()}
              </span>
              <span className="text-[11px] text-gray-400 mt-0.5">{getUserRole()}</span>
            </div>
            <ChevronDown
              size={14}
              className={`hidden md:block text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="mt-2 w-60 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl z-[100]"
        >
          <DropdownMenuLabel className="px-3 py-2.5 font-normal border-b border-gray-100 mb-1">
            <p className="text-sm font-bold text-gray-900">{getUserDisplayName()}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email || user?.phoneNumber}</p>
          </DropdownMenuLabel>
          <DropdownMenuItem asChild className="p-0 rounded-lg">
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={15} className="text-gray-500" />
              <span className="text-sm text-gray-700">Hồ sơ cá nhân</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="p-0 rounded-lg">
            <Link href="/orders/list" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
              <ShoppingCart size={15} className="text-gray-500" />
              <span className="text-sm text-gray-700">Đơn hàng của tôi</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-100 my-1" />
          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut size={15} />
            <span className="text-sm">{isLoggingOut ? "Đang xử lý..." : "Đăng xuất"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">

          {/* ── Main row: [Logo] [Search flex-1] [Right section] ── */}
          <div className="flex items-center h-[68px] gap-4">

            {/* 1. Logo — to, nổi bật */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="relative w-12 h-12 overflow-hidden rounded-full shrink-0 shadow-sm ring-2 ring-primary/20">
                <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
              </div>
              <div className="hidden sm:block leading-[1.15]">
                <p className="text-[20px] font-black tracking-tight text-gray-900">
                  AGRI<span className="text-primary">SHRIMP</span>
                </p>
                <p className="text-[10px] tracking-[0.22em] text-primary/60 font-semibold">& STORE</p>
              </div>
            </Link>

            {/* 2. Search — tiếng Việt, nút xanh lá */}
            <div className="hidden md:flex flex-1 max-w-sm">
              <div className="w-full flex items-center h-10 border-2 border-gray-200 rounded-full bg-white focus-within:border-primary transition-colors overflow-hidden">
                <input
                  type="text"
                  placeholder={listening ? "Đang nghe..." : "Bạn cần tìm gì?"}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-full pl-4 pr-1 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                />
                {browserSupportsSpeechRecognition && (
                  <button type="button" onClick={handleVoiceSearch}
                    className={`h-full w-8 flex items-center justify-center shrink-0 transition-colors ${listening ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-primary"}`}>
                    {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}
                <button type="button" onClick={() => setIsImageSearchOpen(true)}
                  className="h-full w-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors shrink-0">
                  <Camera size={14} />
                </button>
                <button type="button" aria-label="Tìm kiếm" onClick={() => handleSearch(searchKeyword)}
                  className="h-full px-5 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-r-full transition-colors shrink-0">
                  <Search size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* 3. Right section — cố định bên phải */}
            <div className="flex items-center gap-0 ml-auto shrink-0">

              {/* Delivery address */}
              <div className="hidden lg:flex items-center gap-2 px-4 border-l border-gray-200">
                <MapPin size={15} className="text-primary shrink-0" />
                <div className="leading-[1.2]">
                  <p className="text-[10px] text-gray-400">Địa chỉ giao hàng</p>
                  <p className="text-[12px] font-semibold text-gray-700 whitespace-nowrap max-w-[140px] truncate">
                    {SITE_CONFIG.address}
                  </p>
                </div>
              </div>

              {/* Cart */}
              <div className="pl-3 pr-1">
                <Link href="/user/cart" id="cart-icon-target"
                  className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-primary">
                  <ShoppingCart size={21} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] h-[17px] min-w-[17px] px-1 flex items-center justify-center rounded-full border-2 border-white font-bold">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Hotline pill */}
              <div className="hidden xl:flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-3 py-1.5 cursor-pointer mx-2 shrink-0">
                <div className="w-6 h-6 bg-primary/15 rounded-full flex items-center justify-center shrink-0">
                  <Phone size={13} className="text-primary" />
                </div>
                <div className="leading-[1.2]">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Hotline</p>
                  <p className="text-[12px] font-bold text-gray-800">{SITE_CONFIG.phone}</p>
                </div>
              </div>

              {/* Bell */}
              <button type="button" aria-label="Thông báo"
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors text-gray-500 relative">
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </button>

              {/* Divider */}
              <div className="h-7 w-px bg-gray-200 mx-2 hidden md:block" />

              {/* Mobile: search toggle */}
              <button type="button" aria-label="Tìm kiếm" onClick={() => setShowMobileSearch((v) => !v)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
                <Search size={19} />
              </button>

              {/* Auth */}
              {renderAuthSection()}
            </div>
          </div>

          {/* Mobile search bar */}
          {showMobileSearch && (
            <div className="md:hidden pb-2">
              <div className="flex items-center h-9 border border-gray-300 rounded-full bg-white focus-within:border-primary/60 transition-colors overflow-hidden pl-1">
                <input
                  type="text"
                  placeholder={listening ? "Đang nghe..." : "Tìm sản phẩm..."}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchKeyword.trim()) {
                      handleSearch(searchKeyword);
                      setShowMobileSearch(false);
                    }
                  }}
                  autoFocus
                  className="flex-1 h-full px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  aria-label="Tìm kiếm"
                  onClick={() => { handleSearch(searchKeyword); setShowMobileSearch(false); }}
                  className="h-full px-4 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-r-full transition-colors"
                >
                  <Search size={15} />
                </button>
              </div>
            </div>
          )}

        </div>
      </header>

      {isImageSearchOpen && <ImageSearchModal onClose={() => setIsImageSearchOpen(false)} />}
    </>
  );
}
