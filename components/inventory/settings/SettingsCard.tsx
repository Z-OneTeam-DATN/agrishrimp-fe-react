"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
}

export const SettingsCard = ({
  title,
  description,
  icon: Icon,
  href,
  className,
}: SettingsCardProps) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(href)}
      className={cn(
        "group relative bg-white p-5 rounded-xl border border-slate-200",
        "shadow-sm hover:shadow-md hover:-translate-y-1",
        "cursor-pointer transition-all duration-300 ease-out",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
          <Icon size={22} strokeWidth={2} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-blue-700 mb-1 tracking-tight">
            {title}
          </h3>
          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* Decorative element on hover */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
      </div>
    </div>
  );
};
