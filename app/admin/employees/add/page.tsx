"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ChevronLeft, Users, Building2,
    ShieldCheck, Mail, Phone, MapPin,
    Key, Loader2, Camera, UserCircle2, Briefcase, Fingerprint, Calendar, Upload
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
import { BranchType, UserRequest, EmployeeCreateSchema, EmployeeCreateInput } from "@/app/types/employee.schema";
import { useAuthStore } from "@/stores/useAuthStore";

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

export default function AddEmployeePage() {
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cccdFileInputRef = useRef<HTMLInputElement>(null);

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
            status: "ACTIVE",
            startDate: new Date().toISOString().split('T')[0],
            branchId: currentUser?.branch?.id ?? undefined,
            roleId: undefined,
            gender: "MALE"
        }
    });

    const currentAvatarUrl = watch("avatarUrl");
    const currentGender = watch("gender");
    const currentStatus = watch("status");
    const currentBranchId = watch("branchId");
    const currentRoleId = watch("roleId");
    const currentCitizenId = watch("citizenId");

    useEffect(() => {
        async function loadInitData() {
            setLoading(true);
            try {
                const [rolesRes, branchesRes] = await Promise.all([
                    RoleService.getAll(),
                    BranchService.getAll()
                ]);

                let rolesList = (Array.isArray(rolesRes) ? rolesRes : (rolesRes as any).content || []) as RoleType[];

                // 1. Cấm gán USER (5.8)
                // 2. Cấm tự leo thang quyền (5.8) - Phải là ADMIN mới gán được ADMIN
                rolesList = rolesList.filter(r => {
                    const slug = r.slug.toLowerCase();
                    if (slug === "user" || slug === "customer") return false;
                    if (currentUser?.role?.slug !== "admin" && slug === "admin") return false;
                    return true;
                });

                setRoles(rolesList);

                // ✅ Tải danh sách chi nhánh
                const branchesList = (Array.isArray(branchesRes) ? branchesRes : (branchesRes as any).content || []) as BranchType[];
                setBranches(branchesList);
            } catch (error) {
                toast.error("Không thể tải dữ liệu hệ thống.");
            } finally {
                setLoading(false);
            }
        }
        loadInitData();
    }, [currentUser]);

    useEffect(() => {
        if (!currentBranchId && branches.length > 0) {
            const preferredBranchId =
                currentUser?.branch?.id && branches.some((branch) => branch.id === currentUser.branch?.id)
                    ? currentUser.branch.id
                    : branches[0].id;

            setValue("branchId", preferredBranchId, { shouldValidate: false, shouldDirty: false });
        }
    }, [branches, currentBranchId, currentUser, setValue]);

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
            } catch (error) {
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
    }, [currentCitizenId, setValue, watch]);

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
              headers: { "Content-Type": "multipart/form-data" },
            });

            const ocrData = response.data;
            const currentFullName = watch("fullName");
            const currentCitizenId = watch("citizenId");
            const currentAddress = watch("addressDetail");
            const currentDateOfBirth = watch("dateOfBirth");
            const currentGender = watch("gender");

            // Auto-fill form fields from OCR result
            if (ocrData.fullName && !currentFullName?.trim()) {
                setValue("fullName", ocrData.fullName.trim(), { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.dateOfBirth && (!currentDateOfBirth?.trim() || currentDateOfBirth.endsWith("-01-01"))) {
                setValue("dateOfBirth", ocrData.dateOfBirth, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.gender && (!dirtyFields.gender || currentGender === "OTHER")) {
                setValue("gender", ocrData.gender, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.address && !currentAddress?.trim()) {
                setValue("addressDetail", ocrData.address.trim(), { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            if (ocrData.citizenId && !currentCitizenId?.trim()) {
                setValue("citizenId", ocrData.citizenId.trim(), { shouldDirty: true, shouldValidate: true, shouldTouch: true });
            }

            toast.success(`OCR thành công! Độ tin cậy: ${Math.round((ocrData.confidence || 0) * 100)}%`);

        } catch (error: any) {
            toast.error(getErrorMessage(error) || "Lỗi khi xử lý ảnh CCCD. Vui lòng thử lại.");
        } finally {
            setOcrProcessing(false);
            // Reset file input
            if (e.target) e.target.value = '';
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            const response = await apiJava.post('/users/upload-avatar', formDataUpload);
            const avatarUrl = response.data.imageUrl || response.data.url;
            if (avatarUrl) {
                setValue("avatarUrl", avatarUrl, { shouldDirty: true, shouldValidate: true });
                toast.success("Tải ảnh lên thành công!");
            }
        } catch (error) {
            toast.error("Lỗi khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    const onFormSubmit = async (data: EmployeeCreateInput) => {
        try {
            setSaving(true);
            await EmployeeService.create(data as unknown as UserRequest);
            toast.success("Tài khoản đã tạo thành công. Email đã được gửi.");
            router.push("/admin/employees");
        } catch (error: any) {
            const backendDetails = error.response?.data?.details;
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
                toast.error(getErrorMessage(error) || "Lỗi khi tạo nhân viên.");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pb-[100px] bg-slate-50 min-h-screen">
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400">
                        <ChevronLeft size={20} />
                    </Button>
                    <h1 className="text-[16px] font-bold text-slate-800 uppercase">Thêm nhân viên mới</h1>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto p-4 grid grid-cols-12 gap-6">
                <div className="col-span-8 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-lg">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-emerald-600">
                            <Users size={16} />
                            <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">1. Thông tin cá nhân</span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Họ và tên *</Label>
                                    <Input {...register("fullName")} className={cn("h-9 text-[13px]", errors.fullName && "border-red-500")} placeholder="Nguyễn Văn A" />
                                    {errors.fullName && <p className="text-[10px] text-red-500 font-bold">{errors.fullName.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Giới tính</Label>
                                    <Select value={currentGender} onValueChange={(val: any) => setValue("gender", val)}>
                                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Nam</SelectItem><SelectItem value="FEMALE">Nữ</SelectItem><SelectItem value="OTHER">Khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Fingerprint size={10} /> Số CCCD (12 số) *</Label>
                                    <Input {...register("citizenId")} className={cn("h-9 text-[13px] font-bold", errors.citizenId && "border-red-500")} placeholder="0..." maxLength={12} />
                                    {errors.citizenId && <p className="text-[10px] text-red-500 font-bold">{errors.citizenId.message}</p>}
                                    {!errors.citizenId && <p className="text-[10px] text-slate-400">Có thể gợi ý năm sinh và giới tính từ CCCD. Không thể suy ra chính xác địa chỉ hoặc số điện thoại chỉ từ dãy số CCCD.</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                                        <Upload size={10} />
                                        Upload ảnh CCCD
                                    </Label>
                                    <div className="flex gap-2">
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
                                            size="sm"
                                            onClick={() => cccdFileInputRef.current?.click()}
                                            disabled={ocrProcessing}
                                            className="h-9 flex-1 text-[12px]"
                                        >
                                            {ocrProcessing ? (
                                                <>
                                                    <Loader2 size={12} className="animate-spin mr-1" />
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={12} className="mr-1" />
                                                    Chọn ảnh
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Upload ảnh mặt trước CCCD để tự động điền thông tin</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Phone size={10} /> Số điện thoại *</Label>
                                    <Input {...register("phoneNumber")} className={cn("h-9 text-[13px]", errors.phoneNumber && "border-red-500")} placeholder="09..." />
                                    {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold">{errors.phoneNumber.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><MapPin size={10} /> Địa chỉ liên hệ *</Label>
                                    <Input {...register("addressDetail")} className={cn("h-9 text-[13px]", errors.addressDetail && "border-red-500")} placeholder="Số nhà, tên đường..." />
                                    {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold">{errors.addressDetail.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-lg">
                        <div className="flex items-center gap-2 mb-6 border-b pb-3 text-emerald-600">
                            <Briefcase size={16} />
                            <span className="text-[11px] font-black uppercase text-slate-800 tracking-widest">2. Công tác & Phân quyền</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Mã nhân viên</Label>
                                {/* ✅ Khóa ô Mã nhân viên */}
                                <Input
                                    disabled
                                    className="h-9 text-[13px] bg-slate-100 text-slate-400 font-bold cursor-not-allowed"
                                    placeholder="Hệ thống sẽ tự động tạo (VD: NV-0001)"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Ngày vào làm *</Label>
                                <Input type="date" {...register("startDate")} className={cn("h-9 text-[13px]", errors.startDate && "border-red-500")} />
                                {errors.startDate && <p className="text-[10px] text-red-500 font-bold">{errors.startDate.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Chi nhánh làm việc *</Label>
                                <Select
                                    value={currentBranchId ? String(currentBranchId) : undefined}
                                    onValueChange={(val) => setValue("branchId", Number(val))}
                                    disabled={branches.length === 0}
                                >
                                    <SelectTrigger className={cn("h-9 text-[13px]", errors.branchId && "border-red-500")}><SelectValue placeholder={branches.length === 0 ? "Chưa có chi nhánh" : "Chọn chi nhánh"} /></SelectTrigger>
                                    <SelectContent>
                                        {branches.length > 0 ? (
                                            branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)
                                        ) : (
                                            <div className="px-3 py-2 text-[12px] text-slate-400">
                                                Chưa có chi nhánh nào. Hãy tạo chi nhánh trước.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.branchId && <p className="text-[10px] text-red-500 font-bold">{errors.branchId.message}</p>}
                                {branches.length === 0 && (
                                    <p className="text-[10px] text-slate-400 font-medium">Bạn cần tạo ít nhất 1 chi nhánh trước khi thêm nhân viên.</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-slate-400">Vai trò hệ thống *</Label>
                                <Select
                                    value={currentRoleId ? String(currentRoleId) : undefined}
                                    onValueChange={(val) => setValue("roleId", Number(val))}
                                    disabled={roles.length === 0}
                                >
                                    <SelectTrigger className={cn("h-9 text-[13px]", errors.roleId && "border-red-500")}><SelectValue placeholder={roles.length === 0 ? "Chưa có vai trò" : "Chọn vai trò"} /></SelectTrigger>
                                    <SelectContent>
                                        {roles.length > 0 ? (
                                            roles.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.displayName}</SelectItem>)
                                        ) : (
                                            <div className="px-3 py-2 text-[12px] text-slate-400">
                                                Chưa có vai trò nào khả dụng.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.roleId && <p className="text-[10px] text-red-500 font-bold">{errors.roleId.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 space-y-4">
                    <div className="bg-white border border-slate-200 p-6 shadow-sm flex flex-col items-center rounded-lg">
                        <Label className="text-[10px] font-bold uppercase text-slate-400 mb-4 self-start">Ảnh đại diện</Label>
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-32 h-32 bg-slate-100 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                                {uploading ? <Loader2 className="animate-spin text-emerald-600" /> : currentAvatarUrl ? <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserCircle2 size={80} className="text-slate-200" />}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-lg"><Camera size={16} /></div>
                            <input type="file" ref={fileInputRef} onChange={handleEmployeeAvatarUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* ✅ Cột phải: Đã bỏ ô Mật khẩu, thêm thông báo */}
                    <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-4 rounded-lg">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5"><Mail size={10} /> Email (Tài khoản) *</Label>
                            <Input {...register("email")} className={cn("h-9 text-[13px]", errors.email && "border-red-500")} placeholder="email@agrishrimp.vn" />
                            {errors.email && <p className="text-[10px] text-red-500 font-bold">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-slate-400">Trạng thái tài khoản</Label>
                            <Select value={currentStatus} onValueChange={(val: any) => setValue("status", val)}>
                                <SelectTrigger className="h-9 text-[12px] font-bold uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">ĐANG HOẠT ĐỘNG</SelectItem>
                                    <SelectItem value="INACTIVE" className="text-rose-600 font-bold">TẠM KHÓA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Box thông báo về mật khẩu */}
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-[4px] mt-4 flex items-start gap-2">
                            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-blue-800 leading-relaxed">
                                <span className="font-bold">Bảo mật:</span> Mật khẩu mặc định của tài khoản là <code className="bg-white text-blue-700 px-1 py-0.5 rounded font-bold border border-blue-200 shadow-sm">123456</code>.
                                Hệ thống sẽ tự động gửi email chứa thông tin đăng nhập đến hòm thư của nhân viên này.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t p-3 flex justify-end gap-3 z-[999] shadow-inner">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="font-bold uppercase text-[11px]">Hủy bỏ</Button>
                <Button type="submit" disabled={saving || uploading || branches.length === 0 || roles.length === 0} className="h-9 px-10 text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white uppercase">
                    {saving ? <Loader2 className="animate-spin mr-2" /> : "LƯU NHÂN VIÊN"}
                </Button>
            </div>
        </form>
    );
}
