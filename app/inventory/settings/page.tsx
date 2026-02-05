"use client";

import React from "react";
import { SettingsGrid } from "@/components/inventory/settings/SettingsGrid";
import { SettingsCard } from "@/components/inventory/settings/SettingsCard";
import { SETTINGS_MENU } from "./constants";

export default function SettingsDashboardPage() {
  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cấu hình hệ thống
        </h1>
        <p className="mt-2 text-slate-500 text-[14px]">
          Thiết lập các thông số vận hành, quản lý chi nhánh và chính sách cho toàn bộ hệ thống cửa hàng.
        </p>
      </div>

      {/* Main Grid Navigation */}
      <SettingsGrid>
        {SETTINGS_MENU.map((item) => (
          <SettingsCard
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            href={item.href}
          />
        ))}
      </SettingsGrid>

      {/* Footer Info (Optional) */}
      <div className="mt-16 pt-8 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400">
          Phiên bản hệ thống 2.0.4 • © 2024 AgriShrimp Warehouse Management
        </p>
      </div>
    </div>
  );
}
