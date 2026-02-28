"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import {
    X, Settings, HelpCircle, Save, ChevronLeft, User, MapPin, Truck, Search, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SupplierSchema, SupplierFormValues } from "@/app/types/admin.schema";
import { supplierService } from "@/app/services/supplier.service";

interface Province { id: string; name: string; full_name: string; }
interface ErrorResponse { message: string; }

export default function AddSupplierPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [provinces, setProvinces] = useState<Province[]>([]);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<SupplierFormValues>({
        resolver: zodResolver(SupplierSchema),
        defaultValues: { status: "active", provinceId: "" },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const provRes = await fetch("https://esgoo.net/api-tinhthanh/1/0.htm");
                const provData = await provRes.json();
                if (provData.error === 0) setProvinces(provData.data);
            } catch (error) {
                console.error("Lỗi fetch dữ liệu ban đầu:", error);
            }
        };
        fetchData();
    }, []);

    const detectProvince = (fullAddress: string) => {
        if (!fullAddress || provinces.length === 0) return "";
        const addressLower = fullAddress.toLowerCase();
        const foundProvince = provinces.find((p) => {
            const cleanName = p.name.toLowerCase().replace("tỉnh ", "").replace("thành phố ", "");
            return addressLower.includes(cleanName);
        });
        return foundProvince ? foundProvince.id : "";
    };

    const handleLookupTaxCode = async () => {
        const taxCode = watch("taxCode");
        if (!taxCode) { toast.error("Vui lòng nhập MST"); return; }
        const loadingToast = toast.loading("Đang tra cứu từ tổng cục thuế...");
        try {
            const businessInfo = await supplierService.lookupTaxCode(taxCode);
            if (businessInfo) {
                setValue("name", businessInfo.name, { shouldValidate: true });
                setValue("addressDetail", businessInfo.address, { shouldValidate: true });
                const detectedId = detectProvince(businessInfo.address);
                if (detectedId) setValue("provinceId", detectedId, { shouldValidate: true });
                if (businessInfo.owner) setValue("contactName", businessInfo.owner, { shouldValidate: true });
                if (businessInfo.phone) setValue("phone", businessInfo.phone, { shouldValidate: true });
                if (businessInfo.email) setValue("email", businessInfo.email, { shouldValidate: true });
                toast.success("Đã tìm thấy thông tin!");
            }
        } catch {
            toast.error("Không tìm thấy thông tin hoặc API lỗi.");
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const onSubmit = async (data: SupplierFormValues) => {
        setIsSubmitting(true);
        try {
            await supplierService.create(data);
            toast.success("Đã lưu thông tin nhà cung cấp thành công!");
            window.dispatchEvent(new Event("supplierUpdated"));
            router.push("/admin/suppliers");
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            toast.error(axiosError.response?.data?.message || "Lỗi hệ thống");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (errors: any) => {
        toast.error("Vui lòng điền đầy đủ và đúng định dạng các trường bắt buộc!");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 pb-[100px] bg-slate-50/30 p-4 min-h-screen">
            <div className="flex items-center gap-4 mb-2 px-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 text-slate-400"><ChevronLeft size={20} /></Button>
                <h1 className="text-[18px] font-black text-[#1f1f1f] tracking-tight uppercase">Thêm nhà cung cấp mới</h1>
                <div className="ms-auto flex items-center gap-3 text-gray-400">
                    <Settings size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
                    <HelpCircle size={18} className="cursor-pointer hover:text-emerald-600 transition-colors" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8"><X size={20} /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-9 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <Truck size={16} /> 1. Thông tin pháp nhân nhà cung cấp
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="md:col-span-2 space-y-1.5 relative">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tên công ty / Pháp nhân *</Label>
                                <Input {...register("name")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5 relative">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Mã số thuế *</Label>
                                <div className="flex gap-0">
                                    <Input {...register("taxCode")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none font-mono focus:border-emerald-500" />
                                    <Button type="button" variant="outline" onClick={handleLookupTaxCode} className="h-[34px] bg-slate-50 border-[#ccc] border-l-0 rounded-none px-3 text-[10px] font-black text-blue-600 hover:bg-blue-50">
                                        <Search size={14} className="mr-1" /> TRA CỨU
                                    </Button>
                                </div>
                                {errors.taxCode && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.taxCode.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <User size={16} /> 2. Thông tin liên hệ trực tiếp
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Họ và tên người đại diện *</Label>
                                <Input {...register("contactName")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                                {errors.contactName && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.contactName.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Số điện thoại di động *</Label>
                                <Input {...register("phone")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Email liên hệ</Label>
                                <Input {...register("email")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                        <div className="flex items-center gap-2 mb-6 text-emerald-700 font-black text-[11px] uppercase tracking-widest border-b pb-3">
                            <MapPin size={16} /> 3. Trụ sở / Kho bãi nhà cung cấp
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Tỉnh / Thành phố *</Label>
                                <Controller name="provinceId" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:ring-0"><SelectValue placeholder="-- Chọn Tỉnh/TP --" /></SelectTrigger>
                                        <SelectContent className="rounded-none max-h-[200px]">
                                            {provinces.map((p) => (<SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                )} />
                                {errors.provinceId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.provinceId.message}</p>}
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Địa chỉ chi tiết *</Label>
                                <Input {...register("addressDetail")} className="h-[34px] text-[13px] border-[#ccc] rounded-none shadow-none focus:border-emerald-500" />
                                {errors.addressDetail && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.addressDetail.message}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-5">
                    <div className="bg-white border border-[#dcdcdc] p-6 rounded-none shadow-sm">
                        <Label className="text-[11px] font-black text-slate-700 uppercase block mb-5 tracking-widest border-b pb-3">Trạng thái vận hành</Label>
                        <Controller name="status" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-[38px] text-[13px] border-[#ccc] rounded-none font-black text-emerald-600 shadow-none focus:ring-0"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-none">
                                    <SelectItem value="active" className="text-emerald-600 font-bold uppercase tracking-tighter">ĐANG GIAO DỊCH</SelectItem>
                                    <SelectItem value="inactive" className="text-rose-600 font-bold uppercase tracking-tighter">TẠM NGỪNG</SelectItem>
                                </SelectContent>
                            </Select>
                        )} />
                    </div>
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-none">
                        <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase mb-3 tracking-widest border-b border-emerald-200 pb-1.5">
                            <ShieldCheck size={14} /> Quy tắc hệ thống
                        </div>
                        <p className="text-[11px] text-emerald-700/80 leading-relaxed font-medium italic">
                            * Hệ thống sẽ tự động đối soát thông tin qua hệ thống Thuế Việt Nam để đảm bảo tính minh bạch.
                        </p>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-[#f8f9fa] border-t border-[#ddd] p-[12px_30px] flex items-center justify-end gap-[15px] z-[999]">
                <Button type="button" variant="outline" className="min-w-[110px] h-[38px] text-[12px] font-bold border-[#ccc] bg-white rounded-none" onClick={() => router.back()}>HỦY BỎ</Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[180px] h-[38px] text-[12px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-none">
                    <Save size={18} className="mr-2" /> {isSubmitting ? "ĐANG LƯU..." : "LƯU NHÀ CUNG CẤP"}
                </Button>
            </div>
        </form>
    );
}