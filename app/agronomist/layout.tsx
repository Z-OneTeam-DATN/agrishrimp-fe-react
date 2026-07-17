"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, Database, FileSpreadsheet, FlaskConical, Loader2, ShieldAlert, Stethoscope } from "lucide-react";
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
    href: "/agronomist/knowledge",
    label: "Bệnh & tri thức",
    icon: Database,
    permissions: [P.AI_KNOWLEDGE_VIEW],
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

  const hasWorkspaceAccess = hasPermission(P.AGRONOMIST_WORKSPACE_USE);
  const canGoAdmin = hasAnyPermission(ADMIN_WORKSPACE_PERMISSIONS as unknown as string[]);
  const canGoChat = hasAnyPermission(ADVISOR_WORKSPACE_PERMISSIONS as unknown as string[]);

  useEffect(() => {
    if (!isLoadingAuth && hasWorkspaceAccess) {
      setLastWorkspace("/agronomist");
    }
  }, [hasWorkspaceAccess, isLoadingAuth]);

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5ef]">
        <Loader2 className="h-8 w-8 animate-spin text-[#325b48]" />
      </div>
    );
  }

  if (!hasWorkspaceAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f5ef] px-6">
        <div className="w-full max-w-md rounded-[28px] border border-[#d7dfd8] bg-white p-8 text-center shadow-[0_24px_80px_rgba(28,55,46,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
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
    <div className="min-h-screen bg-[#f3f5ef] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r border-[#d9dfd4] bg-[#243127] px-5 py-6 text-white">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#b9c8bc]">
              AgriShrimp AI Doctor
            </p>
            <h1 className="mt-3 text-2xl font-black leading-tight text-white">
              Workspace kỹ sư nông nghiệp
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#c8d5cb]">
              Nhập tri thức, duyệt ca khó và kiểm thử câu trả lời trước khi đưa ra production.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {AGRONOMIST_NAV_ITEMS.filter((item) => item.permissions.some(hasPermission)).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "bg-[#d9e9dd] text-[#203126]"
                      : "text-[#d5ddd4] hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#aab9ad]">
              Chuyển workspace
            </p>
            <div className="grid gap-2">
              {canGoAdmin ? (
                <Link
                  href="/admin"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#edf3ee] transition-colors hover:bg-white/10"
                >
                  Qua quản trị
                </Link>
              ) : null}
              {canGoChat ? (
                <Link
                  href="/chat"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-[#edf3ee] transition-colors hover:bg-white/10"
                >
                  Qua chat
                </Link>
              ) : null}
            </div>
            <div className="rounded-xl bg-black/10 px-3 py-2 text-xs text-[#b9c7bc]">
              Quyền hiện có: {permissions.filter(Boolean).length}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#d7dfd8] bg-[#f3f5ef]/90 px-8 py-5 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-black uppercase tracking-[0.32em] text-[#6f8174]">
                  Approved Knowledge Workspace
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#203126]">
                  {AGRONOMIST_NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? "AI Doctor"}
                </h2>
              </div>
              <div className="rounded-full border border-[#d4ddd5] bg-white px-4 py-2 text-sm font-semibold text-[#47634f]">
                Deterministic mode only
              </div>
            </div>
          </header>

          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
