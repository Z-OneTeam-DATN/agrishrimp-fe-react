"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock,
  FileSpreadsheet,
  FlaskConical,
  LayoutDashboard,
  Loader2,
  NotebookPen,
  ShieldAlert,
  Stethoscope,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import {
  ADMIN_WORKSPACE_PERMISSIONS,
  ADVISOR_WORKSPACE_PERMISSIONS,
  setLastWorkspace,
} from "@/lib/workspace-permissions";

const AGRONOMIST_NAV_ITEMS = [
  {
    href: "/agronomist/overview",
    label: "Trang tổng quan",
    icon: LayoutDashboard,
    permissions: [P.AI_KNOWLEDGE_VIEW],
  },
  {
    href: "/agronomist/categories",
    label: "Thêm danh mục",
    icon: Tags,
    permissions: [P.AI_KNOWLEDGE_VIEW],
  },
  {
    href: "/agronomist/diseases",
    label: "Quản lý phác đồ",
    icon: NotebookPen,
    permissions: [P.AI_KNOWLEDGE_CREATE, P.AI_KNOWLEDGE_UPDATE],
  },
  {
    href: "/agronomist/import",
    label: "Import Excel",
    icon: FileSpreadsheet,
    permissions: [P.AI_IMPORT_KNOWLEDGE],
  },
  {
    href: "/agronomist/review",
    label: "Case cần duyệt",
    icon: Stethoscope,
    permissions: [P.AI_CASE_REVIEW, P.AI_KNOWLEDGE_VIEW],
  },
  {
    href: "/agronomist/tester",
    label: "Chat thử nghiệm",
    icon: FlaskConical,
    permissions: [P.AI_KNOWLEDGE_VIEW],
  },
  {
    href: "/agronomist/reports",
    label: "Báo cáo câu hỏi",
    icon: BarChart3,
    permissions: [P.AI_KNOWLEDGE_VIEW],
  },
] as const;

export default function AgronomistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoadingAuth, permissions } = useAuthStore();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const hasWorkspaceAccess = hasPermission(P.AGRONOMIST_WORKSPACE_USE);
  const canGoAdmin = hasAnyPermission(ADMIN_WORKSPACE_PERMISSIONS as unknown as string[]);
  const canGoChat = hasAnyPermission(ADVISOR_WORKSPACE_PERMISSIONS as unknown as string[]);

  useEffect(() => {
    if (!isLoadingAuth && hasWorkspaceAccess) {
      setLastWorkspace("/agronomist");
    }
  }, [hasWorkspaceAccess, isLoadingAuth]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const activeNavItem = AGRONOMIST_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasWorkspaceAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] px-6">
        <div className="w-full max-w-md rounded-[4px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[4px] bg-rose-50 text-rose-500">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-slate-900">
            Bạn chưa được cấp quyền vào workspace kỹ sư nông nghiệp
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Hãy gán quyền <span className="font-semibold text-slate-700">AGRONOMIST_WORKSPACE_USE</span>
            {" "}cho tài khoản này để quản lý tri thức AI Doctor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-30 flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-600">
          <div className="mb-4 flex h-[64px] items-center px-7">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <img
                  src="/images/logo_arishrimp.jpg"
                  alt="AgriShrimp Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[18px] font-black uppercase leading-none tracking-[0.15em] text-slate-900">
                  AGRI<span className="text-blue-600">SHRIMP</span>
                </h1>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  AI Doctor
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 no-scrollbar">
            {AGRONOMIST_NAV_ITEMS.filter((item) => item.permissions.some(hasPermission)).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {active && (
                    <div className="absolute left-0 h-4 w-1 rounded-r-full bg-blue-500" />
                  )}
                  <div
                    className={cn(
                      "rounded-md p-1 transition-colors",
                      active ? "bg-blue-100" : "bg-transparent group-hover:bg-slate-100",
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")}
                    />
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 border-t border-slate-200 bg-slate-50/60 p-4">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Chuyển workspace
            </p>
            <div className="grid gap-1">
              {canGoAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Qua quản trị
                </Link>
              ) : null}
              {canGoChat ? (
                <Link
                  href="/chat"
                  className="rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Qua chat
                </Link>
              ) : null}
            </div>
            <div className="rounded-md bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-500">
              Quyền hiện có: {permissions.filter(Boolean).length}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-slate-200 bg-white/80 px-6 shadow-sm backdrop-blur-md">
            <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-slate-400">
              <span className="text-slate-400">AI Doctor</span>
              <span className="text-slate-300">/</span>
              <span className="truncate text-[13px] font-bold text-slate-800">
                {activeNavItem?.label ?? "Tổng quan"}
              </span>
            </div>

            <div className="hidden items-center gap-4 text-slate-500 xl:flex">
              <div className="flex items-center gap-2 rounded-lg border border-slate-100/50 bg-slate-50 px-3 py-1.5">
                <Clock size={14} className="text-slate-400" />
                <span className="font-mono text-[13px] font-bold tracking-wider text-slate-700">
                  {formattedTime}
                </span>
                <div className="mx-1 h-3 w-[1px] bg-slate-200" />
                <span className="text-[12px] font-medium text-slate-500">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 lg:flex">
                <span className="text-[12px] font-bold text-blue-700">Deterministic mode only</span>
                <div className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></div>
              </div>
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
