"use client";

import Link from "next/link";
import { Bot, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function AIChatButton() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const shouldHideOnPath = [
    "/ai-doctor",
    "/profile",
    "/orders",
    "/edit-profile",
    "/password",
    "/address",
    "/voucher",
    "/account",
    "/about",
    "/contact",
    "/ordering",
    "/packing",
    "/privacy-policy",
    "/return",
    "/shipping-fee",
    "/store-locator",
    "/terms-of-use",
    "/warranty-policy",
    "/cookie-policy",
  ].some((path) => pathname?.startsWith(path));

  if (shouldHideOnPath) return null;
  if (dismissed) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip nổi phía trên */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-lg rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700">
        <Bot size={16} className="text-amber-500 shrink-0" />
        <span className="whitespace-nowrap">Hỏi Bác sĩ AI</span>
        <button
          type="button"
          aria-label="Đóng"
          onClick={() => setDismissed(true)}
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* FAB button */}
      <Link
        href="/ai-doctor"
        aria-label="Chat với Bác sĩ AI"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 shadow-xl transition-all hover:scale-105 active:scale-95"
      >
        <Bot size={26} className="text-white" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-amber-400 opacity-40 animate-ping" />
      </Link>
    </div>
  );
}
