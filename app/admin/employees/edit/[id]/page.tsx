"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft, Save, X, Users, Building2, 
    ShieldCheck, Calendar, Mail, Phone, MapPin, 
    Key, Info, Loader2, UserCircle2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/axios";
import { EmployeeService } from "@/app/services/employee.service";
import { RoleService } from "@/app/services/RoleService";
import { BranchService } from "@/app/services/branchService";
import { RoleType } from "@/app/types/role.schema";
import { BranchType, UserRequest } from "@/app/types/employee.schema";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const userId = Number(params.id);

    // Form States
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        citizenId: "",
        dateOfBirth: "",
        roleId: "",
        branchId: "",
        gender: "1",
        status: "ACTIVE",
        address: ""
    });

    // Data States
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadInitData() {
            setLoading(true);
            try {
                // 1. Tải dữ liệu danh mục đồng thời
                const [rolesRes, branchesRes, userRes] = await Promise.all([
                    RoleService.getAll(),
                    BranchService.getAll(),
                    EmployeeService.getById(userId)
                ]);
                
                const rolesList = Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).content || [];
                setRoles(rolesList);

                const branchesList = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data as any).content || [];
                setBranches(branchesList);

                // 2. Điền dữ liệu nhân viên vào Form (Hydration)
                setFormData({
                    fullName: userRes.fullName || "",
                    email: userRes.email || "",
                    phoneNumber: userRes.phoneNumber || "",
                    citizenId: userRes.citizenId || "",
                    dateOfBirth: userRes.dateOfBirth ? userRes.dateOfBirth.split('T')[0] : "",
                    roleId: String(userRes.roleId),
                    branchId: String(userRes.branchId),
                    gender: userRes.gender === "MALE" ? "1" : userRes.gender === "FEMALE" ? "0" : "2",
                    status: userRes.status || "ACTIVE",
                    address: "" // Backend Response chưa có address? Bổ sung nếu cần
                });

            } catch (error) {
                console.error("Load Error:", error);
                toast.error("Không thể tải thông tin nhân viên.");
                router.push("/admin/employees");
            } finally {
                setLoading(false);
            }
        }
        loadInitData();
    }, [userId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.fullName.trim()) return toast.error("Vui lòng nhập họ tên.");
        if (formData.citizenId.length !== 12) return toast.error("Số CCCD phải đủ 12 chữ số.");

        try {
            setSaving(true);
            const payload: UserRequest = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                citizenId: formData.citizenId.trim(),
                dateOfBirth: formData.dateOfBirth,
                roleId: Number(formData.roleId),
                branchId: Number(formData.branchId),
                gender: Number(formData.gender),
                status: formData.status
            };

            await EmployeeService.update(userId, payload);
            toast.success("Cập nhật nhân viên thành công!");
            router.push("/admin/employees");
        } catch (error: any) {
            toast.error(getErrorMessage(error) || "Lỗi khi cập nhật nhân viên.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /><p className="text-sm font-medium text-slate-500">Đang tải dữ liệu nhân viên...</p></div>;

    return (
        <div className="space-y-4 pb-[100px] bg-slate-50 min-h-screen text-slate-800">
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-[16px] font-bold uppercase tracking-tight">Chỉnh sửa nhân viên: {formData.fullName}</h1>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-6">
                {/* LEFT COL */}
                <div className="col-span-8 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <Users size={16} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">1. Thông tin cá nhân</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Họ và tên *</Label>
                                    <Input name="fullName" value={formData.fullName} onChange={handleChange} className="h-9 text-[13px] font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Giới tính</Label>
                                    <Select value={formData.gender} onValueChange={(val) => handleSelectChange("gender", val)}>
                                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Nam</SelectItem>
                                            <SelectItem value="0">Nữ</SelectItem>
                                            <SelectItem value="2">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Mail size={10} /> Email (Tài khoản)</Label>
                                    <Input name="email" value={formData.email} disabled className="h-9 text-[13px] bg-slate-50 cursor-not-allowed" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Phone size={10} /> Số điện thoại *</Label>
                                    <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="h-9 text-[13px]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Số CCCD (12 số) *</Label>
                                    <Input name="citizenId" value={formData.citizenId} onChange={handleChange} className="h-9 text-[13px]" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Ngày sinh *</Label>
                                    <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="h-9 text-[13px]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <Building2 size={16} />
                            <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">2. Công tác & Phân quyền</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Chi nhánh làm việc *</Label>
                                <Select value={formData.branchId} onValueChange={(val) => handleSelectChange("branchId", val)}>
                                    <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Vai trò hệ thống *</Label>
                                <Select value={formData.roleId} onValueChange={(val) => handleSelectChange("roleId", val)}>
                                    <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.displayName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col items-center">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-4 self-start">Tài khoản</Label>
                        <UserCircle2 size={80} className="text-slate-200 mb-4" />
                        <div className="w-full space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Trạng thái</Label>
                                <Select value={formData.status} onValueChange={(val) => handleSelectChange("status", val)}>
                                    <SelectTrigger className="h-9 text-[12px] font-bold uppercase"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">ĐANG HOẠT ĐỘNG</SelectItem>
                                        <SelectItem value="INACTIVE" className="text-rose-600 font-bold">TẠM KHÓA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-700">
                            <Lock size={16} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Bảo mật</span>
                        </div>
                        <p className="text-[11px] text-amber-600 font-medium leading-relaxed italic">
                            Email là tài khoản định danh không thể thay đổi. Mật khẩu có thể được đặt lại trong phần Quản lý tài khoản.
                        </p>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
                <Button variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[11px]">Hủy bỏ</Button>
                <Button onClick={handleSave} disabled={saving} className="h-9 px-10 text-[11px] font-black bg-slate-900 text-white uppercase shadow-xl">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : "CẬP NHẬT NHÂN VIÊN"}
                </Button>
            </div>
        </div>
    );
}
