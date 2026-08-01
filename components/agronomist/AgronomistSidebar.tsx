"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileSpreadsheet,
  FlaskConical,
  NotebookPen,
  Stethoscope,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

const AGRONOMIST_NAV_ITEMS = [
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

// Sidebar rieng cho khu vuc /agronomist — nam canh SiteHeader/SiteNavbar chung cua site (khong
// tu dung header/avatar/dong ho rieng nhu ban cu), chi lo phan dieu huong giua cac muc quan ly tri
// thuc AI Doctor de categories/review/tester khong bi "mo coi" (khong co duong dan nao toi).
export function AgronomistSidebar() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  const visibleItems = AGRONOMIST_NAV_ITEMS.filter((item) =>
    item.permissions.some(hasPermission),
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-[calc(var(--site-header-height,64px)+24px)] lg:max-h-[calc(100vh-var(--site-header-height,64px)-48px)] lg:w-[220px] lg:self-start lg:overflow-y-auto">
      <nav className="space-y-0.5 rounded-[8px] border border-[#e1e4ec] bg-white p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                  active ? "bg-[#dfe4ff]" : "bg-transparent group-hover:bg-slate-100",
                )}
              >
                <Icon
                  size={16}
                  className={cn(
                    active ? "text-[#252896]" : "text-slate-400 group-hover:text-slate-600",
                  )}
                />
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
