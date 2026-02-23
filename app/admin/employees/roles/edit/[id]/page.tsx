"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft, Package, Warehouse, Users, TrendingUp,
    Building2, LayoutDashboard, Truck, ShieldCheck, Loader2, Info, Settings, Lock, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { RoleService } from "@/app/services/RoleService";

// 1. TỪ ĐIỂN DỊCH THUẬN (FE -> BE)
const FE_TO_BE_MAP: Record<string, string> = {
  "dashboard": "DASHBOARD_VIEW",
  "employees": "USER_MANAGE",
  "admin_settings": "SETTING_MANAGE",
  "products": "PRODUCT_MANAGE",
  "categories": "CATEGORY_MANAGE",
  "variants": "VARIANT_MANAGE",
  "receipts": "IMPORT_MANAGE",
  "receipt_approve": "IMPORT_APPROVE",
  "exports": "EXPORT_MANAGE",
  "export_approve": "EXPORT_APPROVE",
  "export_force_edit": "EXPORT_FORCE_EDIT",
  "transfers": "TRANSFER_MANAGE",
  "transfer_approve": "TRANSFER_APPROVE",
  "inventory_checks": "INVENTORY_CHECK_MANAGE",
  "audit_finalize": "INVENTORY_BALANCE",
  "shipping_overview": "SHIPPING_MANAGE",
  "suppliers": "SUPPLIER_MANAGE",
  "customers": "CUSTOMER_MANAGE",
  "sales_report": "REPORT_SALES_VIEW",
  "inventory_report": "REPORT_INVENTORY_VIEW",
  "branches": "BRANCH_MANAGE"
};

// 2. TỪ ĐIỂN DỊCH NGƯỢC (BE -> FE)
const BE_TO_FE_MAP: Record<string, { type: 'screen' | 'advanced', id: string }> = {
  "PRODUCT_MANAGE": { type: 'screen', id: 'products' },
  "CATEGORY_MANAGE": { type: 'screen', id: 'categories' },
  "VARIANT_MANAGE": { type: 'screen', id: 'variants' },
  "IMPORT_MANAGE": { type: 'screen', id: 'receipts' },
  "IMPORT_APPROVE": { type: 'advanced', id: 'receipt_approve' },
  "EXPORT_MANAGE": { type: 'screen', id: 'exports' },
  "EXPORT_APPROVE": { type: 'advanced', id: 'export_approve' },
  "EXPORT_FORCE_EDIT": { type: 'advanced', id: 'export_force_edit' },
  "TRANSFER_MANAGE": { type: 'screen', id: 'transfers' },
  "TRANSFER_APPROVE": { type: 'advanced', id: 'transfer_approve' },
  "INVENTORY_CHECK_MANAGE": { type: 'screen', id: 'inventory_checks' },
  "INVENTORY_BALANCE": { type: 'advanced', id: 'audit_finalize' },
  "SHIPPING_MANAGE": { type: 'screen', id: 'shipping_overview' },
  "SUPPLIER_MANAGE": { type: 'screen', id: 'suppliers' },
  "CUSTOMER_MANAGE": { type: 'screen', id: 'customers' },
  "REPORT_SALES_VIEW": { type: 'screen', id: 'sales_report' },
  "REPORT_INVENTORY_VIEW": { type: 'screen', id: 'inventory_report' },
  "DASHBOARD_VIEW": { type: 'screen', id: 'dashboard' },
  "USER_MANAGE": { type: 'screen', id: 'employees' },
  "SETTING_MANAGE": { type: 'screen', id: 'admin_settings' },
  "BRANCH_MANAGE": { type: 'screen', id: 'branches' }
};

