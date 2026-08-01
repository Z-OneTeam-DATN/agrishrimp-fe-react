"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Clock,
  FileSpreadsheet,
  FlaskConical,
  Loader2,
  NotebookPen,
  ShieldAlert,
  Stethoscope,
  Tags,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { P } from "@/lib/permissions";
import { setLastWorkspace } from "@/lib/workspace-permissions";

const AGRONOMIST_NAV_ITEMS = [
  {
    href: "/agronomist",
    label: "Tri thức chatbot",
    icon: NotebookPen,
    permissions: [
      P.AI_KNOWLEDGE_VIEW,
      P.AI_KNOWLEDGE_CREATE,
      P.AI_KNOWLEDGE_UPDATE,
    ],
    exact: true,
  },
  {
    href: "/agronomist/categories",
    label: "Quản lý danh mục",
    icon: Tags,
    permissions: [P.AI_KNOWLEDGE_VIEW],
    exact: false,
  },
  {
    href: "/agronomist/diseases",
    label: "Quản lý phác đồ",
    icon: NotebookPen,
    permissions: [
      P.AI_KNOWLEDGE_VIEW,
      P.AI_KNOWLEDGE_CREATE,
      P.AI_KNOWLEDGE_UPDATE,
      P.AI_IMPORT_KNOWLEDGE,
    ],
    exact: false,
  },
  {
    href: "/agronomist/review",
    label: "Câu hỏi chưa đáp",
    icon: Stethoscope,
    permissions: [P.AI_CASE_REVIEW],
    exact: false,
  },
  {
    href: "/agronomist/import",
    label: "Import Excel",
    icon: FileSpreadsheet,
    permissions: [P.AI_IMPORT_KNOWLEDGE],
    exact: false,
  },
  {
    href: "/agronomist/tester",
    label: "Chat thử nghiệm",
    icon: FlaskConical,
    permissions: [P.AI_KNOWLEDGE_APPROVE],
    exact: false,
  },
] as const;

export default function AgronomistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoadingAuth, user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const hasWorkspaceAccess = hasPermission(P.AGRONOMIST_WORKSPACE_USE);

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

  const displayName =
    user?.fullName ||
    user?.displayName ||
    user?.phoneNumber ||
    user?.email ||
    "Người dùng";

  const roleName =
    typeof user?.role === "object" && user.role !== null
      ? user.role.displayName || "Kỹ sư nông nghiệp"
      : user?.role || "Kỹ sư nông nghiệp";

  const avatarFallback = displayName.trim().charAt(0).toUpperCase() || "A";

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#252896]" />
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
            Hãy gán quyền{" "}
            <span className="font-semibold text-slate-700">
              AGRONOMIST_WORKSPACE_USE
            </span>{" "}
            cho tài khoản này để quản lý tri thức AI Doctor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 z-30 flex h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white text-slate-600">
          <div className="mb-4 flex h-[64px] items-center px-7">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-sm">
                <img
                  src="/images/logo_arishrimp.jpg"
                  alt="AgriShrimp Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-[18px] font-black uppercase leading-none tracking-[0.15em] text-slate-900">
                  AGRI<span className="text-[#252896]">SHRIMP</span>
                </h1>
                <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-400">
                  AI Doctor
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-4 no-scrollbar">
            {AGRONOMIST_NAV_ITEMS.filter((item) =>
              item.permissions.some(hasPermission),
            ).map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    active
                      ? "bg-[#eef0ff] text-[#252896]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  {active && (
                    <div className="absolute left-0 h-4 w-1 rounded-r-full bg-[#252896]" />
                  )}
                  <div
                    className={cn(
                      "rounded-md p-1 transition-colors",
                      active
                        ? "bg-[#dfe4ff]"
                        : "bg-transparent group-hover:bg-slate-100",
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        active
                          ? "text-[#252896]"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-slate-200 bg-white/80 px-6 shadow-sm backdrop-blur-md">
            <div className="hidden items-center gap-4 text-slate-500 xl:flex">
              <div className="flex items-center gap-2 rounded-lg border border-slate-100/50 bg-slate-50 px-3 py-1.5">
                <Clock size={14} className="text-slate-400" />
                <span className="font-mono text-[13px] font-bold tracking-wider text-slate-700">
                  {formattedTime}
                </span>
                <div className="mx-1 h-3 w-[1px] bg-slate-200" />
                <span className="text-[12px] font-medium text-slate-500">
                  {formattedDate}
                </span>
              </div>
            </div>

            <div className="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent py-1 pl-2 pr-1 transition-all hover:border-slate-100 hover:bg-slate-50">
              <div className="hidden text-right sm:block">
                <p className="max-w-[180px] truncate text-[13px] font-black leading-none text-slate-800 transition-colors">
                  {displayName}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {roleName}
                </p>
              </div>
              <Avatar className="h-11 w-11 border-2 border-white shadow-md ring-1 ring-slate-100">
                <AvatarImage
                  src={user?.avatar?.imageUrl ?? ""}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#252896] text-[14px] font-bold text-white">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="bg-white p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
