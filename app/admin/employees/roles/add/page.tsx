"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  X,
  Settings,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Action {
  id: "view" | "add" | "edit" | "delete";
  label: string;
}

interface Screen {
  id: string;
  label: string;
}

interface PermissionGroup {
  id: string;
  label: string;
  screens: Screen[];
}

const ACTIONS: Action[] = [
  { id: "view", label: "Xem" },
  { id: "add", label: "Thêm" },
  { id: "edit", label: "Sửa" },
  { id: "delete", label: "Xóa" },
];

const PERMISSION_STRUCTURE: PermissionGroup[] = [
  {
    id: "hang_hoa",
    label: "Hàng hóa",
    screens: [
      { id: "products", label: "Sản phẩm" },
      { id: "categories", label: "Danh mục" },
      { id: "variants", label: "Thuộc tính" },
    ],
  },
  {
    id: "giao_dich_kho",
    label: "Giao dịch kho",
    screens: [
      { id: "receipts", label: "Nhập hàng" },
      { id: "exports", label: "Xuất hàng" },
      { id: "transfers", label: "Điều chuyển" },
      { id: "inventory_checks", label: "Kiểm kê" },
    ],
  },
  {
    id: "doi_tac",
    label: "Đối tác",
    screens: [
      { id: "suppliers", label: "Nhà cung cấp" },
      { id: "customers", label: "Khách hàng" },
    ],
  },
  {
    id: "bao_cao",
    label: "Báo cáo",
    screens: [
      { id: "sales_report", label: "Báo cáo bán hàng" },
      { id: "inventory_report", label: "Báo cáo kho" },
      { id: "financial_report", label: "Báo cáo tài chính" },
    ],
  },
  {
    id: "he_thong",
    label: "Hệ thống",
    screens: [
      { id: "employees", label: "Nhân viên hệ thống" },
      { id: "admin_settings", label: "Cấu hình & Quản trị" },
      { id: "branches", label: "Chi nhánh & Kho" },
    ],
  },
];

type PermissionsState = Record<string, string[]>;

export default function AddRolePage() {
  const router = useRouter();
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [permissions, setPermissions] = useState<PermissionsState>({});

  const stats = useMemo(() => {
    const actionCount = Object.values(permissions).flat().length;
    const totalPossibleActions =
      PERMISSION_STRUCTURE.flatMap((g) => g.screens).length * 4;
    return {
      actionCount,
      progress:
        totalPossibleActions > 0
          ? Math.round((actionCount / totalPossibleActions) * 100)
          : 0,
    };
  }, [permissions]);

  const toggleAction = (screenId: string, actionId: string) => {
    setPermissions((prev) => {
      const current = prev[screenId] || [];
      let next = current.includes(actionId)
        ? current.filter((a) => a !== actionId)
        : [...current, actionId];
      if (
        ["add", "edit", "delete"].includes(actionId) &&
        next.includes(actionId) &&
        !next.includes("view")
      )
        next.push("view");
      if (actionId === "view" && !next.includes("view")) next = [];
      return { ...prev, [screenId]: next };
    });
  };

  const applyPreset = (
    groupId: string,
    preset: "view" | "staff" | "manager" | "full",
  ) => {
    const group = PERMISSION_STRUCTURE.find((g) => g.id === groupId);
    if (!group) return;
    const newPermissions = { ...permissions };
    group.screens.forEach((screen) => {
      switch (preset) {
        case "view":
          newPermissions[screen.id] = ["view"];
          break;
        case "staff":
          newPermissions[screen.id] = ["view", "add", "edit"];
          break;
        case "manager":
        case "full":
          newPermissions[screen.id] = ["view", "add", "edit", "delete"];
          break;
      }
    });
    setPermissions(newPermissions);
  };

  const handleSave = () => {
    if (!roleName) {
      toast.error("Vui lòng nhập tên");
      return;
    }
    toast.success("Thành công!");
    router.push("/admin/employees/roles");
  };

  const filteredStructure = useMemo(() => {
    if (!searchTerm) return PERMISSION_STRUCTURE;
    return PERMISSION_STRUCTURE.map((group) => ({
      ...group,
      screens: group.screens.filter((s) =>
        s.label.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    })).filter((group) => group.screens.length > 0);
  }, [searchTerm]);

  return (
    <div className="space-y-4 pb-[100px] bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-400"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-[16px] font-bold text-slate-800 uppercase">
            Thêm vai trò
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-300">
            <Settings size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-slate-300"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">
                  Tên vai trò *
                </Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="h-9 text-[13px] border-slate-200 rounded-none focus:ring-0"
                />
              </div>
              <div className="md:col-span-8 space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">
                  Ghi chú
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-9 text-[13px] border-slate-200 rounded-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 uppercase">
                Phân quyền chức năng
              </span>
              <div className="relative w-64">
                <Search
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300"
                  size={12}
                />
                <Input
                  placeholder="Tìm chức năng..."
                  className="pl-7 h-7 text-[11px] border-slate-200 rounded-none focus:ring-0 bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 space-y-8">
              {filteredStructure.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                      {group.label}
                    </span>
                    <div className="flex gap-1">
                      {["view", "staff", "full"].map((p) => (
                        <button
                          key={p}
                          onClick={() => applyPreset(group.id, p as any)}
                          className="text-[9px] font-bold px-2 py-0.5 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 uppercase"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Table className="table-fixed">
                    <TableBody>
                      {group.screens.map((screen) => {
                        const screenPerms = permissions[screen.id] || [];
                        return (
                          <TableRow
                            key={screen.id}
                            className="hover:bg-slate-50 border-none group"
                          >
                            <TableCell className="py-2 text-[13px] text-slate-600 w-[200px]">
                              {screen.label}
                            </TableCell>
                            {ACTIONS.map((action) => (
                              <TableCell
                                key={action.id}
                                className="text-center w-[80px]"
                              >
                                <div className="flex items-center gap-1 justify-center">
                                  <Checkbox
                                    checked={screenPerms.includes(action.id)}
                                    onCheckedChange={() =>
                                      toggleAction(screen.id, action.id)
                                    }
                                    className="h-4 w-4 border-slate-300 rounded-none"
                                  />
                                  <span className="text-[10px] text-slate-400">
                                    {action.label}
                                  </span>
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm space-y-4">
            <Label className="text-[10px] font-bold text-slate-400 uppercase block border-b pb-2">
              Trạng thái
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-[12px] border-slate-200 rounded-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Ngừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm space-y-4">
            <Label className="text-[10px] font-bold text-slate-400 uppercase block border-b pb-2">
              Tóm tắt quyền
            </Label>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Mức độ
                </span>
                <span className="text-[14px] font-black text-slate-800">
                  {stats.progress}%
                </span>
              </div>
              <div className="w-full h-1 bg-slate-100">
                <div
                  className="h-full bg-slate-800 transition-all duration-500"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 italic leading-relaxed">
                Vai trò này quyết định khả năng thao tác dữ liệu trên toàn hệ
                thống.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-slate-200 p-3 flex items-center justify-end gap-3 z-[999]">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-400 font-bold uppercase text-[11px]"
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          className="h-9 px-8 text-[11px] font-bold bg-slate-900 text-white rounded-none uppercase"
        >
          Lưu vai trò
        </Button>
      </div>
    </div>
  );
}
