"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronRight,
  Loader2,
  Mic,
  MicOff,
  Search,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Menu,
  NotebookPen,
  PackageSearch,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogout } from "@/hooks/use-logout";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { ADMIN_WORKSPACE_PERMISSIONS } from "@/lib/workspace-permissions";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/useCartStore";
import { getPublicCategories } from "@/app/services/CategoryService";
import { PublicProductService } from "@/app/services/publicProduct.service";
import { CategoryDTO } from "@/app/types/category.type";
import { PublicProductListItem } from "@/app/types/product.schema";
import NotificationBell from "@/components/site/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ImageSearchModal = dynamic(() => import("@/components/site/ImageSearchModal"), {
  ssr: false,
});

type BrowserSpeechRecognitionResultLike = ArrayLike<{ transcript?: string }>;

type BrowserSpeechRecognitionEventLike = {
  results: ArrayLike<BrowserSpeechRecognitionResultLike>;
};

interface BrowserSpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Trang chủ" },
  { href: "/user/cart", label: "Giỏ hàng" },
  { href: "/blog", label: "Bài viết" },
];

const getFullImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8004";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatProductPrice = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const getSuggestionImage = (product: PublicProductListItem) =>
  product.imageUrls?.[0] ||
  (product.variants?.find((variant) => variant.imageUrl)?.imageUrl || "").split(",")[0]?.trim() ||
  "/placeholder.svg";

