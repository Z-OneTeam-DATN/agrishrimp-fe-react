"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Home, Loader2, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import { setLastWorkspace } from "@/lib/workspace-permissions";
import { AgronomistSidebar } from "@/components/agronomist/AgronomistSidebar";

export default function AgronomistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoadingAuth } = useAuthStore();
  const { hasPermission } = usePermissions();

  const hasWorkspaceAccess =
    hasPermission(P.AGRONOMIST_WORKSPACE_USE) || hasPermission(P.AI_KNOWLEDGE_UPDATE);

  useEffect(() => {
    if (!isLoadingAuth && hasWorkspaceAccess) {
      setLastWorkspace("/agronomist");
    }
  }, [hasWorkspaceAccess, isLoadingAuth]);

  if (isLoadingAuth) {
    return (
      <section className="bg-[#f7f8fb] py-10">
        <div className="mx-auto flex min-h-[360px] w-full max-w-[1460px] items-center justify-center px-4 sm:px-6 lg:px-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#252896]" />
        </div>
      </section>
    );
  }

  if (!hasWorkspaceAccess) {
    return (
      <section className="bg-[#f7f8fb] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md rounded-[4px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[4px] bg-rose-50 text-rose-500">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-slate-900">
            Bạn chưa được cấp quyền vào workspace kỹ sư nông nghiệp
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Hãy gán quyền{" "}
            <span className="font-semibold text-slate-700">
              AGRONOMIST_WORKSPACE_USE
            </span>{" "}
            cho tài khoản này để quản lý tri thức AI Doctor.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-[4px] bg-[#252896] px-5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1d2078]"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#f7f8fb] py-5 sm:py-6 lg:py-7">
      <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:px-8">
        <AgronomistSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