// 3. BỘ KHUNG GIAO DIỆN
const PERMISSION_STRUCTURE = [
    { group: "TỔNG QUAN", icon: LayoutDashboard, screens: [{ id: "dashboard", label: "Bảng điều khiển", advanced: [] }] },
    { group: "NHÂN VIÊN HỆ THỐNG", icon: Building2, screens: [{ id: "employees", label: "Danh sách nhân viên", advanced: [] }, { id: "admin_settings", label: "Cài đặt phân quyền", advanced: [] }] },
    { group: "SẢN PHẨM", icon: Package, screens: [{ id: "products", label: "Quản lý sản phẩm", advanced: [] }, { id: "categories", label: "Danh mục hàng hóa", advanced: [] }, { id: "variants", label: "Biến thể sản phẩm", advanced: [] }] },
    { group: "NHẬP HÀNG", icon: Warehouse, screens: [{ id: "receipts", label: "Phiếu nhập kho", advanced: [{ id: "receipt_approve", label: "Duyệt nhập kho" }] }, { id: "inventory_checks", label: "Kiểm kê kho", advanced: [{ id: "audit_finalize", label: "Cân bằng kho" }] }] },
    { group: "TỔNG QUAN VẬN CHUYỂN", icon: Truck, screens: [{ id: "shipping_overview", label: "Theo dõi đơn vận", advanced: [] }] },
    { group: "NHÀ CUNG CẤP", icon: Users, screens: [{ id: "suppliers", label: "Danh sách nhà cung cấp", advanced: [] }, { id: "customers", label: "Danh sách khách hàng", advanced: [] }] },
    { group: "BÁO CÁO BÁN HÀNG", icon: TrendingUp, screens: [{ id: "sales_report", label: "Báo cáo doanh thu", advanced: [] }, { id: "inventory_report", label: "Báo cáo tồn kho", advanced: [] }] },
    { group: "CÀI ĐẶT HỆ THỐNG", icon: Settings, screens: [{ id: "branches", label: "Quản lý chi nhánh", advanced: [] }] }
];

