"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Lock,
  MapPin,
  ClipboardList,
  Ticket,
  LogOut,
  Camera,
  Loader2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { UserService } from "@/app/services/user.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthStore } from "@/stores/useAuthStore";

const getFullImageUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const origin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:8004";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ProfileSidebar({
  onLinkClick,
}: {
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { data: user } = useCurrentUser();
  const setUser = useAuthStore((state) => state.setUser);
  const canChangePassword = user?.provider !== "GOOGLE";

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const itemClass = (path: string) => `
    flex items-center rounded-md px-3 py-2.5 transition-colors text-sm font-medium mb-1
    ${
      isActive(path)
        ? "bg-blue-50 text-[#1965a2]"
        : "text-gray-600 hover:bg-gray-50 hover:text-[#1965a2]"
    }
  `;

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const displayName = useMemo(
    () => user?.fullName || user?.displayName || user?.phoneNumber || user?.email || "Người dùng",
    [user],
  );

  const avatarUrl = user?.avatar?.imageUrl || (user as any)?.avatarUrl;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ND";

  const handleAvatarSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh đại diện phải nhỏ hơn 2MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingAvatar(true);

    try {
      const uploadedAvatar = await UserService.uploadAvatar(formData);
      if (user) {
        if (uploadedAvatar.imageUrl) {
          await UserService.updateAvatarUrl(uploadedAvatar.imageUrl);
        }

        setUser({
          ...user,
          avatar: {
            ...(user.avatar ?? {}),
            ...uploadedAvatar,
          },
          avatarUrl: uploadedAvatar.imageUrl ?? undefined,
        } as any);
      }
      toast.success("Cập nhật ảnh đại diện thành công.");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Không thể cập nhật ảnh đại diện lúc này.";
      toast.error(errorMessage);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  return (
    <div className="border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-5 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative block rounded-full disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Cập nhật ảnh đại diện"
            >
              <Avatar className="h-12 w-12 border border-gray-200">
                <AvatarImage src={getFullImageUrl(avatarUrl) || undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-gray-50 text-gray-400 font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                {isUploadingAvatar ? (
                  <Loader2 size={10} className="animate-spin text-[#1965a2]" />
                ) : (
                  <Camera size={10} className="text-[#1965a2]" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">{displayName}</h3>
            <Link
              href="/edit-profile"
              onClick={handleLinkClick}
              className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#1965a2]"
            >
              <Pencil size={11} />
              <span>Sửa Hồ Sơ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* --- MENU TÀI KHOẢN --- */}
      <div className="mb-2 px-1 text-[11px] font-bold text-gray-400">
        Tài khoản
      </div>
      <nav className="flex flex-col">
        <Link href="/edit-profile" onClick={handleLinkClick} className={itemClass("/edit-profile")}>
          <Settings size={18} className="mr-2.5 text-[#1965a2]" /> Thiết lập tài khoản
        </Link>
        {canChangePassword && (
          <Link href="/password" onClick={handleLinkClick} className={itemClass("/password")}>
            <Lock size={18} className="mr-2.5 text-[#1965a2]" /> Đổi mật khẩu
          </Link>
        )}
        <Link href="/address" onClick={handleLinkClick} className={itemClass("/address")}>
          <MapPin size={18} className="mr-2.5 text-[#1965a2]" /> Sổ địa chỉ
        </Link>
      </nav>

      {/* --- MENU ĐƠN HÀNG --- */}
      <div className="mb-2 mt-5 px-1 text-[11px] font-bold text-gray-400">
        Đơn hàng
      </div>
      <nav className="flex flex-col">
        <Link href="/orders/list" onClick={handleLinkClick} className={itemClass("/orders/list")}>
          <ClipboardList size={18} className="mr-2.5 text-[#1965a2]" /> Đơn hàng của tôi
        </Link>
      </nav>

      {/* --- MENU TIỆN ÍCH --- */}
      <div className="mb-2 mt-5 px-1 text-[11px] font-bold text-gray-400">
        Tiện ích
      </div>
      <nav className="flex flex-col">
        <Link href="/voucher" onClick={handleLinkClick} className={itemClass("/voucher")}>
          <Ticket size={18} className="mr-2.5 text-[#1965a2]" /> Kho Voucher
        </Link>

        {/* Đăng xuất */}
        <div className="border-t border-gray-100 mt-4 pt-4">
          <Link
            href="/logout"
            onClick={handleLinkClick}
            className="flex items-center px-3 py-2.5 transition-colors text-sm font-bold text-rose-500 hover:bg-rose-50 uppercase tracking-tighter"
          >
            <LogOut size={18} className="mr-2.5" /> Đăng xuất
          </Link>
        </div>
      </nav>
    </div>
  );
}

