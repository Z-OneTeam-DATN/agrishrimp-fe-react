"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ChatService } from "@/app/services/chat.service";
import { Conversation } from "@/app/types/chat.types";

const AUTO_DISMISS_MS = 6000;
const APPEAR_DELAY_MS = 1800;
const SESSION_KEY = "_urt";

export default function ChatUnreadBanner() {
  const { isAuthenticated, isLoadingAuth, user } = useAuthStore();
  const { openChat, isOpen } = useChatStore();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leavingRef = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Fetch unread conversation once per session
  useEffect(() => {
    if (isLoadingAuth || !isAuthenticated) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const roleSlug = (user as any)?.role?.slug as string | undefined;
    const isStaff = roleSlug && roleSlug !== "customer" && roleSlug !== "khach-hang";
    if (isStaff) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const c = await ChatService.getMyConversation();
        if (!cancelled && c.unreadByCustomer > 0) {
          setConv(c);
          setMounted(true);
        }
      } catch {}
    }, APPEAR_DELAY_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [isLoadingAuth, isAuthenticated, user]);

  // Slide-in animation + progress bar + auto-dismiss
  useEffect(() => {
    if (!mounted) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    // Double rAF: ensure browser paints translate-x-[120%] before transition
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setEntered(true);
        // Start draining progress bar
        if (progressRef.current) {
          progressRef.current.style.transition = `width ${AUTO_DISMISS_MS}ms linear`;
          progressRef.current.style.width = "0%";
        }
      })
    );

    dismissTimer.current = setTimeout(startLeave, AUTO_DISMISS_MS);

    return () => {
      cancelAnimationFrame(raf);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const startLeave = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    setTimeout(() => setMounted(false), 380);
  };

  const dismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    startLeave();
  };

  const handleClick = () => {
    dismiss();
    openChat();
  };

  if (!mounted || !conv || isOpen) return null;

  const isVisible = entered && !leaving;
  const preview = conv.lastMessage ?? "Tin nhắn mới từ cửa hàng";

  return (
    <div
      role="button"
      aria-label="Mở tin nhắn"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={`fixed top-[72px] right-4 z-[999] w-72 rounded-2xl shadow-2xl
        bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600
        overflow-hidden cursor-pointer select-none
        transition-[transform,opacity] ease-out duration-[380ms]
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"}`}
    >
      {/* Body */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-3">
        {/* Shop avatar */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo_arishrimp.jpg"
              alt="AgriShrimp"
              className="w-11 h-11 object-cover"
            />
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-800" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-gray-800 dark:text-white leading-tight">
              AgriShrimp Shop
            </span>
            <button
              onClick={dismiss}
              aria-label="Đóng"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ml-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[12.5px] text-gray-500 dark:text-gray-300 mt-0.5 leading-snug line-clamp-2">
            {preview}
          </p>

          <p className="text-[11.5px] font-medium text-teal-600 dark:text-teal-400 mt-1.5">
            {conv.unreadByCustomer} tin nhắn chưa đọc · Nhấn để xem
          </p>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-[3px] bg-gray-100 dark:bg-slate-700">
        <div
          ref={progressRef}
          className="h-full bg-teal-500"
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
