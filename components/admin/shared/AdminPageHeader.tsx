"use client";

import React from "react";
import { Plus, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { usePermissions } from "@/hooks/usePermissions";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  addBtnLabel?: string;
  addBtnHref?: string;
  onAddClick?: () => void;
  permission?: string;
  secondaryBtnLabel?: string;
  secondaryBtnHref?: string;
  secondaryBtnIcon?: LucideIcon;
  onSecondaryClick?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: { id: string; label: string; count: number | null; color?: string }[];
}

export function AdminPageHeader({ 
  title, 
  subtitle,
  titleClassName,
  addBtnLabel, 
  addBtnHref,
  onAddClick,
  permission,
  secondaryBtnLabel,
  secondaryBtnHref,
  secondaryBtnIcon: SecondaryIcon,
  onSecondaryClick,
  activeTab,
  onTabChange,
  tabs
}: AdminPageHeaderProps) {
  const { hasPermission } = usePermissions();
  const canAdd = !permission || hasPermission(permission);
  const hasTabs = Boolean(tabs && onTabChange);
  const hasActions = Boolean(
    secondaryBtnLabel || (canAdd && (addBtnHref || onAddClick)),
  );

  if (!hasTabs && !hasActions) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-4">
        {tabs && onTabChange && (
          <div className="hidden md:flex gap-[5px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "px-3 py-[6px] text-[13px] font-semibold rounded-[4px] transition-all",
                  activeTab === tab.id 
                    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100" 
                    : "text-[#555] hover:bg-[#f8f9fa] hover:text-blue-600"
                )}
              >
                {tab.label} {tab.count !== null && <span className={cn("ml-1", tab.color || "text-blue-600")}>({tab.count})</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {secondaryBtnLabel && (
          secondaryBtnHref ? (
            <Link href={secondaryBtnHref}>
              <Button variant="outline" className="h-[40px] px-4 text-[14px] font-medium bg-white border-slate-200 border text-slate-700 hover:bg-slate-50 rounded-md shadow-sm">
                {SecondaryIcon && <SecondaryIcon className="mr-2 h-4 w-4 text-slate-500" />} {secondaryBtnLabel}
              </Button>
            </Link>
          ) : (
            <Button 
              variant="outline"
              onClick={onSecondaryClick}
              className="h-[40px] px-4 text-[14px] font-medium bg-white border-slate-200 border text-slate-700 hover:bg-slate-50 rounded-md shadow-sm"
            >
              {SecondaryIcon && <SecondaryIcon className="mr-2 h-4 w-4 text-slate-500" />} {secondaryBtnLabel}
            </Button>
          )
        )}

        {canAdd && (addBtnHref || onAddClick) && (
          addBtnHref ? (
            <Link href={addBtnHref}>
              <Button className="h-[40px] px-4 text-[14px] font-bold bg-[#4169E1] hover:bg-blue-700 text-white rounded-md shadow-md transition-all">
                <Plus className="mr-2 h-5 w-5" /> {addBtnLabel || "Thêm mới"}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={onAddClick}
              className="h-[40px] px-4 text-[14px] font-bold bg-[#4169E1] hover:bg-blue-700 text-white rounded-md shadow-md transition-all"
            >
              <Plus className="mr-2 h-5 w-5" /> {addBtnLabel || "Thêm mới"}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

