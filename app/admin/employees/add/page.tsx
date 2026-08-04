"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, IdCard, Loader2, ShieldCheck, Upload, UserCircle2 } from "lucide-react";
import { toast } from "sonner";

import { RoleService } from "@/app/services/RoleService";
import { BranchService } from "@/app/services/branchService";
import { EmployeeService } from "@/app/services/employee.service";
import {
    BranchType,
    EmployeeCreateInput,
    EmployeeCreateSchema,
    UserRequest,
} from "@/app/types/employee.schema";
import { RoleType } from "@/app/types/role.schema";
import { BirthDatePicker, SharedDatePicker } from "@/components/admin/shared/BirthDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { apiJava, getErrorMessage } from "@/lib/axios";
import { P } from "@/lib/permissions";
import { canManageSystemAdminRoles, isBranchlessWorkspaceRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";

const extractContent = <T,>(payload: T[] | { content?: T[] } | null | undefined) => {
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? [];
};

const toApiError = (error: unknown) => error as Parameters<typeof getErrorMessage>[0];

const normalizeOcrErrorMessage = (error: unknown) => {
    const rawMessage = getErrorMessage(toApiError(error)) || "";
    const message = rawMessage.trim();

    if (!message) {
        return "Chưa lấy được thông tin từ ảnh. Vui lòng thử lại.";
    }

    const lowered = message.toLowerCase();

    if (lowered.includes("api key") || lowered.includes("cấu hình")) {
        return "Hệ thống đang thiếu cấu hình xử lý ảnh. Vui lòng thử lại sau.";
    }

    if (lowered.includes("không thể kết nối") || lowered.includes("thử lại sau")) {
        return "Hệ thống đang bận. Vui lòng thử lại sau ít phút.";
    }

    if (lowered.includes("json") || lowered.includes("định dạng")) {
        return "Ảnh chưa đúng định dạng. Vui lòng chọn lại ảnh rõ hơn.";
    }

    return message;
};

export default function AddEmployeePage() {
    const router = useRouter();
    const { user: currentUser, isLoadingAuth } = useAuthStore();
    const { hasPermission } = usePermissions();
    const roleSlug = typeof currentUser?.role === "object" ? currentUser.role?.slug : currentUser?.role;
    const isAdmin = roleSlug?.toLowerCase() === "admin" || roleSlug?.toLowerCase() === "super_admin";

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const citizenIdInputRef = useRef<HTMLInputElement>(null);
    const hasLoadedInitRef = useRef(false);

    const [roles, setRoles] = useState<RoleType[]>([]);
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);
    const [citizenImagePreview, setCitizenImagePreview] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        clearErrors,
        setError,
        formState: { errors, dirtyFields },
    } = useForm<EmployeeCreateInput>({
        resolver: zodResolver(EmployeeCreateSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: undefined,
            phoneNumber: "",
            citizenId: "",
            addressDetail: "",
            dateOfBirth: "",
            avatarUrl: null,
            status: undefined,
            startDate: "",
            branchId: undefined,
            roleId: undefined,
            gender: undefined,
        },
    });

    const currentAvatarUrl = watch("avatarUrl");
    const currentGender = watch("gender");
    const currentStatus = watch("status");
    const currentBranchId = watch("branchId");
    const currentRoleId = watch("roleId");
    const currentDateOfBirth = watch("dateOfBirth");
    const currentStartDate = watch("startDate");

    const selectedRole = roles.find((role) => role.id === currentRoleId);
    const isBranchRequired = !isBranchlessWorkspaceRole(selectedRole?.permissionCodes);

    useEffect(() => {
        if (!isLoadingAuth && !hasPermission(P.STAFF_CREATE)) {
            router.push("/admin/forbidden");
        }
    }, [hasPermission, isLoadingAuth, router]);

    useEffect(() => {
        return () => {
            if (citizenImagePreview) {
                URL.revokeObjectURL(citizenImagePreview);
            }
        };
    }, [citizenImagePreview]);

    useEffect(() => {
        if (isLoadingAuth || !hasPermission(P.STAFF_CREATE)) {
            return;
        }

        async function loadInitData() {
            if (!hasLoadedInitRef.current) {
                setLoading(true);
            }

            try {
                const [rolesRes, branchesRes] = await Promise.all([
                    RoleService.getAll(),
                    BranchService.getAll(),
                ]);

                let rolesList = extractContent<RoleType>(rolesRes as RoleType[] | { content?: RoleType[] });
                rolesList = rolesList.filter((role) => {
                    const slug = role.slug.toLowerCase();
                    if (slug === "user" || slug === "customer") return false;
                    if (!canManageSystemAdminRoles(currentUser?.role) && (slug === "admin" || slug === "super_admin")) {
                        return false;
                    }
                    return true;
                });
                setRoles(rolesList);

                let branchesList = extractContent<BranchType>(branchesRes as BranchType[] | { content?: BranchType[] });
                if (!isAdmin && currentUser?.branch?.id) {
                    branchesList = branchesList.filter((branch) => branch.id === currentUser.branch?.id);
                }
                setBranches(branchesList);
            } catch {
                toast.error("Không tải được dữ liệu cần thiết. Vui lòng thử lại.");
            } finally {
                hasLoadedInitRef.current = true;
                setLoading(false);
            }
        }

        loadInitData();
    }, [currentUser, hasPermission, isAdmin, isLoadingAuth]);

    useEffect(() => {
        if (!isAdmin && !currentBranchId && currentUser?.branch?.id) {
            const isCurrentBranchAvailable = branches.some((branch) => branch.id === currentUser.branch?.id);
            if (isCurrentBranchAvailable) {
                setValue("branchId", currentUser.branch.id, { shouldValidate: false, shouldDirty: false });
            }
        }
    }, [branches, currentBranchId, currentUser, isAdmin, setValue]);

    const handleAvatarClick = () => avatarInputRef.current?.click();
    const handleCitizenIdUploadClick = () => citizenIdInputRef.current?.click();

    const validateCitizenIdImage = async (file: File) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            throw new Error("Vui lòng chọn ảnh JPG, PNG hoặc WEBP.");
        }

        if (file.size > 5 * 1024 * 1024) {
            throw new Error("Ảnh CCCD vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
        }

        const objectUrl = URL.createObjectURL(file);

        try {
            const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                const image = new Image();
                image.onload = () => {
                    resolve({ width: image.width, height: image.height });
                    URL.revokeObjectURL(image.src);
                };
                image.onerror = () => {
                    reject(new Error("Không đọc được ảnh. Vui lòng chọn lại ảnh khác."));
                    URL.revokeObjectURL(image.src);
                };
                image.src = objectUrl;
            });

            if (dimensions.width < 640 || dimensions.height < 480) {
                throw new Error("Ảnh quá nhỏ. Vui lòng chọn ảnh rõ hơn, tối thiểu khoảng 640x480.");
            }
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    };

    const handleEmployeeAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const response = await apiJava.post("/users/upload-avatar", formDataUpload);
            const avatarUrl = response.data.imageUrl || response.data.url;

            if (!avatarUrl) {
                toast.error("Tải ảnh xong nhưng hệ thống chưa nhận được ảnh. Vui lòng thử lại.");
                return;
            }

            setValue("avatarUrl", avatarUrl, { shouldDirty: true, shouldValidate: true });
            toast.success("Ảnh đại diện đã được tải lên.");
        } catch (error: unknown) {
            toast.error(getErrorMessage(toApiError(error)) || "Không tải được ảnh đại diện. Vui lòng thử lại.");
        } finally {
            setUploading(false);
        }
    };

    const applyOcrValue = <K extends keyof EmployeeCreateInput>(
        field: K,
        value: EmployeeCreateInput[K] | null | undefined,
    ) => {
        if (value === null || value === undefined) return;
        if (typeof value === "string" && value.trim() === "") return;
        if (dirtyFields[field]) return;

        setValue(field as keyof EmployeeCreateInput, value as EmployeeCreateInput[keyof EmployeeCreateInput], {
            shouldDirty: false,
            shouldValidate: true,
            shouldTouch: true,
        });
        clearErrors(field as keyof EmployeeCreateInput);
    };

    const handleCitizenIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        try {
            await validateCitizenIdImage(file);

            const nextPreview = URL.createObjectURL(file);
            if (citizenImagePreview) {
                URL.revokeObjectURL(citizenImagePreview);
            }
            setCitizenImagePreview(nextPreview);

            setOcrProcessing(true);
            const recognized = await EmployeeService.ocrCitizenId(file);
            const currentValues = getValues();

            applyOcrValue("fullName", recognized.fullName ?? currentValues.fullName);
            applyOcrValue("citizenId", recognized.citizenId ?? currentValues.citizenId);
            applyOcrValue("dateOfBirth", recognized.dateOfBirth ?? currentValues.dateOfBirth);
            applyOcrValue("addressDetail", recognized.addressDetail ?? currentValues.addressDetail);

            if (recognized.gender && ["MALE", "FEMALE", "OTHER"].includes(recognized.gender)) {
                applyOcrValue("gender", recognized.gender);
            }

            toast.success("Lấy thông tin thành công, vui lòng kiểm tra lại thông tin.");
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error(normalizeOcrErrorMessage(error));
            }
        } finally {
            setOcrProcessing(false);
        }
    };

    const onFormSubmit = async (data: EmployeeCreateInput) => {
        if (isBranchRequired && !data.branchId) {
            setError("branchId", { type: "manual", message: "Vui lòng chọn chi nhánh" });
            return;
        }

        try {
            setSaving(true);
            await EmployeeService.create(data as unknown as UserRequest);
            toast.success("Đã tạo nhân viên thành công.");
            router.push("/admin/employees");
        } catch (error: unknown) {
            const backendDetails = (error as { response?: { data?: { details?: string[] } } }).response?.data?.details;
            if (Array.isArray(backendDetails)) {
                backendDetails.forEach((detail: string) => {
                    const parts = detail.split(" ");
                    const field = parts[0] as keyof EmployeeCreateInput;
                    const message = parts.slice(1).join(" ");
                    setError(field, { type: "manual", message });
                });
                toast.error("Vui lòng kiểm tra lại thông tin đã nhập.");
            } else {
                toast.error(getErrorMessage(toApiError(error)) || "Chưa tạo được nhân viên. Vui lòng thử lại.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading || isLoadingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-2 pb-[100px] text-slate-800">
            <div className="mb-6 mt-2 space-y-3">
                <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
                    Thêm nhân viên mới
                </h1>

                <div className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="border-b border-slate-200 pb-3">
                        <span className="text-[11px] font-bold text-slate-800">
                            1. Thông tin cá nhân
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-12 xl:gap-6">
                        <div className="xl:col-span-4">
                            <div className="space-y-3">
                                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Ảnh đại diện
                                        </Label>
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="relative cursor-pointer" onClick={handleAvatarClick}>
                                                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-white">
                                                    {uploading ? (
                                                        <Loader2 className="animate-spin text-blue-600" />
                                                    ) : currentAvatarUrl ? (
                                                        <img
                                                            src={currentAvatarUrl}
                                                            alt="Avatar"
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <UserCircle2 size={60} className="text-slate-200" />
                                                    )}
                                                </div>
                                                <div className="absolute bottom-1 right-1 rounded-full bg-blue-600 p-2 text-white shadow-lg">
                                                    <Camera size={18} />
                                                </div>
                                            </div>

                                            <input
                                                type="file"
                                                ref={avatarInputRef}
                                                onChange={handleEmployeeAvatarUpload}
                                                className="hidden"
                                                accept="image/*"
                                            />

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleAvatarClick}
                                                disabled={uploading}
                                                className="h-9 w-full text-[13px] font-medium"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Loader2 size={12} className="mr-2 animate-spin" />
                                                        Đang tải ảnh
                                                    </>
                                                ) : (
                                                    "Chọn ảnh đại diện"
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Upload ảnh CCCD
                                        </Label>

                                        <div className="space-y-3">
                                            <div className="flex min-h-[120px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                {citizenImagePreview ? (
                                                    <img
                                                        src={citizenImagePreview}
                                                        alt="Ảnh CCCD"
                                                        className="max-h-[150px] w-full rounded-xl object-contain"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 px-4 py-5 text-center text-slate-400">
                                                        <IdCard size={26} className="text-slate-300" />
                                                        <p className="text-[12px] font-medium">Chưa có ảnh CCCD</p>
                                                        <p className="text-[11px]">Ảnh rõ 4 góc, mặt trước, tối đa 5MB.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <input
                                                type="file"
                                                ref={citizenIdInputRef}
                                                onChange={handleCitizenIdUpload}
                                                className="hidden"
                                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                            />

                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCitizenIdUploadClick}
                                                disabled={ocrProcessing}
                                                className="h-9 w-full text-[13px] font-medium"
                                            >
                                                {ocrProcessing ? (
                                                    <>
                                                        <Loader2 size={14} className="mr-2 animate-spin" />
                                                        Đang lấy thông tin
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={14} className="mr-2" />
                                                        Chọn ảnh CCCD
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-8">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Họ và tên *
                                        </Label>
                                        <Input
                                            {...register("fullName")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.fullName && "border-rose-500 focus-visible:ring-rose-500",
                                            )}
                                            placeholder="Nhập họ và tên..."
                                        />
                                        {errors.fullName && (
                                            <span className="text-[11px] text-rose-500">{errors.fullName.message}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Số CCCD (12 số) *
                                        </Label>
                                        <Input
                                            {...register("citizenId")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.citizenId && "border-rose-500 focus-visible:ring-rose-500",
                                            )}
                                            placeholder="Nhập số CCCD..."
                                            maxLength={12}
                                        />
                                        {errors.citizenId && (
                                            <span className="text-[11px] text-rose-500">{errors.citizenId.message}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Giới tính *
                                        </Label>
                                        <Select
                                            value={currentGender}
                                            onValueChange={(val: "MALE" | "FEMALE" | "OTHER") =>
                                                setValue("gender", val, {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                    shouldTouch: true,
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    "h-9 text-[12px] font-medium",
                                                    errors.gender && "border-rose-500 focus-visible:ring-rose-500",
                                                )}
                                            >
                                                <SelectValue placeholder="Chọn giới tính" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MALE">Nam</SelectItem>
                                                <SelectItem value="FEMALE">Nữ</SelectItem>
                                                <SelectItem value="OTHER">Khác</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && (
                                            <span className="text-[11px] text-rose-500">{errors.gender.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Ngày sinh *
                                        </Label>
                                        <input type="hidden" {...register("dateOfBirth")} />
                                        <BirthDatePicker
                                            value={currentDateOfBirth}
                                            hasError={!!errors.dateOfBirth}
                                            onChange={(nextValue) =>
                                                setValue("dateOfBirth", nextValue, {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                    shouldTouch: true,
                                                })
                                            }
                                        />
                                        {errors.dateOfBirth && (
                                            <span className="text-[11px] text-rose-500">{errors.dateOfBirth.message}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Số điện thoại *
                                        </Label>
                                        <Input
                                            {...register("phoneNumber")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.phoneNumber && "border-rose-500 focus-visible:ring-rose-500",
                                            )}
                                            placeholder="Nhập số điện thoại..."
                                        />
                                        {errors.phoneNumber && (
                                            <span className="text-[11px] text-rose-500">{errors.phoneNumber.message}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Email đăng nhập *
                                        </Label>
                                        <Input
                                            {...register("email")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.email && "border-rose-500 focus-visible:ring-rose-500",
                                            )}
                                            placeholder="email@agrishrimp.vn"
                                        />
                                        {errors.email && (
                                            <span className="text-[11px] text-rose-500">{errors.email.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                    <div className="flex h-full flex-col gap-1.5 md:col-span-8">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Địa chỉ liên hệ *
                                        </Label>
                                        <Input
                                            {...register("addressDetail")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.addressDetail && "border-rose-500 focus-visible:ring-rose-500",
                                            )}
                                            placeholder="Số nhà, tên đường..."
                                        />
                                        {errors.addressDetail ? (
                                            <span className="min-h-[16px] text-[11px] text-rose-500">
                                                {errors.addressDetail.message}
                                            </span>
                                        ) : (
                                            <span aria-hidden="true" className="min-h-[16px] text-[10px] text-transparent">
                                                {"\u00A0"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex h-full flex-col gap-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Mật khẩu
                                        </Label>
                                        <div className="border border-blue-100 bg-blue-50 p-3">
                                            <div className="flex items-start gap-2">
                                                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-600" />
                                                <p className="text-[11px] leading-relaxed text-blue-800">
                                                    Mật khẩu mặc định là{" "}
                                                    <code className="rounded border border-blue-200 bg-white px-1 py-0.5 font-semibold text-blue-700">
                                                        123456
                                                    </code>
                                                    .
                                                </p>
                                            </div>
                                        </div>
                                        <span aria-hidden="true" className="min-h-[16px] text-[10px] text-transparent">
                                            {"\u00A0"}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-4">
                                    <div className="border-b border-slate-200 pb-3">
                                        <span className="text-[11px] font-bold text-slate-800">
                                            2. Công tác & phân quyền
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                                        <div className="space-y-1.5 xl:col-span-3">
                                            <Label className="text-[10px] font-medium text-slate-400">
                                                Vai trò hệ thống *
                                            </Label>
                                            <Select
                                                value={currentRoleId ? String(currentRoleId) : undefined}
                                                onValueChange={(val) =>
                                                    setValue("roleId", Number(val), {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                        shouldTouch: true,
                                                    })
                                                }
                                                disabled={roles.length === 0}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 text-[13px]",
                                                        errors.roleId && "border-rose-500 focus-visible:ring-rose-500",
                                                    )}
                                                >
                                                    <SelectValue
                                                        placeholder={roles.length === 0 ? "Chưa có vai trò" : "Chọn vai trò"}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.length > 0 ? (
                                                        roles.map((role) => (
                                                            <SelectItem key={role.id} value={String(role.id)}>
                                                                {role.displayName}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-[12px] text-slate-400">
                                                            Chưa có vai trò nào khả dụng.
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.roleId && (
                                                <span className="text-[11px] text-rose-500">{errors.roleId.message}</span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 xl:col-span-3">
                                            <Label className="text-[10px] font-medium text-slate-400">
                                                Chi nhánh làm việc{isBranchRequired ? " *" : ""}
                                            </Label>
                                            <Select
                                                value={currentBranchId ? String(currentBranchId) : undefined}
                                                onValueChange={(val) =>
                                                    setValue("branchId", Number(val), {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                        shouldTouch: true,
                                                    })
                                                }
                                                disabled={branches.length === 0 || !isAdmin}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 text-[13px]",
                                                        errors.branchId && "border-rose-500 focus-visible:ring-rose-500",
                                                    )}
                                                >
                                                    <SelectValue
                                                        placeholder={branches.length === 0 ? "Chưa có chi nhánh" : "Chọn chi nhánh"}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches.length > 0 ? (
                                                        branches.map((branch) => (
                                                            <SelectItem key={branch.id} value={String(branch.id)}>
                                                                {branch.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-[12px] text-slate-400">
                                                            Chưa có chi nhánh nào. Hãy tạo chi nhánh trước.
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {errors.branchId && (
                                                <span className="text-[11px] text-rose-500">{errors.branchId.message}</span>
                                            )}
                                            {!isBranchRequired ? (
                                                <span className="text-[10px] text-slate-400">
                                                    Vai trò này dùng chung toàn hệ thống, không cần gán chi nhánh.
                                                </span>
                                            ) : branches.length === 0 ? (
                                                <span className="text-[10px] text-slate-400">
                                                    Bạn cần tạo ít nhất 1 chi nhánh trước khi thêm nhân viên.
                                                </span>
                                            ) : !isAdmin ? (
                                                <span className="text-[10px] text-slate-400">
                                                    Tài khoản hiện tại chỉ được gán nhân viên vào chi nhánh đang phụ trách.
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="space-y-1.5 xl:col-span-3">
                                            <Label className="text-[10px] font-medium text-slate-400">
                                                Ngày vào làm *
                                            </Label>
                                            <input type="hidden" {...register("startDate")} />
                                            <SharedDatePicker
                                                value={currentStartDate}
                                                hasError={!!errors.startDate}
                                                onChange={(nextValue) =>
                                                    setValue("startDate", nextValue, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                        shouldTouch: true,
                                                    })
                                                }
                                                placeholder="Chọn ngày vào làm"
                                                variant="compact"
                                                buttonClassName={cn(
                                                    "h-9 text-[13px]",
                                                    errors.startDate && "border-rose-500 focus-visible:ring-rose-500",
                                                )}
                                            />
                                            {errors.startDate && (
                                                <span className="text-[11px] text-rose-500">{errors.startDate.message}</span>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 xl:col-span-3">
                                            <Label className="text-[10px] font-medium text-slate-400">
                                                Trạng thái tài khoản *
                                            </Label>
                                            <Select
                                                value={currentStatus}
                                                onValueChange={(val: "ACTIVE" | "INACTIVE") =>
                                                    setValue("status", val, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                        shouldTouch: true,
                                                    })
                                                }
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 text-[12px] font-medium",
                                                        errors.status && "border-rose-500 focus-visible:ring-rose-500",
                                                    )}
                                                >
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                                    <SelectItem value="INACTIVE">Tạm khóa</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.status && (
                                                <span className="text-[11px] text-rose-500">{errors.status.message}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-[999] flex justify-end gap-3 border-t bg-white p-3 lg:left-[260px]">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-[11px] font-medium text-slate-400"
                >
                    Hủy bỏ
                </Button>
                <Button
                    type="submit"
                    disabled={saving || uploading || ocrProcessing || (isBranchRequired && branches.length === 0) || roles.length === 0}
                    className="h-9 bg-blue-600 px-10 text-[11px] font-medium text-white shadow-xl hover:bg-blue-700"
                >
                    {saving ? <Loader2 className="mr-2 animate-spin" /> : null}
                    Tạo nhân viên mới
                </Button>
            </div>
        </form>
    );
}
