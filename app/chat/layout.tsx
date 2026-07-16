"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import { setLastWorkspace } from "@/lib/workspace-permissions";

const WebSocketProvider = dynamic(
  () => import("@/components/providers/WebSocketProvider"),
  { ssr: false }
);

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoadingAuth } = useAuthStore();
  const { hasAnyPermission } = usePermissions();
  const isAllowed = hasAnyPermission([P.CUSTOMER_ADVISOR_USE, P.CHAT_VIEW]);

  useEffect(() => {
    if (!isLoadingAuth && isAllowed) {
      setLastWorkspace("/chat");
    }
  }, [isAllowed, isLoadingAuth]);

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f766e]" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-slate-900">
            Bạn chưa được cấp quyền vào khu vực chat
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Hãy gán quyền <span className="font-semibold text-slate-700">CUSTOMER_ADVISOR_USE</span>
            {" "}hoặc <span className="font-semibold text-slate-700">CHAT_VIEW</span>
            {" "}cho tài khoản này trong phần quản lý vai trò.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WebSocketProvider />
      {children}
    </>
  );
}
