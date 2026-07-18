"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserCircle, Settings, Building2, ChevronRight } from "lucide-react";
import { driverService } from "@/app/services/driver.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { isAdminRole } from "@/lib/roles";
import { P } from "@/lib/permissions";

export default function AdminSettingsPage() {
  const [driverCount, setDriverCount] = useState<number | null>(null);
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const isAdmin = isAdminRole(user?.role);
  const canViewDriver = hasPermission(P.DRIVER_VIEW) || isAdmin;
  const canViewSetting = hasPermission(P.SETTING_VIEW) || isAdmin;
  const canViewBranch = hasPermission(P.BRANCH_VIEW) || isAdmin;

  useEffect(() => {
    if (!canViewDriver) return;
    driverService.getAll(undefined, undefined, 0, 1)
      .then((res) => setDriverCount(res?.totalElements ?? 0))
      .catch(() => setDriverCount(0));
  }, [canViewDriver]);

  return (
    <div className="space-y-6 pb-10 bg-slate-50 min-h-screen px-1 py-4">
      <div className="mb-6 mt-2">
        <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
          CÀI ĐẶT HỆ THỐNG
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Card: Quản lý tài xế */}
        {canViewDriver && (
          <Link href="/admin/drivers" className="block group">
            <div className="bg-white border border-slate-200 rounded-[4px] p-5 shadow-sm hover:border-emerald-500 hover:shadow transition-all duration-200 flex flex-col justify-between h-[160px] relative">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 text-slate-500 rounded-[4px] group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <UserCircle size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Quản lý tài xế
                    </h2>
                    {driverCount !== null && driverCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-600 bg-emerald-50 rounded-full">
                        {driverCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed">
                    Thiết lập danh sách tài xế vận hành, quản lý bằng lái xe và phương tiện điều động kho vận.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end text-[11.5px] font-medium text-slate-500 group-hover:text-emerald-600 transition-colors pt-2">
                Truy cập thiết lập
                <ChevronRight size={14} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        )}

        {/* Card: Cấu hình chung (Disabled) */}
        {canViewSetting && (
          <div className="bg-white border border-slate-200 rounded-[4px] p-5 shadow-sm opacity-60 flex flex-col justify-between h-[160px]">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-[4px]">
                <Settings size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-[14px] font-semibold text-slate-500">
                  Cấu hình chung
                </h2>
                <p className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed">
                  Thiết lập các tham số hệ thống, múi giờ hạch toán, đơn vị tiền tệ và định dạng hiển thị mặc định.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-400 text-right pt-2">
              Đang phát triển
            </div>
          </div>
        )}

        {/* Card: Thông tin chi nhánh (Disabled) */}
        {canViewBranch && (
          <div className="bg-white border border-slate-200 rounded-[4px] p-5 shadow-sm opacity-60 flex flex-col justify-between h-[160px]">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-slate-50 text-slate-400 rounded-[4px]">
                <Building2 size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-[14px] font-semibold text-slate-500">
                  Thông tin chi nhánh
                </h2>
                <p className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed">
                  Cập nhật thông tin liên hệ, sơ đồ kho bãi và mã số thuế phục vụ hóa đơn vận chuyển nội bộ.
                </p>
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-400 text-right pt-2">
              Đang phát triển
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
