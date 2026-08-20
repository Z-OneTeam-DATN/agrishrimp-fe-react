"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  HelpCircle,
  User,
  LogOut,
  Settings as SettingsIcon,
  Menu,
  MapPin,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLogout } from "@/hooks/use-logout";
import { resolveImageUrl } from "@/lib/resolveImageUrl";

export function InventoryTopbar() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const { data: user } = useCurrentUser();
  const { logout, isLoading } = useLogout();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getUserDisplayName = () => {
    if (!user) return "Warehouse Admin";
    return (
      user.fullName ||
      user.displayName ||
      user.phoneNumber ||
      user.email ||
      "Warehouse Admin"
    );
  };

  const userAvatarUrl =
    user?.avatar?.imageUrl || (user as any)?.avatarUrl || "";

  const formattedDate = mounted
    ? time.toLocaleDateString("vi-VN", {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  const formattedTime = mounted
    ? time.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <header className="h-[60px] border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6 flex-1">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-500"
        >
          <Menu size={20} />
        </Button>

        {/* Company Logo & Name */}
        <div className="flex items-center gap-3 pr-6 border-r border-slate-100">
          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 shadow-sm ring-4 ring-slate-50">
            <img
              src="/images/logo_arishrimp.jpg"
              alt="AgriShrimp Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-slate-900 leading-none tracking-tight">
              AGRISHRIMP CO.
            </span>
            <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">
              Global Solutions
            </span>
          </div>
        </div>

        {/* Date Time Display - Professional Style */}
        <div className="hidden md:flex items-center gap-4 text-slate-500 ml-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100/50">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[13px] font-bold text-slate-700 font-mono tracking-wider">
              {formattedTime}
            </span>
            <div className="w-[1px] h-3 bg-slate-200 mx-1" />
            <span className="text-[12px] font-medium text-slate-500">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Branch Info Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
          <MapPin size={14} className="text-indigo-600" />
          <span className="text-[12px] font-bold text-indigo-700">
            Chi nhánh Hà Nội
          </span>
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse ml-1"
            title="Online"
          ></div>
        </div>

        {/* Utility Actions */}
        <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          >
            <HelpCircle size={20} />
          </Button>
        </div>

        {/* User Profile Modern */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all ml-2 group">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                  {getUserDisplayName()}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mt-1">
                  {user?.role?.displayName || "Warehouse Pro"}
                </p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-white shadow-md ring-1 ring-slate-100">
                {userAvatarUrl ? (
                  <AvatarImage
                    src={resolveImageUrl(userAvatarUrl)}
                    alt={getUserDisplayName()}
                  />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-[11px] font-bold">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 mt-3 shadow-2xl border-slate-100 rounded-xl p-2"
          >
            <DropdownMenuLabel className="px-3 py-3">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Đang đăng nhập với
                </span>
                <span className="text-[13px] font-bold text-slate-800 mt-0.5">
                  {user?.email || user?.phoneNumber || "Đang tải..."}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50 mx-2" />
            <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5 px-3 text-slate-600 hover:bg-blue-50 focus:bg-blue-50 group">
              <User className="mr-3 h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              <span className="text-[13px] font-medium">Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg py-2.5 px-3 text-slate-600 hover:bg-blue-50 focus:bg-blue-50 group">
              <SettingsIcon className="mr-3 h-4 w-4 text-slate-400 group-hover:text-blue-600" />
              <span className="text-[13px] font-medium">Cài đặt hệ thống</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50 mx-2" />
            <DropdownMenuItem
              onClick={() => logout()}
              disabled={isLoading}
              className="text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-600 font-bold py-2.5 px-3 rounded-lg group"
            >
              <LogOut className="mr-3 h-4 w-4 text-rose-400 group-hover:text-rose-600" />
              <span className="text-[13px]">
                {isLoading ? "Đang xử lý..." : "Đăng xuất"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

