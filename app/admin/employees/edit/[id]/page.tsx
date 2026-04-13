"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ChevronLeft, Users,
    Mail, Phone, MapPin, 
    Lock, Loader2, Camera, UserCircle2, Briefcase, Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage, apiJava } from "@/lib/axios";
import { EmployeeService } from "@/app/services/employee.service";
import { RoleService } from "@/app/services/RoleService";
import { BranchService } from "@/app/services/branchService";
import { RoleType } from "@/app/types/role.schema";
import { BranchType, UserRequest, EmployeeUpdateSchema, EmployeeUpdateInput } from "@/app/types/employee.schema";
import { useAuthStore } from "@/stores/useAuthStore";
import { canManageSystemAdminRoles } from "@/lib/roles";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const userId = Number(params.id);
    const { user: currentUser, isLoadingAuth } = useAuthStore();
    const { hasAllPermissions } = usePermissions();

    // Data States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userEmail, setUserEmail] = useState<string>("");

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        setError,
        formState: { errors },
    } = useForm<EmployeeUpdateInput>({
        resolver: zodResolver(EmployeeUpdateSchema),
    });

    const currentGender = watch("gender");
    const currentStatus = watch("status");
    const currentBranchId = watch("branchId");
    const currentRoleId = watch("roleId");

    useEffect(() => {
        if (!isLoadingAuth && !hasAllPermissions([P.STAFF_VIEW, P.STAFF_UPDATE])) {
            router.push("/admin/forbidden");
        }
    }, [hasAllPermissions, isLoadingAuth, router]);

    useEffect(() => {
        if (isLoadingAuth || !hasAllPermissions([P.STAFF_VIEW, P.STAFF_UPDATE])) {
            return;
        }

        async function loadInitData() {
            setLoading(true);
            try {
                const [rolesRes, branchesRes, userRes] = await Promise.all([
                    RoleService.getAll(),
                    BranchService.getAll(),
                    EmployeeService.getById(userId)
                ]);
                
                let rolesList = Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).content || [];
                rolesList = rolesList.filter((r: RoleType) => {
                    const slug = r.slug.toLowerCase();
                    if (slug === "user" || slug === "customer") return false;
                    if (!canManageSystemAdminRoles(currentUser?.role) && (slug === "admin" || slug === "super_admin")) return false;
                    return true;
                });
                setRoles(rolesList);

                const branchesList = Array.isArray(branchesRes) ? branchesRes : (branchesRes as any).content || [];
                setBranches(branchesList);

                // Lưu email riêng (không nằm trong schema update)
                setUserEmail(userRes.email || "");

                // Populate form
                reset({
                    fullName: userRes.fullName || "",
                    employeeCode: userRes.employeeCode || "",
                    phoneNumber: userRes.phoneNumber || "",
                    citizenId: userRes.citizenId || "",
                    dateOfBirth: userRes.dateOfBirth ? userRes.dateOfBirth.split('T')[0] : "",
                    branchId: userRes.branch?.id || 0,
                    roleId: userRes.role?.id || 0,
                    gender: (userRes.gender as any) || "MALE",
                    status: (userRes.status as any) || "ACTIVE",
                    addressDetail: userRes.addressDetail || "",
                    avatarUrl: userRes.avatarUrl || null,
                    startDate: userRes.startDate ? userRes.startDate.split('T')[0] : ""
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
    }, [userId, router, reset, currentUser, hasAllPermissions, isLoadingAuth]);

    const onFormSubmit = async (data: EmployeeUpdateInput) => {
        try {
            setSaving(true);
            // Add email when updating (email is not part of update form but required by backend)
            const updateData = {
                ...data,
                email: userEmail
            } as unknown as UserRequest;
            await EmployeeService.update(userId, updateData);
            toast.success("Cập nhật nhân viên thành công!");
            router.push("/admin/employees");
        } catch (error: any) {
            const msg = getErrorMessage(error);
            const backendDetails = error.response?.data?.details;
            
            if (Array.isArray(backendDetails)) {
                backendDetails.forEach((detail: any) => {
                    const fieldName = detail.field as keyof EmployeeUpdateInput;
                    setError(fieldName, { type: "manual", message: detail.message });
                });
                toast.error("Vui lòng kiểm tra lại các trường thông tin.");
            } else {
                toast.error(msg || "Lỗi khi cập nhật nhân viên.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleEmployeeAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const response = await apiJava.post('/users/upload-avatar', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const avatarUrl = response.data.imageUrl || response.data.url;

            if (!avatarUrl) {
                toast.error("Upload thành công nhưng không nhận được đường dẫn ảnh.");
                return;
            }

            setValue("avatarUrl", avatarUrl, { shouldDirty: true, shouldValidate: true });
            toast.success("Tải ảnh lên thành công!");
        } catch (error: any) {
            toast.error(getErrorMessage(error) || "Lỗi khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    if (loading || isLoadingAuth) return <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={32} /><p className="text-sm font-medium text-slate-50">Đang tải dữ liệu nhân viên...</p></div>;

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-[100px] bg-slate-50 min-h-screen text-slate-800">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEmployeeAvatarUpload} />
            {/* HEADER */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-[16px] font-bold uppercase tracking-tight text-slate-800">Chỉnh sửa nhân viên</h1>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-6">
                {/* LEFT COL */}
                <div className="col-span-8 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-lg">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <Users size={16} />
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-800">1. Thông tin cá nhân</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Họ và tên *</Label>
                                    <Input {...register("fullName")} className={cn("h-9 text-[13px] font-medium", errors.fullName && "border-red-500")} />
                                    {errors.fullName && <p className="text-[10px] text-red-500 font-bold">{errors.fullName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Giới tính</Label>
                                    <Select value={currentGender} onValueChange={(val: any) => setValue("gender", val)}>
                                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Nam</SelectItem>
                                            <SelectItem value="FEMALE">Nữ</SelectItem>
                                            <SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Mail size={10} /> Email (Tài khoản)</Label>
                                    <Input value={userEmail || ""} disabled className="h-9 text-[13px] bg-slate-50 cursor-not-allowed" />
                                    <p className="text-[10px] text-slate-400 italic">Email không thể thay đổi</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Phone size={10} /> Số điện thoại *</Label>
                                    <Input {...register("phoneNumber")} className={cn("h-9 text-[13px]", errors.phoneNumber && "border-red-500")} />
                                    {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold">{errors.phoneNumber.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Fingerprint size={10} /> Số CCCD (12 số)</Label>
                                    <Input {...register("citizenId")} disabled className="h-9 text-[13px] font-bold bg-slate-50 cursor-not-allowed" maxLength={12} />
                                    <p className="text-[10px] text-slate-400 italic">Số CCCD không thể thay đổi sau khi tạo</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Ngày sinh *</Label>
                                    <Input type="date" {...register("dateOfBirth")} className={cn("h-9 text-[13px]", errors.dateOfBirth && "border-red-500")} />
                                    {errors.dateOfBirth && <p className="text-[10px] text-red-500 font-bold">{errors.dateOfBirth.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><MapPin size={10} /> Địa chỉ liên hệ *</Label>
                                <Input {...register("addressDetail")} className={cn("h-9 text-[13px]", errors.addressDetail && "border-red-500")} />
                                {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold">{errors.addressDetail.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-lg">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-blue-600">
                            <Briefcase size={16} />
                            <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">2. Công tác & Phân quyền</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Mã nhân viên</Label>
                                <Input {...register("employeeCode")} disabled className="h-9 text-[13px] bg-slate-50 font-bold cursor-not-allowed" />
                                <p className="text-[10px] text-slate-400 italic">Mã nhân viên không thể thay đổi</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Ngày vào làm *</Label>
                                <Input type="date" {...register("startDate")} className={cn("h-9 text-[13px]", errors.startDate && "border-red-500")} />
                                {errors.startDate && <p className="text-[10px] text-red-500 font-bold">{errors.startDate.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Chi nhánh làm việc *</Label>
                                <Select value={String(currentBranchId)} onValueChange={(val) => setValue("branchId", Number(val))}>
                                    <SelectTrigger className={cn("h-9 text-[13px]", errors.branchId && "border-red-500")}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.branchId && <p className="text-[10px] text-red-500 font-bold">{errors.branchId.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Vai trò hệ thống *</Label>
                                <Select value={String(currentRoleId)} onValueChange={(val) => setValue("roleId", Number(val))}>
                                    <SelectTrigger className={cn("h-9 text-[13px]", errors.roleId && "border-red-500")}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.displayName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.roleId && <p className="text-[10px] text-red-500 font-bold">{errors.roleId.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col items-center rounded-lg">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-4 self-start">Ảnh hồ sơ</Label>
                        <div className="relative mb-4">
                            <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                                {watch("avatarUrl") ? (
                                    <img src={watch("avatarUrl") as string} alt="avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle2 size={60} className="text-slate-300" />
                                )}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="absolute bottom-0 right-0 translate-x-2 translate-y-2 rounded-full p-2 border border-slate-200 bg-white shadow-sm" onClick={handleAvatarClick} disabled={uploading}>
                                <Camera size={14} />
                            </Button>
                        </div>
                        <div className="w-full space-y-4">
                            <div className="text-center text-[11px] text-slate-500">Nhấn vào biểu tượng camera để thay đổi ảnh</div>
                            {uploading && <div className="text-[11px] text-slate-400">Đang tải ảnh...</div>}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Trạng thái</Label>
                                <Select value={currentStatus} onValueChange={(val: any) => setValue("status", val)}>
                                    <SelectTrigger className="h-9 text-[12px] font-bold uppercase"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">ĐANG HOẠT ĐỘNG</SelectItem>
                                        <SelectItem value="INACTIVE" className="text-rose-600 font-bold">TẠM KHÓA</SelectItem>
                                        <SelectItem value="BANNED" className="text-amber-700 font-bold">CẤM TRUY CẬP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 space-y-3 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700">
                            <Lock size={16} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Bảo mật</span>
                        </div>
                        <p className="text-[11px] text-amber-600 font-medium leading-relaxed italic">
                            Mật khẩu có thể được đặt lại bởi quản trị viên hệ thống hoặc qua chức năng Quên mật khẩu.
                        </p>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[11px]">Hủy bỏ</Button>
                <Button type="submit" disabled={saving} className="h-9 px-10 text-[11px] font-black bg-slate-900 text-white uppercase shadow-xl">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : "CẬP NHẬT NHÂN VIÊN"}
                </Button>
            </div>
        </form>
    );
}
