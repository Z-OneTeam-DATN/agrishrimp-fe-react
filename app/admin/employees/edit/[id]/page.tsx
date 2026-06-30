"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Mail, Phone, MapPin,
    Loader2, Camera, UserCircle2, Fingerprint
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
    const roleSlug = typeof currentUser?.role === "object" ? currentUser.role?.slug : currentUser?.role;
    const isAdmin = roleSlug?.toLowerCase() === "admin" || roleSlug?.toLowerCase() === "super_admin";

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

                let branchesList = Array.isArray(branchesRes) ? branchesRes : (branchesRes as any).content || [];
                if (!isAdmin && currentUser?.branch?.id) {
                    branchesList = branchesList.filter((branch: BranchType) => branch.id === currentUser.branch?.id);
                }
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
    }, [userId, router, reset, currentUser, hasAllPermissions, isLoadingAuth, isAdmin]);

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
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 pb-[100px] text-slate-800">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleEmployeeAvatarUpload} />
            <div className="mt-2 mb-8 space-y-4">
                <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
                    Chỉnh sửa nhân viên
                </h1>

                <div className="border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="border-b border-slate-200 pb-3">
                        <span className="text-[11px] font-bold text-slate-800">
                            1. Thông tin cá nhân
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-12">
                        <div className="xl:col-span-3">
                            <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-6 xl:min-h-[360px]">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-medium text-slate-400">
                                        Ảnh đại diện
                                    </Label>
                                    <div className="flex flex-col items-center justify-center gap-5 xl:min-h-[290px]">
                                        <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                                            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-white">
                                                {uploading ? (
                                                    <Loader2 className="animate-spin text-blue-600" />
                                                ) : watch("avatarUrl") ? (
                                                    <img src={watch("avatarUrl") as string} alt="avatar" className="h-full w-full object-cover" />
                                                ) : (
                                                    <UserCircle2 size={86} className="text-slate-200" />
                                                )}
                                            </div>
                                            <div className="absolute bottom-1 right-1 rounded-full bg-blue-600 p-2 text-white shadow-lg">
                                                <Camera size={18} />
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleAvatarClick}
                                            disabled={uploading}
                                            className="h-10 w-full text-[13px] font-medium"
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 size={12} className="mr-2 animate-spin" />
                                                    Đang tải ảnh
                                                </>
                                            ) : (
                                                <>
                                                    <Camera size={12} className="mr-2" />
                                                    Đổi ảnh đại diện
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-9">
                            <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                <div className="space-y-1.5 md:col-span-6">
                                    <Label className="flex h-4 items-center text-[10px] font-medium text-slate-400">Họ và tên *</Label>
                                    <Input {...register("fullName")} className={cn("h-9 text-[13px] font-medium", errors.fullName && "border-red-500")} />
                                    <p className={cn("min-h-4 text-[10px] font-bold", errors.fullName ? "text-red-500" : "text-transparent")}>
                                        {errors.fullName?.message || "\u00A0"}
                                    </p>
                                </div>
                                <div className="space-y-1.5 md:col-span-6">
                                    <Label className="flex h-4 items-center text-[10px] font-medium text-slate-400">Giới tính</Label>
                                    <Select value={currentGender} onValueChange={(val: any) => setValue("gender", val)}>
                                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Nam</SelectItem>
                                            <SelectItem value="FEMALE">Nữ</SelectItem>
                                            <SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="min-h-4 text-[10px] text-transparent">{"\u00A0"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                <div className="space-y-1.5 md:col-span-6">
                                    <Label className="flex h-4 items-center gap-1.5 text-[10px] font-medium text-slate-400"><Mail size={10} /> Email đăng nhập *</Label>
                                    <Input value={userEmail || ""} disabled className="h-9 text-[13px] bg-slate-50 cursor-not-allowed" />
                                    <p className="min-h-4 text-[10px] text-slate-400 italic">Email không thể thay đổi</p>
                                </div>
                                <div className="space-y-1.5 md:col-span-6">
                                    <Label className="flex h-4 items-center gap-1.5 text-[10px] font-medium text-slate-400"><Phone size={10} /> Số điện thoại *</Label>
                                    <Input {...register("phoneNumber")} className={cn("h-9 text-[13px]", errors.phoneNumber && "border-red-500")} />
                                    <p className={cn("min-h-4 text-[10px] font-bold", errors.phoneNumber ? "text-red-500" : "text-transparent")}>
                                        {errors.phoneNumber?.message || "\u00A0"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                <div className="space-y-1.5 md:col-span-6">
                                    <Label className="flex h-4 items-center gap-1.5 text-[10px] font-medium text-slate-400"><Fingerprint size={10} /> Số CCCD (12 số)</Label>
                                    <Input {...register("citizenId")} disabled className="h-9 text-[13px] font-bold bg-slate-50 cursor-not-allowed" maxLength={12} />
                                    <p className="min-h-4 text-[10px] text-slate-400 italic">Số CCCD không thể thay đổi sau khi tạo</p>
                                </div>
                                <div className="space-y-1.5 md:col-span-6">
                                    <Label className="flex h-4 items-center text-[10px] font-medium text-slate-400">Ngày sinh *</Label>
                                    <Input type="date" {...register("dateOfBirth")} className={cn("h-9 text-[13px]", errors.dateOfBirth && "border-red-500")} />
                                    <p className={cn("min-h-4 text-[10px] font-bold", errors.dateOfBirth ? "text-red-500" : "text-transparent")}>
                                        {errors.dateOfBirth?.message || "\u00A0"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="flex h-4 items-center gap-1.5 text-[10px] font-medium text-slate-400"><MapPin size={10} /> Địa chỉ liên hệ *</Label>
                                <Input {...register("addressDetail")} className={cn("h-9 text-[13px]", errors.addressDetail && "border-red-500")} />
                                <p className={cn("min-h-4 text-[10px] font-bold", errors.addressDetail ? "text-red-500" : "text-transparent")}>
                                    {errors.addressDetail?.message || "\u00A0"}
                                </p>
                            </div>
                            </div>
                        </div>
                    </div>
                        </div>

                <div className="border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="border-b border-slate-200 pb-3">
                        <span className="text-[11px] font-bold text-slate-800">
                            2. Công tác & phân quyền
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-slate-400">Mã nhân viên</Label>
                            <Input {...register("employeeCode")} disabled className="h-9 text-[13px] bg-slate-50 font-bold cursor-not-allowed" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-slate-400">Chi nhánh làm việc *</Label>
                            <Select value={String(currentBranchId)} onValueChange={(val) => setValue("branchId", Number(val))} disabled={!isAdmin}>
                                <SelectTrigger className={cn("h-9 text-[13px]", errors.branchId && "border-red-500")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.branchId && <p className="text-[10px] text-red-500 font-bold">{errors.branchId.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-slate-400">Vai trò hệ thống *</Label>
                            <Select value={String(currentRoleId)} onValueChange={(val) => setValue("roleId", Number(val))}>
                                <SelectTrigger className={cn("h-9 text-[13px]", errors.roleId && "border-red-500")}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.displayName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.roleId && <p className="text-[10px] text-red-500 font-bold">{errors.roleId.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-slate-400">Ngày vào làm *</Label>
                            <Input type="date" {...register("startDate")} className={cn("h-9 text-[13px]", errors.startDate && "border-red-500")} />
                            {errors.startDate && <p className="text-[10px] text-red-500 font-bold">{errors.startDate.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-medium text-slate-400">Trạng thái tài khoản</Label>
                            <Select value={currentStatus} onValueChange={(val: any) => setValue("status", val)}>
                                <SelectTrigger className="h-9 text-[12px] font-medium"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                    <SelectItem value="INACTIVE">Tạm khóa</SelectItem>
                                    <SelectItem value="BANNED">Cấm truy cập</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="font-medium text-[11px] text-slate-400">Hủy bỏ</Button>
                <Button type="submit" disabled={saving} className="h-9 bg-blue-600 px-10 text-[11px] font-medium text-white shadow-xl hover:bg-blue-700">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : null}
                    Cập nhật nhân viên
                </Button>
            </div>
        </form>
    );
}