const getSuggestionPrice = (product: PublicProductListItem) =>
  product.variants?.find((variant) => (variant.price ?? 0) > 0)?.price ?? null;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function Header() {
  const router = useRouter();
  const { data: user, isAuthenticated, isLoading } = useCurrentUser();
  const { logout, isLoading: isLoggingOut } = useLogout();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const isAgronomist = hasPermission(P.AGRONOMIST_WORKSPACE_USE);
  const canAccessAdmin = hasAnyPermission(ADMIN_WORKSPACE_PERMISSIONS as unknown as string[]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileCategories, setMobileCategories] = useState<CategoryDTO[]>([]);
  const [mobileCategoriesLoaded, setMobileCategoriesLoaded] = useState(false);
  const [isLoadingMobileCategories, setIsLoadingMobileCategories] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<PublicProductListItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const speechRecognitionRef = useRef<BrowserSpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const normalizedSearchKeyword = searchKeyword.trim();

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    const trimmed = keyword.trim();
    setIsSuggestionsOpen(false);
    startTransition(() => {
      if (!trimmed) {
        router.push("/", { scroll: false });
        return;
      }

      router.push(`/san-pham?keyword=${encodeURIComponent(trimmed)}`, {
        scroll: false,
      });
    });
  }, [router]);

  useEffect(() => {
    if (normalizedSearchKeyword.length < 2) {
      setSuggestedProducts([]);
      setIsLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);
    const timeoutId = globalThis.setTimeout(async () => {
      try {
        const response = await PublicProductService.getList({
          keyword: normalizedSearchKeyword,
          page: 0,
          size: 5,
        });

        if (!cancelled) {
          setSuggestedProducts(response.content ?? []);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 260);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [normalizedSearchKeyword]);

  const handleSearchInputChange = (value: string) => {
    setSearchKeyword(value);
    setIsSuggestionsOpen(true);
  };

  const handleSelectSuggestion = (product: PublicProductListItem) => {
    setSearchKeyword(product.name);
    setIsSuggestionsOpen(false);
    router.push(`/san-pham/${product.slug}`);
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setSuggestedProducts([]);
    setIsSuggestionsOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setIsSpeechSupported(
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    );

    return () => {
      speechRecognitionRef.current?.abort();
      speechRecognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const routes = [
      "/san-pham",
      "/blog",
      "/user/cart",
      "/login",
      "/orders/list",
    ];
    const prefetchRoutes = () => {
      routes.forEach((route) => router.prefetch(route));
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(prefetchRoutes, 600);
    return () => globalThis.clearTimeout(timeoutId);
  }, [router]);

  const handleVoiceSearch = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      return;
    }

    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const recognition =
      speechRecognitionRef.current ?? new SpeechRecognitionConstructor();

    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript?.trim() ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        setSearchKeyword(transcript);
        handleSearch(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [handleSearch, isListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch(searchKeyword);
    if (e.key === "Escape") setIsSuggestionsOpen(false);
  };

  const renderHighlightedText = (text: string) => {
    if (!normalizedSearchKeyword) return text;

    const parts = text.split(new RegExp(`(${escapeRegExp(normalizedSearchKeyword)})`, "ig"));
    return parts.map((part, index) =>
      part.toLocaleLowerCase("vi-VN") === normalizedSearchKeyword.toLocaleLowerCase("vi-VN") ? (
        <mark key={`${part}-${index}`} className="bg-transparent font-extrabold text-[rgb(25,101,162)]">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    );
  };

  const renderSuggestionsDropdown = () => {
    const shouldShow =
      isSuggestionsOpen &&
      normalizedSearchKeyword.length >= 2;

    if (!shouldShow) return null;

    return (
      <div className="absolute left-0 right-0 top-full z-[120] mt-2 border border-slate-200 bg-white text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
        <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Sản phẩm
        </div>

        {isLoadingSuggestions ? (
          <div className="flex items-center gap-3 px-4 py-5 text-sm font-medium text-slate-500">
            <Loader2 size={18} className="animate-spin text-[rgb(25,101,162)]" />
            Đang tìm sản phẩm...
          </div>
        ) : suggestedProducts.length === 0 ? (
          <div className="px-4 py-5 text-sm font-medium text-slate-500">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        ) : (
          <div className="py-2">
            {suggestedProducts.map((product) => {
              const imageUrl = getFullImageUrl(getSuggestionImage(product));
              const price = getSuggestionPrice(product);

              return (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectSuggestion(product)}
                  className="grid w-full grid-cols-[52px_minmax(0,1fr)] gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden bg-slate-50">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-full w-full object-contain"
                      onError={(event) => {
                        (event.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[14px] font-bold leading-5 text-slate-950">
                      {renderHighlightedText(product.name)}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-slate-500">
                      {product.brandName && <span>{product.brandName}</span>}
                      {product.brandName && product.categoryName && <span>•</span>}
                      {product.categoryName && <span>{product.categoryName}</span>}
                    </span>
                    <span className="mt-1 block text-[13px] font-extrabold text-[rgb(25,101,162)]">
                      {formatProductPrice(price)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => handleSearch(normalizedSearchKeyword)}
          className="flex w-full items-center justify-center border-t border-slate-100 px-4 py-3 text-center text-sm font-bold text-[rgb(25,101,162)] transition-colors hover:bg-slate-50"
        >
          Xem tất cả kết quả cho "{normalizedSearchKeyword}"
        </button>
      </div>
    );
  };

  const renderSearchBox = (variant: "mobile" | "desktop") => {
    const isMobile = variant === "mobile";
    const inputClassName = isMobile
      ? "h-10 flex-1 bg-white px-4 text-[13px] text-gray-800 outline-none placeholder:text-gray-400"
      : "h-11 flex-1 bg-white px-4 text-[15px] text-gray-800 outline-none placeholder:text-gray-400";
    const iconButtonClassName = isMobile
      ? "flex h-8 w-8 items-center justify-center rounded-full transition-colors"
      : "flex h-11 w-10 items-center justify-center transition-colors";

    return (
      <div
        className="relative"
        onFocus={() => {
          if (normalizedSearchKeyword.length >= 2) setIsSuggestionsOpen(true);
        }}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            setIsSuggestionsOpen(false);
          }
        }}
      >
        <div
          className={cn(
            "flex items-center overflow-hidden bg-white",
            isMobile
              ? "rounded-[20px] border border-[#cbd8ec] shadow-[0_8px_20px_rgba(18,44,87,0.14)]"
              : "rounded-lg"
          )}
        >
          <input
            type="text"
            placeholder={isListening ? "Đang nghe..." : "Tìm kiếm sản phẩm..."}
            value={searchKeyword}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={inputClassName}
          />
          {searchKeyword ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className={cn(
                iconButtonClassName,
                "text-gray-400 hover:text-[rgb(25,101,162)]"
              )}
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={isMobile ? 15 : 16} />
            </button>
          ) : null}
          {isSpeechSupported ? (
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={cn(
                iconButtonClassName,
                isListening
                  ? "text-red-500 animate-pulse"
                  : "text-gray-400 hover:text-[rgb(25,101,162)]"
              )}
            >
              {isListening ? <MicOff size={isMobile ? 16 : 15} /> : <Mic size={isMobile ? 16 : 15} />}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated || !user) {
                toast.error("Vui lòng đăng nhập để dùng tính năng tìm kiếm bằng hình ảnh!");
                setTimeout(() => router.push("/login"), 1500);
                return;
              }
              setIsImageSearchOpen(true);
            }}
            className={cn(
              iconButtonClassName,
              "text-gray-400 hover:text-[rgb(25,101,162)]"
            )}
          >
            <Camera size={isMobile ? 16 : 15} />
          </button>
          <button
            type="button"
            aria-label="Tìm kiếm"
            onClick={() => handleSearch(searchKeyword)}
            className={
              isMobile
                ? "mr-2 flex h-8 w-8 items-center justify-center rounded-full text-[rgb(25,101,162)]"
                : "mx-1 flex h-10 w-16 items-center justify-center rounded-lg bg-[rgb(25,101,162)] text-white transition-colors hover:bg-[rgb(21,88,141)] shadow-[0_6px_16px_rgba(25,101,162,0.28)]"
            }
          >
            <Search size={isMobile ? 19 : 20} strokeWidth={isMobile ? 2.4 : 2.5} />
          </button>
        </div>

        {renderSuggestionsDropdown()}
      </div>
    );
  };

  const { itemCount, fetchCartCount } = useCartStore();
  const isLoggedIn = isAuthenticated && !!user;

  useEffect(() => {
    if (isLoading) return;
    void fetchCartCount();
  }, [fetchCartCount, isLoading, isLoggedIn]);

  useEffect(() => {
    if (!isMobileMenuOpen || mobileCategoriesLoaded) return;

    let cancelled = false;

    const loadCategories = async () => {
      setIsLoadingMobileCategories(true);
      try {
        const categories = await getPublicCategories();
        if (!cancelled) {
          setMobileCategories(categories);
          setMobileCategoriesLoaded(true);
        }
      } finally {
        if (!cancelled) setIsLoadingMobileCategories(false);
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [isMobileMenuOpen, mobileCategoriesLoaded]);

  const getUserDisplayName = () =>
    user?.fullName || user?.displayName || user?.phoneNumber || user?.email || "Người dùng";

  const parentMobileCategories = mobileCategories.filter((c) => !c.parentId || c.parentId === 0);
  const getMobileChildren = (parentId: number) =>
    mobileCategories.filter((c) => c.parentId === parentId && c.parentId !== 0);

  const renderAuthSection = () => {
    if (isLoading) {
      return (
        <div className="flex h-11 min-w-[148px] items-center gap-2.5 px-2.5 animate-pulse xl:min-w-[164px]">
          <div className="h-8 w-8 rounded-full bg-white/20 shrink-0 xl:h-9 xl:w-9" />
          <div className="flex flex-1 flex-col gap-1.5 text-left">
            <div className="h-2 bg-white/20 rounded w-full" />
            <div className="h-2 bg-white/20 rounded w-2/3" />
          </div>
        </div>
      );
    }

    if (!isLoggedIn) {
      return (
        <Link
          href="/login"
          className="flex h-11 min-w-[148px] items-center gap-2.5 rounded-xl px-2.5 text-white transition-colors hover:bg-white/10 xl:min-w-[164px]"
        >
          <User size={16} className="shrink-0 text-white xl:h-[17px] xl:w-[17px]" />
          <div className="min-w-0 flex-1 text-left leading-tight">
            <p className="truncate text-[8px] text-white/70 xl:text-[9px]">Đăng nhập / Đăng ký</p>
            <p className="mt-0.5 truncate text-[10px] font-semibold text-white xl:text-[11px]">Tài khoản của tôi</p>
          </div>
        </Link>
      );
    }

    return (
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex h-11 min-w-[148px] items-center gap-2.5 rounded-xl px-2.5 text-left outline-none transition-colors hover:bg-white/10 xl:min-w-[164px]">
            <Avatar className="h-8 w-8 shrink-0 xl:h-8 xl:w-8">
              <AvatarImage src={getFullImageUrl(user?.avatar?.imageUrl || (user as any)?.avatarUrl) ?? ""} alt={getUserDisplayName()} className="object-cover" />
              <AvatarFallback className="bg-white text-[#4b78b8] text-sm font-bold">
                {getUserDisplayName().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-[8px] text-white/70 xl:text-[9px]">
                Tài khoản
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold text-white xl:text-[11px]">
                {getUserDisplayName()}
              </span>
            </div>
            <ChevronDown
              size={13}
              className={`h-3 w-3 shrink-0 text-white/70 transition-transform duration-200 xl:h-[13px] xl:w-[13px] ${isDropdownOpen ? "rotate-180" : ""}`}
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
            <Link href="/orders/list" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
              <User size={15} className="text-gray-500" />
              <span className="text-sm text-gray-700">Tài khoản của tôi</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="p-0 rounded-lg">
            <Link href="/orders/list" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
              <ShoppingCart size={15} className="text-gray-500" />
              <span className="text-sm text-gray-700">Đơn hàng của tôi</span>
            </Link>
          </DropdownMenuItem>
          {isAgronomist && (
            <DropdownMenuItem asChild className="p-0 rounded-lg">
              <Link href="/agronomist/diseases" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                <NotebookPen size={15} className="text-gray-500" />
                <span className="text-sm text-gray-700">Quản lý phác đồ</span>
              </Link>
            </DropdownMenuItem>
          )}
          {canAccessAdmin && (
            <DropdownMenuItem asChild className="p-0 rounded-lg">
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer">
                <ShieldCheck size={15} className="text-gray-500" />
                <span className="text-sm text-gray-700">Quay lại quản trị</span>
              </Link>
            </DropdownMenuItem>
          )}
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
      <header
        data-mobile-site-header
        className="shadow-[0_14px_34px_rgba(19,60,102,0.22)]"
      >
        <div className="md:hidden bg-[rgb(25,101,162)] text-white">
          <div className="flex min-h-10 items-center justify-between px-3">
            <ArrowLeft size={18} className="text-white/90" />
            <Link
              href="/orders/list"
              className="flex items-center gap-2 text-center text-[11px] font-semibold text-white/95"
            >
              <PackageSearch size={13} className="text-[#f6c453]" />
              <span>Tra cứu đơn hàng để theo dõi đơn hàng hiện tại</span>
            </Link>
            <ArrowRight size={18} className="text-white/90" />
          </div>
        </div>

        <div className="md:hidden bg-[linear-gradient(180deg,rgb(28,117,188)_0%,rgb(25,101,162)_100%)] text-white">
          <div className="px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Mở menu"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileMenuOpen(true);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                >
                  <Menu size={28} strokeWidth={2.2} />
                </button>

                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetContent
                    side="left"
                    className="w-full max-w-none border-r-0 bg-white p-0 [&>button]:hidden"
                  >
                    <SheetTitle className="sr-only">Menu dieu huong tren di dong</SheetTitle>
                    <div className="flex min-h-24 items-center justify-between bg-[linear-gradient(180deg,rgb(28,117,188)_0%,rgb(25,101,162)_100%)] px-4 py-3 text-white">
                      <SheetClose asChild>
                        <button
                          type="button"
                          aria-label="Đóng menu"
                          className="flex h-10 w-10 items-center justify-center"
                        >
                          <span className="text-[38px] font-light leading-none">×</span>
                        </button>
                      </SheetClose>

                      <Link href="/" className="flex items-center gap-2.5 self-center" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-white/95 shadow-sm shrink-0">
                          <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
                        </div>
                        <div className="leading-[1.04] pt-0.5">
                          <p className="text-[17px] font-black tracking-tight text-white">
                            AGRI<span className="text-[#e7f1ff]">SHRIMP</span>
                          </p>
                          <p className="text-[7px] tracking-[0.18em] text-white/75 font-semibold">HIỆU QUẢ & THÂN THIỆN</p>
                        </div>
                      </Link>

                      <div className="flex items-center gap-3">
                        <Link
                          href="/orders/list"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex h-9 w-9 items-center justify-center"
                        >
                          {isLoggedIn ? (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage
                                src={user?.avatar?.imageUrl ?? ""}
                                alt={getUserDisplayName()}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-white text-[#4b78b8] text-sm font-bold">
                                {getUserDisplayName().charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <User size={21} className="text-white/95" />
                          )}
                        </Link>
                        <Link
                          href="/user/cart"
                          className="relative flex h-9 w-9 items-center justify-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <ShoppingCart size={21} className="text-white/95" />
                          {itemCount > 0 && (
                            <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold leading-none text-white">
                              {itemCount > 99 ? "99+" : itemCount}
                            </span>
                          )}
                        </Link>
                      </div>
                    </div>

                    <div className="px-4 pb-8 pt-1">
                      <div className="border-t border-gray-200" />

                      <div className="divide-y divide-gray-200">
                        {MOBILE_NAV_ITEMS.slice(0, 3).map((item) => (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className="flex min-h-16 items-center justify-between py-2 text-[16px] font-bold uppercase text-[#171717]"
                            >
                              <span>{item.label}</span>
                            </Link>
                          </SheetClose>
                        ))}

                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="mobile-categories" className="border-b-0">
                            <AccordionTrigger className="min-h-16 py-2 text-[16px] font-bold uppercase text-[#171717] hover:no-underline">
                              Danh mục
                            </AccordionTrigger>
                            <AccordionContent className="pb-4">
                              {isLoadingMobileCategories ? (
                                <p className="py-2 text-sm text-gray-500">Đang tải danh mục...</p>
                              ) : (
                                <div className="divide-y divide-gray-200 border-t border-gray-200">
                                  {parentMobileCategories.map((category) => {
                                    const children = getMobileChildren(category.id);
                                    return (
                                      <div key={category.id} className="py-3">
                                        <SheetClose asChild>
                                          <Link
                                            href={`/san-pham?categoryId=${category.id}`}
                                            className="flex items-center justify-between text-[14px] font-semibold text-gray-900"
                                          >
                                            <span>{category.name}</span>
                                            <ChevronRight size={16} className="text-gray-400" />
                                          </Link>
                                        </SheetClose>
                                        {children.length > 0 && (
                                          <div className="mt-3 space-y-2 pl-3">
                                            {children.map((child) => (
                                              <SheetClose asChild key={child.id}>
                                                <Link
                                                  href={`/san-pham?categoryId=${child.id}`}
                                                  className="block text-[13px] font-medium text-gray-600 transition-colors hover:text-[rgb(25,101,162)]"
                                                >
                                                  {child.name}
                                                </Link>
                                              </SheetClose>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {MOBILE_NAV_ITEMS.slice(3).map((item) => (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className="flex min-h-16 items-center justify-between py-2 text-[16px] font-bold uppercase text-[#171717]"
                            >
                              <span>{item.label}</span>
                              <ChevronRight size={20} className="text-gray-400" />
                            </Link>
                          </SheetClose>
                        ))}
                      </div>

                      <div className="mt-8 space-y-5 px-1">
                        <p className="text-[15px] font-bold uppercase text-[#171717]">Bạn cần hỗ trợ?</p>
                        <div className="flex items-center gap-4 text-[#171717]">
                          <Truck size={24} className="shrink-0" />
                          <span className="text-[14px] font-semibold">0855 678 679</span>
                        </div>
                        <div className="flex items-center gap-4 text-[#171717]">
                          <PackageSearch size={24} className="shrink-0" />
                          <span className="text-[14px] font-semibold">support@agrishrimp.vn</span>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Link href="/" className="flex items-center gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white/95 shadow-sm shrink-0">
                    <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
                  </div>
                  <div className="leading-[1.02]">
                    <p className="text-[17px] font-black tracking-tight text-white">
                      AGRI<span className="text-[#e7f1ff]">SHRIMP</span>
                    </p>
                    <p className="text-[7px] tracking-[0.18em] text-white/75 font-semibold">HIỆU QUẢ & THÂN THIỆN</p>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/orders/list"
                  className="flex h-9 w-9 items-center justify-center"
                >
                  {isLoggedIn ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={user?.avatar?.imageUrl ?? ""}
                        alt={getUserDisplayName()}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-white text-[#4b78b8] text-sm font-bold">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User size={21} className="text-white/95" />
                  )}
                </Link>
                <Link
                  href="/user/cart"
                  className="relative flex h-9 w-9 items-center justify-center"
                >
                  <ShoppingCart size={21} className="text-white/95" />
                  {itemCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold leading-none text-white">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div className="pt-3">
              {renderSearchBox("mobile")}
            </div>
          </div>
        </div>

        <div className="bg-[rgb(25,101,162)] text-white">
          <div className="mx-auto hidden w-full max-w-[1460px] px-8 lg:px-12 xl:px-16 md:block">
            <Link
              href="/orders/list"
              className="flex min-h-9 items-center justify-center gap-2 text-center text-[12px] font-semibold tracking-wide text-white/95"
            >
              <PackageSearch size={14} className="text-[#f6c453]" />
              <span>Tra cứu đơn hàng để theo dõi đơn hàng hiện tại</span>
            </Link>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,rgb(28,117,188)_0%,rgb(25,101,162)_100%)] text-white">
          <div className="mx-auto hidden w-full max-w-[1460px] px-8 lg:px-12 xl:px-16 py-4 md:block">
            <div className="grid items-start gap-3 xl:gap-4 lg:grid-cols-[220px_minmax(0,1fr)_340px] xl:grid-cols-[248px_minmax(0,1fr)_380px]">
              <Link href="/" className="flex items-center gap-2.5 shrink-0 min-h-11">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/95 shadow-sm shrink-0">
                  <Image src="/images/logo_arishrimp.jpg" alt="AgriShrimp" fill className="object-cover" />
                </div>
                <div className="leading-[1.05]">
                  <p className="text-[24px] font-black tracking-tight text-white">
                    AGRI<span className="text-[#e7f1ff]">SHRIMP</span>
                  </p>
                  <p className="text-[10px] tracking-[0.24em] text-white/75 font-semibold">HIỆU QUẢ & THÂN THIỆN</p>
                </div>
              </Link>

              <div className="min-w-0 w-full">
                <div>
                  {renderSearchBox("desktop")}

                  <div className="flex items-center gap-4 px-2 pt-3 text-[11px] font-medium text-white/85">
                    <span className="flex items-center gap-2">
                      <BadgeCheck size={13} className="text-[#d8e5ff]" />
                      <span>Đảm bảo chất lượng</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Truck size={13} className="text-[#d8e5ff]" />
                      <span>Miễn phí vận chuyển</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={13} className="text-[#d8e5ff]" />
                      <span>Hỗ trợ 24/7</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-end gap-1.5 pt-0.5 xl:justify-self-end">
                {renderAuthSection()}

                {isLoggedIn && <NotificationBell />}

                <span className="text-[18px] font-light leading-none text-white/34 select-none">|</span>
                <Link
                  href="/user/cart"
                  id="cart-icon-target"
                  className="flex h-11 min-w-[130px] items-center gap-2.5 rounded-xl px-2.5 text-white transition-colors hover:bg-white/10 xl:min-w-[144px]"
                >
                  <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                    <ShoppingCart size={17} className="xl:h-[18px] xl:w-[18px]" />
                    {itemCount > 0 && (
                      <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f04646] px-1.5 text-[10px] font-bold leading-none text-white">
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 text-left leading-tight">
                    <p className="text-[8px] text-white/70 xl:text-[9px]">Mua sắm nhanh</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-white xl:text-[12px]">Giỏ hàng</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isImageSearchOpen && <ImageSearchModal onClose={() => setIsImageSearchOpen(false)} />}
    </>
  );
}
