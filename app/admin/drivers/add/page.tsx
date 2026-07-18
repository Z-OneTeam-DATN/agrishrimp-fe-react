"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DriverSchema, DriverFormValues } from "@/app/types/driver.schema";
import { driverService } from "@/app/services/driver.service";
import { FileService } from "@/app/services/file.service";

export default function AddDriverPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [licenseUploading, setLicenseUploading] = useState(false);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<DriverFormValues>({
        resolver: zodResolver(DriverSchema),
        mode: "onChange",
        defaultValues: {
            fullName: "",
            phone: "",
            email: "",
            idCard: "",
            licenseNumber: "",
            licenseClass: "",
            avatarUrl: "",
            licenseImageUrl: "",
            status: "ACTIVE",
            vehicleNumber: "",
            vehicleType: "",
        },
    });

    const avatarUrl = watch("avatarUrl");
    const licenseImageUrl = watch("licenseImageUrl");

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "avatarUrl" | "licenseImageUrl") => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Tập tin quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
            return;
        }

        const setUploading = fieldName === "avatarUrl" ? setAvatarUploading : setLicenseUploading;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await FileService.tmpUpload(formData) as any;
            
            const imgPath = response?.url || response?.data?.url || response?.data?.tmpPath || response?.tmpPath || response?.data?.imageUrl || response?.imageUrl;
            
            if (imgPath) {
                setValue(fieldName, imgPath, { shouldValidate: true });
                toast.success(`Tải ảnh ${fieldName === "avatarUrl" ? "ảnh đại diện" : "bằng lái"} thành công!`);
            } else {
                toast.error("Tải ảnh thất bại, không nhận được URL");
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải ảnh lên máy chủ");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = (fieldName: "avatarUrl" | "licenseImageUrl") => {
        setValue(fieldName, "", { shouldValidate: true });
    };

    const onSubmit = async (data: DriverFormValues) => {
        setIsSubmitting(true);
        try {
            await driverService.create(data);
            toast.success("Thêm tài xế mới thành công!");
            router.push("/admin/drivers");
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi khi lưu thông tin tài xế";
            toast.error(msg);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-[100px] text-slate-800">
            <div className="mb-6 mt-2 px-1">
                <h1 className="text-[20px] font-semibold uppercase tracking-tight text-slate-900">
                    THÊM TÀI XẾ MỚI
                </h1>
            </div>

            <div className="space-y-5 px-1">
                {/* Phần 1: Thông tin cá nhân */}
                <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-[12px] font-semibold text-slate-900 border-b border-slate-100 pb-2">
                            1. Thông tin cá nhân và liên hệ
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Họ và tên tài xế *</Label>
                            <Input
                                {...register("fullName")}
                                placeholder="Nhập họ và tên"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.fullName && <p className="text-[10px] text-rose-500 mt-1">{errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Số điện thoại *</Label>
                            <Input
                                {...register("phone")}
                                placeholder="Nhập số điện thoại"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.phone && <p className="text-[10px] text-rose-500 mt-1">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Email liên hệ</Label>
                            <Input
                                {...register("email")}
                                type="email"
                                placeholder="Nhập địa chỉ email"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.email && <p className="text-[10px] text-rose-500 mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Số CCCD / CMND *</Label>
                            <Input
                                {...register("idCard")}
                                placeholder="Nhập số căn cước công dân"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.idCard && <p className="text-[10px] text-rose-500 mt-1">{errors.idCard.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Trạng thái công việc *</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus:ring-0">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[4px]">
                                            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                            <SelectItem value="BUSY">Đang bận (Giao chuyến)</SelectItem>
                                            <SelectItem value="INACTIVE">Tạm ngừng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.status && <p className="text-[10px] text-rose-500 mt-1">{errors.status.message}</p>}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 xl:col-span-3">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Hình ảnh đại diện (Avatar)</Label>
                            {avatarUrl ? (
                                <div className="relative w-28 h-28 border border-slate-200 rounded-[4px] overflow-hidden bg-slate-50">
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage("avatarUrl")}
                                        className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative flex items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, "avatarUrl")}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={avatarUploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 px-4 rounded-[4px] border-slate-200 bg-white text-[13px] text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            {avatarUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                            ) : (
                                                <Upload size={14} className="text-slate-400" />
                                            )}
                                            Tải ảnh lên
                                        </Button>
                                    </div>
                                    <span className="text-[10.5px] text-slate-400">PNG, JPG, JPEG (tối đa 5MB)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Phần 2: Giấy phép lái xe & Phương tiện */}
                <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-[12px] font-semibold text-slate-900 border-b border-slate-100 pb-2">
                            2. Giấy phép lái xe và phương tiện
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Số bằng lái xe (GPLX) *</Label>
                            <Input
                                {...register("licenseNumber")}
                                placeholder="Nhập số GPLX"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.licenseNumber && <p className="text-[10px] text-rose-500 mt-1">{errors.licenseNumber.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Hạng bằng lái *</Label>
                            <Input
                                {...register("licenseClass")}
                                placeholder="VD: B2, C, D..."
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.licenseClass && <p className="text-[10px] text-rose-500 mt-1">{errors.licenseClass.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Biển số xe (Nếu có)</Label>
                            <Input
                                {...register("vehicleNumber")}
                                placeholder="VD: 29C-123.45"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.vehicleNumber && <p className="text-[10px] text-rose-500 mt-1">{errors.vehicleNumber.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Loại phương tiện (Nếu có)</Label>
                            <Input
                                {...register("vehicleType")}
                                placeholder="VD: Xe tải đông lạnh 3.5 tấn"
                                className="h-10 text-[13px] font-normal rounded-[4px] border-slate-200 shadow-none focus-visible:ring-emerald-500/20"
                            />
                            {errors.vehicleType && <p className="text-[10px] text-rose-500 mt-1">{errors.vehicleType.message}</p>}
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 xl:col-span-3">
                            <Label className="text-[10.5px] font-semibold text-slate-500">Hình ảnh bằng lái xe</Label>
                            {licenseImageUrl ? (
                                <div className="relative max-w-[360px] h-[200px] border border-slate-200 rounded-[4px] overflow-hidden bg-slate-50">
                                    <img src={licenseImageUrl} alt="License" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage("licenseImageUrl")}
                                        className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative flex items-center gap-3">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, "licenseImageUrl")}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={licenseUploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-10 px-4 rounded-[4px] border-slate-200 bg-white text-[13px] text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            {licenseUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                            ) : (
                                                <Upload size={14} className="text-slate-400" />
                                            )}
                                            Tải ảnh mặt trước GPLX
                                        </Button>
                                    </div>
                                    <span className="text-[10.5px] text-slate-400">PNG, JPG, JPEG (tối đa 5MB)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Thanh hành động cố định cuối màn hình */}
            <div className="fixed bottom-0 left-0 right-0 z-[999] flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:left-[260px]">
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 min-w-[110px] rounded-[4px] border-slate-300 bg-white px-6 text-[13px] font-medium text-slate-600"
                    onClick={() => router.back()}
                >
                    Hủy bỏ
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || avatarUploading || licenseUploading}
                    className="h-10 min-w-[180px] rounded-[4px] bg-emerald-600 px-6 text-[13px] font-semibold text-white hover:bg-emerald-700"
                >
                    {isSubmitting ? "Đang lưu..." : "Lưu tài xế"}
                </Button>
            </div>
        </form>
    );
}
