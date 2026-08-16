"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Headset, MessageCircle, PhoneCall, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";

const CONSULT_PHONE = "0395024181";
const CONSULT_PHONE_LABEL = "0395.024.181";
const ZALO_URL = `https://zalo.me/${CONSULT_PHONE}`;

function ZaloMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded bg-blue-600 text-[8px] font-black leading-none text-white",
        className,
      )}
    >
      Zalo
      <span className="absolute -bottom-0.5 left-2 h-1.5 w-1.5 rotate-45 rounded-[1px] bg-blue-600" />
    </span>
  );
}

export default function FloatingContactCluster() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const {
    isOpen: isChatOpen,
    openChat,
    setConsultProduct,
  } = useChatStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (isChatOpen) return null;

  const handleChat = () => {
    setOpen(false);
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để chat với chăm sóc khách hàng!");
      router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    setConsultProduct(null);
    openChat();
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 right-4 z-[60] flex flex-col items-end gap-3 md:bottom-8 md:right-8"
    >
      <div
        className={cn(
          "w-[min(340px,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-[18px] border border-blue-100 bg-white shadow-2xl transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={() => window.open(ZALO_URL, "_blank", "noopener,noreferrer")}
          className="group flex h-[72px] w-full items-center justify-between border-b border-blue-50 bg-blue-50/70 px-4 text-left transition-colors hover:bg-blue-100/80"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-sm ring-1 ring-blue-100">
              <ZaloMark className="h-8 w-8" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold text-blue-950">
                Liên hệ Zalo
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                Tư vấn viên
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-700 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={handleChat}
          className="group flex h-[72px] w-full items-center justify-between border-b border-blue-50 px-4 text-left transition-colors hover:bg-blue-50"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-sm ring-1 ring-teal-100">
              <MessageCircle className="h-7 w-7 text-teal-600" strokeWidth={2.3} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold text-blue-950">
                Chat trực tuyến
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                Hỗ trợ CSKH
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-700 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            window.open(`tel:${CONSULT_PHONE}`, "_self");
          }}
          className="group flex h-[72px] w-full items-center justify-between px-4 text-left transition-colors hover:bg-red-50/70"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white shadow-sm ring-1 ring-red-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500 text-red-600">
                <PhoneCall className="h-5 w-5" strokeWidth={2.4} />
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold text-blue-950">
                Gọi tư vấn
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-slate-500">
                {CONSULT_PHONE_LABEL}
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-700 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Đóng cụm tư vấn" : "Mở cụm tư vấn"}
        className="group flex h-16 items-center rounded-full bg-white pl-6 pr-2 text-blue-600 shadow-2xl ring-1 ring-blue-100 transition-transform hover:-translate-y-0.5 hover:text-blue-700"
      >
        <span className="mr-4 text-[20px] font-extrabold leading-none">
          Nhận tư vấn
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors group-hover:bg-blue-700">
          {open ? <X className="h-7 w-7" /> : <Headset className="h-7 w-7" />}
        </span>
      </button>
    </div>
  );
}
