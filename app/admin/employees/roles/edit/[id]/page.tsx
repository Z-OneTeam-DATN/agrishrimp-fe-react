"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { RoleService } from "@/app/services/RoleService";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  ALL_ROLE_ACTION_IDS,
  ALL_ROLE_MODULE_IDS,
  ROLE_PERMISSION_STRUCTURE,
} from "../../permission-config";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = Number(params.id);
  const { hasPermission } = usePermissions();
  const { isLoadingAuth } = useAuthStore();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [enabledScreens, setEnabledScreens] = useState<string[]>([]);
  const [advancedPerms, setAdvancedPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [errors, setErrors] = useState<{ roleName?: string; permissions?: string }>({});

  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.ROLE_UPDATE)) {
      router.push("/admin/forbidden");
    }
  }, [hasPermission, isLoadingAuth, router]);

  const actionMap = useMemo(
    () =>
      new Map(
        ROLE_PERMISSION_STRUCTURE.flatMap((group) =>
          group.screens.map((screen) => [
            screen.id,
            screen.advanced.map((action) => action.id),
          ])
        )
      ),
    []
  );

  useEffect(() => {
    const fetchRoleDetails = async () => {
      try {
        setLoading(true);
        const roleData = await RoleService.getById(roleId);

        setRoleName(roleData.displayName || "");
        setDescription(roleData.description || "");
        setStatus(roleData.isActive ? "active" : "inactive");
        setIsSystemRole(Boolean(roleData.isSystem));

        const grantedCodes = new Set(roleData.permissionCodes || []);
        setEnabledScreens(ALL_ROLE_MODULE_IDS.filter((id) => grantedCodes.has(id)));
        setAdvancedPerms(ALL_ROLE_ACTION_IDS.filter((id) => grantedCodes.has(id)));
      } catch (error) {
        toast.error("Lỗi khi tải dữ liệu vai trò");
        router.push("/admin/employees/roles");
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(roleId)) {
      fetchRoleDetails();
    }
  }, [roleId, router]);

  const toggleModule = (id: string, checked: boolean) => {
    if (isSystemRole) return;
    setErrors((prev) => ({ ...prev, permissions: undefined }));

    if (checked) {
      setEnabledScreens((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }

    setEnabledScreens((prev) => prev.filter((item) => item !== id));
    const childIds = actionMap.get(id) || [];
    setAdvancedPerms((prev) => prev.filter((item) => !childIds.includes(item)));
  };

  const toggleAction = (id: string, checked: boolean, parentId: string) => {
    if (isSystemRole) return;
    setErrors((prev) => ({ ...prev, permissions: undefined }));

    if (checked) {
      setEnabledScreens((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]));
      setAdvancedPerms((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }

    setAdvancedPerms((prev) => prev.filter((item) => item !== id));
  };

  const handleEnableAll = () => {
    if (isSystemRole) return;
    setErrors((prev) => ({ ...prev, permissions: undefined }));

    if (enabledScreens.length === ALL_ROLE_MODULE_IDS.length) {
      setEnabledScreens([]);
      setAdvancedPerms([]);
      return;
    }

    setEnabledScreens(ALL_ROLE_MODULE_IDS);
    setAdvancedPerms(ALL_ROLE_ACTION_IDS);
  };

  const handleSave = async () => {
    const cleanRoleName = roleName.trim();
    const cleanDescription = description.trim();
    const nextErrors: { roleName?: string; permissions?: string } = {};

    if (!cleanRoleName) {
      nextErrors.roleName = "Vui lòng nhập tên vai trò.";
    }

    if (enabledScreens.length === 0) {
      nextErrors.permissions = "Vui lòng chọn ít nhất 1 quyền truy cập.";
    }

    if (nextErrors.roleName || nextErrors.permissions) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSaving(true);
      setErrors({});
      await RoleService.update(roleId, {
        roleName: cleanRoleName,
        description: cleanDescription,
        status,
        enabledScreens,
        advancedPerms,
      });

      toast.success("Cập nhật vai trò thành công!");
      router.push("/admin/employees/roles");
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Không thể cập nhật vai trò.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3 text-slate-800">
      <div className={cn("mt-2 mb-8 space-y-4", isSystemRole && "opacity-80")}>
          <div className="flex items-center justify-between">
            <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
              Chỉnh sửa vai trò
            </h1>
            {isSystemRole && (
              <div className="rounded border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium uppercase text-amber-700">
                <Lock size={12} className="mr-1 inline" /> Vai trò hệ thống
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-3 text-blue-600">
              <span className="text-[11px] font-bold text-slate-800">1. Thông tin cơ bản</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
              <div className="space-y-1.5 xl:col-span-4">
                <Label className="text-[10px] font-medium text-slate-400">
                  Tên vai trò *
                </Label>
                <Input
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    setErrors((prev) => ({ ...prev, roleName: undefined }));
                  }}
                  disabled={isSystemRole}
                  className={cn("h-9", errors.roleName && "border-rose-500 focus-visible:ring-rose-500")}
                />
                {errors.roleName && (
                  <p className="text-[11px] text-rose-500">{errors.roleName}</p>
                )}
              </div>

              <div className="space-y-1.5 xl:col-span-5">
                <Label className="text-[10px] font-medium text-slate-400">
                  Mô tả chức năng
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSystemRole}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5 xl:col-span-3">
                <Label className="text-[10px] font-medium text-slate-400">
                  Trạng thái
                </Label>
                <Select value={status} onValueChange={setStatus} disabled={isSystemRole}>
                  <SelectTrigger className="h-9 text-[12px] font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng sử dụng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800">
                2. Phân quyền sử dụng module
              </span>
              {!isSystemRole && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableAll}
                  className="h-7 text-[10px] font-medium border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  {enabledScreens.length === ALL_ROLE_MODULE_IDS.length ? "Tắt tất cả" : "Bật tất cả"}
                </Button>
              )}
            </div>
            {errors.permissions && (
              <div className="px-6 pt-3">
                <p className="text-[11px] text-rose-500">{errors.permissions}</p>
              </div>
            )}

            <div className="p-6 space-y-1">
              {ROLE_PERMISSION_STRUCTURE.map((group) => (
                <div key={group.group} className="space-y-1">
                  <div className="bg-slate-100/50 px-4 py-2 border-y border-slate-200 mt-4 first:mt-0">
                    <span className="text-[12px] font-medium text-slate-800">
                      {group.group}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.screens.map((screen) => {
                      const isEnabled = enabledScreens.includes(screen.id);

                      return (
                        <div key={screen.id} className="bg-white border-b last:border-0">
                          <div
                            className={cn(
                              "flex items-center justify-between py-4 px-6 transition-all",
                              isSystemRole
                                ? "cursor-not-allowed"
                                : "cursor-pointer",
                              isEnabled ? "bg-blue-50/50" : "hover:bg-slate-50"
                            )}
                            onClick={() => toggleModule(screen.id, !isEnabled)}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm",
                                  isEnabled ? "bg-blue-600 animate-pulse" : "bg-slate-200"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-[14px] font-medium",
                                  isEnabled ? "text-blue-700" : "text-slate-600"
                                )}
                              >
                                {screen.label}
                              </span>
                            </div>

                            <div
                              className="flex items-center gap-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span
                                className={cn(
                                  "text-[10px] font-medium w-16 text-right transition-colors",
                                  isEnabled ? "text-blue-600" : "text-slate-300"
                                )}
                              >
                                {isEnabled ? "Đang bật" : "Đang tắt"}
                              </span>
                              <div
                                className={cn(
                                  "relative w-14 h-7 rounded-full transition-all border-2 shadow-sm",
                                  isEnabled
                                    ? "bg-blue-600 border-blue-600"
                                    : "bg-slate-200 border-slate-200"
                                )}
                                onClick={() => toggleModule(screen.id, !isEnabled)}
                              >
                                <div
                                  className={cn(
                                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md",
                                    isEnabled ? "translate-x-7" : "translate-x-0"
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          {isEnabled && screen.advanced.length > 0 && (
                            <div className="ml-10 mt-1 mb-4 grid grid-cols-3 gap-3 border-l-2 border-blue-100 pl-6 py-2 animate-in slide-in-from-left-2 duration-300">
                              {screen.advanced.map((adv) => (
                                <div
                                  key={adv.id}
                                  className="flex items-center gap-3 cursor-pointer group/action"
                                  onClick={() =>
                                    toggleAction(
                                      adv.id,
                                      !advancedPerms.includes(adv.id),
                                      screen.id
                                    )
                                  }
                                >
                                  <Checkbox
                                    checked={advancedPerms.includes(adv.id)}
                                    disabled={isSystemRole}
                                    onCheckedChange={(val) =>
                                      toggleAction(adv.id, val as boolean, screen.id)
                                    }
                                    className="data-[state=checked]:bg-blue-600"
                                  />
                                  <Label className="text-[12px] font-medium text-slate-500 cursor-pointer group-hover/action:text-blue-600">
                                    {adv.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        className="font-medium text-[11px] text-slate-400"
        >
          Hủy bỏ
        </Button>
        {!isSystemRole && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-10 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl"
          >
            {saving ? <Loader2 className="animate-spin mr-2" /> : null}
            Cập nhật vai trò
          </Button>
        )}
      </div>
    </div>
  );
}
