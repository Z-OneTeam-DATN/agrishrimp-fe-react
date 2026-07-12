"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ShieldCheck,
    Loader2, Camera, UserCircle2, Upload, CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage, apiJava } from "@/lib/axios";
import { EmployeeService } from "@/app/services/employee.service";
import { RoleService } from "@/app/services/RoleService";
import { BranchService } from "@/app/services/branchService";
import { RoleType } from "@/app/types/role.schema";
import { BranchType, UserRequest, EmployeeCreateSchema, EmployeeCreateInput } from "@/app/types/employee.schema";
import { useAuthStore } from "@/stores/useAuthStore";
import { canManageSystemAdminRoles } from "@/lib/roles";
import { usePermissions } from "@/hooks/usePermissions";
import { P } from "@/lib/permissions";

const inferBirthYearAndGenderFromCitizenId = (citizenId: string) => {
    if (!/^\d{12}$/.test(citizenId)) return null;

    const genderCenturyDigit = Number(citizenId[3]);
    const birthYearSuffix = Number(citizenId.slice(4, 6));
    const centuryMap = [1900, 1900, 2000, 2000, 2100, 2100, 2200, 2200];
    const inferredCentury = centuryMap[genderCenturyDigit];

    if (!Number.isFinite(inferredCentury)) return null;

    return {
        gender: genderCenturyDigit % 2 === 0 ? "FEMALE" : "MALE",
        year: inferredCentury + birthYearSuffix,
    } as const;
};

const isLikelyOcrFullName = (value?: string | null) => {
    if (!value) return false;

    const normalized = value.trim().replace(/\s+/g, " ").toUpperCase();
    if (!normalized || /\d/.test(normalized)) return false;

    if (normalized.includes("FULL NAME") || normalized.includes("NAME")) return false;
    if (normalized === "HO VA TEN" || normalized === "HO TEN" || normalized === "TEN") return false;

    return normalized.split(" ").length >= 2;
};

const sanitizeOcrAddress = (value?: string | null) => {
    if (!value) return "";

    const cleaned = value
        .replace(/\bPlace\s+of\s+(origin|residence)\b/gi, " ")
        .replace(/^[/,\-\s]+/, "")
        .replace(/\s+/g, " ")
        .replace(/\s+,/g, ",")
        .trim();

    const parts = cleaned
        .split(/\s+/)
        .filter((part) => {
            const normalized = part.replace(/[,./-]/g, "");
            return !(normalized.length === 1 && /^[A-Za-zÀ-ỹ]$/.test(normalized));
        });

    let result = parts.join(" ").trim();
    result = result.replace(/[/,\-\s]+$/, "").trim();
    result = result.replace(/\s+[A-ZÀ-Ỵ]{1,2}$/, "").trim();
    return result;
};

const extractContent = <T,>(payload: T[] | { content?: T[] } | null | undefined) => {
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? [];
};

const toApiError = (error: unknown) => error as Parameters<typeof getErrorMessage>[0];

