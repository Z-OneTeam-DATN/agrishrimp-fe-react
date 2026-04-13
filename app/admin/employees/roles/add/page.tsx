"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
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
} from "../permission-config";

export default function AddRolePage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { isLoadingAuth } = useAuthStore();

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [enabledScreens, setEnabledScreens] = useState<string[]>([]);
  const [advancedPerms, setAdvancedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !hasPermission(P.ROLE_CREATE)) {
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

  const toggleModule = (id: string, checked: boolean) => {
    if (checked) {
      setEnabledScreens((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }

    setEnabledScreens((prev) => prev.filter((item) => item !== id));
    const childIds = actionMap.get(id) || [];
    setAdvancedPerms((prev) => prev.filter((item) => !childIds.includes(item)));
  };

  const toggleAction = (id: string, checked: boolean, parentId: string) => {
    if (checked) {
      setEnabledScreens((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]));
      setAdvancedPerms((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }

    setAdvancedPerms((prev) => prev.filter((item) => item !== id));
  };

  const handleEnableAll = () => {
    setEnabledScreens(ALL_ROLE_MODULE_IDS);
    setAdvancedPerms(ALL_ROLE_ACTION_IDS);
  };

  const handleSave = async () => {
    const cleanRoleName = roleName.trim();
    const cleanDescription = description.trim();

    if (!cleanRoleName) {
      return toast.error("Vui lòng nhập tên vai trò.");
    }

    if (enabledScreens.length === 0) {
      return toast.error("Vui lòng chọn ít nhất 1 quyền truy cập.");
    }

    try {
      setSaving(true);

      await RoleService.create({
        roleName: cleanRoleName,
        description: cleanDescription,
        status,
        enabledScreens,
        advancedPerms,
      });

      toast.success("Tạo vai trò thành công!");
      router.push("/admin/employees/roles");
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Không thể tạo vai trò.");
    } finally {
      setSaving(false);
    }
  };

  const coverage = Math.round((enabledScreens.length / ALL_ROLE_MODULE_IDS.length) * 100) || 0;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-[100px] bg-slate-50 min-h-screen text-slate-800">
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[16px] font-bold uppercase">Thêm vai trò mới</h1>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-6">
        <div className="col-span-9 space-y-4">
          <div className="bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
              <ShieldCheck size={16} />
              <span className="text-[11px] font-black uppercase text-slate-800">
                1. Thông tin cơ bản
              </span>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Tên vai trò *
                </Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="h-9 font-bold"
                  placeholder="Nhập tên vai trò..."
                />
              </div>

              <div className="col-span-8 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-slate-400">
                  Mô tả chức năng
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-9"
                  placeholder="Mô tả tóm tắt..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                2. Phân quyền sử dụng module
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnableAll}
                className="h-7 text-[10px] font-black border-blue-200 text-blue-600 hover:bg-blue-50 uppercase"
              >
                Bật tất cả
              </Button>
            </div>

            <div className="p-6 space-y-1">
              {ROLE_PERMISSION_STRUCTURE.map((group) => (
                <div key={group.group} className="space-y-1">
                  <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2 border-y border-slate-200 mt-4 first:mt-0">
                    <group.icon size={14} className="text-slate-500" />
                    <span className="text-[12px] font-black uppercase text-slate-800">
                      {group.group}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {group.screens.map((screen) => {
                      const isEnabled = enabledScreens.includes(screen.id);

                      return (
                        <div key={screen.id} className="bg-white">
                          <div
                            className={cn(
                              "flex items-center justify-between py-4 px-6 cursor-pointer transition-all",
                              isEnabled ? "bg-blue-50/50" : "hover:bg-slate-50"
                            )}
                            onClick={() => toggleModule(screen.id, !isEnabled)}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  isEnabled ? "bg-blue-600 animate-pulse" : "bg-slate-200"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-[14px] font-bold uppercase",
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
                                  "text-[10px] font-black w-16 text-right",
                                  isEnabled ? "text-blue-600" : "text-slate-300"
                                )}
                              >
                                {isEnabled ? "ĐANG BẬT" : "ĐANG TẮT"}
                              </span>
                              <div
                                className={cn(
                                  "relative w-14 h-7 rounded-full transition-all border-2",
                                  isEnabled
                                    ? "bg-blue-600 border-blue-600"
                                    : "bg-slate-200 border-slate-200"
                                )}
                                onClick={() => toggleModule(screen.id, !isEnabled)}
                              >
                                <div
                                  className={cn(
                                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
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
                                    onCheckedChange={(val) =>
                                      toggleAction(adv.id, val as boolean, screen.id)
                                    }
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

        <div className="col-span-3 space-y-4">
          <div className="bg-white border p-5 shadow-sm space-y-4">
            <Label className="text-[10px] font-bold uppercase text-slate-400 block border-b pb-2">
              Trạng thái
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-[12px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem>
                <SelectItem value="inactive">NGỪNG SỬ DỤNG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white border p-5 shadow-sm space-y-5">
            <Label className="text-[10px] font-bold uppercase text-slate-400 block border-b pb-2">
              Thống kê
            </Label>
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Độ phủ
              </span>
              <span className="text-[14px] font-black text-blue-600">{coverage}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100">
              <div
                className="h-full bg-blue-600 transition-all duration-700"
                style={{ width: `${coverage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999]">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="font-bold uppercase text-[11px] text-slate-400"
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-10 text-[11px] font-black bg-slate-900 text-white uppercase shadow-xl"
        >
          {saving ? <Loader2 className="animate-spin mr-2" /> : null}
          Lưu vai trò
        </Button>
      </div>
    </div>
  );
}
