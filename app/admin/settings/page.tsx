"use client";

import React from "react";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 pb-10 bg-[#f0f2f5] min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-medium text-[#1f1f1f]">Cài đặt</h1>
      </div>

      <div className="bg-white border border-[#dcdcdc] rounded-none shadow-sm p-16 flex flex-col items-center justify-center min-h-[400px]">
        <Settings size={64} strokeWidth={1} className="text-slate-200 mb-4" />
        <p className="text-[18px] text-slate-500 font-medium">
          Trang cài đặt đang được phát triển
        </p>
        <p className="text-[13px] text-slate-400 mt-1">
          Tính năng này sẽ sớm được ra mắt.
        </p>
      </div>
    </div>
  );
}