export default function EditRolePage() {
    const router = useRouter();
    const params = useParams();
    const roleId = Number(params.id);

    const [roleName, setRoleName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("active");
    const [enabledScreens, setEnabledScreens] = useState<string[]>([]);
    const [advancedPerms, setAdvancedPerms] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSystemRole, setIsSystemRole] = useState(false);

    const [moduleActionsMap, setModuleActionsMap] = useState<Map<string, string[]>>(new Map());

    useEffect(() => {
        const fetchRoleDetails = async () => {
            try {
                setLoading(true);
                const roleData = await RoleService.getById(roleId);
                
                setRoleName(roleData.displayName || "");
                setDescription(roleData.description || "");
                setStatus(roleData.isActive ? "active" : "inactive");
                setIsSystemRole(roleData.isSystem);

                // BƯỚC 2: DỊCH NGƯỢC ĐỂ BẬT CÔNG TẮC
                if (roleData.permissionCodes && Array.isArray(roleData.permissionCodes)) {
                    const screensToEnable: string[] = [];
                    const advancedToEnable: string[] = [];

                    roleData.permissionCodes.forEach((beCode: string) => {
                        const mapped = BE_TO_FE_MAP[beCode];
                        if (mapped) {
                            if (mapped.type === 'screen') screensToEnable.push(mapped.id);
                            if (mapped.type === 'advanced') advancedToEnable.push(mapped.id);
                        }
                    });

                    setEnabledScreens(screensToEnable);
                    setAdvancedPerms(advancedToEnable);
                }

                const moduleMap = new Map<string, string[]>();
                PERMISSION_STRUCTURE.forEach(group => {
                    group.screens.forEach(screen => {
                        moduleMap.set(screen.id, screen.advanced ? screen.advanced.map(a => a.id) : []);
                    });
                });
                setModuleActionsMap(moduleMap);

            } catch (error) {
                toast.error("Lỗi khi tải dữ liệu vai trò");
                router.push("/admin/employees/roles");
            } finally {
                setLoading(false);
            }
        };
        fetchRoleDetails();
    }, [roleId]);

    const toggleModule = (id: string, checked: boolean) => {
        if (checked) {
            setEnabledScreens(prev => prev.includes(id) ? prev : [...prev, id]);
        } else {
            setEnabledScreens(prev => prev.filter(x => x !== id));
            const childs = moduleActionsMap.get(id) || [];
            setAdvancedPerms(prev => prev.filter(x => !childs.includes(x)));
        }
    };

    const toggleAction = (id: string, checked: boolean, parentId: string) => {
        if (checked) {
            if (!enabledScreens.includes(parentId)) {
                setEnabledScreens(prev => prev.includes(parentId) ? prev : [...prev, parentId]);
            }
            setAdvancedPerms(prev => prev.includes(id) ? prev : [...prev, id]);
        } else {
            setAdvancedPerms(prev => prev.filter(x => x !== id));
        }
    };

    const handleSave = async () => {
        if (!roleName.trim()) return toast.error("Vui lòng nhập tên");
        try {
            setSaving(true);
            
            // CHỈ gửi đúng các trường mà Swagger yêu cầu (Gọt dũa Payload)
            const cleanPayload = {
                roleName: roleName.trim(),
                description: description.trim(),
                status: status, // "active" hoặc "inactive"
                enabledScreens: enabledScreens.map(s => FE_TO_BE_MAP[s] || s),
                advancedPerms: advancedPerms.map(a => FE_TO_BE_MAP[a] || a)
            };

            console.log("🚀 Đang gửi Payload gọt dũa:", cleanPayload);

            try {
                // ID truyền qua URL, Body chỉ chứa cleanPayload
                await RoleService.update(roleId, cleanPayload); 
                toast.success("Cập nhật thành công!");
                router.push("/admin/employees/roles");
            } catch (error) {
                console.error("Lỗi cập nhật:", error);
                throw error;
            }
        } catch (error: any) {
            if (error.response?.status === 409) {
                toast.error("Tên vai trò này đã tồn tại trên hệ thống.");
            } else {
                toast.error(getErrorMessage(error) || "Lỗi khi cập nhật");
            }
        } finally {
            setSaving(false);
        }
    };

    const coverage = Math.round((enabledScreens.length / PERMISSION_STRUCTURE.flatMap(g => g.screens).length) * 100);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-4 pb-[100px] bg-slate-50 min-h-screen text-slate-800">
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft size={20} /></Button>
                    <h1 className="text-[16px] font-bold uppercase tracking-tight">Chỉnh sửa vai trò: {roleName}</h1>
                </div>
                {isSystemRole && <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded border border-amber-200 text-[11px] font-bold uppercase"><Lock size={12} className="inline mr-1" /> Vai trò hệ thống</div>}
            </div>

            <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-6">
                <div className={cn("col-span-9 space-y-4", isSystemRole && "opacity-80 pointer-events-none")}>
                    <div className="bg-white border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <ShieldCheck size={16} /><span className="text-[11px] font-black uppercase">1. Thông tin cơ bản</span>
                        </div>
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-4 space-y-1.5"><Label className="text-[10px] font-bold uppercase text-slate-400">Tên vai trò *</Label><Input value={roleName} onChange={(e) => setRoleName(e.target.value)} disabled={isSystemRole} className="h-9 font-bold" /></div>
                            <div className="col-span-8 space-y-1.5"><Label className="text-[10px] font-bold uppercase text-slate-400">Mô tả chức năng</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSystemRole} className="h-9" /></div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-3 border-b bg-slate-50/50 flex items-center justify-between">
                            <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-slate-800">2. Phân quyền sử dụng module</span></div>
                            {!isSystemRole && <Button variant="outline" size="sm" onClick={() => setEnabledScreens(PERMISSION_STRUCTURE.flatMap(g => g.screens.map(s => s.id)))} className="h-7 text-[10px] font-black border-blue-200 text-blue-600 hover:bg-blue-50 uppercase">Bật tất cả</Button>}
                        </div>
                        <div className="p-6 space-y-1">
                            {PERMISSION_STRUCTURE.map((group, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2 border-y border-slate-200 mt-4 first:mt-0"><group.icon size={14} className="text-slate-500" /><span className="text-[12px] font-black uppercase text-slate-800">{group.group}</span></div>
                                    <div className="divide-y divide-slate-100">
                                        {group.screens.map((screen) => {
                                            const isEnabled = enabledScreens.includes(screen.id);
                                            return (
                                                <div key={screen.id} className="bg-white border-b last:border-0">
                                                    <div 
                                                        className={cn("flex items-center justify-between py-4 px-6 cursor-pointer transition-all", isEnabled ? "bg-blue-50/50" : "hover:bg-slate-50")}
                                                        onClick={() => toggleModule(screen.id, !isEnabled)}
                                                    >
                                                        <div className="flex items-center gap-4"><div className={cn("w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm", isEnabled ? "bg-blue-600 animate-pulse" : "bg-slate-200")} /><span className={cn("text-[14px] font-bold uppercase", isEnabled ? "text-blue-700" : "text-slate-600")}>{screen.label}</span></div>
                                                        <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                            <span className={cn("text-[10px] font-black w-16 text-right transition-colors", isEnabled ? "text-blue-600" : "text-slate-300")}>{isEnabled ? "ĐANG BẬT" : "ĐANG TẮT"}</span>
                                                            <div 
                                                                className={cn("relative w-14 h-7 rounded-full transition-all border-2 shadow-sm", isEnabled ? "bg-blue-600 border-blue-600" : "bg-slate-200 border-slate-200")}
                                                                onClick={() => toggleModule(screen.id, !isEnabled)}
                                                            >
                                                                <div className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md", isEnabled ? "translate-x-7" : "translate-x-0")} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isEnabled && screen.advanced.length > 0 && (
                                                        <div className="ml-10 mt-1 mb-4 grid grid-cols-3 gap-3 border-l-2 border-blue-100 pl-6 py-2 animate-in slide-in-from-left-2 duration-300">
                                                            {screen.advanced.map((adv) => (
                                                                <div key={adv.id} className="flex items-center gap-3 cursor-pointer group/action" onClick={() => toggleAction(adv.id, !advancedPerms.includes(adv.id), screen.id)}>
                                                                    <Checkbox checked={advancedPerms.includes(adv.id)} onCheckedChange={(val) => toggleAction(adv.id, val as boolean, screen.id)} className="data-[state=checked]:bg-blue-600" />
                                                                    <Label className="text-[12px] font-medium text-slate-500 cursor-pointer group-hover/action:text-blue-600">{adv.label}</Label>
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

                                    <div className="bg-white border p-5 shadow-sm space-y-4"><Label className="text-[10px] font-bold uppercase text-slate-400 block border-b pb-2">Trạng thái</Label><Select value={status} onValueChange={setStatus} disabled={isSystemRole}><SelectTrigger className="h-8 text-[12px] font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">ĐANG HOẠT ĐỘNG</SelectItem><SelectItem value="inactive">NGỪNG SỬ DỤNG</SelectItem></SelectContent></Select></div>

                                    <div className="bg-white border p-5 shadow-sm space-y-5">

                                        <Label className="text-[10px] font-bold uppercase text-slate-400 block border-b pb-2">Thống kê</Label>

                <div className="flex justify-between items-end mb-1"><span className="text-[10px] font-black text-slate-500 uppercase">Độ phủ</span><span className="text-[14px] font-black text-blue-600">{coverage}%</span></div><div className="w-full h-1 bg-slate-100"><div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${coverage}%` }} /></div></div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
                <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[11px] text-slate-400">Hủy bỏ</Button>
                {!isSystemRole && <Button onClick={handleSave} disabled={saving} className="h-9 px-10 text-[11px] font-black bg-slate-900 text-white uppercase shadow-xl">{saving ? <Loader2 className="animate-spin mr-2" /> : null} CẬP NHẬT VAI TRÒ</Button>}
            </div>
        </div>
    );
}