export default function AddEmployeePage() {
    const router = useRouter();
    const { user: currentUser, isLoadingAuth } = useAuthStore();
    const { hasPermission } = usePermissions();
    const roleSlug = typeof currentUser?.role === "object" ? currentUser.role?.slug : currentUser?.role;
    const isAdmin = roleSlug?.toLowerCase() === "admin" || roleSlug?.toLowerCase() === "super_admin";
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cccdFileInputRef = useRef<HTMLInputElement>(null);
    const hasLoadedInitRef = useRef(false);

    const [roles, setRoles] = useState<RoleType[]>([]);
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        setError,
        formState: { errors, dirtyFields },
    } = useForm<EmployeeCreateInput>({
        resolver: zodResolver(EmployeeCreateSchema),
        defaultValues: {
            fullName: "",
            email: "",
            // ✅ Đặt cứng mật khẩu mặc định là 123456
            password: undefined,
            phoneNumber: "",
            citizenId: "",
            addressDetail: "",
            dateOfBirth: "",
            avatarUrl: null,
            status: undefined,
            startDate: new Date().toISOString().split('T')[0],
            branchId: undefined,
            roleId: undefined,
            gender: undefined
        }
    });

    const currentAvatarUrl = watch("avatarUrl");
    const currentGender = watch("gender");
    const currentStatus = watch("status");
    const currentBranchId = watch("branchId");
    const currentRoleId = watch("roleId");
    const currentCitizenId = watch("citizenId");

    useEffect(() => {
        if (!isLoadingAuth && !hasPermission(P.STAFF_CREATE)) {
            router.push("/admin/forbidden");
        }
    }, [hasPermission, isLoadingAuth, router]);

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
                    BranchService.getAll()
                ]);

                let rolesList = extractContent<RoleType>(rolesRes as RoleType[] | { content?: RoleType[] });

                // 1. Cấm gán USER (5.8)
                // 2. Cấm tự leo thang quyền (5.8) - Phải là ADMIN mới gán được ADMIN
                rolesList = rolesList.filter(r => {
                    const slug = r.slug.toLowerCase();
                    if (slug === "user" || slug === "customer") return false;
                    if (!canManageSystemAdminRoles(currentUser?.role) && (slug === "admin" || slug === "super_admin")) return false;
                    return true;
                });

                setRoles(rolesList);

                // ✅ Tải danh sách chi nhánh
                let branchesList = extractContent<BranchType>(branchesRes as BranchType[] | { content?: BranchType[] });
                if (!isAdmin && currentUser?.branch?.id) {
                    branchesList = branchesList.filter((branch) => branch.id === currentUser.branch?.id);
                }
                setBranches(branchesList);
            } catch {
                toast.error("Không thể tải dữ liệu hệ thống.");
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

    useEffect(() => {
        // Validate CCCD format first
        if (!currentCitizenId || !/^\d{12}$/.test(currentCitizenId)) {
            return;
        }

        // 🔍 Lookup CCCD từ API để auto-fill thông tin nhân viên
        const lookupCitizenInfo = async () => {
            try {
                const data = await EmployeeService.lookupByCitizenId(currentCitizenId);
                
                // Auto-fill fullName từ API
                const currentFullName = watch("fullName");
                if (!currentFullName && data.fullName) {
                    setValue("fullName", data.fullName, { shouldDirty: true });
                }
                
                // Auto-fill dateOfBirth từ API
                const currentDateOfBirth = watch("dateOfBirth");
                if (!currentDateOfBirth && data.dateOfBirth) {
                    setValue("dateOfBirth", data.dateOfBirth, { shouldDirty: true });
                } else if (currentDateOfBirth === `${inferBirthYearAndGenderFromCitizenId(currentCitizenId)?.year}-01-01` && data.dateOfBirth) {
                    // Update inferred date with actual API date
                    setValue("dateOfBirth", data.dateOfBirth, { shouldDirty: true });
                }
                
                // Auto-fill gender từ API
                if ((currentGender === "MALE" || currentGender === "OTHER") && data.gender) {
                    setValue("gender", data.gender as "MALE" | "FEMALE" | "OTHER", { shouldDirty: true });
                }
                
                // Auto-fill addressDetail từ API
                const currentAddress = watch("addressDetail");
                if (!currentAddress && data.address) {
                    setValue("addressDetail", data.address, { shouldDirty: true });
                }
            } catch {
                // CCCD lookup failed - fallback to inference from citizenId digits
                const inferred = inferBirthYearAndGenderFromCitizenId(currentCitizenId);
                if (!inferred) return;

                const currentDateOfBirth = watch("dateOfBirth");
                if (!currentDateOfBirth) {
                    setValue("dateOfBirth", `${inferred.year}-01-01`, { shouldDirty: true });
                }

                if (!currentGender || currentGender === "OTHER") {
                    setValue("gender", inferred.gender, { shouldDirty: true });
                }
            }
        };

        lookupCitizenInfo();
    }, [currentCitizenId, currentGender, setValue, watch]);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleEmployeeAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const response = await apiJava.post('/users/upload-avatar', formDataUpload);

            const avatarUrl = response.data.imageUrl || response.data.url;
            if (!avatarUrl) {
                toast.error("Upload thành công nhưng không nhận được đường dẫn ảnh.");
                return;
            }

            setValue("avatarUrl", avatarUrl, { shouldDirty: true, shouldValidate: true });
            toast.success("Tải ảnh lên thành công!");
        } catch (error: unknown) {
            toast.error(getErrorMessage(toApiError(error)) || "Lỗi khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    const handleCccdOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn file ảnh hợp lệ (PNG, JPG, JPEG)");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước ảnh không được vượt quá 5MB");
            return;
        }

        try {
            setOcrProcessing(true);
            const formData = new FormData();
            formData.append("image", file);

            const response = await apiJava.post('/employees/ocr-cccd', formData, {
                timeout: 90000,
            });

            const ocrData = response.data;
            const currentFullName = watch("fullName");
            const currentCitizenId = watch("citizenId");
            const currentAddress = watch("addressDetail");
            const currentDateOfBirth = watch("dateOfBirth");
            const currentGender = watch("gender");

            // Auto-fill form fields from OCR result
            const normalizedName = ocrData.fullName?.trim();
            if (normalizedName && !currentFullName?.trim() && isLikelyOcrFullName(normalizedName)) {
                setValue("fullName", normalizedName, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.dateOfBirth && (!currentDateOfBirth?.trim() || currentDateOfBirth.endsWith("-01-01"))) {
                setValue("dateOfBirth", ocrData.dateOfBirth, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.gender && (!dirtyFields.gender || currentGender === "OTHER")) {
                setValue("gender", ocrData.gender, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            const normalizedAddress = sanitizeOcrAddress(ocrData.address);
            if (normalizedAddress && !currentAddress?.trim()) {
                setValue("addressDetail", normalizedAddress, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.citizenId && !currentCitizenId?.trim()) {
                setValue("citizenId", ocrData.citizenId.trim(), { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            toast.success(`OCR thành công! Độ tin cậy: ${Math.round((ocrData.confidence || 0) * 100)}%`);

        } catch (error: unknown) {
            toast.error(getErrorMessage(toApiError(error)) || "Lỗi khi xử lý ảnh CCCD. Vui lòng thử lại.");
        } finally {
            setOcrProcessing(false);
            // Reset file input
            if (e.target) e.target.value = '';
        }
    };

    const onFormSubmit = async (data: EmployeeCreateInput) => {
        try {
            setSaving(true);
            await EmployeeService.create(data as unknown as UserRequest);
            toast.success("Tài khoản đã tạo thành công. Email đã được gửi.");
            router.push("/admin/employees");
        } catch (error: unknown) {
            const backendDetails = (error as { response?: { data?: { details?: string[] } } }).response?.data?.details;
            if (Array.isArray(backendDetails)) {
                backendDetails.forEach((detail: string) => {
                    // BE trả format: "fieldName message"
                    const parts = detail.split(" ");
                    const field = parts[0] as keyof EmployeeCreateInput;
                    const message = parts.slice(1).join(" ");
                    setError(field, { type: "manual", message });
                });
                toast.error("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
            } else {
                toast.error(getErrorMessage(toApiError(error)) || "Lỗi khi tạo nhân viên.");
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
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 pb-[100px] text-slate-800">
            <div className="mt-2 mb-8 space-y-4">
                <h1 className="text-[20px] font-semibold tracking-tight uppercase text-slate-900">
                    Thêm nhân viên mới
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
                                                ) : currentAvatarUrl ? (
                                                    <img
                                                        src={currentAvatarUrl}
                                                        alt="Avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <UserCircle2 size={86} className="text-slate-200" />
                                                )}
                                            </div>
                                            <div className="absolute bottom-1 right-1 rounded-full bg-blue-600 p-2 text-white shadow-lg">
                                                <Camera size={18} />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleEmployeeAvatarUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
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
                                                "Chọn ảnh đại diện"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-9">
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                    <div className="space-y-1.5 md:col-span-5">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Họ và tên *
                                        </Label>
                                        <Input
                                            {...register("fullName")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.fullName && "border-rose-500 focus-visible:ring-rose-500"
                                            )}
                                            placeholder="Nhập họ và tên..."
                                        />
                                        {errors.fullName && (
                                            <span className="text-[11px] text-rose-500">{errors.fullName.message}</span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-3">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Giới tính
                                        </Label>
                                        <Select
                                            value={currentGender || undefined}
                                            onValueChange={(val: "MALE" | "FEMALE" | "OTHER") => setValue("gender", val, { shouldValidate: true })}
                                        >
                                            <SelectTrigger className={cn("h-9 text-[12px] font-medium", errors.gender && "border-rose-500")}>
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

                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Email đăng nhập *
                                        </Label>
                                        <Input
                                            {...register("email")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.email && "border-rose-500 focus-visible:ring-rose-500"
                                            )}
                                            placeholder="email@agrishrimp.vn"
                                        />
                                        {errors.email && (
                                            <span className="text-[11px] text-rose-500">{errors.email.message}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                    <div className="space-y-1.5 md:col-span-5">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Số điện thoại *
                                        </Label>
                                        <Input
                                            {...register("phoneNumber")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.phoneNumber && "border-rose-500 focus-visible:ring-rose-500"
                                            )}
                                            placeholder="Nhập số điện thoại..."
                                        />
                                        {errors.phoneNumber && (
                                            <span className="text-[11px] text-rose-500">
                                                {errors.phoneNumber.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-3">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Số CCCD (12 số) *
                                        </Label>
                                        <Input
                                            {...register("citizenId")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.citizenId && "border-rose-500 focus-visible:ring-rose-500"
                                            )}
                                            placeholder="Nhập số CCCD..."
                                            maxLength={12}
                                        />
                                        {errors.citizenId && (
                                            <span className="text-[11px] text-rose-500">
                                                {errors.citizenId.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-4">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Ngày sinh *
                                        </Label>
                                        <Controller
                                            name="dateOfBirth"
                                            control={control}
                                            render={({ field }) => {
                                                const dateValue = field.value ? parseISO(field.value) : undefined;
                                                return (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                type="button"
                                                                className={cn(
                                                                    "h-9 w-full justify-between px-3 text-[13px] font-normal shadow-none border-slate-200",
                                                                    !field.value && "text-slate-400",
                                                                    errors.dateOfBirth && "border-rose-500 focus-visible:ring-rose-500"
                                                                )}
                                                            >
                                                                <span>
                                                                    {dateValue && !Number.isNaN(dateValue.getTime())
                                                                        ? format(dateValue, "dd/MM/yyyy")
                                                                        : "dd/mm/yyyy"}
                                                                </span>
                                                                <CalendarIcon className="h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0 z-[1000]" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={dateValue}
                                                                onSelect={(date) => {
                                                                    if (date) {
                                                                        field.onChange(format(date, "yyyy-MM-dd"));
                                                                    } else {
                                                                        field.onChange("");
                                                                    }
                                                                }}
                                                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                                captionLayout="dropdown-buttons"
                                                                fromYear={1940}
                                                                toYear={new Date().getFullYear()}
                                                                defaultMonth={dateValue || new Date(2000, 0, 1)}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                );
                                            }}
                                        />
                                        {errors.dateOfBirth && (
                                            <span className="text-[11px] text-rose-500">
                                                {errors.dateOfBirth.message}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                                    <div className="flex h-full flex-col gap-1.5 md:col-span-5">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Địa chỉ liên hệ *
                                        </Label>
                                        <Input
                                            {...register("addressDetail")}
                                            className={cn(
                                                "h-9 text-[13px]",
                                                errors.addressDetail && "border-rose-500 focus-visible:ring-rose-500"
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

                                    <div className="flex h-full flex-col gap-1.5 md:col-span-3">
                                        <Label className="text-[10px] font-medium text-slate-400">
                                            Nhận diện CCCD
                                        </Label>
                                        <input
                                            ref={cccdFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCccdOcrUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => cccdFileInputRef.current?.click()}
                                            disabled={ocrProcessing}
                                            className="h-9 w-full justify-center text-[12px] font-medium"
                                        >
                                            {ocrProcessing ? (
                                                <>
                                                    <Loader2 size={12} className="mr-2 animate-spin" />
                                                    Đang xử lý ảnh CCCD
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={12} className="mr-2" />
                                                    Chọn ảnh CCCD
                                                </>
                                            )}
                                        </Button>
                                        <span aria-hidden="true" className="min-h-[16px] text-[10px] text-transparent">
                                            {"\u00A0"}
                                        </span>
                                    </div>

                                    <div className="flex h-full flex-col gap-1.5 md:col-span-4">
                                        <Label aria-hidden="true" className="text-[10px] font-medium text-transparent">
                                            Mật khẩu mặc định
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

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
                        <div className="space-y-1.5 xl:col-span-3">
                            <Label className="text-[10px] font-medium text-slate-400">
                                Chi nhánh làm việc *
                            </Label>
                            <Select
                                value={currentBranchId ? String(currentBranchId) : undefined}
                                onValueChange={(val) => setValue("branchId", Number(val), { shouldValidate: true })}
                                disabled={branches.length === 0 || !isAdmin}
                            >
                                <SelectTrigger
                                    className={cn(
                                        "h-9 text-[13px]",
                                        errors.branchId && "border-rose-500 focus-visible:ring-rose-500"
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
                            {branches.length === 0 ? (
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
                                Vai trò hệ thống *
                            </Label>
                            <Select
                                value={currentRoleId ? String(currentRoleId) : undefined}
                                onValueChange={(val) => setValue("roleId", Number(val), { shouldValidate: true })}
                                disabled={roles.length === 0}
                            >
                                <SelectTrigger
                                    className={cn(
                                        "h-9 text-[13px]",
                                        errors.roleId && "border-rose-500 focus-visible:ring-rose-500"
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
                                Ngày vào làm *
                            </Label>
                            <Controller
                                name="startDate"
                                control={control}
                                render={({ field }) => {
                                    const dateValue = field.value ? parseISO(field.value) : undefined;
                                    return (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    className={cn(
                                                        "h-9 w-full justify-between px-3 text-[13px] font-normal shadow-none border-slate-200",
                                                        !field.value && "text-slate-400",
                                                        errors.startDate && "border-rose-500 focus-visible:ring-rose-500"
                                                    )}
                                                >
                                                    <span>
                                                        {dateValue && !Number.isNaN(dateValue.getTime())
                                                            ? format(dateValue, "dd/MM/yyyy")
                                                            : "dd/mm/yyyy"}
                                                    </span>
                                                    <CalendarIcon className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-[1000]" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dateValue}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            field.onChange(format(date, "yyyy-MM-dd"));
                                                        } else {
                                                            field.onChange("");
                                                        }
                                                    }}
                                                    disabled={(date) => date < new Date("2000-01-01")}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }}
                            />
                            {errors.startDate && (
                                <span className="text-[11px] text-rose-500">{errors.startDate.message}</span>
                            )}
                        </div>

                        <div className="space-y-1.5 xl:col-span-3">
                            <Label className="text-[10px] font-medium text-slate-400">
                                Trạng thái tài khoản
                            </Label>
                            <Select
                                value={currentStatus || undefined}
                                onValueChange={(val: "ACTIVE" | "INACTIVE" | "BANNED") => setValue("status", val, { shouldValidate: true })}
                            >
                                <SelectTrigger className={cn("h-9 text-[12px] font-medium", errors.status && "border-rose-500")}>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                    <SelectItem value="INACTIVE">Tạm khóa</SelectItem>
                                    <SelectItem value="BANNED">Cấm truy cập</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <span className="text-[11px] text-rose-500">{errors.status.message}</span>
                            )}
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
                    disabled={saving || uploading || branches.length === 0 || roles.length === 0}
                    className="h-9 bg-blue-600 px-10 text-[11px] font-medium text-white shadow-xl hover:bg-blue-700"
                >
                    {saving ? <Loader2 className="mr-2 animate-spin" /> : null}
                    Lưu nhân viên
                </Button>
            </div>
        </form>
    );
}

