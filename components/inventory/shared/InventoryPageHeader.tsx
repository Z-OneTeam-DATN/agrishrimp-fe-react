"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InventoryHeaderProps {
  title: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAddClick?: () => void;
  addBtnLabel?: string;
  addBtnHref?: string;
  tabs?: { id: string; label: string; count: number | null; color?: string }[];
}

const defaultTabs = [
  { id: "all", label: "Tất cả", count: null },
  { id: "low", label: "Sắp hết hàng", count: 2, color: "text-[#007bff]" },
  { id: "out", label: "Hết hàng", count: 5, color: "text-red-600" },
];

export function InventoryPageHeader({ 
  title, 
  activeTab, 
  onTabChange, 
  onAddClick,
  addBtnLabel = "Thêm hàng hóa",
  addBtnHref,
  tabs = defaultTabs
}: InventoryHeaderProps) {
  const renderAddButton = () => {
    const button = (
      <Button 
        variant="outline" 
        className="h-[32px] text-[12px] bg-white border-[#dcdcdc] rounded-[4px]"
        onClick={onAddClick}
      >
        <Plus className="mr-1 h-3 w-3" />
        {addBtnLabel}
      </Button>
    );

    if (addBtnHref) {
      return (
        <Link href={addBtnHref}>
          {button}
        </Link>
      );
    }

    return button;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <h1 className="text-[18px] font-bold text-[#1f1f1f]">{title}</h1>
        {onTabChange && activeTab && (
          <div className="hidden md:flex gap-[5px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "px-3 py-[6px] text-[13px] font-semibold rounded-[4px] transition-all",
                  activeTab === tab.id 
                    ? "bg-[#eef6fc] text-[#007bff]" 
                    : "text-[#555] hover:bg-[#f8f9fa] hover:text-[#007bff]"
                )}
              >
                {tab.label} {tab.count !== null && <span className={cn("ml-1", tab.color)}>({tab.count})</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {renderAddButton()}
      </div>
    </div>
  );
}
